import { useCallback, useEffect, useState, useRef } from 'react';
import { useAiChatApiConnector } from "./useAiChatApiConnector";
import { aiChatStore } from "@/_store/aiChat/aiChatStore";
import useChatStore from '@/_store/chat/chatIdStore'
import useSpreadsheetIdStore from '@/_store/sheet/spreadSheetIdStore'
import useSpreadsheetNamesStore from '@/_store/sheet/spreadSheetNamesStore'
import { getOrCreateGuestId } from '../../_utils/guestUtils'
import useChatModeStore from "@/_store/chat/chatModeStore";

import { aiChatApiReq } from "@/_types/ai-chat-api/aiChatApi.types";
import { AiChatState } from '@/_types/store/aiChatStore.types';

export const useMainAiChatController = () => {
    console.log('📋 [useMainAiChatController] Initialized');
    const { executeAiChat, isConnected } = useAiChatExcuter();
    const [isProcessing, setIsProcessing] = useState(false);
    const lastProcessedMessageIdRef = useRef<string>('');

    useEffect(() => {
        console.log('📮 [useMainAiChatController] Setting up direct store subscription');
        
        const unsubscribe = aiChatStore.subscribe((state) => {
            const messages = state.messages || [];
            const latestMessage = messages[messages.length - 1];
            
            console.log('📥 [useMainAiChatController] Store changed:', {
                messageCount: messages.length,
                latestMessage,
                isProcessing,
                isConnected
            });
            
            // 최신 메시지가 사용자 메시지이고, 아직 처리하지 않은 메시지인 경우
            if (
                latestMessage && 
                latestMessage.type === 'user' && 
                latestMessage.id !== lastProcessedMessageIdRef.current &&
                !isProcessing && 
                isConnected
            ) {
                console.log('✅ [useMainAiChatController] Processing new user message:', latestMessage.content);
                lastProcessedMessageIdRef.current = latestMessage.id;
                
                const processMessage = async () => {
                    setIsProcessing(true);
                    
                    try {
                        console.log('🚀 [useMainAiChatController] Executing AI chat...');
                        const result = await executeAiChat(state);
                        console.log('✅ [useMainAiChatController] AI 채팅 실행 완료:', result);
                    } catch (error) {
                        console.error('❌ [useMainAiChatController] AI 채팅 실행 실패:', error);
                    } finally {
                        setIsProcessing(false);
                        console.log('🏁 [useMainAiChatController] Processing completed');
                    }
                };
                
                processMessage();
            } else {
                console.log('⚠️ [useMainAiChatController] Conditions not met:', {
                    hasLatestMessage: !!latestMessage,
                    messageType: latestMessage?.type,
                    messageId: latestMessage?.id,
                    lastProcessedId: lastProcessedMessageIdRef.current,
                    isUserMessage: latestMessage?.type === 'user',
                    isNewMessage: latestMessage?.id !== lastProcessedMessageIdRef.current,
                    isProcessing,
                    isConnected,
                    allConditions: {
                        condition1: !!latestMessage,
                        condition2: latestMessage?.type === 'user',
                        condition3: latestMessage?.id !== lastProcessedMessageIdRef.current,
                        condition4: !isProcessing,
                        condition5: isConnected
                    }
                });
            }
        });

        return unsubscribe;
    }, [executeAiChat, isConnected, isProcessing]);

    return {
        isProcessing,
        isConnected,
    };
}

