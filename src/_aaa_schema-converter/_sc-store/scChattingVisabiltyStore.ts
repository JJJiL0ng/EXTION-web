//scChatting의 보임 안보임 여부를 정하는 zustand 상태 관리 코드
import { create } from 'zustand'
interface scChattingVisabliltyState {
    scChattingVisablilty: boolean;
    setScChattingVisablilty: (visible: boolean) => void;
}

export const useScChattingVisabliltyStore = create<scChattingVisabliltyState>((set) => ({
    scChattingVisablilty: false,
    setScChattingVisablilty: (visible: boolean) => set({ scChattingVisablilty: visible }),
}));

