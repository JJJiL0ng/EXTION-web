// 대안: 메모리 전용 (persist 제거)
import { create } from 'zustand';

interface ChatState {
  chatId: string | null;
  chatSessionId: string | null;
  setChatId: (newChatId: string) => void;
  setChatSessionId: (newChatSessionId: string) => void;
  resetChatId: () => void;
  resetChatSessionId: () => void;
}

const useChatStoreMemoryOnly = create<ChatState>()((set) => ({
  chatId: null,
  chatSessionId: null,
  setChatId: (newChatId) => set({ chatId: newChatId }),
  setChatSessionId: (newChatSessionId) => set({ chatSessionId: newChatSessionId }),
  resetChatId: () => set({ chatId: null }),
  resetChatSessionId: () => set({ chatSessionId: null }),
}));

export default useChatStoreMemoryOnly;
