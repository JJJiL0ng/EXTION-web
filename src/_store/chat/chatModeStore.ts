import { create } from 'zustand';

type ChatMode = 'agent' | 'edit';

interface chatModeState {
  chatId: string | null;
  mode: ChatMode;
  setChatId: (newChatId: string) => void;
  resetChatId: () => void;
  setMode: (mode: ChatMode) => void;
  resetSettings: () => void;
}

const useChatModeStore = create<chatModeState>((set) => ({
  chatId: null,
  mode: 'agent',
  
  setChatId: (newChatId: string) => set({ chatId: newChatId }),
  
  resetChatId: () => set({ chatId: null }),
  
  setMode: (mode: ChatMode) => set({ mode }),
  
  resetSettings: () => set({ 
    chatId: null, 
    mode: 'agent'
  }),
}));

export default useChatModeStore;
export type { ChatMode };