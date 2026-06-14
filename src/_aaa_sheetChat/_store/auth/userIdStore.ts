import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UserIdState {
  userId: string | null;
  setUserId: (newUserId: string) => void;
  resetUserId: () => void;
}

export const USER_ID_STORAGE_KEY = 'user-id-storage';

export const useUserIdStore = create<UserIdState>()(
  persist(
    (set) => ({
      userId: null,
      setUserId: (newUserId) => set({ userId: newUserId }),
      resetUserId: () => set({ userId: null }),
    }),
    {
      name: USER_ID_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ userId: state.userId }),
    },
  ),
);

export default useUserIdStore;
