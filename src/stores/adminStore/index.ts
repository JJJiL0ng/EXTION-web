import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 어드민용 메시지 타입
export interface AdminMessage {
  id: string;
  content: string;
  timestamp: Date;
  role: 'USER' | 'EXTION_AI' | 'SYSTEM';
  type: 'TEXT' | 'FILE_UPLOAD' | 'FORMULA' | 'VISUALIZATION' | 'DATA_GENERATION' | 'FUNCTION' | 'DATA_EDIT';
  mode?: 'NORMAL' | 'FORMULA' | 'VISUALIZATION' | 'DATA_GENERATION' | 'DATA_FIX' | 'DATA_EDIT' | 'FUNCTION';
  sheetContext?: any;
  formulaData?: any;
  artifactData?: any;
  dataChangeInfo?: any;
  fileUploadInfo?: any;
  metadata?: any;
}

// 어드민용 사용자 타입
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: string;
  lastActive: string;
}

// 어드민용 채팅 타입
export interface AdminChat {
  id?: string;
  chatId?: string;
  title: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  lastUpdated?: string;
  messageCount: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  analytics?: any;
  userId: string;
  userDisplayName?: string;
  userEmail?: string;
  sheetMetaDataId?: string;
  messages?: AdminMessage[];
}

// 어드민용 시트 테이블 데이터 타입
export interface AdminSheetTableData {
  id: string;
  name: string;
  index: number;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

// 어드민용 시트 메타데이터 타입
export interface AdminSheetMetaData {
  id: string;
  fileName: string;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;
  activeSheetIndex: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  sheetTableData: AdminSheetTableData[];
}

// 어드민 스토어 상태 타입
interface AdminStoreState {
  // 채팅 데이터 (adminsheetchat용)
  currentChatId: string | null;
  chatData: AdminChat | null;
  
  // 시트 데이터 (adminsheetchat용)
  sheetMetaData: AdminSheetMetaData | null;
  
  // 대시보드 데이터 (admindashboard용)
  allUsers: AdminUser[];
  selectedUser: AdminUser | null;
  userChats: AdminChat[];
  selectedChatId: string | null;
  
  // 로딩 상태
  isLoading: boolean;
  loading: boolean;
  modalLoading: boolean;
  error: string | null;
  modalError: string;
  
  // 액션들
  setCurrentChatId: (chatId: string | null) => void;
  setChatData: (chatData: AdminChat | null) => void;
  setSheetMetaData: (sheetMetaData: AdminSheetMetaData | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
  clearErrors: () => void;
  
  // 대시보드 액션들
  setAllUsers: (users: AdminUser[]) => void;
  setSelectedUser: (user: AdminUser | null) => void;
  setUserChats: (chats: AdminChat[]) => void;
  setSelectedChatId: (chatId: string | null) => void;
  setModalLoading: (loading: boolean) => void;
  setModalError: (error: string) => void;
}

export const useAdminStore = create<AdminStoreState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      currentChatId: null,
      chatData: null,
      sheetMetaData: null,
      allUsers: [],
      selectedUser: null,
      userChats: [],
      selectedChatId: null,
      isLoading: false,
      loading: false,
      modalLoading: false,
      error: null,
      modalError: '',
      
      // 액션들
      setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
      setChatData: (chatData) => set({ chatData }),
      setSheetMetaData: (sheetMetaData) => set({ sheetMetaData }),
      setLoading: (isLoading) => set({ isLoading, loading: isLoading }),
      setError: (error) => set({ error }),
      clearData: () => set({
        currentChatId: null,
        chatData: null,
        sheetMetaData: null,
        isLoading: false,
        error: null,
      }),
      clearErrors: () => set({ error: null }),
      
      // 대시보드 액션들
      setAllUsers: (users) => set({ allUsers: users }),
      setSelectedUser: (user) => set({ selectedUser: user }),
      setUserChats: (chats) => set({ userChats: chats }),
      setSelectedChatId: (chatId) => set({ selectedChatId: chatId }),
      setModalLoading: (loading) => set({ modalLoading: loading }),
      setModalError: (error) => set({ modalError: error }),
    }),
    {
      name: 'admin-store',
    }
  )
  ); 