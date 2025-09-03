// aiChat API 커넥터를 사용하여 채팅 관련 API 호출을 담당

import { aiChatStore } from '@/_store/aiChat/aiChatStore';

export const useAiChatStore = () => {
    const {
        // 상태
        messages,
        wsConnectionStatus,
        wsError,
        websocketId,
        userId,
        spreadsheetId,
        chatId,
        isSendingMessage,
        aiThinkingIndicatorVisible,
        currentAssistantMessageId,
        
        // 상태 설정
        setWsConnectionStatus,
        setWebsocketId,
        setUserId,
        setSpreadsheetId,
        setChatId,
        setIsSendingMessage,
        setAiThinkingIndicatorVisible,
        
        // 메시지 관리
        addUserMessage,
        updateAssistantMessage,
        completeAssistantMessage,
        setAssistantMessageError,
        updateUserMessageStatus,
        addSystemMessage,
        addErrorMessage
    } = aiChatStore();

    return {
        // 상태
        messages,
        wsConnectionStatus,
        wsError,
        websocketId,
        userId,
        spreadsheetId,
        chatId,
        isSendingMessage,
        aiThinkingIndicatorVisible,
        currentAssistantMessageId,
        
        // 액션
        setWsConnectionStatus,
        setWebsocketId,
        setUserId,
        setSpreadsheetId,
        setChatId,
        setIsSendingMessage,
        setAiThinkingIndicatorVisible,
        addUserMessage,
        updateAssistantMessage,
        completeAssistantMessage,
        setAssistantMessageError,
        updateUserMessageStatus,
        addSystemMessage,
        addErrorMessage
    };
};