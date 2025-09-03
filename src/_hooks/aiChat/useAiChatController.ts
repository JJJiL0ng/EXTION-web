import { useCallback, useEffect } from 'react';
import { useAiChatApiConnector } from "./useAiChatApiConnector";
import { aiChatStore } from "@/_store/aiChat/aiChatStore";
import useChatStore from '@/_store/chat/chatIdStore'
import useSpreadsheetIdStore from '@/_store/sheet/spreadSheetIdStore'
import useSpreadsheetNamesStore from '@/_store/sheet/spreadSheetNamesStore'  
import { getOrCreateGuestId } from '../../_utils/guestUtils'
import { ChatMode } from '../../_store/chat/chatModeStore';
import useChatModeStore from "@/_store/chat/chatModeStore";

import { aiChatApiReq } from "@/_types/ai-chat-api/aiChatApi.types";
import { AiChatState } from '@/_types/store/aiChatStore.types';


export const useAiChatStoreStatusMonitor = () => {
// aiChatStore를 사용해서 상태변화를 모니터링하는 훅
}









// ================

export const useAiChatController = () => {
  const { connect, executeAiJob, isConnected, isConnecting, disconnect } = useAiChatApiConnector();
  const { chatId } = useChatStore();
  const { spreadsheetId } = useSpreadsheetIdStore();
  const parsedSheetNames = useSpreadsheetNamesStore.getState().selectedSheets.map(s => s.name)
 
  
  // 서버 연결 초기화
  useEffect(() => {
    const serverUrl = process.env.NEXT_PUBLIC_AI_CHAT_SERVER_URL || 'ws://localhost:8080';
    
    if (!isConnected && !isConnecting) {
      connect(serverUrl).catch(console.error);
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, isConnected, isConnecting]);

  const executeAiChat = useCallback(async (request: AiChatState) => {
    try {
        if (!chatId || !spreadsheetId) {
          throw new Error('Chat ID or Spreadsheet ID is required');
        }
      // 필요한 추가 정보를 request에 포함
    const lastContent = request.messages[request.messages.length - 1]?.content as string;
    const enrichedRequest: aiChatApiReq = {
      ...request,
      userId: getOrCreateGuestId(),
      chatId,
      spreadsheetId,
      parsedSheetNames,
      jobId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      chatMode: useChatModeStore.getState().mode,
      userQuestionMessage: lastContent,
    };

      // AI 작업 실행
      const result = await executeAiJob(enrichedRequest);
      
      return result;
    } catch (error) {
      console.error('AI Chat execution failed:', error);
      throw error;
    }
  }, [executeAiJob, chatId, spreadsheetId, parsedSheetNames]);

  return {
    executeAiChat,
    isConnected,
    isConnecting,
    connect,
    disconnect,
  };
};

