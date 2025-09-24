import { create } from 'zustand';

interface ChattingComponentZindexState {
  isVisible: boolean;
  zIndex: number;
  showChat: () => void;
  hideChat: () => void;
  toggleChat: () => void;
}

export const useChattingComponentZindexStore = create<ChattingComponentZindexState>((set, get) => ({
  // 초기 상태: 채팅이 숨겨진 상태
  isVisible: false,
  zIndex: -1, // 숨겨진 상태의 z-index

  // 채팅을 보이게 하는 함수
  showChat: () => {
    console.log('🤖 [ChattingZindexStore] 채팅 표시');
    set({
      isVisible: true,
      zIndex: 9999 // 높은 z-index로 설정하여 채팅이 맨 위로 오도록
    });
  },

  // 채팅을 숨기는 함수
  hideChat: () => {
    console.log('🤖 [ChattingZindexStore] 채팅 숨김');
    set({
      isVisible: false,
      zIndex: -1 // 낮은 z-index로 설정하여 채팅이 숨겨지도록
    });
  },

  // 채팅 상태를 토글하는 함수
  toggleChat: () => {
    const currentState = get();
    if (currentState.isVisible) {
      currentState.hideChat();
    } else {
      currentState.showChat();
    }
  }
}));