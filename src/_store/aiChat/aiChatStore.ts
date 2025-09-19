// aiChat 스토어를 사용하여 채팅 상태 및 메시지 관리를 담당

import { AiChatState, WebSocketConnectionStatus, MessageStatus, ChatMessage, previousMessagesContent } from "@/_types/store/aiChatStore.types";

import { create } from 'zustand';
import { produce } from 'immer'; // 불변성 관리를 위해 immer 사용
import { v4 as uuidv4 } from 'uuid'; // 고유 ID 생성을 위해 uuid 라이브러리 사용
import { aiChatApiRes } from "@/_types/apiConnector/ai-chat-api/aiChatApi.types";
import useChatStore from '@/_store/chat/chatIdAndChatSessionIdStore'

interface ChatActions {
    // 상태 설정 관련
    setWsConnectionStatus: (status: WebSocketConnectionStatus, error?: string) => void;
    setWebsocketId: (id: string) => void;

    // 메시지 관련
    addUserMessage: (content: string, chatSessionBranchId: string) => string;
    updateAssistantMessage: (id: string, newContentChunk: string) => void;
    completeAssistantMessage: (id: string) => void;
    setAssistantMessageError: (id: string, errorContent: string) => void;
    updateUserMessageStatus: (id: string, status: MessageStatus) => void;
    addSystemMessage: (content: string) => void;
    addErrorMessage: (content: string) => void;
    addAiMessage: (aiChatApiRes: aiChatApiRes) => void;
    addLoadedPreviousMessages: (previousMessagesContent: previousMessagesContent[]) => void;

    // UI 상태 관련
    setIsSendingMessage: (sending: boolean) => void;
    setAiThinkingIndicatorVisible: (visible: boolean) => void;
}

//chatid 스토어에서 chatid 가져오기
const ChatId = useChatStore.getState().chatId;
const ChatSessionId = useChatStore.getState().chatSessionId;
// -----------------------------------------------------------
// 2. Zustand 스토어 생성
// -----------------------------------------------------------

export const aiChatStore = create<AiChatState & ChatActions>((set) => ({
    // 초기 상태
    chatId: ChatId,
    chatSessionId: ChatSessionId,
    messages: [],
    webSocket: null,
    wsConnectionStatus: 'disconnected',
    wsError: null,
    currentAssistantMessageId: null,
    websocketId: null,

    isSendingMessage: false,
    aiThinkingIndicatorVisible: false,
    isTyping: false,

    // -----------------------------------------------------------
    // 액션 구현
    // -----------------------------------------------------------

    // 웹소켓 연결 상태 설정
    setWsConnectionStatus: (status: WebSocketConnectionStatus, error?: string) => {
        set({ wsConnectionStatus: status, wsError: error ?? null });
    },
    setWebsocketId: (id: string) => set({ websocketId: id }),

    // 사용자 메시지 추가 (낙관적 UI)
    addUserMessage: (content: string, chatSessionBranchId: string) => {
        const newMessage: ChatMessage = {
            id: chatSessionBranchId,
            type: 'user',
            content,
            timestamp: Date.now(),
            status: 'pending', // 전송 대기 상태
        };

        set(produce((state: AiChatState) => {
            state.messages.push(newMessage);
        }));

        // 생성된 메시지 ID 반환
        return newMessage.id;
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
    addErrorMessage: (content: string) => {
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

    // AI 메시지 추가
    addAiMessage: (aiChatApiRes: aiChatApiRes) => {
        // dataEditChatRes인 경우 aiChatApiRes 형태로 변환
        const aiResponse: aiChatApiRes = 'dataEditCommands' in aiChatApiRes
            ? {
                jobId: uuidv4(),
                chatSessionId: aiChatApiRes.chatSessionId,
                taskManagerOutput: aiChatApiRes.taskManagerOutput,
                dataEditChatRes: aiChatApiRes.dataEditChatRes,
                spreadSheetVersionId: aiChatApiRes.spreadSheetVersionId,
                editLockVersion: aiChatApiRes.editLockVersion || 1,
              }
            : aiChatApiRes;

        const newMessage: ChatMessage = {
            id: uuidv4(),
            type: 'assistant',
            aiChatRes: aiResponse,
            timestamp: Date.now(),
            status: 'completed',
            content: aiResponse.taskManagerOutput.reason,
        };
        set(produce((state: AiChatState) => {
            state.messages.push(newMessage);
        }));
    },
    addLoadedPreviousMessages: (previousMessagesContent: previousMessagesContent[]) => {
      // 백엔드에서 내려온 기존 히스토리(user/assistant 역할 + content) 배열을 ChatMessage 형태로 변환하여 스토어에 적재
      set(produce((state: AiChatState) => {
          // 1) 기존 메시지 초기화
          state.messages = [];

          // 2) 변환 및 push
          const baseTime = Date.now();
          previousMessagesContent.forEach((m, idx) => {
              if (m.role === 'user') {
                  state.messages.push({
                      id: uuidv4(),
                      type: 'user',
                      content: m.content,
                      timestamp: baseTime + idx, // 단조 증가 보장
                      // 이미 서버에 존재하는 과거 메시지이므로 'sent' 로 표기 (UI에서 재전송 동작 X)
                      status: 'sent'
                  });
              } else if (m.role === 'assistant') {
                  state.messages.push({
                      id: uuidv4(),
                      type: 'assistant',
                      content: m.content,
                      timestamp: baseTime + idx,
                      status: 'completed',
                      isStreaming: false
                  });
              }
          });
      }));
    },

    // UI 상태 관련
    setIsSendingMessage: (sending: boolean) => set({ isSendingMessage: sending }),
    setAiThinkingIndicatorVisible: (visible: boolean) => set({ aiThinkingIndicatorVisible: visible }),
}));