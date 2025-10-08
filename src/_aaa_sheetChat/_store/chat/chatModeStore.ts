import { create } from 'zustand';

type ChatMode = 'Agent' | 'Edit';

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
  mode: 'Agent',
  
  setChatId: (newChatId: string) => set({ chatId: newChatId }),
  
  resetChatId: () => set({ chatId: null }),
  
  setMode: (mode: ChatMode) => set({ mode }),
  
  resetSettings: () => set({ 
    chatId: null, 
    mode: 'Agent'
  }),
}));

export default useChatModeStore;
export type { ChatMode };