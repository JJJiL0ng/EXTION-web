'use client'

import React, { useState, useEffect } from 'react';
import { 
    MessageCircleIcon, 
    PlusIcon, 
    FileSpreadsheetIcon, 
    TrashIcon,
    XIcon,
    MenuIcon
} from 'lucide-react';
import { useExtendedUnifiedDataStore } from '@/stores/useUnifiedDataStore';

interface ChatSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onToggle }) => {
    const {
        chatSessions,
        currentChatId,
        chatHistory,
        createNewChatSession,
        switchToChatSession,
        deleteChatSession,
        resetStore
    } = useExtendedUnifiedDataStore();

    // 채팅 세션들을 생성 시간 순으로 정렬 (고정된 순서 유지)
    const sortedChatSessions = Object.values(chatSessions)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 새 채팅 생성
    const handleNewChat = () => {
        const newChatId = createNewChatSession();
        console.log('새로운 채팅 세션 생성:', newChatId);
    };

    // 채팅 세션 전환
    const handleSwitchChat = (chatId: string) => {
        switchToChatSession(chatId);
    };

    // 채팅 삭제
    const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // 클릭 이벤트 전파 방지
        if (confirm('이 채팅을 삭제하시겠습니까?')) {
            deleteChatSession(chatId);
            
            // 현재 채팅이 삭제된 경우 새 채팅 생성
            if (currentChatId === chatId) {
                handleNewChat();
            }
        }
    };

    // 채팅 제목 생성 (파일명 또는 기본 제목)
    const getChatTitle = (session: any) => {
        if (session.chatTitle) {
            return session.chatTitle;
        }
        if (session.xlsxData?.fileName) {
            return session.xlsxData.fileName;
        }
        return `새 채팅 ${session.chatId.slice(-8)}`;
    };

    // 채팅 미리보기 텍스트 생성
    const getChatPreview = (session: any) => {
        if (session.xlsxData?.fileName) {
            return `📊 ${session.xlsxData.fileName}`;
        }
        return '파일을 업로드하여 채팅을 시작하세요';
    };

    return (
        <>
            {/* 사이드바 열기 버튼 (사이드바가 닫혀있을 때만 표시) */}
            {/* {!isOpen && (
                <button
                    onClick={onToggle}
                    className="fixed top-4 left-4 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
                    aria-label="사이드바 열기"
                >
                    <MenuIcon className="h-5 w-5" />
                </button>
            )} */}

            {/* 사이드바 */}
            <div className={`
                fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                w-80
            `}>
                {/* 헤더 */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-800">채팅 목록</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleNewChat}
                                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                새 채팅
                            </button>
                            <button
                                onClick={onToggle}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                aria-label="사이드바 닫기"
                            >
                                <XIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">
                        총 {Object.keys(chatSessions).length}개의 채팅
                    </div>
                </div>

                {/* 채팅 목록 */}
                <div className="flex-1 overflow-y-auto">
                    {sortedChatSessions.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            <MessageCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>아직 채팅이 없습니다</p>
                            <p className="text-sm">새 채팅을 만들어보세요</p>
                        </div>
                    ) : (
                        <div className="p-2">
                            {sortedChatSessions.map((session) => (
                                <div
                                    key={session.chatId}
                                    onClick={() => handleSwitchChat(session.chatId)}
                                    className={`
                                        relative p-3 mb-2 rounded-lg cursor-pointer transition-all group
                                        ${currentChatId === session.chatId 
                                            ? 'bg-blue-50 border-2 border-blue-200' 
                                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                        }
                                    `}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center mb-1">
                                                {session.hasUploadedFile ? (
                                                    <FileSpreadsheetIcon className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                                                ) : (
                                                    <MessageCircleIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                                )}
                                                <h3 className="font-medium text-sm text-gray-800 truncate">
                                                    {getChatTitle(session)}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                {getChatPreview(session)}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(session.lastAccessedAt).toLocaleDateString('ko-KR')} {' '}
                                                {new Date(session.lastAccessedAt).toLocaleTimeString('ko-KR', { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </p>
                                        </div>
                                        
                                        {/* 삭제 버튼 */}
                                        <button
                                            onClick={(e) => handleDeleteChat(session.chatId, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all ml-2"
                                            aria-label="채팅 삭제"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    
                                    {/* 현재 활성 채팅 표시 */}
                                    {currentChatId === session.chatId && (
                                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className="p-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 text-center">
                        Extion Chat v1.0
                    </div>
                </div>
            </div>

            {/* 오버레이 (모바일용) */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-25 z-30 lg:hidden"
                    onClick={onToggle}
                />
            )}
        </>
    );
};

export default ChatSidebar; 