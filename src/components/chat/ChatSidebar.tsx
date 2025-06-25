'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
    MessageCircleIcon, 
    PlusIcon, 
    TrashIcon,
    Loader2Icon,
    RefreshCwIcon,
    SearchIcon,
    ClockIcon,
} from 'lucide-react';
import GoogleIcon from '@/components/icons/GoogleIcon';
import { useUnifiedStore } from '@/stores';
import { useAuthStore } from '@/stores/authStore';
import { 
    getChatList, 
    loadChatMessages,
    createChat,
    deleteChat,
    convertApiMessageToChatMessage,
    ChatListItem
} from '@/services/api/chatService';
import { 
    getSpreadsheetDataByChatId,
    convertSpreadsheetDataToXLSXData
} from '@/services/api/spreadsheetService';
import { signInWithGoogle } from '@/services/firebase/authService';
import { XLSXData } from '@/stores/store-types';

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
    const { user, loading } = useAuthStore();
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'spreadsheet' | 'chat'>('all');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [loadingChatId, setLoadingChatId] = useState<string | null>(null);

    const {
        xlsxData,
        resetAllStores,
        setXLSXData,
        setCurrentChatId,
        setCurrentSheetMetaDataId,
        addMessageToSheet,
        chatListRefreshTrigger,
        saveChatListToStorage,
        loadChatListFromStorage,
        getCachedChatList,
        isChatListCacheValid,
        clearChatListCache
    } = useUnifiedStore();

    const router = useRouter();
    const searchParams = useSearchParams();

    // 채팅 목록 로드 (캐시 우선)
    const loadChats = useCallback(async (forceRefresh = false) => {
        if (!user) return;

        // 강제 새로고침이 아니고 유효한 캐시가 있으면 캐시 사용
        if (!forceRefresh && isChatListCacheValid()) {
            const cachedList = getCachedChatList();
            if (cachedList.length > 0) {
                // StoredChatListItem을 ChatListItem으로 변환
                const convertedChats: ChatListItem[] = cachedList.map(chat => ({
                    ...chat,
                    updatedAt: new Date(chat.updatedAt),
                    createdAt: new Date(chat.createdAt),
                    messageCount: chat.messageCount || 0,
                    lastMessage: chat.lastMessage ? {
                        ...chat.lastMessage,
                        timestamp: new Date(chat.lastMessage.timestamp)
                    } : undefined
                }));
                
                setChats(convertedChats);
                console.log('📋 캐시에서 채팅 목록 로드됨:', convertedChats.length, '개');
                return;
            }
        }

        setIsLoadingChats(true);
        try {
            const response = await getChatList(user.uid);
            setChats(response.chats);
            
            // 로컬스토리지에 저장
            saveChatListToStorage(response.chats);
            
            console.log('📋 API에서 채팅 목록 로드됨:', response.chats.length, '개');
            
            // 각 채팅의 스프레드시트 정보 디버깅
            response.chats.forEach((chat: ChatListItem) => {
                console.log('채팅:', {
                    id: chat.id,
                    title: chat.title,
                    sheetMetaDataId: chat.sheetMetaDataId,
                    hasSpreadsheetData: !!chat.spreadsheetData,
                    messageCount: chat.messageCount
                });
            });
        } catch (error) {
            console.error('❌ 채팅 목록 로드 오류:', error);
            
            // API 실패 시 캐시된 데이터라도 사용
            const cachedList = getCachedChatList();
            if (cachedList.length > 0) {
                const convertedChats: ChatListItem[] = cachedList.map(chat => ({
                    ...chat,
                    updatedAt: new Date(chat.updatedAt),
                    createdAt: new Date(chat.createdAt),
                    messageCount: chat.messageCount || 0,
                    lastMessage: chat.lastMessage ? {
                        ...chat.lastMessage,
                        timestamp: new Date(chat.lastMessage.timestamp)
                    } : undefined
                }));
                
                setChats(convertedChats);
                console.log('📋 API 실패로 캐시에서 채팅 목록 복원:', convertedChats.length, '개');
            }
        } finally {
            setIsLoadingChats(false);
        }
    }, [user, isChatListCacheValid, getCachedChatList, saveChatListToStorage]);

    // 컴포넌트 마운트 시 로컬스토리지에서 캐시 로드
    useEffect(() => {
        // 사용자 정보가 없어도 캐시는 로드할 수 있음
        loadChatListFromStorage();
    }, [loadChatListFromStorage]);

    // 컴포넌트 마운트 시 채팅 목록 로드
    useEffect(() => {
        if (user && !loading) {
            loadChats();
        }
    }, [user, loading, loadChats]);

    // chatListRefreshTrigger가 변경될 때 채팅 목록 새로고침
    useEffect(() => {
        if (chatListRefreshTrigger && user && !loading) {
            console.log('📋 채팅 목록 새로고침 트리거 감지:', chatListRefreshTrigger);
            loadChats();
        }
    }, [chatListRefreshTrigger, user, loading, loadChats]);

    // URL 파라미터와 선택된 채팅 동기화
    useEffect(() => {
        const chatId = searchParams.get('chatId');
        setSelectedChatId(chatId);
    }, [searchParams]);

    // 선택된 채팅 ID 변경 시 로딩 상태 동기화
    useEffect(() => {
        if (selectedChatId && loadingChatId && selectedChatId === loadingChatId) {
            console.log('📋 선택된 채팅 ID와 로딩 중인 채팅 ID 일치 - 로딩 상태 유지');
        }
    }, [selectedChatId, loadingChatId]);

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    // 클라우드 채팅 목록 생성 및 필터링
    const getCloudChatList = (): CloudChatItem[] => {
        const cloudChats: CloudChatItem[] = [];

        // API 채팅 추가
        chats.forEach(chat => {
            const hasSpreadsheet = !!chat.sheetMetaDataId;
            cloudChats.push({
                id: chat.id,
                title: chat.title,
                updatedAt: chat.updatedAt,
                preview: getChatPreview(chat),
                hasSpreadsheet: hasSpreadsheet,
                spreadsheetInfo: hasSpreadsheet ? {
                    fileName: chat.spreadsheetData?.fileName || 'Spreadsheet',
                    totalSheets: chat.spreadsheetData?.totalSheets || 1
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

    // 채팅 선택 및 복원 (최적화된 버전)
    const handleSelectChat = async (chat: ChatListItem) => {
        if (selectedChatId === chat.id) return;
    
        console.log('=== 채팅 선택 시작 ===', {
            chatId: chat.id,
            chatTitle: chat.title,
            hasSpreadsheet: !!chat.sheetMetaDataId,
            messageCount: chat.messageCount
        });

        if (!chat.id) {
            console.error('❌ 채팅 ID가 없습니다:', chat);
            return;
        }

        setLoadingChatId(chat.id);
        try {
            // 1. 상태 초기화
            resetAllStores();

            // 2. 채팅 ID와 스프레드시트 ID 설정
            setCurrentChatId(chat.id);
            if (chat.sheetMetaDataId) {
                setCurrentSheetMetaDataId(chat.sheetMetaDataId);
            }
            
            // 3. 병렬로 데이터 로드
            const [spreadsheetDataResult, chatMessagesResult] = await Promise.allSettled([
                // 스프레드시트 데이터 로드
                chat.sheetMetaDataId ? getSpreadsheetDataByChatId(chat.id) : Promise.resolve(null),
                // 채팅 메시지 로드
                user ? loadChatMessages(chat.id, user.uid) : Promise.reject(new Error('사용자 정보가 없습니다.'))
            ]);

            // 4. 스프레드시트 데이터 처리
            let loadedXlsxData: XLSXData | null = null;
            if (spreadsheetDataResult.status === 'fulfilled' && spreadsheetDataResult.value) {
                loadedXlsxData = convertSpreadsheetDataToXLSXData(spreadsheetDataResult.value);
                setCurrentSheetMetaDataId(spreadsheetDataResult.value.id);
                console.log('📊 스프레드시트 데이터 로드 완료:', {
                    fileName: loadedXlsxData?.fileName,
                    sheetsCount: loadedXlsxData?.sheets?.length
                });
            } else {
                console.log('📊 스프레드시트 없음 - 빈 시트 표시');
                setCurrentSheetMetaDataId(null);
            }
            
            // 5. 스프레드시트 데이터 설정
            setXLSXData(loadedXlsxData);
            
            // 6. 채팅 메시지 처리
            if (chatMessagesResult.status === 'fulfilled') {
                const chatMessages = chatMessagesResult.value.messages.map(convertApiMessageToChatMessage);
                const activeSheetIndex = loadedXlsxData?.activeSheetIndex ?? 0;
                
                // 메시지를 활성 시트에 추가
                chatMessages.forEach(message => {
                    addMessageToSheet(activeSheetIndex, message);
                });
                
                console.log('💬 채팅 메시지 로드 완료:', chatMessages.length, '개');
            } else {
                console.error('❌ 채팅 메시지 로드 실패:', chatMessagesResult.reason);
            }

            // 7. URL 업데이트 (필요한 경우에만)
            const currentUrl = new URL(window.location.href);
            const currentChatIdFromUrl = currentUrl.searchParams.get('chatId');
            
            if (currentChatIdFromUrl !== chat.id) {
                router.push(`/ai?chatId=${chat.id}`);
                console.log('🔗 URL 업데이트:', `/ai?chatId=${chat.id}`);
            }

            // 8. 캐시 업데이트 (채팅 접근 시간 업데이트)
            const updatedChatList = chats.map(c => 
                c.id === chat.id ? { ...c, updatedAt: new Date() } : c
            );
            saveChatListToStorage(updatedChatList);

            setLoadingChatId(null);
            console.log('✅ 채팅 선택 완료');
            
        } catch (error) {
            console.error('❌ 채팅 선택 실패:', error);
            resetAllStores();
            setLoadingChatId(null);
        }
    };

    // 새 채팅 생성
    const handleNewChat = async () => {
        if (!user) return;

        setIsCreatingChat(true);
        try {
            // 1. 먼저 기존 스프레드시트 데이터 초기화
            console.log('🧹 새 채팅 시작 - 기존 데이터 초기화');
            resetAllStores();
            
            const chatTitle = `채팅 ${new Date().toLocaleString('ko-KR')}`;
            // 새 sheetMetaDataId 생성
            const newSheetMetaDataId = crypto.randomUUID();
            
            const newChatId = await createChat(chatTitle, user.uid, newSheetMetaDataId);
            
            console.log('새 채팅 생성됨:', newChatId, '연결된 sheetMetaDataId:', newSheetMetaDataId);
            
            // 2. 채팅 목록 새로고침 (강제)
            await loadChats(true);

            // 3. 새 채팅 상태 설정
            setCurrentChatId(newChatId);
            setCurrentSheetMetaDataId(newSheetMetaDataId);
            
            // 4. 새 채팅으로 URL 이동
            router.push(`/ai?chatId=${newChatId}`);
            
        } catch (error) {
            console.error('새 채팅 생성 오류:', error);
        } finally {
            setIsCreatingChat(false);
        }
    };

    // 채팅 선택 핸들러 (CloudChatItem 대응)
    const handleSelectCloudChat = async (chatItem: CloudChatItem) => {
        if (chatItem.isActive || loadingChatId) {
            return;
        }

        const chat = chats.find(chat => chat.id === chatItem.id);
        if (chat) {
            await handleSelectChat(chat);
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
            if (!user) {
                throw new Error('사용자 정보가 없습니다.');
            }
            await deleteChat(chatId, user.uid);
            console.log('채팅 삭제됨:', chatId);
            
            // 삭제된 채팅이 현재 선택된 채팅이면 초기화
            if (selectedChatId === chatId) {
                setSelectedChatId(null);
                resetAllStores();
                
                // URL을 기본 AI 페이지로 리다이렉트
                router.push('/ai');
            }
            
            // 채팅 목록 새로고침 (강제)
            await loadChats(true);
        } catch (error) {
            console.error('채팅 삭제 오류:', error);
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    // 채팅 미리보기 텍스트 생성
    const getChatPreview = (chat: ChatListItem) => {
        // sheetMetaDataId가 있으면 스프레드시트 채팅
        if (chat.sheetMetaDataId) {
            const fileName = chat.spreadsheetData?.fileName || 'Spreadsheet';
            return `📊 ${fileName}`;
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
                        {!loading && !user && (
                            <button
                                onClick={handleLogin}
                                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <GoogleIcon className="w-4 h-4" />
                                <span>구글로 로그인</span>
                            </button>
                        )}
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
                            onClick={handleNewChat}
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
                                onClick={() => loadChats(true)}
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
                                        onClick={() => handleSelectCloudChat(chatItem)}
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
                                                <div className="flex items-center mb-1">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm text-gray-800 truncate">
                                                            {chatItem.title}
                                                        </h3>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* 액션 버튼 */}
                                            {/* <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={(e) => handleDeleteChat(chatItem, e)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                                                    aria-label="채팅 삭제"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div> */}
                                        </div>
                                        
                                        {/* 현재 활성 채팅 표시 */}
                                        {chatItem.isActive && (
                                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r"
                                                 style={{ backgroundColor: '#005DE9' }}></div>
                                        )}

                                        {/* 채팅 로딩 오버레이 */}
                                        {loadingChatId === chatItem.id && (
                                            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                <Loader2Icon className="h-6 w-6 animate-spin" style={{ color: '#005DE9' }} />
                                            </div>
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
                                    <span className="font-medium">{user.email || user.displayName}</span>
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