'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
    MessageCircleIcon, 
    PlusIcon, 
    FileSpreadsheetIcon, 
    TrashIcon,
    XIcon,
    MenuIcon,
    Loader2Icon,
    RefreshCwIcon,
    Cloud,
    ChevronLeftIcon,
    SearchIcon,
    FilterIcon,
    MoreVerticalIcon,
    CalendarIcon,
    ClockIcon,
    Layers
} from 'lucide-react';
import { useUnifiedStore } from '@/stores';
import { 
    getUserChats, 
    deleteChat, 
    createChat,
    FirebaseChat,
    getChatMessages,
    convertFirebaseMessageToChatMessage
} from '@/services/firebase/chatService';
import { 
    getSpreadsheetByChatId 
} from '@/services/firebase/spreadsheetService';
import { auth } from '@/services/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

interface ChatSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

// 클라우드 채팅 아이템 타입
interface CloudChatItem {
    id: string;
    title: string;
    updatedAt: Date;
    preview: string;
    hasSpreadsheet: boolean;
    spreadsheetInfo?: {
        fileName: string;
        totalSheets: number;
    };
    messageCount?: number;
    isActive: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onToggle }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [firebaseChats, setFirebaseChats] = useState<FirebaseChat[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'spreadsheet' | 'chat'>('all');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const {
        chatSessions,
        currentChatId,
        chatHistory,
        createNewChatSession,
        switchToChatSession,
        deleteChatSession,
        loadChatSessionsFromStorage,
        saveChatSessionToStorage,
        xlsxData,
        resetAllStores,
        getCurrentChatSession,
        updateChatSession,
        setXLSXData,
        setCurrentChatId,
        saveCurrentSessionToStore,
        setCurrentSpreadsheetId,
        addMessageToSheet,
        clearAllMessages
    } = useUnifiedStore();

    const router = useRouter();
    const searchParams = useSearchParams();

    // Firebase 인증 상태 감지
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Firebase 채팅 목록 로드
    const loadFirebaseChats = useCallback(async () => {
        if (!user) return;

        setIsLoadingChats(true);
        try {
            const chats = await getUserChats(user.uid);
            setFirebaseChats(chats);
            console.log('Firebase 채팅 목록 로드됨:', chats.length, '개');
        } catch (error) {
            console.error('Firebase 채팅 목록 로드 오류:', error);
        } finally {
            setIsLoadingChats(false);
        }
    }, [user]);

    // 컴포넌트 마운트 시 Firebase 채팅 목록 로드
    useEffect(() => {
        if (user && !loading) {
            loadFirebaseChats();
        }
    }, [user, loading, loadFirebaseChats]);

    // URL 파라미터와 선택된 채팅 동기화
    useEffect(() => {
        const chatId = searchParams.get('chatId');
        setSelectedChatId(chatId);
    }, [searchParams]);

    // 클라우드 채팅 목록 생성 및 필터링
    const getCloudChatList = (): CloudChatItem[] => {
        const cloudChats: CloudChatItem[] = [];

        // Firebase 채팅 추가
        firebaseChats.forEach(chat => {
            cloudChats.push({
                id: chat.id,
                title: chat.title,
                updatedAt: chat.updatedAt,
                preview: getFirebaseChatPreview(chat),
                hasSpreadsheet: chat.spreadsheetData?.hasSpreadsheet || false,
                spreadsheetInfo: chat.spreadsheetData?.hasSpreadsheet ? {
                    fileName: chat.spreadsheetData.fileName || '',
                    totalSheets: chat.spreadsheetData.totalSheets || 1
                } : undefined,
                messageCount: chat.messageCount,
                isActive: selectedChatId === chat.id
            });
        });

        // 필터링 적용
        let filteredChats = cloudChats;

        // 검색 필터
        if (searchQuery.trim()) {
            filteredChats = filteredChats.filter(chat => 
                chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chat.preview.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // 타입 필터
        if (filterType === 'spreadsheet') {
            filteredChats = filteredChats.filter(chat => chat.hasSpreadsheet);
        } else if (filterType === 'chat') {
            filteredChats = filteredChats.filter(chat => !chat.hasSpreadsheet);
        }

        // 최신 순으로 정렬
        return filteredChats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    };

    // Firebase 채팅 선택 및 복원
    const handleSelectFirebaseChat = async (chat: FirebaseChat) => {
        try {
            console.log('=== Firebase 채팅 선택 ===', chat.id);
            
            // URL 업데이트만 수행 - 실제 데이터 로드는 페이지에서 처리
            router.push(`/ai?chatId=${chat.id}`);
            console.log('URL 업데이트:', `/ai?chatId=${chat.id}`);
            
        } catch (error) {
            console.error('❌ Firebase 채팅 선택 실패:', error);
        }
    };

    // 새 채팅 생성 (Firebase)
    const handleNewFirebaseChat = async () => {
        if (!user) return;

        setIsCreatingChat(true);
        try {
            const chatTitle = `새 채팅 ${new Date().toLocaleString('ko-KR')}`;
            const newChatId = await createChat(chatTitle, user.uid);
            
            console.log('새 Firebase 채팅 생성됨:', newChatId);
            
            // 채팅 목록 새로고침
            await loadFirebaseChats();
            
            // 새 채팅으로 URL 이동
            router.push(`/ai?chatId=${newChatId}`);
            
        } catch (error) {
            console.error('새 Firebase 채팅 생성 오류:', error);
        } finally {
            setIsCreatingChat(false);
        }
    };

    // 채팅 선택 핸들러
    const handleSelectChat = async (chatItem: CloudChatItem) => {
        const firebaseChat = firebaseChats.find(chat => chat.id === chatItem.id);
        if (firebaseChat) {
            await handleSelectFirebaseChat(firebaseChat);
        }
    };

    // 채팅 삭제 핸들러
    const handleDeleteChat = async (chatItem: CloudChatItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(chatItem.id);
    };

    // 삭제 확인 핸들러
    const confirmDeleteChat = async (chatId: string) => {
        try {
            await deleteChat(chatId);
            console.log('Firebase 채팅 삭제됨:', chatId);
            
            // 삭제된 채팅이 현재 선택된 채팅이면 초기화
            if (selectedChatId === chatId) {
                setSelectedChatId(null);
                resetAllStores();
                
                // URL을 기본 AI 페이지로 리다이렉트
                router.push('/ai');
            }
            
            // 채팅 목록 새로고침
            await loadFirebaseChats();
        } catch (error) {
            console.error('채팅 삭제 오류:', error);
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    // Firebase 채팅 미리보기 텍스트 생성
    const getFirebaseChatPreview = (chat: FirebaseChat) => {
        if (chat.spreadsheetData?.hasSpreadsheet && chat.spreadsheetData.fileName) {
            return `📊 ${chat.spreadsheetData.fileName}`;
        }
        if (chat.lastMessage) {
            return chat.lastMessage.content;
        }
        return '채팅을 시작하세요';
    };

    // 시간 포맷팅 함수
    const formatTime = (date: Date) => {
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInHours * 60);
            return `${diffInMinutes}분 전`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}시간 전`;
        } else if (diffInHours < 48) {
            return '어제';
        } else {
            return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        }
    };

    const cloudChats = getCloudChatList();

    return (
        <>
            {/* 사이드바 */}
            <div className={`
                fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-xl z-50 
                transition-all duration-300 ease-out backdrop-blur-sm flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                w-80
            `}>
                {/* 헤더 */}
                <div className="p-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <Image 
                                src="/logo.png" 
                                alt="EXTION" 
                                width={32}
                                height={32}
                                className="w-auto"
                            />
                        </div>
                        {/* <button
                            onClick={onToggle}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
                            aria-label="사이드바 닫기"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button> */}
                    </div>

                    {/* 검색 및 필터 */}
                    <div className="space-y-3">
                        {/* 검색바 */}
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="채팅 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                                style={{ 
                                    '--tw-ring-color': '#005DE9',
                                    '--tw-ring-opacity': '0.5'
                                } as React.CSSProperties}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#005DE9';
                                    e.target.style.boxShadow = '0 0 0 2px rgba(0, 93, 233, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e5e7eb';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>

                    {/* 새 채팅 버튼 */}
                    {user && (
                        <button
                            onClick={handleNewFirebaseChat}
                            disabled={isCreatingChat}
                            className="w-full mt-4 flex items-center justify-center px-4 py-3 text-white rounded-xl transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            style={{ backgroundColor: '#005DE9' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#004ab8';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#005DE9';
                            }}
                        >
                            {isCreatingChat ? (
                                <>
                                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                                    생성 중...
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    새 채팅 시작
                                </>
                            )}
                        </button>
                    )}

                    {/* 상태 정보 */}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>
                            {user ? `총 ${cloudChats.length}개 채팅` : '로그인이 필요합니다'}
                        </span>
                        {user && (
                            <button
                                onClick={loadFirebaseChats}
                                disabled={isLoadingChats}
                                className="p-1 hover:bg-white/50 rounded transition-colors"
                                title="새로고침"
                            >
                                <RefreshCwIcon className={`h-3 w-3 ${isLoadingChats ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>

                {/* 채팅 목록 - 독립적인 스크롤 영역 */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 #f1f5f9'
                }}>
                    <div className="p-2">
                        {cloudChats.length === 0 && !isLoadingChats ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <MessageCircleIcon className="h-8 w-8 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium mb-1">채팅이 없습니다</p>
                                <p className="text-xs text-gray-400">새 채팅을 시작해보세요</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cloudChats.map((chatItem) => (
                                    <div
                                        key={chatItem.id}
                                        onClick={() => handleSelectChat(chatItem)}
                                        className={`
                                            relative p-4 rounded-xl cursor-pointer transition-all duration-200 group
                                            ${chatItem.isActive 
                                                ? 'border-2 shadow-md' 
                                                : 'bg-gray-50 hover:bg-white hover:shadow-md border-2 border-transparent'
                                            }
                                        `}
                                        style={chatItem.isActive ? {
                                            backgroundColor: 'rgba(0, 93, 233, 0.05)',
                                            borderColor: '#005DE9'
                                        } : {}}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm text-gray-800 truncate">
                                                            {chatItem.title}
                                                        </h3>
                                                        <div className="flex items-center mt-1 space-x-2">
                                                            <ClockIcon className="h-3 w-3 text-gray-400" />
                                                            <span className="text-xs text-gray-500">
                                                                {formatTime(chatItem.updatedAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* 액션 버튼 */}
                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={(e) => handleDeleteChat(chatItem, e)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                                                    aria-label="채팅 삭제"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* 현재 활성 채팅 표시 */}
                                        {chatItem.isActive && (
                                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r"
                                                 style={{ backgroundColor: '#005DE9' }}></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* 로딩 상태 */}
                        {isLoadingChats && (
                            <div className="flex items-center justify-center p-8">
                                <div className="flex flex-col items-center space-y-3">
                                    <Loader2Icon className="h-8 w-8 animate-spin" style={{ color: '#005DE9' }} />
                                    <span className="text-sm text-gray-500">채팅 목록을 불러오는 중...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 푸터 */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <div className="text-xs text-gray-500 text-center">
                        {user ? (
                            <div className="space-y-1">
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="font-medium">{user.email}</span>
                                </div>
                                <div className="text-gray-400">Extion Chat v1.0</div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <div>로그인하여 채팅을 시작하세요</div>
                                <div className="text-gray-400">Extion Chat v1.0</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 삭제 확인 모달 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                <TrashIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">채팅 삭제</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                이 채팅을 삭제하시겠습니까?<br />
                                삭제된 채팅은 복구할 수 없습니다.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={() => confirmDeleteChat(showDeleteConfirm)}
                                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 오버레이 */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-25 z-40 xl:hidden backdrop-blur-sm"
                    onClick={onToggle}
                />
            )}
        </>
    );
};

export default ChatSidebar; 