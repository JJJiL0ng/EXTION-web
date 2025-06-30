import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user }, false, 'setUser'),
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
    }),
    {
      name: 'auth-store',
      enabled: process.env.NODE_ENV === 'development',
      trace: true,
    }
  )
); 