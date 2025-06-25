import { StateCreator } from 'zustand';
import { ChatMessage, ChatSession } from '../store-types';
import { FirebaseChat } from '../../services/firebase/chatService';

// 채팅 리스트 아이템 타입 (API에서 받는 데이터)
export interface StoredChatListItem {
    id: string;
    title: string;
    updatedAt: string; // ISO string으로 저장
    createdAt: string; // ISO string으로 저장
    sheetMetaDataId?: string;
    spreadsheetData?: {
        fileName: string;
        totalSheets: number;
    };
    messageCount?: number;
    lastMessage?: {
        content: string;
        timestamp: string; // ISO string으로 저장
    };
}

// 채팅 슬라이스 상태
export interface ChatSlice {
    // === 채팅 세션 관리 ===
    chatSessions: { [chatId: string]: ChatSession };
    currentChatId: string | null;
    currentSheetMetaDataId: string | null;
    chatHistory: string[];
    
    // === 현재 채팅 메타데이터 ===
    currentChatMeta: Partial<FirebaseChat> | null;
    
    // === 채팅 리스트 캐시 ===
    cachedChatList: StoredChatListItem[];
    chatListLastUpdated: number | null;
    
    // === 시트별 채팅 메시지 ===
    sheetMessages: { [sheetIndex: number]: ChatMessage[] };
    activeSheetMessages: ChatMessage[];
    
    // === 시트별 채팅 ID 관리 ===
    sheetChatIds: { [sheetIndex: number]: string };
    
    // === 채팅 목록 새로고침 트리거 ===
    chatListRefreshTrigger?: number;
    
    // === 액션들 ===
    // 채팅 리스트 관리
    saveChatListToStorage: (chatList: any[]) => void;
    loadChatListFromStorage: () => StoredChatListItem[];
    getCachedChatList: () => StoredChatListItem[];
    isChatListCacheValid: () => boolean;
    clearChatListCache: () => void;
    
    // 채팅 세션 관리
    createNewChatSession: () => string;
    switchToChatSession: (chatId: string) => void;
    getChatSession: (chatId: string) => ChatSession | null;
    updateChatSession: (chatId: string, updates: Partial<ChatSession>) => void;
    deleteChatSession: (chatId: string) => void;
    getCurrentChatSession: () => ChatSession | null;
    saveCurrentSessionToStore: () => void;
    saveChatSessionToStorage: () => void;
    loadChatSessionsFromStorage: () => void;
    
    // 채팅 ID 관리 (deprecated)
    setCurrentChatId: (chatId: string | null) => void;
    getCurrentChatId: () => string | undefined;
    generateNewChatId: () => string;
    initializeChatId: () => string;
    addToChatHistory: (chatId: string) => void;
    getChatHistory: () => string[];
    
    // 시트별 메시지 관리
    addMessageToSheet: (sheetIndex: number, message: ChatMessage) => void;
    getMessagesForSheet: (sheetIndex: number) => ChatMessage[];
    updateActiveSheetMessages: () => void;
    clearMessagesForSheet: (sheetIndex: number) => void;
    clearAllMessages: () => void;
    
    // 시트별 채팅 ID 관리
    getChatIdForSheet: (sheetIndex: number) => string;
    setChatIdForSheet: (sheetIndex: number, chatId: string) => void;
    generateNewChatIdForSheet: (sheetIndex: number, chatTitle?: string) => string;
    getCurrentSheetChatId: () => string | null;
    initializeSheetChatIds: () => void;

    // === 채팅 메타데이터 액션 ===
    setCurrentChatMeta: (meta: Partial<FirebaseChat> | null) => void;

    // === 시트 메타데이터 ID 액션 ===
    setCurrentSheetMetaDataId: (sheetMetaDataId: string | null) => void;

    // === SheetTableDataId 관리 액션 ===
    currentSheetTableDataId: string | null;
    setCurrentSheetTableDataId: (sheetTableDataId: string | null) => void;
    getCurrentSheetTableDataId: () => string | null;

