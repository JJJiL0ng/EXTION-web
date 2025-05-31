'use client'

import React, { useState, useEffect } from 'react';
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
    HardDrive
} from 'lucide-react';
import { useExtendedUnifiedDataStore } from '@/stores/useUnifiedDataStore';
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

// 통합 채팅 아이템 타입
interface UnifiedChatItem {
    id: string;
    title: string;
    type: 'cloud' | 'local';
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

    const {
        chatSessions,
        currentChatId,
        chatHistory,
        createNewChatSession,
        switchToChatSession,
        deleteChatSession,
        resetStore,
        setXLSXData,
        setCurrentChatId,
        addMessageToSheet,
        clearAllMessages,
        setCurrentSpreadsheetId,
        setSpreadsheetMetadata,
        markAsSaved,
        updateExtendedSheetContext
    } = useExtendedUnifiedDataStore();

    // Firebase 인증 상태 감지
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Firebase 채팅 목록 로드
    const loadFirebaseChats = async () => {
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
    };

    // 컴포넌트 마운트 시 Firebase 채팅 목록 로드
    useEffect(() => {
        if (user && !loading) {
            loadFirebaseChats();
        }
    }, [user, loading]);

    // 통합 채팅 목록 생성
    const getUnifiedChatList = (): UnifiedChatItem[] => {
        const unifiedChats: UnifiedChatItem[] = [];

        // Firebase 채팅 추가
        firebaseChats.forEach(chat => {
            unifiedChats.push({
                id: chat.id,
                title: chat.title,
                type: 'cloud',
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

        // 로컬 채팅 추가
        Object.values(chatSessions).forEach(session => {
            unifiedChats.push({
                id: session.chatId,
                title: getLocalChatTitle(session),
                type: 'local',
                updatedAt: new Date(session.lastAccessedAt),
                preview: getLocalChatPreview(session),
                hasSpreadsheet: session.hasUploadedFile || false,
                spreadsheetInfo: session.xlsxData ? {
                    fileName: session.xlsxData.fileName,
                    totalSheets: session.xlsxData.sheets?.length || 1
                } : undefined,
                isActive: currentChatId === session.chatId && !selectedChatId
            });
        });

        // 최신 순으로 정렬
        return unifiedChats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    };

    // Firebase 채팅 선택 및 복원
    const handleSelectFirebaseChat = async (chat: FirebaseChat) => {
        if (selectedChatId === chat.id) return;

        setSelectedChatId(chat.id);
        console.log('=== Firebase 채팅 선택 시작 ===');
        console.log('채팅 정보:', {
            id: chat.id,
            title: chat.title,
            hasSpreadsheet: chat.spreadsheetData?.hasSpreadsheet,
            spreadsheetId: chat.spreadsheetId,
            fileName: chat.spreadsheetData?.fileName,
            totalSheets: chat.spreadsheetData?.totalSheets,
            messageCount: chat.messageCount
        });

        try {
            // 1. 현재 상태 초기화
            console.log('1. 상태 초기화 중...');
            resetStore();

            // 2. 채팅 ID 설정 및 URL 업데이트
            console.log('2. 채팅 ID 설정:', chat.id);
            setCurrentChatId(chat.id);
            
            // URL 파라미터에 Firebase 채팅 ID 설정
            if (typeof window !== 'undefined') {
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('chatId', chat.id);
                window.history.replaceState({}, '', newUrl.toString());
                console.log('✅ URL 파라미터 설정됨:', chat.id);
            }

            // 3. 스프레드시트 데이터 복원 (spreadsheetId가 있는 경우)
            if (chat.spreadsheetId) {
                console.log('3. 스프레드시트 데이터 복원 시작...');
                console.log('사용할 spreadsheetId:', chat.spreadsheetId);
                
                try {
                    // spreadsheetId로 직접 스프레드시트 조회
                    console.log('스프레드시트 직접 조회 시작...');
                    const { getSpreadsheetData } = await import('@/services/firebase/spreadsheetService');
                    const spreadsheetData = await getSpreadsheetData(chat.spreadsheetId);
                    
                    if (spreadsheetData) {
                        console.log('✅ 스프레드시트 데이터 복원 성공:', {
                            fileName: spreadsheetData.fileName,
                            sheetsCount: spreadsheetData.sheets.length,
                            spreadsheetId: spreadsheetData.spreadsheetId,
                            activeSheetIndex: spreadsheetData.activeSheetIndex,
                            sheets: spreadsheetData.sheets.map((s: any) => ({
                                name: s.sheetName,
                                headers: s.headers?.length || 0,
                                dataRows: s.data?.length || 0,
                                rawDataRows: s.rawData?.length || 0
                            }))
                        });
                        
                        // 스프레드시트 데이터 설정
                        setXLSXData(spreadsheetData);
                        
                        // 스프레드시트 메타데이터 설정
                        setCurrentSpreadsheetId(chat.spreadsheetId);
                        setSpreadsheetMetadata({
                            fileName: spreadsheetData.fileName,
                            originalFileName: spreadsheetData.fileName,
                            fileSize: 0, // Firebase에서 가져올 수 없는 정보
                            fileType: 'xlsx', // 기본값
                            isSaved: true,
                            lastSaved: chat.updatedAt
                        });
                        markAsSaved(chat.spreadsheetId);
                        
                        // extendedSheetContext 업데이트
                        setTimeout(() => {
                            console.log('🔄 ExtendedSheetContext 업데이트 시도');
                            updateExtendedSheetContext();
                        }, 100);
                        
                        console.log('✅ 스프레드시트 메타데이터 설정 완료');
                    } else {
                        console.warn('⚠️ 스프레드시트 데이터를 찾을 수 없습니다. spreadsheetId:', chat.spreadsheetId);
                    }
                } catch (spreadsheetError) {
                    console.error('❌ 스프레드시트 데이터 복원 오류:', spreadsheetError);
                    // 스프레드시트 로딩 실패해도 채팅은 계속 진행
                }
            } else {
                console.log('3. spreadsheetId 없음 - 스프레드시트 건너뛰기');
            }

            // 4. 채팅 메시지 복원
            console.log('4. 채팅 메시지 복원 시작...');
            try {
                const messages = await getChatMessages(chat.id, 100);
                console.log('✅ Firebase 메시지 로드 성공:', {
                    messageCount: messages.length,
                    messageTypes: messages.reduce((acc, msg) => {
                        acc[msg.type] = (acc[msg.type] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>)
                });

                // 메시지를 시트별로 분류하여 추가
                messages.forEach((firebaseMessage, index) => {
                    const chatMessage = convertFirebaseMessageToChatMessage(firebaseMessage);
                    const sheetIndex = firebaseMessage.sheetContext?.sheetIndex || 0;
                    
                    if (index < 5) { // 처음 5개 메시지만 로깅
                        console.log(`메시지 ${index + 1}:`, {
                            role: firebaseMessage.role,
                            type: firebaseMessage.type,
                            sheetIndex,
                            contentPreview: firebaseMessage.content.substring(0, 50) + '...'
                        });
                    }
                    
                    addMessageToSheet(sheetIndex, chatMessage);
                });

                console.log('✅ 채팅 메시지 복원 완료');
            } catch (messageError) {
                console.error('❌ 채팅 메시지 복원 오류:', messageError);
            }

            console.log('=== Firebase 채팅 복원 완료 ===');
        } catch (error) {
            console.error('❌ Firebase 채팅 복원 전체 오류:', error);
            // 오류 발생 시 사용자에게 알림
            alert(`채팅 데이터를 불러오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
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
            
            // 새 채팅 선택
            const newChat = firebaseChats.find(chat => chat.id === newChatId);
            if (newChat) {
                await handleSelectFirebaseChat(newChat);
            }
        } catch (error) {
            console.error('새 Firebase 채팅 생성 오류:', error);
        } finally {
            setIsCreatingChat(false);
        }
    };

    // 로컬 새 채팅 생성
    const handleNewLocalChat = () => {
        const newChatId = createNewChatSession();
        setSelectedChatId(null); // Firebase 채팅 선택 해제
        
        // URL 파라미터에서 Firebase 채팅 ID 제거
        if (typeof window !== 'undefined') {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('chatId');
            window.history.replaceState({}, '', newUrl.toString());
            console.log('✅ URL 파라미터 제거됨 (로컬 채팅)');
        }
        
        console.log('새로운 로컬 채팅 세션 생성:', newChatId);
    };

    // 통합 채팅 선택 핸들러
    const handleSelectChat = async (chatItem: UnifiedChatItem) => {
        if (chatItem.type === 'cloud') {
            const firebaseChat = firebaseChats.find(chat => chat.id === chatItem.id);
            if (firebaseChat) {
                await handleSelectFirebaseChat(firebaseChat);
            }
        } else {
            // 로컬 채팅
            setSelectedChatId(null); // Firebase 채팅 선택 해제
            
            // URL 파라미터에서 Firebase 채팅 ID 제거
            if (typeof window !== 'undefined') {
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('chatId');
                window.history.replaceState({}, '', newUrl.toString());
                console.log('✅ URL 파라미터 제거됨 (로컬 채팅 전환)');
            }
            
            switchToChatSession(chatItem.id);
        }
    };

    // 통합 채팅 삭제 핸들러
    const handleDeleteChat = async (chatItem: UnifiedChatItem, e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!confirm('이 채팅을 삭제하시겠습니까?')) return;

        try {
            if (chatItem.type === 'cloud') {
                await deleteChat(chatItem.id);
                console.log('Firebase 채팅 삭제됨:', chatItem.id);
                
                // 삭제된 채팅이 현재 선택된 채팅이면 초기화
                if (selectedChatId === chatItem.id) {
                    setSelectedChatId(null);
                    resetStore();
                }
                
                // 채팅 목록 새로고침
                await loadFirebaseChats();
            } else {
                // 로컬 채팅 삭제
                deleteChatSession(chatItem.id);
                
                // 현재 채팅이 삭제된 경우 새 채팅 생성
                if (currentChatId === chatItem.id) {
                    handleNewLocalChat();
                }
            }
        } catch (error) {
            console.error('채팅 삭제 오류:', error);
        }
    };

    // 로컬 채팅 제목 생성
    const getLocalChatTitle = (session: any) => {
        if (session.chatTitle) {
            return session.chatTitle;
        }
        if (session.xlsxData?.fileName) {
            return session.xlsxData.fileName;
        }
        return `로컬 채팅 ${session.chatId.slice(-8)}`;
    };

    // 로컬 채팅 미리보기 텍스트 생성
    const getLocalChatPreview = (session: any) => {
        if (session.xlsxData?.fileName) {
            return `📊 ${session.xlsxData.fileName}`;
        }
        return '파일을 업로드하여 채팅을 시작하세요';
    };

    // Firebase 채팅 미리보기 텍스트 생성
    const getFirebaseChatPreview = (chat: FirebaseChat) => {
        if (chat.spreadsheetData?.hasSpreadsheet && chat.spreadsheetData.fileName) {
            return `📊 ${chat.spreadsheetData.fileName} (${chat.spreadsheetData.totalSheets}개 시트)`;
        }
        if (chat.lastMessage) {
            return chat.lastMessage.content;
        }
        return '채팅을 시작하세요';
    };

    const unifiedChats = getUnifiedChatList();

    return (
        <>
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
                            {user && (
                                <>
                                    <button
                                        onClick={handleNewFirebaseChat}
                                        disabled={isCreatingChat}
                                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                                        title="새 클라우드 채팅"
                                    >
                                        {isCreatingChat ? (
                                            <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
                                        ) : (
                                            <>
                                                <Cloud className="h-4 w-4 mr-1" />
                                                <PlusIcon className="h-3 w-3" />
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={loadFirebaseChats}
                                        disabled={isLoadingChats}
                                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                        title="새로고침"
                                    >
                                        <RefreshCwIcon className={`h-4 w-4 ${isLoadingChats ? 'animate-spin' : ''}`} />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleNewLocalChat}
                                className="flex items-center px-2 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                                title="새 로컬 채팅"
                            >
                                <HardDrive className="h-4 w-4 mr-1" />
                                <PlusIcon className="h-3 w-3" />
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
                        {user ? (
                            <>
                                총 {unifiedChats.length}개 채팅 (클라우드: {firebaseChats.length}개, 로컬: {Object.keys(chatSessions).length}개)
                            </>
                        ) : (
                            <>
                                총 {unifiedChats.length}개 채팅 (로그인하여 클라우드 채팅 사용)
                            </>
                        )}
                    </div>
                </div>

                {/* 통합 채팅 목록 */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-2">
                        {unifiedChats.length === 0 && !isLoadingChats ? (
                            <div className="p-4 text-center text-gray-500">
                                <MessageCircleIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">채팅이 없습니다</p>
                                <p className="text-xs mt-1">새 채팅을 시작해보세요</p>
                            </div>
                        ) : (
                            unifiedChats.map((chatItem) => (
                                <div
                                    key={`${chatItem.type}-${chatItem.id}`}
                                    onClick={() => handleSelectChat(chatItem)}
                                    className={`
                                        relative p-3 mb-2 rounded-lg cursor-pointer transition-all group
                                        ${chatItem.isActive 
                                            ? chatItem.type === 'cloud'
                                                ? 'bg-blue-50 border-2 border-blue-200' 
                                                : 'bg-green-50 border-2 border-green-200'
                                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                        }
                                    `}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center mb-1">
                                                {/* 데이터 소스 아이콘 */}
                                                {chatItem.type === 'cloud' ? (
                                                    <Cloud className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                                                ) : (
                                                    <HardDrive className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                                                )}
                                                
                                                {/* 스프레드시트 아이콘 */}
                                                {chatItem.hasSpreadsheet ? (
                                                    <FileSpreadsheetIcon className={`h-4 w-4 mr-2 flex-shrink-0 ${
                                                        chatItem.type === 'cloud' ? 'text-blue-600' : 'text-green-600'
                                                    }`} />
                                                ) : (
                                                    <MessageCircleIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                                )}
                                                
                                                <h3 className="font-medium text-sm text-gray-800 truncate">
                                                    {chatItem.title}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                {chatItem.preview}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-gray-400">
                                                    {chatItem.updatedAt.toLocaleDateString('ko-KR')} {' '}
                                                    {chatItem.updatedAt.toLocaleTimeString('ko-KR', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </p>
                                                {chatItem.spreadsheetInfo && (
                                                    <span className="text-xs text-gray-400">
                                                        {chatItem.spreadsheetInfo.totalSheets}개 시트
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* 삭제 버튼 */}
                                        <button
                                            onClick={(e) => handleDeleteChat(chatItem, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all ml-2"
                                            aria-label="채팅 삭제"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    
                                    {/* 현재 활성 채팅 표시 */}
                                    {chatItem.isActive && (
                                        <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r ${
                                            chatItem.type === 'cloud' ? 'bg-blue-600' : 'bg-green-600'
                                        }`}></div>
                                    )}
                                </div>
                            ))
                        )}
                        
                        {/* 로딩 상태 */}
                        {isLoadingChats && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2Icon className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                                <span className="text-sm text-gray-500">채팅 목록을 불러오는 중...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 푸터 */}
                <div className="p-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 text-center">
                        {user ? (
                            <div>
                                <div>로그인됨: {user.email}</div>
                                <div className="mt-1">Extion Chat v1.0</div>
                            </div>
                        ) : (
                            <div>
                                <div>로그인하여 클라우드 채팅 사용</div>
                                <div className="mt-1">Extion Chat v1.0</div>
                            </div>
                        )}
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