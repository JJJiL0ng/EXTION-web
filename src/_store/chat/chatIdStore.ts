import { create } from 'zustand';

interface ChatState {
  chatId: string | null;
  setChatId: (newChatId: string) => void;
  resetChatId: () => void;
}

const useChatStore = create<ChatState>((set) => ({
  chatId: null,
  setChatId: (newChatId) => set({ chatId: newChatId }),
  resetChatId: () => set({ chatId: null }),
}));

export default useChatStore;