    // === 채팅 목록 새로고침 액션 ===
    refreshChatList: () => void;
}

// 채팅 슬라이스 생성자
export const createChatSlice: StateCreator<
    ChatSlice & { xlsxData: any; [key: string]: any },
    [],
    [],
    ChatSlice
> = (set, get) => ({
    // === 초기 상태 ===
    chatSessions: {},
    currentChatId: null,
    currentSheetMetaDataId: null,
    chatHistory: [],
    currentChatMeta: null,
    cachedChatList: [],
    chatListLastUpdated: null,
    sheetMessages: {},
    activeSheetMessages: [],
    sheetChatIds: {},
    chatListRefreshTrigger: undefined,
    currentSheetTableDataId: null,
    
    // === 채팅 세션 관리 액션 ===
    createNewChatSession: () => {
        const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const newSession: ChatSession = {
            chatId: newChatId,
            chatTitle: undefined,
            xlsxData: null,
            activeSheetData: null,
            computedSheetData: {},
            sheetMessages: {},
            activeSheetMessages: [],
            sheetChatIds: {},
            hasUploadedFile: false,
            createdAt: new Date(),
            lastAccessedAt: new Date(),
            currentSheetMetaDataId: null,
            sheetMetaData: null,
            currentSheetTableDataId: null
        };

        set((state) => ({
            chatSessions: {
                ...state.chatSessions,
                [newChatId]: newSession
            },
            currentChatId: newChatId,
            chatHistory: [newChatId, ...state.chatHistory.filter(id => id !== newChatId)].slice(0, 50),
            // 새 채팅으로 전환 시 현재 상태 초기화
            xlsxData: null,
            hasUploadedFile: false,
            activeSheetData: null,
            computedSheetData: {},
            sheetMessages: {},
            activeSheetMessages: [],
            sheetChatIds: {},
            currentSheetMetaDataId: null,
            sheetMetaData: null,
            currentSheetTableDataId: null
        }));

        return newChatId;
    },

    setCurrentChatMeta: (meta) => set({ currentChatMeta: meta }),

    switchToChatSession: (chatId: string) => {
        const { chatSessions } = get();
        const session = chatSessions[chatId];
        
        if (!session) {
            console.warn(`채팅 세션을 찾을 수 없습니다: ${chatId}`);
            return;
        }

        // 현재 세션을 저장
        get().saveCurrentSessionToStore();

        // 세션의 lastAccessedAt 업데이트
        const updatedSession = {
            ...session,
            lastAccessedAt: new Date()
        };

        set((state) => ({
            chatSessions: {
                ...state.chatSessions,
                [chatId]: updatedSession
            },
            currentChatId: chatId,
            chatHistory: [chatId, ...state.chatHistory.filter(id => id !== chatId)].slice(0, 50),
            // 선택된 세션의 상태로 복원
            xlsxData: session.xlsxData,
            hasUploadedFile: session.hasUploadedFile,
            activeSheetData: session.activeSheetData,
            computedSheetData: session.computedSheetData,
            sheetMessages: session.sheetMessages,
            activeSheetMessages: session.activeSheetMessages,
            sheetChatIds: session.sheetChatIds,
            currentSheetMetaDataId: session.currentSheetMetaDataId,
            sheetMetaData: session.sheetMetaData,
            currentSheetTableDataId: session.currentSheetTableDataId
        }));
    },

    getChatSession: (chatId: string) => {
        const { chatSessions } = get();
        return chatSessions[chatId] || null;
    },

    updateChatSession: (chatId: string, updates: Partial<ChatSession>) => {
        set((state) => {
            const existingSession = state.chatSessions[chatId];
            if (!existingSession) return state;

            return {
                ...state,
                chatSessions: {
                    ...state.chatSessions,
                    [chatId]: {
                        ...existingSession,
                        ...updates,
                        lastAccessedAt: new Date()
                    }
                }
            };
        });
    },

    deleteChatSession: (chatId: string) => {
        set((state) => {
            const newChatSessions = { ...state.chatSessions };
            delete newChatSessions[chatId];
            
            const newChatHistory = state.chatHistory.filter(id => id !== chatId);
            
            // 삭제된 채팅이 현재 채팅인 경우
            let newCurrentChatId = state.currentChatId;
            let shouldCreateNew = false;
            
            if (state.currentChatId === chatId) {
                // 다른 채팅이 있으면 가장 최근 채팅으로 전환
                if (newChatHistory.length > 0) {
                    newCurrentChatId = newChatHistory[0];
                } else {
                    // 다른 채팅이 없으면 새 채팅 생성 플래그 설정
                    shouldCreateNew = true;
                    newCurrentChatId = null;
                }
            }
            
            const newState = {
                ...state,
                chatSessions: newChatSessions,
                chatHistory: newChatHistory,
                currentChatId: newCurrentChatId
            };
            
            // 새 채팅 생성이 필요한 경우 상태 초기화
            if (shouldCreateNew) {
                return {
                    ...newState,
                    xlsxData: null,
                    hasUploadedFile: false,
                    activeSheetData: null,
                    computedSheetData: {},
                    sheetMessages: {},
                    activeSheetMessages: [],
                    sheetChatIds: {},
                    extendedSheetContext: null,
                    currentSheetMetaDataId: null,
                    sheetMetaData: null,
                    currentSheetTableDataId: null
                };
            }
            
            // 다른 채팅으로 전환하는 경우 해당 세션의 상태로 복원
            if (newCurrentChatId && newChatSessions[newCurrentChatId]) {
                const targetSession = newChatSessions[newCurrentChatId];
                return {
                    ...newState,
                    xlsxData: targetSession.xlsxData,
                    hasUploadedFile: targetSession.hasUploadedFile,
                    activeSheetData: targetSession.activeSheetData,
                    computedSheetData: targetSession.computedSheetData,
                    sheetMessages: targetSession.sheetMessages,
                    activeSheetMessages: targetSession.activeSheetMessages,
                    sheetChatIds: targetSession.sheetChatIds,
                    currentSheetMetaDataId: targetSession.currentSheetMetaDataId,
                    sheetMetaData: targetSession.sheetMetaData,
                    currentSheetTableDataId: targetSession.currentSheetTableDataId
                };
            }
            
            return newState;
        });
    },

    getCurrentChatSession: () => {
        const { currentChatId, chatSessions } = get();
        return currentChatId ? chatSessions[currentChatId] || null : null;
    },

    saveCurrentSessionToStore: () => {
        const state = get();
        const { currentChatId } = state;
        
        if (!currentChatId) return;
        
        const currentSession: ChatSession = {
            chatId: currentChatId,
            chatTitle: state.chatSessions[currentChatId]?.chatTitle,
            xlsxData: state.xlsxData,
            activeSheetData: state.activeSheetData,
            computedSheetData: state.computedSheetData,
            sheetMessages: state.sheetMessages,
            activeSheetMessages: state.activeSheetMessages,
            sheetChatIds: state.sheetChatIds,
            hasUploadedFile: state.hasUploadedFile,
            createdAt: state.chatSessions[currentChatId]?.createdAt || new Date(),
            lastAccessedAt: new Date(),
            currentSheetMetaDataId: state.currentSheetMetaDataId,
            sheetMetaData: state.sheetMetaData,
            currentSheetTableDataId: state.currentSheetTableDataId // 백엔드에서 받은 sheetTableDataId 저장
        };
        
        set((prevState) => ({
            chatSessions: {
                ...prevState.chatSessions,
                [currentChatId]: currentSession
            }
        }));
    },

    saveChatSessionToStorage: () => {
        const { currentChatId, chatSessions } = get();
        if (currentChatId && typeof window !== 'undefined') {
            const session = chatSessions[currentChatId];
            if (session) {
                localStorage.setItem(`chatSession_${currentChatId}`, JSON.stringify(session));
                localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
                localStorage.setItem('currentChatId', currentChatId);
            }
        }
    },

    loadChatSessionsFromStorage: () => {
        if (typeof window === 'undefined') return;
        
        try {
            const storedSessions = localStorage.getItem('chatSessions');
            const storedCurrentChatId = localStorage.getItem('currentChatId');
            
            if (storedSessions) {
                const sessions = JSON.parse(storedSessions);
                set((state) => ({
                    ...state,
                    chatSessions: sessions,
                    currentChatId: storedCurrentChatId
                }));
                
                // 현재 채팅 세션이 있으면 해당 상태로 복원
                if (storedCurrentChatId && sessions[storedCurrentChatId]) {
                    get().switchToChatSession(storedCurrentChatId);
                }
            }
        } catch (error) {
            console.error('채팅 세션 로드 오류:', error);
        }
    },

    // === Chat ID Management (deprecated) ===
    setCurrentChatId: (chatId) => {
        set({ currentChatId: chatId });
        
        // 로컬 스토리지에도 저장
        if (typeof window !== 'undefined' && chatId) {
            localStorage.setItem('currentChatId', chatId);
        }
    },

    setCurrentSheetMetaDataId: (sheetMetaDataId) => set({ currentSheetMetaDataId: sheetMetaDataId }),

    getCurrentChatId: () => {
        const { xlsxData, getCurrentSheetChatId } = get();
        
        // 1. 현재 활성 시트의 채팅 ID 먼저 확인
        if (xlsxData) {
            const currentSheetChatId = getCurrentSheetChatId();
            if (currentSheetChatId) {
                return currentSheetChatId;
            }
        }
        
        // 2. 기존 로직 유지 (시트가 없는 경우)
        const { currentChatId } = get();
        
        if (currentChatId) {
            return currentChatId;
        }
        
        // 3. 로컬 스토리지에서 가져오기
        if (typeof window !== 'undefined') {
            const storedChatId = localStorage.getItem('currentChatId');
            if (storedChatId) {
                get().setCurrentChatId(storedChatId);
                return storedChatId;
            }
        }
        
        // 4. URL 파라미터에서 가져오기
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const chatIdFromUrl = urlParams.get('chatId');
            if (chatIdFromUrl) {
                get().setCurrentChatId(chatIdFromUrl);
                return chatIdFromUrl;
            }
        }
        
        return undefined;
    },

    generateNewChatId: () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const newChatId = `chat_${timestamp}_${random}`;
        
        get().setCurrentChatId(newChatId);
        get().addToChatHistory(newChatId);
        
        // URL 업데이트 (옵션)
        if (typeof window !== 'undefined') {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('chatId', newChatId);
            window.history.replaceState({}, '', newUrl.toString());
        }
        
        return newChatId;
    },

    initializeChatId: () => {
        const { getCurrentChatId, generateNewChatId } = get();
        
        // 기존 채팅 ID가 있는지 확인
        const existingChatId = getCurrentChatId();
        
        if (existingChatId) {
            return existingChatId;
        }
        
        // 없으면 새로 생성
        return generateNewChatId();
    },

    addToChatHistory: (chatId) => {
        set((state) => {
            const newHistory = [chatId, ...state.chatHistory.filter(id => id !== chatId)];
            
            // 최대 50개까지만 유지
            const trimmedHistory = newHistory.slice(0, 50);
            
            // 로컬 스토리지에도 저장
            if (typeof window !== 'undefined') {
                localStorage.setItem('chatHistory', JSON.stringify(trimmedHistory));
            }
            
            return {
                ...state,
                chatHistory: trimmedHistory
            };
        });
    },

    getChatHistory: () => get().chatHistory,

    // === 시트별 메시지 관리 ===
    addMessageToSheet: (sheetIndex, message) => {
        set((state) => {
            const sheetMessages = { ...state.sheetMessages };
            const currentMessages = [...(sheetMessages[sheetIndex] || [])];

            currentMessages.push(message);
            sheetMessages[sheetIndex] = currentMessages;

            // 시트가 없을 때(xlsxData가 null)이거나 현재 활성 시트의 메시지인 경우 activeSheetMessages도 업데이트
            const activeSheetIndex = state.xlsxData?.activeSheetIndex ?? 0;
            const activeSheetMessages =
                (!state.xlsxData || activeSheetIndex === sheetIndex)
                    ? currentMessages
                    : state.activeSheetMessages;

            return {
                ...state,
                sheetMessages,
                activeSheetMessages
            };
        });
    },

    getMessagesForSheet: (sheetIndex) => {
        return get().sheetMessages[sheetIndex] || [];
    },

    updateActiveSheetMessages: () => {
        set((state) => {
            // 시트가 없을 때는 인덱스 0의 메시지를 사용
            const activeSheetIndex = state.xlsxData?.activeSheetIndex ?? 0;
            const activeSheetMessages = state.sheetMessages[activeSheetIndex] || [];

            return {
                ...state,
                activeSheetMessages
            };
        });
    },

    clearMessagesForSheet: (sheetIndex) => {
        set((state) => {
            const sheetMessages = { ...state.sheetMessages };
            sheetMessages[sheetIndex] = [];

            // 시트가 없을 때(xlsxData가 null)이거나 현재 활성 시트의 메시지인 경우 activeSheetMessages도 초기화
            const activeSheetIndex = state.xlsxData?.activeSheetIndex ?? 0;
            const activeSheetMessages =
                (!state.xlsxData || activeSheetIndex === sheetIndex)
                    ? []
                    : state.activeSheetMessages;

            return {
                ...state,
                sheetMessages,
                activeSheetMessages
            };
        });
    },

    clearAllMessages: () => {
        set((state) => ({
            ...state,
            sheetMessages: {},
            activeSheetMessages: []
        }));
    },

    // === 시트별 채팅 ID 관리 ===
    getChatIdForSheet: (sheetIndex: number) => {
        const { sheetChatIds } = get();
        return sheetChatIds[sheetIndex] || '';
    },

    setChatIdForSheet: (sheetIndex: number, chatId: string) => {
        set((state) => ({
            sheetChatIds: {
                ...state.sheetChatIds,
                [sheetIndex]: chatId
            }
        }));
    },

    generateNewChatIdForSheet: (sheetIndex: number, chatTitle?: string) => {
        const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        get().setChatIdForSheet(sheetIndex, newChatId);
        get().addToChatHistory(newChatId);
        return newChatId;
    },

    getCurrentSheetChatId: () => {
        const { currentSheetMetaDataId } = get();
        return currentSheetMetaDataId;
    },

    initializeSheetChatIds: () => {
        const { sheets } = get().xlsxData || { sheets: [] };
        sheets.forEach((sheet: any, index: number) => {
            get().setChatIdForSheet(index, '');
        });
    },

    // === SheetTableDataId 관리 액션 ===
    setCurrentSheetTableDataId: (sheetTableDataId) => {
        set((state) => ({
            ...state,
            currentSheetTableDataId: sheetTableDataId
        }));
        
        // 로컬 스토리지에도 저장
        if (typeof window !== 'undefined') {
            if (sheetTableDataId) {
                localStorage.setItem('currentSheetTableDataId', sheetTableDataId);
            } else {
                localStorage.removeItem('currentSheetTableDataId');
            }
        }
    },

    getCurrentSheetTableDataId: () => {
        const { currentSheetTableDataId } = get();
        
        // 메모리에 있으면 반환
        if (currentSheetTableDataId) {
            return currentSheetTableDataId;
        }
        
        // 로컬 스토리지에서 가져오기
        if (typeof window !== 'undefined') {
            const storedSheetTableDataId = localStorage.getItem('currentSheetTableDataId');
            if (storedSheetTableDataId) {
                get().setCurrentSheetTableDataId(storedSheetTableDataId);
                return storedSheetTableDataId;
            }
        }
        
        return null;
    },

    // === 채팅 리스트 관리 액션 ===
    saveChatListToStorage: (chatList: any[]) => {
        if (typeof window === 'undefined') return;
        
        try {
            // 안전한 날짜 변환 함수
            const safeToISOString = (date: any): string => {
                if (!date) return new Date().toISOString();
                
                if (typeof date === 'string') {
                    const parsedDate = new Date(date);
                    return isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
                }
                
                if (date instanceof Date) {
                    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
                }
                
                return new Date().toISOString();
            };

            // API 응답을 StoredChatListItem 형태로 변환
            const storedChatList: StoredChatListItem[] = chatList.map(chat => ({
                id: chat.id,
                title: chat.title,
                updatedAt: safeToISOString(chat.updatedAt),
                createdAt: safeToISOString(chat.createdAt),
                sheetMetaDataId: chat.sheetMetaDataId,
                spreadsheetData: chat.spreadsheetData,
                messageCount: chat.messageCount,
                lastMessage: chat.lastMessage ? {
                    content: chat.lastMessage.content,
                    timestamp: safeToISOString(chat.lastMessage.timestamp)
                } : undefined
            }));

            localStorage.setItem('cachedChatList', JSON.stringify(storedChatList));
            localStorage.setItem('chatListLastUpdated', Date.now().toString());
            
            set({
                cachedChatList: storedChatList,
                chatListLastUpdated: Date.now()
            });
            
            console.log('💾 채팅 리스트 로컬스토리지에 저장됨:', storedChatList.length, '개');
        } catch (error) {
            console.error('채팅 리스트 저장 오류:', error);
        }
    },

    loadChatListFromStorage: () => {
        if (typeof window === 'undefined') return [];
        
        try {
            const stored = localStorage.getItem('cachedChatList');
            const lastUpdated = localStorage.getItem('chatListLastUpdated');
            
            if (stored && lastUpdated) {
                const chatList: StoredChatListItem[] = JSON.parse(stored);
                const timestamp = parseInt(lastUpdated);
                
                set({
                    cachedChatList: chatList,
                    chatListLastUpdated: timestamp
                });
                
                console.log('📋 로컬스토리지에서 채팅 리스트 로드됨:', chatList.length, '개');
                return chatList;
            }
        } catch (error) {
            console.error('채팅 리스트 로드 오류:', error);
        }
        
        return [];
    },

    getCachedChatList: () => {
        const { cachedChatList } = get();
        return cachedChatList;
    },

    isChatListCacheValid: () => {
        const { chatListLastUpdated } = get();
        if (!chatListLastUpdated) return false;
        
        // 5분 이내의 캐시는 유효한 것으로 간주
        const CACHE_DURATION = 5 * 60 * 1000; // 5분
        return (Date.now() - chatListLastUpdated) < CACHE_DURATION;
    },

    clearChatListCache: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('cachedChatList');
            localStorage.removeItem('chatListLastUpdated');
        }
        
        set({
            cachedChatList: [],
            chatListLastUpdated: null
        });
        
        console.log('🗑️ 채팅 리스트 캐시 삭제됨');
    },

    // === 채팅 목록 새로고침 액션 ===
    refreshChatList: () => {
        // 이 함수는 ChatSidebar에서 채팅 목록을 새로고침하기 위한 트리거 역할
        // 실제 구현은 ChatSidebar에서 이 함수를 감지하여 loadFirebaseChats를 호출
        set((state) => ({
            ...state,
            // 트리거를 위한 임의의 timestamp 업데이트
            chatListRefreshTrigger: Date.now()
        }));
    }
}); 