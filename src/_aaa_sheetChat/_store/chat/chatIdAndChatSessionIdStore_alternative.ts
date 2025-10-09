// 대안: spreadsheetId 기반 복합 키 저장 방식
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ChatState {
  chatId: string | null;
  chatSessionId: string | null;
  spreadsheetId: string | null; // 현재 스프레드시트 ID 추적
  setChatId: (newChatId: string) => void;
  setChatSessionId: (newChatSessionId: string) => void;
  setSpreadsheetId: (spreadsheetId: string) => void;
  resetChatId: () => void;
  resetChatSessionId: () => void;
}

// 스프레드시트별 chatSessionId 매핑 저장
interface ChatSessionMapping {
  [spreadsheetId: string]: {
    chatId: string;
    chatSessionId: string;
  };
}

const useChatStoreAlternative = create<ChatState>()(
  persist(
    (set, get) => ({
      chatId: null,
      chatSessionId: null,
      spreadsheetId: null,

      setChatId: (newChatId) => set({ chatId: newChatId }),

      setChatSessionId: (newChatSessionId) => {
        set({ chatSessionId: newChatSessionId });

        // spreadsheetId별 매핑 저장
        const currentSpreadsheetId = get().spreadsheetId;
        if (currentSpreadsheetId) {
          const mapping = JSON.parse(
            localStorage.getItem('chat-session-mapping') || '{}'
          ) as ChatSessionMapping;

          mapping[currentSpreadsheetId] = {
            chatId: get().chatId || '',
            chatSessionId: newChatSessionId,
          };

          localStorage.setItem('chat-session-mapping', JSON.stringify(mapping));
        }
      },

      setSpreadsheetId: (spreadsheetId) => {
        set({ spreadsheetId });

        // 해당 스프레드시트의 저장된 chatSessionId 복원
        const mapping = JSON.parse(
          localStorage.getItem('chat-session-mapping') || '{}'
        ) as ChatSessionMapping;

        const saved = mapping[spreadsheetId];
        if (saved) {
          set({
            chatId: saved.chatId,
            chatSessionId: saved.chatSessionId,
          });
        } else {
          // 새 스프레드시트면 초기화
          set({
            chatId: null,
            chatSessionId: null,
          });
        }
      },

      resetChatId: () => set({ chatId: null }),
      resetChatSessionId: () => set({ chatSessionId: null }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useChatStoreAlternative;
