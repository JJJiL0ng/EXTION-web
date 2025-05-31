'use client'

import React, { useState, useEffect, useRef } from 'react';
import { 
    FirebaseMessage, 
    FirebaseChat,
    getChatMessages, 
    subscribeToChatMessages,
    convertFirebaseMessageToChatMessage,
    addMessage,
    getChat
} from '@/services/firebase/chatService';
import MessageDisplay from './MessageDisplay';
import { ChatMessage } from '@/stores/useUnifiedDataStore';
import { Loader2, MessageCircleIcon, AlertCircleIcon, SendIcon } from 'lucide-react';
import { useExtendedUnifiedDataStore } from '@/stores/useUnifiedDataStore';
import { callNormalChatAPI } from '@/services/api/dataServices';

interface FirebaseChatDisplayProps {
    chatId: string | null;
    onArtifactClick: (messageId: string) => void;
    onSpreadsheetLoad?: (chatData: FirebaseChat) => void;
}

const FirebaseChatDisplay: React.FC<FirebaseChatDisplayProps> = ({ 
    chatId, 
    onArtifactClick,
    onSpreadsheetLoad 
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [chatData, setChatData] = useState<FirebaseChat | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { xlsxData } = useExtendedUnifiedDataStore();

    // 메시지 끝으로 스크롤
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 메시지가 업데이트될 때마다 스크롤
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 채팅 데이터 로드 및 스프레드시트 데이터 전달
    useEffect(() => {
        if (!chatId) {
            setChatData(null);
            return;
        }

        const loadChatData = async () => {
            try {
                const chat = await getChat(chatId);
                setChatData(chat);
                
                // 스프레드시트 데이터가 있으면 부모 컴포넌트에 전달
                if (chat && chat.spreadsheetData && onSpreadsheetLoad) {
                    // spreadsheetId를 포함하여 전달
                    const chatDataWithSpreadsheetId = {
                        ...chat,
                        spreadsheetId: chat.spreadsheetId || chatId // 실제 spreadsheetId가 있으면 사용, 없으면 chatId 사용
                    };
                    onSpreadsheetLoad(chatDataWithSpreadsheetId);
                }
            } catch (error) {
                console.error('채팅 데이터 로드 오류:', error);
            }
        };

        loadChatData();
    }, [chatId, onSpreadsheetLoad]);

    // Firebase 채팅 메시지 실시간 구독
    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        const unsubscribe = subscribeToChatMessages(chatId, (firebaseMessages) => {
            try {
                // Firebase 메시지를 ChatMessage 형식으로 변환
                const convertedMessages = firebaseMessages.map(convertFirebaseMessageToChatMessage);
                setMessages(convertedMessages);
                setIsLoading(false);
            } catch (err) {
                console.error('메시지 변환 오류:', err);
                setError('메시지를 불러오는 중 오류가 발생했습니다.');
                setIsLoading(false);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [chatId]);

    // 메시지 전송
    const handleSendMessage = async () => {
        if (!chatId || !inputValue.trim() || isSending) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setIsSending(true);

        try {
            // 사용자 메시지 추가
            const userMessageData: Omit<FirebaseMessage, 'id' | 'chatId'> = {
                role: 'user',
                content: userMessage,
                timestamp: new Date(),
                type: 'text',
                mode: 'normal'
            };

            await addMessage(chatId, userMessageData);

            // AI 응답 요청 - 올바른 매개변수로 호출
            const response = await callNormalChatAPI(
                userMessage,
                null, // extendedSheetContext
                undefined, // getDataForGPTAnalysis
                {
                    chatId: chatId,
                    chatTitle: chatData?.title,
                    currentSheetIndex: 0
                }
            );

            // AI 응답 메시지 추가
            if (response.success && response.message) {
                const aiMessageData: Omit<FirebaseMessage, 'id' | 'chatId'> = {
                    role: 'Extion ai',
                    content: response.message,
                    timestamp: new Date(),
                    type: 'text',
                    mode: 'normal'
                };

                await addMessage(chatId, aiMessageData);
            } else {
                throw new Error(response.error || '응답 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('메시지 전송 오류:', error);
            setError('메시지 전송에 실패했습니다.');
        } finally {
            setIsSending(false);
        }
    };

    // 엔터 키 처리
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // 채팅이 선택되지 않은 경우
    if (!chatId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <MessageCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">채팅을 선택해주세요</h3>
                    <p className="text-sm">
                        왼쪽 사이드바에서 채팅을 선택하거나<br />
                        새로운 채팅을 시작해보세요
                    </p>
                </div>
            </div>
        );
    }

    // 오류 상태
    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-red-500">
                    <AlertCircleIcon className="h-16 w-16 mx-auto mb-4 text-red-300" />
                    <h3 className="text-lg font-medium mb-2">오류가 발생했습니다</h3>
                    <p className="text-sm">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        새로고침
                    </button>
                </div>
            </div>
        );
    }

    // 로딩 상태
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
                    <p className="text-sm">채팅 메시지를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // 메인 채팅 화면
    return (
        <div className="flex-1 flex flex-col bg-white">
            {/* 채팅 헤더 */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                            {chatData?.title || 'Firebase 채팅'}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{messages.length}개의 메시지</span>
                            {chatData?.spreadsheetData && (
                                <span className="flex items-center">
                                    📊 {chatData.spreadsheetData.fileName}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        실시간 동기화
                    </div>
                </div>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <MessageCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium mb-2">새로운 채팅입니다</h3>
                            <p className="text-sm">
                                첫 번째 메시지를 보내서<br />
                                대화를 시작해보세요
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto px-4 py-6">
                        <MessageDisplay 
                            messages={messages} 
                            onArtifactClick={onArtifactClick}
                        />
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* 채팅 입력 영역 */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={1}
                                style={{
                                    minHeight: '48px',
                                    maxHeight: '120px',
                                    height: 'auto'
                                }}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                                }}
                                disabled={isSending}
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isSending}
                            className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <SendIcon className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    
                    {isSending && (
                        <div className="mt-2 text-sm text-gray-500 flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            AI가 응답을 생성하고 있습니다...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FirebaseChatDisplay; 