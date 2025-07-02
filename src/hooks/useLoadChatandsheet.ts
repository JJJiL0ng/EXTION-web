import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useUnifiedStore } from '@/stores';
import { 
  loadChatSheetData, 
  ChatSheetDataResponseDto, 
  SheetMetaDataWithTablesDto, 
  SheetTableDataDto 
} from '@/services/api/chatandsheetService';
import { XLSXData, SheetData } from '@/stores/store-types';

// 훅 상태 타입
interface LoadChatAndSheetState {
  isLoading: boolean;
  error: string | null;
  hasSheetData: boolean;
}

// 훅 반환 타입
interface UseLoadChatAndSheetReturn extends LoadChatAndSheetState {
  loadData: (chatId: string) => Promise<void>;
  retryLoad: () => Promise<void>;
  clearError: () => void;
  forceLoad: (chatId?: string) => Promise<void>;
}

export const useLoadChatandsheet = (): UseLoadChatAndSheetReturn => {
  const params = useParams();
  const chatIdFromUrl = params?.id as string;

  // 무한 루프 방지를 위한 ref들
  const lastLoadedChatIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef<boolean>(false);

  // 로컬 상태
  const [state, setState] = useState<LoadChatAndSheetState>({
    isLoading: false,
    error: null,
    hasSheetData: false,
  });

  // 스토어 액션들
  const {
    setCurrentChatId,
    setCurrentSheetMetaDataId,
    setCurrentSheetTableDataId,
    setCurrentSheetId,
    setXLSXData,
    updateChatSession,
    createNewChatSession,
    getChatSession,
    setSheetMetaData,
    setSaveStatus,
    setLoadingState,
    currentChatId
  } = useUnifiedStore();

  // API 데이터를 파일 업로드 방식과 동일한 XLSX 형태로 변환하는 함수
  const processAPIDataToXLSX = useCallback(
    (sheetMetaData: SheetMetaDataWithTablesDto): XLSXData => {
      console.log('🔄 API 데이터를 XLSX 형태로 변환 시작:', {
        fileName: sheetMetaData.fileName,
        sheetsCount: sheetMetaData.sheetTableData.length,
        activeSheetIndex: sheetMetaData.activeSheetIndex,
        rawSheetTableData: sheetMetaData.sheetTableData.map(sheet => ({
          id: sheet.id,
          name: sheet.name,
          index: sheet.index,
          dataType: typeof sheet.data,
          isArray: Array.isArray(sheet.data),
          dataLength: Array.isArray(sheet.data) ? sheet.data.length : 0
        }))
      });

      // 시트 데이터를 인덱스 순으로 정렬하고 파일 업로드 방식과 동일한 형태로 변환
      const sheets: SheetData[] = sheetMetaData.sheetTableData
        .sort((a, b) => a.index - b.index)
        .map((tableData: SheetTableDataDto, sortedIndex) => {
          console.log(`🔧 시트 처리 시작: ${tableData.name}`, {
            originalIndex: tableData.index,
            sortedIndex,
            dataType: typeof tableData.data,
            isArray: Array.isArray(tableData.data),
            dataPreview: Array.isArray(tableData.data) ? tableData.data.slice(0, 2) : tableData.data
          });

          // rawData 검증 및 변환 (파일 업로드 방식과 동일)
          let rawData: string[][] = [];
          
          if (Array.isArray(tableData.data)) {
            // 2차원 배열인지 확인하고 문자열로 변환
            rawData = tableData.data.map((row, rowIndex) => {
              if (Array.isArray(row)) {
                return row.map(cell => String(cell || ''));
              } else {
                console.warn(`🚨 행 ${rowIndex}이 배열이 아닙니다:`, row);
                return [''];
              }
            });
            
            console.log(`✅ rawData 변환 완료 - ${tableData.name}:`, {
              totalRows: rawData.length,
              firstRowCols: rawData[0]?.length || 0,
              sampleFirstRow: rawData[0],
              sampleLastRow: rawData[rawData.length - 1]
            });
          } else {
            // 데이터가 배열이 아닌 경우 빈 시트로 처리
            console.warn(`🚨 시트 "${tableData.name}"의 데이터가 배열 형태가 아닙니다:`, {
              dataType: typeof tableData.data,
              data: tableData.data
            });
            rawData = [['']];
          }

          // 빈 데이터 처리
          if (rawData.length === 0) {
            console.warn(`🚨 시트 "${tableData.name}"이 빈 데이터입니다. 기본값으로 설정.`);
            rawData = [['']];
          }

          // 열 개수 계산 (파일 업로드 방식과 동일)
          const rowCount = rawData.length;
          let columnCount = 0;
          for (const row of rawData) {
            if (row && Array.isArray(row) && row.length > columnCount) {
              columnCount = row.length;
            }
          }

          // 파일 업로드 방식과 동일한 메타데이터 구조 생성
          const sheetData: SheetData = {
            sheetTableDataId: tableData.id, // API에서 온 고유 ID 보존
            sheetName: tableData.name,
            rawData: rawData,
            metadata: {
              rowCount: rowCount,
              columnCount: columnCount,
              dataRange: {
                startRow: 0,
                endRow: Math.max(0, rowCount - 1),
                startCol: 0,
                endCol: Math.max(0, columnCount - 1),
                startColLetter: 'A',
                endColLetter: columnCount > 0 
                  ? String.fromCharCode(65 + Math.max(0, columnCount - 1))
                  : 'A'
              },
              preserveOriginalStructure: true,
              lastModified: tableData.updatedAt
            }
          };

          console.log(`📊 시트 변환 완료: ${tableData.name}`, {
            index: tableData.index,
            sortedIndex,
            rawDataRows: rawData.length,
            rawDataCols: columnCount,
            sheetTableDataId: tableData.id,
            metadata: sheetData.metadata
          });

          return sheetData;
        });

      // 파일 업로드 방식과 동일한 XLSXData 구조 생성
      const xlsxData: XLSXData = {
        fileName: sheetMetaData.fileName,
        sheets: sheets,
        activeSheetIndex: Math.max(0, Math.min(sheetMetaData.activeSheetIndex, sheets.length - 1)),
        sheetMetaDataId: sheetMetaData.id // API 메타데이터 ID 보존
      };

      console.log('✅ XLSX 데이터 변환 완료:', {
        fileName: xlsxData.fileName,
        sheetsCount: xlsxData.sheets.length,
        activeSheetIndex: xlsxData.activeSheetIndex,
        activeSheetName: xlsxData.sheets[xlsxData.activeSheetIndex]?.sheetName || 'Unknown',
        sheetMetaDataId: xlsxData.sheetMetaDataId,
        activeSheetRawDataLength: xlsxData.sheets[xlsxData.activeSheetIndex]?.rawData?.length || 0,
        activeSheetColumnCount: xlsxData.sheets[xlsxData.activeSheetIndex]?.metadata?.columnCount || 0
      });

      return xlsxData;
    },
    []
  );

  // 메인 로드 함수 (파일 업로드 방식과 동일한 플로우 사용)
  const loadData = useCallback(
    async (chatId: string): Promise<void> => {
      if (!chatId) {
        setState(prev => ({ ...prev, error: '채팅 ID가 제공되지 않았습니다.' }));
        return;
      }

      // 이미 로딩 중이거나 같은 chatId를 이미 로드했다면 건너뛰기
      if (isLoadingRef.current || lastLoadedChatIdRef.current === chatId) {
        console.log('⏭️ 이미 로딩 중이거나 로드된 chatId, 건너뛰기:', chatId);
        return;
      }

      isLoadingRef.current = true;
      
      // 파일 업로드 방식과 동일한 로딩 상태 설정
      setLoadingState('fileUpload', true);
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        console.log('🔄 Chat과 Sheet 데이터 로드 시작:', chatId);

        // API 호출
        const response: ChatSheetDataResponseDto = await loadChatSheetData(chatId);
        
        console.log('✅ API 응답 받음:', {
          chatId: response.chatId,
          hasSheetData: !!response.sheetMetaData,
          sheetsCount: response.sheetMetaData?.sheetTableData?.length || 0
        });

        // API 응답에서 받아온 실제 chatId로 현재 chatId 업데이트
        console.log('🆔 현재 chatId 업데이트:', {
          requestedChatId: chatId,
          responseChatId: response.chatId,
          updating: true
        });
        setCurrentChatId(response.chatId);

        // 시트 데이터가 있는 경우 파일 업로드 방식과 동일하게 처리
        if (response.sheetMetaData && response.sheetMetaData.sheetTableData.length > 0) {
          console.log('📊 시트 데이터 발견, XLSX 변환 시작');
          
          // API 응답에서 받아온 실제 sheetMetaDataId로 현재 sheetMetaDataId 업데이트
          console.log('🆔 현재 sheetMetaDataId 업데이트:', {
            newSheetMetaDataId: response.sheetMetaData.id,
            updating: true
          });
          setCurrentSheetMetaDataId(response.sheetMetaData.id);
          
          // dataServices.ts에서 getCurrentSheetId()로 찾을 수 있도록 currentSheetId도 설정
          console.log('🆔 현재 sheetId 업데이트 (dataServices.ts 호환성):', {
            newSheetId: response.sheetMetaData.id,
            updating: true
          });
          setCurrentSheetId(response.sheetMetaData.id);

          // API 데이터를 XLSX 형태로 변환 (파일 업로드 방식과 동일)
          const xlsxData = processAPIDataToXLSX(response.sheetMetaData);

          // 파일 업로드 방식과 동일하게 스토어에 설정
          // 이 시점에서 MainSpreadSheet의 useEffect가 트리거되어 
          // xlsxData → activeSheetData → displayData → HotTable 플로우가 시작됨
          console.log('🎯 setXLSXData 호출 직전:', {
            xlsxDataToSet: {
              fileName: xlsxData.fileName,
              sheetsCount: xlsxData.sheets.length,
              activeSheetIndex: xlsxData.activeSheetIndex,
              firstSheetName: xlsxData.sheets[0]?.sheetName,
              firstSheetDataLength: xlsxData.sheets[0]?.rawData?.length
            }
          });

          setXLSXData(xlsxData);
          
          // 현재 활성화된 시트의 sheetTableDataId 업데이트
          const activeSheet = xlsxData.sheets[xlsxData.activeSheetIndex];
          if (activeSheet?.sheetTableDataId) {
            console.log('🆔 현재 활성 시트의 sheetTableDataId 업데이트:', {
              activeSheetIndex: xlsxData.activeSheetIndex,
              activeSheetName: activeSheet.sheetName,
              sheetTableDataId: activeSheet.sheetTableDataId,
              updating: true
            });
            setCurrentSheetTableDataId(activeSheet.sheetTableDataId);
          }
          
          console.log('🎯 setXLSXData 호출 완료 - MainSpreadSheet 렌더링 트리거됨');

          // 즉시 상태 확인
          const immediateState = useUnifiedStore.getState();
          console.log('🔍 setXLSXData 직후 즉시 상태 확인:', {
            hasXlsxData: !!immediateState.xlsxData,
            hasActiveSheetData: !!immediateState.activeSheetData,
            xlsxDataFileName: immediateState.xlsxData?.fileName,
            activeSheetName: immediateState.activeSheetData?.sheetName,
            activeSheetDataLength: immediateState.activeSheetData?.rawData?.length,
            hasUploadedFile: immediateState.hasUploadedFile
          });

          // 100ms, 300ms, 500ms, 1000ms 후 상태 지속 확인
          [100, 300, 500, 1000].forEach(delay => {
            setTimeout(() => {
              const currentState = useUnifiedStore.getState();
              console.log(`🔍 setXLSXData 이후 ${delay}ms 후 스토어 상태 확인:`, {
                hasXlsxData: !!currentState.xlsxData,
                hasActiveSheetData: !!currentState.activeSheetData,
                xlsxDataFileName: currentState.xlsxData?.fileName,
                activeSheetName: currentState.activeSheetData?.sheetName,
                activeSheetDataLength: currentState.activeSheetData?.rawData?.length,
                hasUploadedFile: currentState.hasUploadedFile
              });
              
              // 상태가 초기화된 경우 경고
              if (!currentState.xlsxData) {
                console.warn(`⚠️ ${delay}ms 후 xlsxData가 null로 초기화됨! 다른 곳에서 상태를 덮어쓰고 있습니다.`);
              }
            }, delay);
          });

          // 스프레드시트 메타데이터 설정 (파일 업로드 방식과 유사)
          setSheetMetaData({
            fileName: response.sheetMetaData.fileName,
            originalFileName: response.sheetMetaData.originalFileName,
            fileSize: response.sheetMetaData.fileSize,
            fileType: response.sheetMetaData.fileType as 'xlsx' | 'csv' | undefined,
            lastSaved: response.sheetMetaData.updatedAt,
            isSaved: true
          });

          // 저장 상태를 synced로 설정
          setSaveStatus('synced');

          setState(prev => ({ ...prev, hasSheetData: true }));

          console.log('✅ 시트 데이터 스토어 설정 완료 - 렌더링 시작됨');
        } else {
          console.log('📭 시트 데이터 없음 - 빈 상태로 초기화');
          
          // 시트 데이터가 없어도 API 응답의 chatId는 유지
          console.log('🆔 시트 데이터 없음 - chatId는 유지, sheetMetaDataId, sheetTableDataId, sheetId 초기화');
          
          // 시트 데이터가 없는 경우 초기화 (파일 업로드 방식과 동일)
          setCurrentSheetMetaDataId(null);
          setCurrentSheetTableDataId(null);
          setCurrentSheetId(null);
          setXLSXData(null);
          setSheetMetaData(null);
          
          setState(prev => ({ ...prev, hasSheetData: false }));
        }

        // 채팅 세션 업데이트 또는 생성 (API 응답의 chatId 사용)
        let existingSession = getChatSession(response.chatId);
        if (!existingSession) {
          console.warn('⚠️ 채팅 세션이 존재하지 않지만 createNewChatSession 호출 방지 (xlsxData 덮어쓰기 방지)');
          // createNewChatSession(); // 임시로 주석 처리하여 xlsxData 덮어쓰기 방지
          // existingSession = getChatSession(response.chatId);
        }

        if (existingSession) {
          updateChatSession(response.chatId, {
            currentSheetMetaDataId: response.sheetMetaData?.id || null,
            sheetMetaData: response.sheetMetaData ? {
              fileName: response.sheetMetaData.fileName,
              originalFileName: response.sheetMetaData.originalFileName,
              fileSize: response.sheetMetaData.fileSize,
              fileType: response.sheetMetaData.fileType as 'xlsx' | 'csv' | undefined,
              lastSaved: response.sheetMetaData.updatedAt,
              isSaved: true
            } : null,
            hasUploadedFile: !!response.sheetMetaData,
            lastAccessedAt: new Date()
          });
        }

        console.log('✅ Chat과 Sheet 데이터 로드 및 렌더링 설정 완료', {
          finalChatId: response.chatId,
          finalSheetMetaDataId: response.sheetMetaData?.id || null
        });
        
        // 성공적으로 로드된 chatId 기록 (요청한 chatId가 아닌 응답 chatId 기록)
        lastLoadedChatIdRef.current = response.chatId;

      } catch (error) {
        console.error('❌ Chat과 Sheet 데이터 로드 실패:', error);
        
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        setState(prev => ({ ...prev, error: errorMessage }));

        // 에러 발생 시 요청된 chatId로라도 설정 (API 응답을 받지 못했으므로)
        console.log('🆔 에러 발생 - 요청된 chatId로 설정, 다른 ID들 초기화:', {
          requestedChatId: chatId,
          errorMessage
        });
        setCurrentChatId(chatId);
        setCurrentSheetMetaDataId(null);
        setCurrentSheetTableDataId(null);
        setCurrentSheetId(null);
        setXLSXData(null);
        setSheetMetaData(null);
        
        // 에러 발생 시에도 chatId 기록 (재시도 방지)
        lastLoadedChatIdRef.current = chatId;
      } finally {
        isLoadingRef.current = false;
        // 파일 업로드 방식과 동일하게 로딩 상태 해제
        setLoadingState('fileUpload', false);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    [processAPIDataToXLSX] // Zustand 액션들은 안정적이므로 의존성에서 제거 (무한 루프 방지)
  );

  // 재시도 함수
  const retryLoad = useCallback(async (): Promise<void> => {
    if (chatIdFromUrl) {
      // 재시도 시에는 이전 기록을 초기화하여 다시 로드 가능하게 함
      lastLoadedChatIdRef.current = null;
      await loadData(chatIdFromUrl);
    }
  }, [chatIdFromUrl, loadData]);

  // 강제 로드 함수 (디버깅용)
  const forceLoad = useCallback(async (chatId?: string): Promise<void> => {
    const targetChatId = chatId || chatIdFromUrl;
    if (targetChatId) {
      console.log('🔧 강제 로드 실행:', targetChatId);
      lastLoadedChatIdRef.current = null;
      isLoadingRef.current = false;
      await loadData(targetChatId);
    }
  }, [chatIdFromUrl, loadData]);

  // 에러 클리어 함수
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // URL의 chatId가 변경될 때 자동 로드 (파일 업로드 방식과 동일한 플로우 시작)
  useEffect(() => {
    console.log('🔍 useEffect 트리거됨:', {
      chatIdFromUrl,
      lastLoadedChatId: lastLoadedChatIdRef.current,
      isLoadingRefCurrent: isLoadingRef.current,
      shouldLoad: chatIdFromUrl && 
                  chatIdFromUrl !== lastLoadedChatIdRef.current && 
                  !isLoadingRef.current
    });

    if (chatIdFromUrl && 
        chatIdFromUrl !== lastLoadedChatIdRef.current && 
        !isLoadingRef.current) {
      console.log('🔄 URL chatId 변경 감지, 자동 로드 시작:', chatIdFromUrl);
      loadData(chatIdFromUrl);
    } else {
      console.log('⏭️ 로드 조건 불충족:', {
        noChatId: !chatIdFromUrl,
        alreadyLoaded: chatIdFromUrl === lastLoadedChatIdRef.current,
        isLoading: isLoadingRef.current
      });
    }
  }, [chatIdFromUrl, loadData]);

  return {
    ...state,
    loadData,
    retryLoad,
    forceLoad,
    clearError,
  };
};
