import { useCallback } from 'react';
import { useUnifiedStore, ChatMessage } from '@/stores';
import { useAuthStore } from '@/stores/authStore';
import { callOrchestratorChatAPI } from '@/services/api/dataServices';
import { cellAddressToCoords } from '@/stores/store-utils/xlsxUtils';
import { ChatResponseHandler } from '@/utils/chatResponseHandlers';
import { ChatMode } from '@/types/chat';

export const useChatHandlers = (
  activeSheetIndex: number
) => {
  const { user } = useAuthStore();
  const {
    xlsxData,
    activeSheetMessages,
    addMessageToSheet,
    clearAllMessages,
    setXLSXData,
    getCurrentChatId,
    generateNewChatId,
    setCurrentChatId,
    getDataForGPTAnalysis,
    addToArtifactHistory,
    openArtifactModal,
    switchToSheet,
    applyGeneratedData
  } = useUnifiedStore();

  // 메시지 전송 함수
  const sendMessage = useCallback(async (
    inputValue: string,
    startLoading: () => void,
    stopLoading: () => void,
    clearInput: () => void,
    setCurrentMode: (mode: ChatMode) => void
  ) => {
    if (!inputValue.trim()) return;

    startLoading();

    // 비로그인 상태이고 현재 채팅 ID가 없을 때 새 로컬 채팅 ID 생성
    if (!getCurrentChatId() && !user) {
      const newChatId = generateNewChatId();
      setCurrentChatId(newChatId);
    }

    // 먼저 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    addMessageToSheet(activeSheetIndex, userMessage);

    console.log('=== 메시지 전송 시작 ===');
    console.log('현재 채팅 ID:', getCurrentChatId());

    try {
      const currentInput = inputValue;
      clearInput();

      // 통합 오케스트레이터 API 호출
      const response = await callOrchestratorChatAPI(
        currentInput,
        null,
        getDataForGPTAnalysis,
        {
          chatId: getCurrentChatId(),
          currentSheetIndex: activeSheetIndex
        }
      );

      console.log('=== API 응답 수신 ===');
      console.log('성공 여부:', response.success);
      console.log('응답 타입:', response.chatType);

      if (response.success) {
        // 백엔드에서 반환된 chatId가 있으면 스토어에 업데이트
        if (response.chatId) {
          console.log('📝 백엔드에서 받은 chatId로 업데이트:', response.chatId);
          setCurrentChatId(response.chatId);
        }

        // 통합 응답 처리
        const mode = await ChatResponseHandler.handleUnifiedResponse(response, {
          activeSheetIndex,
          addMessageToSheet,
          addToArtifactHistory,
          applyGeneratedData,
          switchToSheet,
          xlsxData
        });

        setCurrentMode(mode);
        console.log('✅ 메시지 처리 완료');
      } else {
        console.error('❌ API 응답 실패:', response.error);
        throw new Error(response.error || '응답 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('메시지 처리 중 오류 발생:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'Extion ai',
        content: `메시지 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp: new Date()
      };

      addMessageToSheet(activeSheetIndex, errorMessage);
    } finally {
      stopLoading();
    }
  }, [
    activeSheetIndex,
    user,
    getCurrentChatId,
    generateNewChatId,
    setCurrentChatId,
    addMessageToSheet,
    getDataForGPTAnalysis,
    addToArtifactHistory,
    applyGeneratedData,
    switchToSheet,
    xlsxData
  ]);

  // 데이터 수정 적용 핸들러
  const handleApplyDataFix = useCallback((
    messageId: string,
    appliedDataFixes: string[],
    addAppliedDataFix: (id: string) => void
  ) => {
    console.log('🔧 데이터 수정 적용 시작:', messageId);
    
    const message = activeSheetMessages.find(m => m.id === messageId);
    if (!message || !message.dataFixData || appliedDataFixes.includes(messageId)) {
      console.warn('⚠️ 데이터 수정 적용 조건 미충족:', { 
        hasMessage: !!message, 
        hasDataFixData: !!message?.dataFixData, 
        alreadyApplied: appliedDataFixes.includes(messageId) 
      });
      return;
    }

    const editedData = message.dataFixData.editedData;
    console.log('📊 수정할 데이터:', editedData);

    if (!editedData || !editedData.data) {
      console.error('❌ 수정할 데이터가 올바르지 않습니다:', editedData);
      return;
    }

    const dataToApply = editedData.data;

    applyGeneratedData({
      sheetName: editedData.sheetName,
      data: dataToApply,
      sheetIndex: message.dataFixData.sheetIndex,
    });

    addAppliedDataFix(messageId);

    const confirmationMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'Extion ai',
      content: `**${editedData.sheetName}** 시트의 데이터 수정이 적용되었습니다.\n\n` +
        `• 수정된 행 수: ${dataToApply.length}개\n` +
        `• 열 수: ${dataToApply[0]?.length || 0}개`,
      timestamp: new Date(),
    };
    addMessageToSheet(activeSheetIndex, confirmationMessage);
    
    console.log('✅ 데이터 수정 적용 완료');
  }, [activeSheetMessages, applyGeneratedData, addMessageToSheet, activeSheetIndex]);

  // 함수 결과 적용 핸들러
  const handleApplyFunctionResult = useCallback((
    messageId: string,
    appliedFunctionResults: string[],
    addAppliedFunctionResult: (id: string) => void
  ) => {
    console.log('⚡ 함수 결과 적용 시작:', messageId);
    
    const message = activeSheetMessages.find(m => m.id === messageId) as ChatMessage & { functionData?: any };
    if (!message || !message.functionData || appliedFunctionResults.includes(messageId)) {
      console.warn('⚠️ 함수 결과 적용 조건 미충족:', { 
        hasMessage: !!message, 
        hasFunctionData: !!message?.functionData, 
        alreadyApplied: appliedFunctionResults.includes(messageId) 
      });
      return;
    }

    const { functionDetails } = message.functionData;
    const { result, targetCell, functionType, formula } = functionDetails;
    
    console.log('📊 적용할 함수 결과:', { result, targetCell, functionType, formula });
    
    if (!xlsxData || !useUnifiedStore.getState().activeSheetData) {
      console.error('❌ 스프레드시트 데이터가 없습니다.');
      return;
    }

    try {
      const { row: startRow, col: startCol } = cellAddressToCoords(targetCell);
      console.log('🎯 대상 셀 좌표:', { startRow, startCol, targetCell });

      const currentXlsxData = useUnifiedStore.getState().xlsxData;
      if (!currentXlsxData) {
        console.error('❌ 현재 스프레드시트 데이터를 가져올 수 없습니다.');
        return;
      }

      const newSheets = currentXlsxData.sheets.map((sheet: any, index: number) => {
        if (index === currentXlsxData.activeSheetIndex) {
          const newRawData = (sheet.rawData || []).map((row: any) => [...(row || [])]);

          if (Array.isArray(result)) {
            console.log('📋 2차원 배열 결과 적용:', result);
            (result as string[][]).forEach((rowData, rIdx) => {
              const targetRowIdx = startRow + rIdx;
              while(newRawData.length <= targetRowIdx) newRawData.push([]);
              const targetRow = newRawData[targetRowIdx];
              rowData.forEach((cellData, cIdx) => {
                const targetColIdx = startCol + cIdx;
                while(targetRow.length <= targetColIdx) targetRow.push('');
                targetRow[targetColIdx] = String(cellData);
              });
            });
          } else {
            console.log('📄 단일 값 결과 적용:', result);
            const targetRowIdx = startRow;
            while(newRawData.length <= targetRowIdx) newRawData.push([]);
            const targetRow = newRawData[targetRowIdx];
            while(targetRow.length <= startCol) targetRow.push('');
            targetRow[startCol] = String(result);
          }
          
          const newRowCount = newRawData.length;
          const newColumnCount = newRowCount > 0 ? Math.max(...newRawData.map((r: any) => (r || []).length)) : 0;

          return {
            ...sheet,
            rawData: newRawData,
            metadata: {
              ...(sheet.metadata as any),
              rowCount: newRowCount,
              columnCount: newColumnCount,
              lastModified: new Date()
            }
          };
        }
        return sheet;
      });

      setXLSXData({ ...currentXlsxData, sheets: newSheets });
      addAppliedFunctionResult(messageId);

      const sheetName = useUnifiedStore.getState().activeSheetData?.sheetName || '시트';
      const confirmationMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'Extion ai',
        content: `**${sheetName}** 시트에 함수 결과가 적용되었습니다.\n\n` +
          `• 함수 타입: ${functionType}\n` +
          `• 대상 셀: ${targetCell}\n` +
          `• 수식: ${formula}\n` +
          `• 결과: ${Array.isArray(result) ? `${result.length}개 행의 데이터` : result}`,
        timestamp: new Date(),
      };
      addMessageToSheet(activeSheetIndex, confirmationMessage);
      
      console.log('✅ 함수 결과 적용 완료');

    } catch (error) {
      console.error('❌ 함수 결과 적용 중 오류:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'Extion ai',
        content: `함수 결과 적용 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp: new Date()
      };
      addMessageToSheet(activeSheetIndex, errorMessage);
    }
  }, [activeSheetMessages, xlsxData, setXLSXData, addMessageToSheet, activeSheetIndex]);

  // 아티팩트 클릭 핸들러
  const handleArtifactClick = useCallback((messageId: string) => {
    openArtifactModal(messageId);
  }, [openArtifactModal]);

  // 파일 제거 핸들러
  const removeFile = useCallback(() => {
    clearAllMessages();
    setXLSXData(null);
  }, [clearAllMessages, setXLSXData]);

  return {
    sendMessage,
    handleApplyDataFix,
    handleApplyFunctionResult,
    handleArtifactClick,
    removeFile
  };
}; 