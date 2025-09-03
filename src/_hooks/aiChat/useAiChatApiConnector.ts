import { useEffect, useRef, useCallback } from 'react';
import { AiChatApiConnector } from '@/_ApiConnector/ai-chat/aiChatApiConnector';
import { aiChatApiReq, aiChatApiRes } from "@/_types/ai-chat-api/aiChatApi.types";
import type { AiJobError, AiJobCancelled, AiJobTimeout } from '@/_ApiConnector/ai-chat/aiChatApiConnector';
import { aiChatStore } from '@/_store/aiChat/aiChatStore';

interface UseAiChatApiConnectorOptions {
  serverUrl?: string;
  autoConnect?: boolean;
  userId?: string;
  chatId?: string;
}

export const useAiChatApiConnector = ({ serverUrl, autoConnect = false, userId, chatId }: UseAiChatApiConnectorOptions = {}) => {
  const connectorRef = useRef<AiChatApiConnector | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);

  // 웹소켓 초기화
  const initWebSocket = useCallback((url: string, userId?: string, chatId?: string) => {
    const currentWs = webSocketRef.current;
    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
      console.warn('WebSocket is already open. Disconnecting existing one.');
      currentWs.close();
    }

    {
      const { setWsConnectionStatus, setUserId, setChatId, addSystemMessage } = aiChatStore.getState();
      setWsConnectionStatus('connecting', undefined);
      setUserId(userId || '');
      setChatId(chatId || '');
    }

    const ws = new WebSocket(url);
    webSocketRef.current = ws;

    ws.onopen = () => {
      const { setWsConnectionStatus, addSystemMessage } = aiChatStore.getState();
      setWsConnectionStatus('connected', undefined);
      addSystemMessage('서버에 연결되었습니다.');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        const {
          currentAssistantMessageId,
          setWebsocketId,
          updateAssistantMessage,
          completeAssistantMessage,
          setIsSendingMessage,
          setAiThinkingIndicatorVisible,
          setAssistantMessageError,
          addErrorMessage,
          addSystemMessage,
        } = aiChatStore.getState();

        if (data.type === 'ws_id' && data.id) {
          setWebsocketId(data.id);
          addSystemMessage(`웹소켓 세션 ID: ${data.id}`);
        } else if (data.type === 'chat_chunk') {
          if (currentAssistantMessageId && currentAssistantMessageId === data.id) {
            updateAssistantMessage(currentAssistantMessageId, data.content);
          }
        } else if (data.type === 'chat_complete') {
          if (currentAssistantMessageId && currentAssistantMessageId === data.id) {
            completeAssistantMessage(currentAssistantMessageId);
            setIsSendingMessage(false);
          }
        } else if (data.type === 'error_message') {
          if (data.id && currentAssistantMessageId === data.id) {
            setAssistantMessageError(data.id, data.content || 'AI 응답 중 알 수 없는 오류 발생');
            setIsSendingMessage(false);
            setAiThinkingIndicatorVisible(false);
          } else {
            addErrorMessage(data.content || '알 수 없는 서버 오류가 발생했습니다.');
            setIsSendingMessage(false);
            setAiThinkingIndicatorVisible(false);
          }
        } else if (data.type === 'system_message') {
          addSystemMessage(data.content);
        }
      } catch (e) {
        console.error('Failed to parse WS message:', e);
        const { addErrorMessage, setIsSendingMessage, setAiThinkingIndicatorVisible } = aiChatStore.getState();
        addErrorMessage('서버 메시지 파싱 중 오류가 발생했습니다.');
        setIsSendingMessage(false);
        setAiThinkingIndicatorVisible(false);
      }
    };

    ws.onclose = () => {
      const { setWsConnectionStatus, addSystemMessage, setIsSendingMessage, setAiThinkingIndicatorVisible } = aiChatStore.getState();
      setWsConnectionStatus('disconnected', undefined);
      addSystemMessage('서버와 연결이 끊어졌습니다.');
      setIsSendingMessage(false);
      setAiThinkingIndicatorVisible(false);
      webSocketRef.current = null;
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      const { setWsConnectionStatus, addErrorMessage, setIsSendingMessage, setAiThinkingIndicatorVisible } = aiChatStore.getState();
      setWsConnectionStatus('error', '웹소켓 연결 오류 발생');
      addErrorMessage('웹소켓 연결 오류 발생.');
      setIsSendingMessage(false);
      setAiThinkingIndicatorVisible(false);
      webSocketRef.current = null;
    };
  }, []);

  // 웹소켓 연결 끊기
  const disconnectWebSocket = useCallback(() => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
  }, []);

  // 웹소켓 메시지 전송
  const sendWebSocketMessage = useCallback((messageContent: string, relatedMessageId: string) => {
    const ws = webSocketRef.current;
    const {
      wsConnectionStatus,
      userId,
      websocketId,
      chatId,
      spreadsheetId,
      addErrorMessage,
      updateUserMessageStatus,
      setIsSendingMessage,
      setAiThinkingIndicatorVisible,
    } = aiChatStore.getState();

    if (ws && wsConnectionStatus === 'connected') {
      try {
        const payload = {
          type: 'chat_request',
          messageId: relatedMessageId,
          userId: userId,
          websocketId: websocketId,
          chatId: chatId,
          spreadsheetId: spreadsheetId,
          content: messageContent,
          timestamp: Date.now(),
        };
        ws.send(JSON.stringify(payload));
      } catch (e) {
        console.error('Failed to send message via WebSocket:', e);
        addErrorMessage('메시지 전송에 실패했습니다.');
        updateUserMessageStatus(relatedMessageId, 'error');
        setIsSendingMessage(false);
        setAiThinkingIndicatorVisible(false);
      }
    } else {
      addErrorMessage('웹소켓 연결이 되어있지 않아 메시지를 보낼 수 없습니다.');
      updateUserMessageStatus(relatedMessageId, 'error');
      setIsSendingMessage(false);
      setAiThinkingIndicatorVisible(false);
    }
  }, []);

  useEffect(() => {
    connectorRef.current = new AiChatApiConnector();

    if (autoConnect && serverUrl) {
      initWebSocket(serverUrl, userId, chatId);
    }

    return () => {
      disconnectWebSocket();
      if (connectorRef.current) {
        connectorRef.current.disconnect();
        connectorRef.current = null;
      }
    };
  }, [serverUrl, autoConnect, userId, chatId, initWebSocket, disconnectWebSocket]);

  const connect = useCallback(async (): Promise<void> => {
    if (!connectorRef.current || !serverUrl) return;
    return connectorRef.current.connect(serverUrl);
  }, [serverUrl]);

  const disconnect = useCallback((): void => {
    disconnectWebSocket();
    if (!connectorRef.current) return;
    connectorRef.current.disconnect();
  }, [disconnectWebSocket]);

  const startAiJob = useCallback((request: aiChatApiReq): void => {
    if (!connectorRef.current) throw new Error('Connector not initialized');
    connectorRef.current.startAiJob(request);
  }, []);

  const acknowledgeTask = useCallback((jobId: string, feedback: 'SUCCESS' | 'FAILURE'): void => {
    if (!connectorRef.current) throw new Error('Connector not initialized');
    connectorRef.current.acknowledgeTask(jobId, feedback);
  }, []);

  const onJobPlanned = useCallback((callback: (data: aiChatApiRes) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.onJobPlanned(callback);
  }, []);

  const onTasksExecuted = useCallback((callback: (data: aiChatApiRes) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.onTasksExecuted(callback);
  }, []);

  const onJobError = useCallback((callback: (data: AiJobError) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.onJobError(callback);
  }, []);

  const onJobCancelled = useCallback((callback: (data: AiJobCancelled) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.onJobCancelled(callback);
  }, []);

  const onJobTimeout = useCallback((callback: (data: AiJobTimeout) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.onJobTimeout(callback);
  }, []);

  const offJobPlanned = useCallback((callback?: (data: aiChatApiRes) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.offJobPlanned(callback);
  }, []);

  const offTasksExecuted = useCallback((callback?: (data: aiChatApiRes) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.offTasksExecuted(callback);
  }, []);

  const offJobError = useCallback((callback?: (data: AiJobError) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.offJobError(callback);
  }, []);

  const offJobCancelled = useCallback((callback?: (data: AiJobCancelled) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.offJobCancelled(callback);
  }, []);

  const offJobTimeout = useCallback((callback?: (data: AiJobTimeout) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.offJobTimeout(callback);
  }, []);

  const { wsConnectionStatus } = aiChatStore();
  const isConnected = wsConnectionStatus === 'connected';

  return {
    // WebSocket methods
    initWebSocket,
    disconnectWebSocket,
    sendWebSocketMessage,
    isConnected,
    
    // Original socket.io methods
    connect,
    disconnect,
    startAiJob,
    acknowledgeTask,
    onJobPlanned,
    onTasksExecuted,
    onJobError,
    onJobCancelled,
    onJobTimeout,
    offJobPlanned,
    offTasksExecuted,
    offJobError,
    offJobCancelled,
    offJobTimeout,
  };
};