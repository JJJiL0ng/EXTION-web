//chatVisibility store zustand를 사용해서 채팅의 닫힘 여부를 저장함
import { create } from 'zustand';

interface chatVisibilityState {
  chatVisability: boolean;
  setChatVisability: (chatVisability: boolean) => void;
}

export const useChatVisibilityState = create<chatVisibilityState>((set) => ({
  chatVisability: true,
  setChatVisability: (chatVisability: boolean) => set({ chatVisability: chatVisability }),
}));