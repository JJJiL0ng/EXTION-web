// aiChat 스토어를 사용하여 채팅 상태 및 메시지 관리를 담당

import { AiChatState, WebSocketConnectionStatus, MessageStatus, ChatMessage } from "@/_types/store/aiChatStore.types";

import { create } from 'zustand';
import { produce } from 'immer'; // 불변성 관리를 위해 immer 사용
import { v4 as uuidv4 } from 'uuid'; // 고유 ID 생성을 위해 uuid 라이브러리 사용

interface ChatActions {
    // 웹소켓 관련
    initWebSocket: (url: string, userId?: string, chatId?: string) => void;
    disconnectWebSocket: () => void;
    setWsConnectionStatus: (status: WebSocketConnectionStatus, error?: string) => void;
    setWebsocketId: (id: string) => void;
    setUserId: (id: string) => void;
    setSpreadsheetId: (id: string) => void;
    setChatId: (id: string) => void;

    // 메시지 관련
    addUserMessage: (content: string) => void;
    addAssistantPlaceholder: (initialContent?: string) => string; // AI 응답 시작 시 placeholder 추가 및 ID 반환
    updateAssistantMessage: (id: string, newContentChunk: string) => void;
    completeAssistantMessage: (id: string) => void;
    setAssistantMessageError: (id: string, errorContent: string) => void;
    updateUserMessageStatus: (id: string, status: MessageStatus) => void;
    addSystemMessage: (content: string) => void;
    addErrorMessage: (content: string, relatedMessageId?: string) => void; // 특정 메시지와 관련된 에러 메시지

    // UI 상태 관련
    setIsSendingMessage: (sending: boolean) => void;
    setAiThinkingIndicatorVisible: (visible: boolean) => void;

    // 웹소켓 메시지 전송 (실제 백엔드로 전송하는 로직)
    sendWebSocketMessage: (messageContent: string, relatedMessageId: string) => void; // 사용자 메시지 ID를 함께 보냄
    // sendCustomWebSocketMessage: (payload: object) => void; // 특정 페이로드를 보내야 할 경우
}

// -----------------------------------------------------------
// 2. Zustand 스토어 생성
// -----------------------------------------------------------

