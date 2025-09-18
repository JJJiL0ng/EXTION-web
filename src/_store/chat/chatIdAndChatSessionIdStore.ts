import { create } from 'zustand';

interface ChatState {
  chatId: string | null;
  chatSessionId: string | null;
  setChatId: (newChatId: string) => void;
  setChatSessionId: (newChatSessionId: string) => void;
  resetChatId: () => void;
}

const 
useChatStore = create<ChatState>((set) => ({
  chatId: null,
  chatSessionId: null,
  setChatId: (newChatId) => set({ chatId: newChatId }),
  setChatSessionId: (newChatSessionId) => set({ chatSessionId: newChatSessionId }),
  resetChatId: () => set({ chatId: null }),
  resetChatSessionId: () => set({ chatSessionId: null }),
}));

export default useChatStore;