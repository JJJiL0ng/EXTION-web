import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserIdState {
    userId: string | null;
    setUserId: (newUserId: string) => void;
    resetUserId: () => void;
}

const useUserIdStore = create<UserIdState>()(
    persist(
        (set) => ({
            userId: null,
            setUserId: (newUserId) => set({ userId: newUserId }),
            resetUserId: () => set({ userId: null }),
        }),
        {
            name: 'user-id-storage', // 로컬 스토리지에 저장될 키 이름
        }
    )
);

export default useUserIdStore;