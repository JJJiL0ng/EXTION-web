// aiChat 커넥터와 aiChat 스토어를 사용하여 채팅의 전체 컨드롤을 담당

import { useEffect, useRef, useCallback } from 'react';
import { aiChatStore } from '@/_store/aiChat/aiChatStore';

interface UseAiChatControllerProps {
    url?: string;
    userId?: string;
    chatId?: string;
}

export const useAiChatController = (props?: UseAiChatControllerProps) => {
    const webSocketRef = useRef<WebSocket | null>(null);
    
    // Store actions and state
    const {
        messages,
        wsConnectionStatus,
        wsError,
        websocketId,
        userId,
        spreadsheetId,
        chatId,
        isSendingMessage,
        aiThinkingIndicatorVisible,
    } = aiChatStore();

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
            // 연결 시도 로그는 시스템 메시지로 남기지 않음. onopen에서 안내 메시지 표시
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

    // 메시지 전송 (사용자 메시지 추가 + 웹소켓 전송)
    const sendMessage = useCallback((content: string) => {
        const { addUserMessage, setIsSendingMessage, setAiThinkingIndicatorVisible, updateUserMessageStatus } = aiChatStore.getState();
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

    // props로 전달된 값들이 변경되면 웹소켓 초기화
    useEffect(() => {
        if (props?.url) {
            initWebSocket(props.url, props.userId, props.chatId);
        }

        // 클린업
        return () => {
            disconnectWebSocket();
        };
    }, [props?.url, props?.userId, props?.chatId, initWebSocket, disconnectWebSocket]);

    return {
        // State
        messages,
        wsConnectionStatus,
        wsError,
        websocketId,
        userId,
        spreadsheetId,
        chatId,
        isSendingMessage,
        aiThinkingIndicatorVisible,
        
        // Actions
        initWebSocket,
        disconnectWebSocket,
        sendMessage,
        sendWebSocketMessage,
        
        // Setters
    setUserId: aiChatStore.getState().setUserId,
    setSpreadsheetId: aiChatStore.getState().setSpreadsheetId,
    setChatId: aiChatStore.getState().setChatId,
    };
};