import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string | null;
  regionOfOrigin?: string | null;
  motherTongue?: string | null;
  familySurname?: string | null;
  surnameOrigin?: string | null;
  accountType: 'REAL' | 'DUMMY';
  accountState: 'ACTIVE' | 'INACTIVE' | 'CLAIMED';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('roots_token', token);
        set({ user, token, isAuthenticated: true });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      logout: () => {
        localStorage.removeItem('roots_token');
        localStorage.removeItem('roots_user');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'roots_user',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
