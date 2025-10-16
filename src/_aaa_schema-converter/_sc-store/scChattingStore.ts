//채팅 상태관리 스토어. ScChatviewer에서 이걸 구독하여 새로새로 추가되는 메시지를 랜더링 할거임

import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ScChattingStore {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
}

export const useScChattingStore = create<ScChattingStore>((set) => ({
  messages: [],

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    })),

  clearMessages: () => set({ messages: [] }),
}));