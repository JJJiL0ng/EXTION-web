import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // persist와 createJSONStorage를 임포트합니다.

interface ChatState {
  chatId: string | null;
  chatSessionId: string | null;
  setChatId: (newChatId: string) => void;
  setChatSessionId: (newChatSessionId: string) => void;
  resetChatId: () => void;
  resetChatSessionId: () => void; // 이 부분을 추가해주셨어야 할 것 같습니다.
}

const useChatStore = create<ChatState>()( // create<ChatState>()() 형태로 변경
  persist( // persist 미들웨어를 적용합니다.
    (set) => ({
      chatId: null,
      chatSessionId: null,
      setChatId: (newChatId) => set({ chatId: newChatId }),
      setChatSessionId: (newChatSessionId) => set({ chatSessionId: newChatSessionId }),
      resetChatId: () => set({ chatId: null }),
      resetChatSessionId: () => set({ chatSessionId: null }), // ChatState 인터페이스에 맞게 추가
    }),
    {
      name: 'chat-storage', // localStorage에 저장될 때 사용될 키 이름은 고유해야 합니다.
      storage: createJSONStorage(() => localStorage), // localStorage를 저장소로 사용합니다.
      // (선택 사항) 만약 모든 상태가 아닌 특정 상태만 저장하고 싶다면 partialize 옵션을 사용할 수 있습니다.
      // partialize: (state) => ({ chatId: state.chatId }),
    }
  )
);

export default useChatStore;