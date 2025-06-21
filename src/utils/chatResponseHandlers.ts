import { ChatMessage } from '@/stores';
import { OrchestratorChatResponseDto } from '@/services/api/dataServices';
import { ChatMode } from '@/types/chat';

export interface ResponseHandlerParams {
  response: OrchestratorChatResponseDto;
  activeSheetIndex: number;
  addMessageToSheet: (sheetIndex: number, message: ChatMessage) => void;
  addToArtifactHistory: (artifactData: any) => void;
  applyGeneratedData: (data: any) => void;
  switchToSheet: (index: number) => void;
  xlsxData: any;
}

export class ChatResponseHandler {
  // 아티팩트 응답 처리
  static async handleArtifactResponse(params: ResponseHandlerParams): Promise<void> {
    const { response, activeSheetIndex, addMessageToSheet, addToArtifactHistory } = params;
    
    console.log('🎨 아티팩트 응답 처리 시작:', response);
    
    const artifactCode = response.code || (response as any).data?.code;
    const artifactType = response.type || (response as any).data?.type;
    const artifactTitle = response.title || (response as any).data?.title;
    const artifactExplanation = response.explanation || (response as any).data?.explanation;
    
    console.log('🔍 아티팩트 데이터 추출:', {
      hasCode: !!artifactCode,
      type: artifactType,
      title: artifactTitle,
      hasExplanation: !!artifactExplanation
    });
    
    if (artifactCode) {
      const artifactId = (Date.now() + 1).toString();
      
      const artifactData = {
        type: artifactType || 'analysis',
        title: artifactTitle || `${artifactType || 'Chart'} 분석`,
        timestamp: new Date(),
        code: artifactCode,
        messageId: artifactId
      };

      addToArtifactHistory(artifactData);

      let explanationText = '';
      if (typeof artifactExplanation === 'string') {
        explanationText = artifactExplanation;
      } else if (artifactExplanation && typeof artifactExplanation === 'object') {
        explanationText = artifactExplanation.korean || '';
      } else if (response.message) {
        explanationText = response.message;
      } else {
        explanationText = `${artifactType || 'Chart'} 분석이 완료되었습니다.`;
      }
      
      const assistantMessage: ChatMessage = {
        id: artifactId,
        type: 'Extion ai',
        content: explanationText,
        timestamp: new Date(),
        artifactData: {
          type: artifactType || 'analysis',
          title: artifactTitle || `${artifactType || 'Chart'} 분석`,
          timestamp: new Date(),
          code: artifactCode,
          artifactId: artifactId
        }
      };

      addMessageToSheet(activeSheetIndex, assistantMessage);
    } else if (response.message) {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'Extion ai',
        content: response.message,
        timestamp: new Date()
      };
      addMessageToSheet(activeSheetIndex, assistantMessage);
    }
  }

  // 함수 실행 응답 처리
  static async handleFunctionResponse(params: ResponseHandlerParams): Promise<void> {
    const { response, activeSheetIndex, addMessageToSheet } = params;
    
    console.log('⚡ 함수 응답 처리 시작:', response);
    
    const functionDetails = response.functionDetails || (response as any).data?.functionDetails;
    const explanation = response.message || (response as any).data?.explanation;
    
    if (functionDetails) {
      const messageContent = explanation || 
        `함수가 실행되었습니다.\n\n` +
        `• 함수 타입: ${functionDetails.functionType}\n` +
        `• 대상 셀: ${functionDetails.targetCell}\n` +
        `• 수식: ${functionDetails.formula}\n` +
        `• 결과: ${Array.isArray(functionDetails.result) ? 
          `${functionDetails.result.length}개 행의 데이터` : 
          functionDetails.result}`;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'Extion ai',
        content: messageContent,
        timestamp: new Date(),
        functionData: {
          functionDetails: functionDetails,
          isApplied: false
        },
        mode: 'function'
      } as any;

      addMessageToSheet(activeSheetIndex, assistantMessage);
    } else if (response.message) {
      const fallbackMessage = explanation || response.message || '함수 실행 요청을 처리했습니다.';
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'Extion ai',
        content: fallbackMessage,
        timestamp: new Date()
      };
      addMessageToSheet(activeSheetIndex, assistantMessage);
    }
  }

  // 데이터 수정 응답 처리
  static async handleDataFixResponse(params: ResponseHandlerParams): Promise<void> {
    const { response, activeSheetIndex, addMessageToSheet } = params;
    
    console.log('🔧 데이터 수정 응답 처리 시작:', response);
    
    if (response.editedData) {
      const targetSheetIndex = response.sheetIndex !== undefined ? response.sheetIndex : activeSheetIndex;
      
      let changesDescription = '';
      if (response.changes) {
        changesDescription = `\n\n변경 내용:\n• 유형: ${response.changes.type}\n• 세부사항: ${response.changes.details}`;
      }
      
      const messageContent = (response.message || '데이터 수정을 제안합니다.') + changesDescription +
        `\n\n수정된 시트: ${response.editedData.sheetName}\n` +
        `수정된 행 수: ${response.editedData.data.length}개\n` +
        `열 수: ${response.editedData.data[0]?.length || 0}개`;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'Extion ai',
        content: messageContent,
        timestamp: new Date(),
        dataFixData: {
          editedData: response.editedData,
          sheetIndex: targetSheetIndex,
          changes: response.changes,
          isApplied: false
        }
      } as any;

      addMessageToSheet(activeSheetIndex, assistantMessage);
    } else if (response.message) {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'Extion ai',
        content: response.message,
        timestamp: new Date()
      };
      addMessageToSheet(activeSheetIndex, assistantMessage);
    }
  }

  // 데이터 편집 응답 처리
  static async handleDataEditResponse(params: ResponseHandlerParams): Promise<void> {
    const { response, activeSheetIndex, addMessageToSheet } = params;
    
    console.log('📝 데이터 편집 응답 처리 시작:', response);
    
    const editedData = response.editedData || (response as any).data?.editedData;
    const sheetIndex = response.sheetIndex !== undefined ? response.sheetIndex : (response as any).data?.sheetIndex;
    const changes = response.changes || (response as any).data?.changes;
    const explanation = response.message || (response as any).data?.explanation;
    
    if (editedData) {
      const targetSheetIndex = sheetIndex !== undefined ? sheetIndex : activeSheetIndex;
      
      let changesDescription = '';
      if (changes) {
        changesDescription = `\n\n변경 내용:\n• 유형: ${changes.type}\n• 세부사항: ${changes.details}`;
      }
      
      const dataToProcess = editedData.data || editedData;
      
      const messageContent = (explanation || '데이터 편집을 제안합니다.') + changesDescription +
        `\n\n편집된 시트: ${editedData.sheetName}\n` +
        `편집된 행 수: ${dataToProcess.length}개\n` +
        `열 수: ${dataToProcess[0]?.length || 0}개`;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'Extion ai',
        content: messageContent,
        timestamp: new Date(),
        dataFixData: {
          editedData: {
            sheetName: editedData.sheetName,
            data: dataToProcess
          },
          sheetIndex: targetSheetIndex,
          changes: changes,
          isApplied: false
        }
      } as any;

      addMessageToSheet(activeSheetIndex, assistantMessage);
    } else {
      const fallbackMessage = explanation || response.message || '데이터 편집 요청을 처리했습니다.';
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'Extion ai',
        content: fallbackMessage,
        timestamp: new Date()
      };
      addMessageToSheet(activeSheetIndex, assistantMessage);
    }
  }

  // 데이터 생성 응답 처리
  static async handleDataGenerationResponse(params: ResponseHandlerParams): Promise<void> {
    const { response, activeSheetIndex, addMessageToSheet, applyGeneratedData, switchToSheet, xlsxData } = params;
    
    console.log('📊 데이터 생성 응답 처리 시작:', response);
    
    const editedData = response.editedData || (response as any).data?.editedData;
    const sheetIndex = response.sheetIndex !== undefined ? response.sheetIndex : (response as any).data?.sheetIndex;
    const explanation = response.message || (response as any).data?.explanation;
    
    if (editedData) {
      const targetSheetIndex = sheetIndex !== undefined ? sheetIndex : activeSheetIndex;
      
      applyGeneratedData({
        sheetName: editedData.sheetName,
        data: editedData.data,
        sheetIndex: targetSheetIndex
      });

      const messageContent = (explanation || response.message || '데이터가 생성되었습니다!') +
        `\n\n시트명: ${editedData.sheetName}\n` +
        `생성된 행 수: ${editedData.data.length}개\n` +
        `열 수: ${editedData.data[0]?.length || 0}개\n\n` +
        `새로운 데이터가 스프레드시트에 자동으로 추가되었습니다.`;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'Extion ai',
        content: messageContent,
        timestamp: new Date()
      };

      addMessageToSheet(activeSheetIndex, assistantMessage);

      if (targetSheetIndex !== activeSheetIndex && xlsxData && xlsxData.sheets[targetSheetIndex]) {
        setTimeout(() => {
          switchToSheet(targetSheetIndex);
        }, 1000);
      }
    } else {
      const fallbackMessage = explanation || response.message || '데이터 생성 요청을 처리했습니다.';
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'Extion ai',
        content: fallbackMessage,
        timestamp: new Date()
      };
      addMessageToSheet(activeSheetIndex, assistantMessage);
    }
  }

  // 일반 채팅 응답 처리
  static async handleNormalResponse(params: ResponseHandlerParams): Promise<void> {
    const { response, activeSheetIndex, addMessageToSheet } = params;
    
    console.log('💬 일반 채팅 응답 처리 시작:', response);
    
    let messageContent = '';
    
    if (response.message && typeof response.message === 'string') {
      messageContent = response.message;
    } else if (response.explanation && typeof response.explanation === 'object' && (response.explanation as any).korean) {
      messageContent = (response.explanation as any).korean;
    } else if ((response as any).data?.message) {
      messageContent = (response as any).data.message;
    } else if ((response as any).data?.content) {
      messageContent = (response as any).data.content;
    } else if ((response as any).content) {
      messageContent = (response as any).content;
    } else if (response.title) {
      messageContent = response.title;
    } else if (response.error) {
      messageContent = `오류가 발생했습니다: ${response.error}`;
    } else if (response.success) {
      messageContent = '요청이 성공적으로 처리되었습니다.';
    } else {
      messageContent = '응답을 받았지만 내용을 표시할 수 없습니다.';
    }
    
    if (!messageContent || messageContent.trim() === '') {
      messageContent = '응답을 받았지만 내용을 표시할 수 없습니다.';
    }
    
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'Extion ai',
      content: messageContent,
      timestamp: new Date()
    };
    
    addMessageToSheet(activeSheetIndex, assistantMessage);
  }

  // 통합 응답 처리
  static async handleUnifiedResponse(
    response: OrchestratorChatResponseDto,
    params: Omit<ResponseHandlerParams, 'response'>
  ): Promise<ChatMode> {
    const fullParams = { ...params, response };
    
    const chatType = response.chatType as string;
    let mode: ChatMode = 'general';

    if (chatType === 'artifact' || chatType === 'visualization-chat') {
      await this.handleArtifactResponse(fullParams);
      mode = 'visualization';
    } else if (chatType === 'function' || chatType === 'function-chat') {
      await this.handleFunctionResponse(fullParams);
      mode = 'function';
    } else if (chatType === 'datafix' || chatType === 'dataedit' || chatType === 'data-edit' || chatType === 'edit-chat') {
      await this.handleDataEditResponse(fullParams);
      mode = 'data-edit';
    } else if (chatType === 'datageneration' || chatType === 'generate-chat') {
      await this.handleDataGenerationResponse(fullParams);
      mode = 'data-generate';
    } else {
      await this.handleNormalResponse(fullParams);
      mode = 'general';
    }

    return mode;
  }
} 