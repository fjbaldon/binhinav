import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api';

type User = {
    userId: string;
    username: string;
    role: 'admin' | 'merchant';
    name: string;
    placeId?: string;
};

type AuthState = {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    updateUser: (partialUser: Partial<User>) => void;
};

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            login: async (token: string) => {
                set({ token, isAuthenticated: true });
                try {
                    const response = await apiClient.get('/auth/profile');
                    set({ user: response.data });
                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                    set({ token: null, user: null, isAuthenticated: false });
                }
            },
            logout: () => {
                set({ token: null, user: null, isAuthenticated: false });
            },
            updateUser: (partialUser: Partial<User>) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...partialUser } : null,
                }));
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
