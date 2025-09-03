// aiChat 커넥터와 aiChat 스토어를 사용하여 채팅의 전체 컨드롤을 담당

import { useEffect, useCallback } from 'react';
import { aiChatStore } from '@/_store/aiChat/aiChatStore';
import { useAiChatApiConnector } from './useAiChatApiConnector';

interface UseAiChatControllerProps {
  autoConnect?: boolean;
  userId: string;
  spreadSheetId: string;
  chatId: string;
}

export const useAiChatController = (props: UseAiChatControllerProps) => {
  const USER_ID = props.userId;
  const CHAT_ID = props.chatId;
  const SERVER_URL = `${process.env.NEXT_PUBLIC_API_URL || 'ws://localhost:8080'}`;

  // Store 상태 구독
  const {
    messages,
    wsConnectionStatus,
    websocketId,
    userId,
    chatId,
    isSendingMessage,
    aiThinkingIndicatorVisible,
  } = aiChatStore();

  // API Connector 초기화
  const {
    initWebSocket,
    disconnectWebSocket,
    sendWebSocketMessage,
    isConnected,
  } = useAiChatApiConnector({
    serverUrl: SERVER_URL,
    autoConnect: props?.autoConnect || false,
    userId: USER_ID,
    chatId: CHAT_ID,
  });

  // 연결 초기화
  const initializeConnection = useCallback(() => {
    initWebSocket(SERVER_URL, USER_ID, CHAT_ID);
  }, [initWebSocket, SERVER_URL, USER_ID, CHAT_ID]);

  // 메시지 전송 (사용자 메시지 추가 + 웹소켓 전송)
  const sendMessage = useCallback((content: string) => {
    const { 
      addUserMessage, 
      setIsSendingMessage, 
      setAiThinkingIndicatorVisible, 
      updateUserMessageStatus 
    } = aiChatStore.getState();

    // 사용자 메시지를 스토어에 추가하고 생성된 ID 받기
    const messageId = addUserMessage(content);
    setIsSendingMessage(true);
    setAiThinkingIndicatorVisible(true);
    
    // 웹소켓으로 메시지 전송
    setTimeout(() => {
      sendWebSocketMessage(content, messageId);
      updateUserMessageStatus(messageId, 'sent');
    }, 0);
  }, [sendWebSocketMessage]);

  // 새로운 유저 메시지 감지 및 처리
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    // 마지막 메시지가 유저 메시지이고 상태가 'pending'인 경우 자동 전송
    if (
      lastMessage && 
      lastMessage.type === 'user' && 
      lastMessage.status === 'pending' &&
      isConnected &&
      !isSendingMessage
    ) {
      console.log('새로운 유저 메시지 감지, 자동 전송:', lastMessage.content);
      
      const { setIsSendingMessage, setAiThinkingIndicatorVisible, updateUserMessageStatus } = aiChatStore.getState();
      
      setIsSendingMessage(true);
      setAiThinkingIndicatorVisible(true);
      
      // 웹소켓으로 메시지 전송
      setTimeout(() => {
        sendWebSocketMessage(lastMessage.content, lastMessage.id);
        updateUserMessageStatus(lastMessage.id, 'sent');
      }, 0);
    }
  }, [messages, isConnected, isSendingMessage, sendWebSocketMessage]);

  // Store의 setters를 노출
  const { 
    setUserId, 
    setSpreadsheetId, 
    setChatId,
    addUserMessage,
    // clearMessages,
  } = aiChatStore.getState();

  return {
    // State
    messages,
    wsConnectionStatus,
    websocketId,
    userId,
    chatId,
    isSendingMessage,
    aiThinkingIndicatorVisible,
    isConnected,
    
    // Actions
    initializeConnection,
    disconnectWebSocket,
    sendMessage,
    
    // Store actions
    setUserId,
    setSpreadsheetId,
    setChatId,
    addUserMessage,
    // clearMessages,
  };
};