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
    console.log('useMainAiChatController22222 initialized');
    const { newUserMessage, clearNewMessage } = useAiChatStoreStatusMonitor();
    const { executeAiChat, isConnected } = useAiChatExcuter();
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const handleNewUserMessage = async () => {
            if (newUserMessage && !isProcessing && isConnected) {
                setIsProcessing(true);

                try {
                    // aiChatStore에서 현재 상태 가져오기
                    const currentState = aiChatStore.getState();

                    // AI 채팅 실행
                    const result = await executeAiChat(currentState);

                    console.log('AI 채팅 실행 완료:', result);

                    // 새 메시지 상태 초기화
                    clearNewMessage();

                } catch (error) {
                    console.error('AI 채팅 실행 실패:', error);
                } finally {
                    setIsProcessing(false);
                }
            }
        };

        handleNewUserMessage();
    }, [newUserMessage, isProcessing, isConnected, executeAiChat, clearNewMessage]);

    return {
        isProcessing,
        isConnected,
        newUserMessage,
    };
}

export const useAiChatStoreStatusMonitor = () => {
    console.log('useAiChatStoreStatusMonitor77777 initialized');

    const [newUserMessage, setNewUserMessage] = useState<string | null>(null);
    const [messageCount, setMessageCount] = useState(0);
    const lastMessageCountRef = useRef(0);

    useEffect(() => {
        const unsubscribe = aiChatStore.subscribe((state) => {
            const currentMessageCount = state.messages?.length || 0;

            // 새로운 메시지가 추가된 경우
            if (currentMessageCount > lastMessageCountRef.current) {
                const latestMessage = state.messages?.[currentMessageCount - 1];

                // 사용자 메시지인지 확인 (type이 'user'인 경우)
                if (latestMessage && latestMessage.type === 'user') {
                    setNewUserMessage(latestMessage.content as string);
                }

                lastMessageCountRef.current = currentMessageCount;
            }

            setMessageCount(currentMessageCount);
        });

        // 초기 메시지 카운트 설정
        const initialState = aiChatStore.getState();
        lastMessageCountRef.current = initialState.messages?.length || 0;
        setMessageCount(lastMessageCountRef.current);

        return unsubscribe;
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
    console.log('useMainAiChatController999 initialized');

    const { connect, executeAiJob, isConnected, isConnecting, disconnect } = useAiChatApiConnector();
    const { chatId } = useChatStore();
    const { spreadsheetId } = useSpreadsheetIdStore();
    // Stale Closure 문제 해결: useStore 훅 사용하여 실시간 상태 감지
    const { selectedSheets } = useSpreadsheetNamesStore();

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