export const aiChatStore = create<AiChatState & ChatActions>((set, get) => ({
    // 초기 상태
    messages: [],
    webSocket: null,
    wsConnectionStatus: 'disconnected',
    wsError: null,
    currentAssistantMessageId: null,
    websocketId: null,
    userId: null,
    spreadsheetId: null, // 초기에는 null
    chatId: null,        // 초기에는 null

    isSendingMessage: false,
    aiThinkingIndicatorVisible: false,
    isTyping: false,

    // -----------------------------------------------------------
    // 액션 구현
    // -----------------------------------------------------------

    // 웹소켓 초기화
    initWebSocket: (url: string, userId?: string, chatId?: string) => {
        const currentWs = get().webSocket;
        if (currentWs && currentWs.readyState === WebSocket.OPEN) {
            console.warn('WebSocket is already open. Disconnecting existing one.');
            currentWs.close();
        }

        set({ wsConnectionStatus: 'connecting', wsError: null, userId: userId || null, chatId: chatId || null });

        // URL에 userId 및 chatId를 쿼리 파라미터로 추가할 수 있습니다.
        // 예: `ws://localhost:8080/chat?userId=${userId}&chatId=${chatId}`
        const ws = new WebSocket(url);
        set({ webSocket: ws });

        ws.onopen = () => {
            set({ wsConnectionStatus: 'connected' });
            get().addSystemMessage('서버에 연결되었습니다.');
            // 연결 후 백엔드로부터 websocketId를 받을 수 있습니다.
            // 또는 백엔드에서 즉시 initial handshake 메시지를 통해 id를 보내줄 수도 있습니다.
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data as string);
                // 백엔드 메시지 형식에 따라 파싱 로직 변경 필요
                // 예시: { type: 'chat_chunk' | 'chat_complete' | 'error_message' | 'system_message' | 'ws_id', id: '...', content: '...' }

                if (data.type === 'ws_id' && data.id) {
                    get().setWebsocketId(data.id);
                    get().addSystemMessage(`웹소켓 세션 ID: ${data.id}`);
                } else if (data.type === 'chat_chunk') {
                    // AI 응답 스트리밍 중인 경우
                    const assistantMessageId = get().currentAssistantMessageId;
                    if (assistantMessageId && assistantMessageId === data.id) { // 현재 스트리밍 중인 메시지 ID와 일치
                        get().updateAssistantMessage(assistantMessageId, data.content);
                    } else {
                        // 새로운 AI 응답 스트리밍 시작 (예상치 못한 경우지만, 처리)
                        // 또는 백엔드에서 initial_response를 먼저 보내고 ID를 부여하는 방식일 수 있음.
                        const newId = get().addAssistantPlaceholder(data.content); // 첫 청크로 메시지 시작
                        // set({ currentAssistantMessageId: newId, aiThinkingIndicatorVisible: false }); // AI 생각 중 표시 끄기
                    }
                } else if (data.type === 'chat_complete') {
                    // AI 응답 스트리밍 완료
                    const assistantMessageId = get().currentAssistantMessageId;
                    if (assistantMessageId && assistantMessageId === data.id) {
                        get().completeAssistantMessage(assistantMessageId);
                        set({ currentAssistantMessageId: null, isSendingMessage: false }); // 스트리밍 완료 후 관련 상태 초기화
                    }
                } else if (data.type === 'error_message') {
                    // 백엔드로부터 에러 메시지 수신
                    if (data.id && get().currentAssistantMessageId === data.id) {
                        get().setAssistantMessageError(data.id, data.content || 'AI 응답 중 알 수 없는 오류 발생');
                        set({ currentAssistantMessageId: null, isSendingMessage: false, aiThinkingIndicatorVisible: false });
                    } else {
                        get().addErrorMessage(data.content || '알 수 없는 서버 오류가 발생했습니다.');
                        set({ isSendingMessage: false, aiThinkingIndicatorVisible: false });
                    }
                } else if (data.type === 'system_message') {
                    get().addSystemMessage(data.content);
                }
                // TODO: 사용자 메시지에 대한 ACK (acknowledgment) 처리 로직 추가 가능
                // if (data.type === 'ack' && data.relatedMessageId) {
                //   get().updateUserMessageStatus(data.relatedMessageId, 'sent');
                // }

            } catch (e) {
                console.error('Failed to parse WS message:', e);
                get().addErrorMessage('서버 메시지 파싱 중 오류가 발생했습니다.');
                set({ isSendingMessage: false, aiThinkingIndicatorVisible: false });
            }
        };

        ws.onclose = () => {
            set({ wsConnectionStatus: 'disconnected', webSocket: null, currentAssistantMessageId: null });
            get().addSystemMessage('서버와 연결이 끊어졌습니다.');
            set({ isSendingMessage: false, aiThinkingIndicatorVisible: false }); // 연결 끊기면 모든 대기 상태 해제
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            set({
                wsConnectionStatus: 'error',
                wsError: '웹소켓 연결 오류 발생',
                webSocket: null,
                currentAssistantMessageId: null,
            });
            get().addErrorMessage('웹소켓 연결 오류 발생.');
            set({ isSendingMessage: false, aiThinkingIndicatorVisible: false }); // 연결 끊기면 모든 대기 상태 해제
        };
    },

    // 웹소켓 연결 끊기
    disconnectWebSocket: () => {
        get().webSocket?.close();
    },

    // 웹소켓 연결 상태 설정
    setWsConnectionStatus: (status: WebSocketConnectionStatus, error?: string) => {
        set({ wsConnectionStatus: status, wsError: error ?? null });
    },
    setWebsocketId: (id: string) => set({ websocketId: id }),
    setUserId: (id: string) => set({ userId: id }),
    setSpreadsheetId: (id: string) => set({ spreadsheetId: id }),
    setChatId: (id: string) => set({ chatId: id }),

    // 사용자 메시지 추가 (낙관적 UI)
    addUserMessage: (content: string) => {
        const newMessage: ChatMessage = {
            id: uuidv4(),
            type: 'user',
            content,
            timestamp: Date.now(),
            status: 'pending', // 전송 대기 상태
        };

        set(produce((state: AiChatState) => {
            state.messages.push(newMessage);
        }));

        // 이 시점에서 isSendingMessage를 true로 설정하고, AI Thinking Indicator를 활성화
        set({ isSendingMessage: true, aiThinkingIndicatorVisible: true });

        // 웹소켓을 통해 메시지 전송은 useAiChatController에서 감지 후 호출
        // get().sendWebSocketMessage(content, newMessage.id);
    },

    // AI 응답 Placeholder 추가
    addAssistantPlaceholder: (initialContent: string = '...') => {
        const newId = uuidv4();
        const placeholderMessage: ChatMessage = {
            id: newId,
            type: 'assistant',
            content: initialContent, // 초기 로딩 표시 또는 첫 청크 내용
            timestamp: Date.now(),
            status: 'streaming',
            isStreaming: true,
        };
        set(produce((state: AiChatState) => {
            state.messages.push(placeholderMessage);
        }));
        return newId;
    },

    // AI 응답 스트리밍 업데이트
    updateAssistantMessage: (id: string, newContentChunk: string) => {
        set(produce((state: AiChatState) => {
            const message = state.messages.find(msg => msg.id === id && msg.type === 'assistant');
            if (message) {
                message.content += newContentChunk;
                message.status = 'streaming';
            }
        }));
    },

    // AI 응답 스트리밍 완료
    completeAssistantMessage: (id: string) => {
        set(produce((state: AiChatState) => {
            const message = state.messages.find(msg => msg.id === id && msg.type === 'assistant');
            if (message) {
                message.status = 'completed';
                message.isStreaming = false;
                // AI 응답 완료 후, 'isSendingMessage'와 'aiThinkingIndicatorVisible'을 false로 설정
                // 이 로직은 onmessage의 chat_complete 핸들러에 의해 호출되는 것이 더 정확합니다.
            }
        }));
    },

    // AI 응답 에러 처리
    setAssistantMessageError: (id: string, errorContent: string) => {
        set(produce((state: AiChatState) => {
            const message = state.messages.find(msg => msg.id === id); // 타입에 상관없이 ID로 찾음
            if (message) {
                message.content = errorContent;
                message.status = 'error';
                message.isStreaming = false;
                // message.type = 'error'; // 에러 타입으로 변경하여 UI에서 다르게 렌더링 가능
            }
        }));
    },

    // 사용자 메시지 상태 업데이트
    updateUserMessageStatus: (id: string, status: MessageStatus) => {
        set(produce((state: AiChatState) => {
            const message = state.messages.find(msg => msg.id === id && msg.type === 'user');
            if (message) {
                message.status = status;
            }
        }));
    },

    // 시스템 메시지 추가
    addSystemMessage: (content: string) => {
        const newMessage: ChatMessage = {
            id: uuidv4(),
            type: 'system',
            content,
            timestamp: Date.now(),
            status: 'completed',
        };
        set(produce((state: AiChatState) => {
            state.messages.push(newMessage);
        }));
    },

    // 에러 메시지 추가 (특정 메시지 관련 또는 일반 에러)
    addErrorMessage: (content: string, relatedMessageId?: string) => {
        const newMessage: ChatMessage = {
            id: uuidv4(),
            type: 'error',
            content,
            timestamp: Date.now(),
            status: 'error',
            //   errorDetails: content,
            // relatedMessageId를 저장하여 UI에서 관련 메시지 옆에 표시할 수도 있습니다.
        };
        set(produce((state: AiChatState) => {
            state.messages.push(newMessage);
        }));
    },

    // UI 상태 관련
    setIsSendingMessage: (sending: boolean) => set({ isSendingMessage: sending }),
    setAiThinkingIndicatorVisible: (visible: boolean) => set({ aiThinkingIndicatorVisible: visible }),


    // 웹소켓 메시지 전송 로직
    sendWebSocketMessage: (messageContent: string, relatedMessageId: string) => {
        const { webSocket, wsConnectionStatus, userId, websocketId, chatId, spreadsheetId } = get();
        if (webSocket && wsConnectionStatus === 'connected') {
            try {
                const payload = {
                    type: 'chat_request',
                    messageId: relatedMessageId, // 이 메시지에 대한 응답을 매핑하기 위해 ID 포함
                    userId: userId,
                    websocketId: websocketId, // 백엔드에서 세션을 식별하기 위해 필요할 수 있음
                    chatId: chatId,
                    spreadsheetId: spreadsheetId, // 도메인 특정
                    content: messageContent,
                    timestamp: Date.now(),
                };
                webSocket.send(JSON.stringify(payload));
                // 사용자 메시지 상태는 이미 'pending'에서 'sent'로 업데이트 되었을 것임 (controller에서)
            } catch (e) {
                console.error('Failed to send message via WebSocket:', e);
                get().addErrorMessage('메시지 전송에 실패했습니다.');
                get().updateUserMessageStatus(relatedMessageId, 'error'); // 사용자 메시지를 에러 상태로
                set({ isSendingMessage: false, aiThinkingIndicatorVisible: false });
            }
        } else {
            get().addErrorMessage('웹소켓 연결이 되어있지 않아 메시지를 보낼 수 없습니다.');
            get().updateUserMessageStatus(relatedMessageId, 'error'); // 사용자 메시지를 에러 상태로
            set({ isSendingMessage: false, aiThinkingIndicatorVisible: false });
        }
    },
}));