import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface userIdState {
  userId: string | null;
  setUserId: (newUserId: string) => void;
  resetUserId: () => void;
}

export const useUserIdStore = create<userIdState>()(
  persist(
    (set) => ({
      userId: null,
      setUserId: (newUserId) => set({ userId: newUserId }),
      resetUserId: () => set({ userId: null }),
    }),
    {
      name: 'user-id',
      // SSR 안전 가드: 서버에서는 storage 미지정, 클라이언트에서만 localStorage 사용
      storage:
        typeof window !== 'undefined'
          ? createJSONStorage(() => localStorage)
          : undefined,
      // 필요시 특정 필드만 저장하려면 partialize 사용 가능
      // partialize: (state) => ({ userId: state.userId }),
    }
  )
);
