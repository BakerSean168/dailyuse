/**
 * Auth Store - Zustand 状态管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============ Types ============
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  reset: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null,
};

// ============ Store ============
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await window.electron.auth.login(email, password);
          set({ 
            user: result.user, 
            token: result.token, 
            isAuthenticated: true 
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Login failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await window.electron.auth.logout();
          set(initialState);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Logout failed' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await window.electron.auth.register({ email, password, name });
          set({ 
            user: result.user, 
            token: result.token, 
            isAuthenticated: true 
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Registration failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      checkAuth: async () => {
        const { token } = get();
        if (!token) return;
        
        set({ isLoading: true });
        
        try {
          const user = await window.electron.auth.checkAuth(token);
          set({ user, isAuthenticated: true });
        } catch {
          set(initialState);
        } finally {
          set({ isLoading: false });
        }
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
      }),
    }
  )
);

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
