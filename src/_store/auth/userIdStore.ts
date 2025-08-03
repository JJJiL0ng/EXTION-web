import { create } from 'zustand';

interface userIdState {
  userId: string | null;
  setUserId: (newUserId: string) => void;
  resetUserId: () => void;
}

const useUserIdStore = create<userIdState>((set) => ({
  userId: null,
  setUserId: (newUserId) => set({ userId: newUserId }),
  resetUserId: () => set({ userId: null }),
}));

export default useUserIdStore;