export const useAiChatStoreStatusMonitor = () => {
    console.log('📷 [useAiChatStoreStatusMonitor] Initialized');

    const [newUserMessage, setNewUserMessage] = useState<string | null>(null);
    const [messageCount, setMessageCount] = useState(0);
    const lastMessageCountRef = useRef(0);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        // 중복 초기화 방지
        if (isInitializedRef.current) {
            console.log('🚫 [useAiChatStoreStatusMonitor] Already initialized, skipping');
            return;
        }
        
        console.log('📮 [useAiChatStoreStatusMonitor] Setting up store subscription');
        isInitializedRef.current = true;
        
        const unsubscribe = aiChatStore.subscribe((state) => {
            console.log('📥 [Store] State changed:', { 
                messageCount: state.messages?.length,
                lastMessage: state.messages?.[state.messages?.length - 1],
                allMessages: state.messages
            });
            
            const currentMessageCount = state.messages?.length || 0;
            console.log('📊 [Store] Message count comparison:', {
                current: currentMessageCount,
                previous: lastMessageCountRef.current
            });

            // 새로운 메시지가 추가된 경우
            if (currentMessageCount > lastMessageCountRef.current) {
                const latestMessage = state.messages?.[currentMessageCount - 1];
                console.log('🔍 [Store] Latest message detected:', latestMessage);

                // 사용자 메시지인지 확인 (type이 'user'인 경우)
                if (latestMessage && latestMessage.type === 'user') {
                    console.log('✅ [Store] Setting new user message:', latestMessage.content);
                    setNewUserMessage(latestMessage.content as string);
                } else {
                    console.log('⚠️ [Store] Message type is not "user":', latestMessage?.type);
                }

                lastMessageCountRef.current = currentMessageCount;
            } else {
                console.log('🔄 [Store] No new messages detected');
            }

            setMessageCount(currentMessageCount);
        });

        // 초기 메시지 카운트 설정
        const initialState = aiChatStore.getState();
        const initialCount = initialState.messages?.length || 0;
        console.log('🏁 [Store] Initial state:', {
            messageCount: initialCount,
            messages: initialState.messages
        });
        lastMessageCountRef.current = initialCount;
        setMessageCount(initialCount);

        return () => {
            console.log('🧹 [useAiChatStoreStatusMonitor] Cleaning up subscription');
            unsubscribe();
        };
    }, []);

    const clearNewMessage = useCallback(() => {
        setNewUserMessage(null);
    }, []);

    return {
        newUserMessage,
        messageCount,
        clearNewMessage,
    };
}

export const useAiChatExcuter = () => {
    console.log('🔧 [useAiChatExcuter] Hook initialized');

    const { connect, executeAiJob, isConnected, isConnecting, disconnect } = useAiChatApiConnector();
    const { chatId } = useChatStore();
    const { spreadsheetId } = useSpreadsheetIdStore();
    // Stale Closure 문제 해결: useStore 훅 사용하여 실시간 상태 감지
    const { selectedSheets } = useSpreadsheetNamesStore();

    // 서버 연결 초기화
    useEffect(() => {
        const serverUrl = process.env.NEXT_PUBLIC_AI_CHAT_SERVER_URL || 'ws://localhost:8080';
        
        console.log('🌐 [useAiChatExcuter] Attempting connection to:', serverUrl);
        console.log('🌐 [useAiChatExcuter] Connection status:', { isConnected, isConnecting });

        if (!isConnected && !isConnecting) {
            console.log('🚀 [useAiChatExcuter] Starting connection...');
            connect(serverUrl)
                .then(() => {
                    console.log('✅ [useAiChatExcuter] Connection successful!');
                })
                .catch((error) => {
                    console.error('❌ [useAiChatExcuter] Connection failed:', error);
                });
        } else {
            console.log('⏭️ [useAiChatExcuter] Skipping connection - already connected or connecting');
        }

        return () => {
            console.log('🧹 [useAiChatExcuter] Cleaning up connection');
            disconnect();
        };
    }, [connect, disconnect, isConnected, isConnecting]);

    const executeAiChat = useCallback(async (request: AiChatState) => {
        try {
            if (!chatId || !spreadsheetId) {
                throw new Error('Chat ID or Spreadsheet ID is required');
            }

            // 실행 시점의 최신 상태를 가져와서 Stale Closure 문제 해결
            const currentParsedSheetNames = selectedSheets.map(s => s.name);
            const currentChatMode = useChatModeStore.getState().mode;

            // 필요한 추가 정보를 request에 포함
            const lastContent = request.messages[request.messages.length - 1]?.content as string;
            const enrichedRequest: aiChatApiReq = {
                ...request,
                userId: getOrCreateGuestId(),
                chatId,
                spreadsheetId,
                parsedSheetNames: currentParsedSheetNames,
                jobId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                chatMode: currentChatMode,
                userQuestionMessage: lastContent,
            };

            // AI 작업 실행
            const result = await executeAiJob(enrichedRequest);

            return result;
        } catch (error) {
            console.error('AI Chat execution failed:', error);
            throw error;
        }
    }, [executeAiJob, chatId, spreadsheetId, selectedSheets]);

    return {
        executeAiChat,
        isConnected,
        isConnecting,
        connect,
        disconnect,
    };
};

