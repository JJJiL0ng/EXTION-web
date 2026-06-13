import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const CHAT_STORAGE_KEY = 'chat-storage';

export interface ChatState {
  chatId: string | null;
  chatSessionId: string | null;
  setChatId: (newChatId: string) => void;
  setChatSessionId: (newChatSessionId: string) => void;
  resetChatId: () => void;
  resetChatSessionId: () => void;
}

const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chatId: null,
      chatSessionId: null,
      setChatId: (newChatId) => set({ chatId: newChatId }),
      setChatSessionId: (newChatSessionId) => set({ chatSessionId: newChatSessionId }),
      resetChatId: () => set({ chatId: null }),
      resetChatSessionId: () => set({ chatSessionId: null }),
    }),
    {
      name: CHAT_STORAGE_KEY,
      version: 1,
      partialize: (state) => ({
        chatId: state.chatId,
        chatSessionId: state.chatSessionId,
      }),
      // SessionStorage 사용 - 각 탭마다 독립적인 상태 유지
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useChatStore;
