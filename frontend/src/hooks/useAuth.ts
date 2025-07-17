import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api';

type User = {
    userId: string;
    username: string;
    role: 'admin' | 'merchant';
    // Add other properties from your JWT payload, e.g., placeId for merchants
    placeId?: string;
};

type AuthState = {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
};

export const useAuth = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            login: async (token: string) => {
                set({ token, isAuthenticated: true });
                try {
                    // After setting the token, fetch the user's profile
                    const response = await apiClient.get('/auth/profile');
                    set({ user: response.data });
                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                    // If profile fetch fails, log out
                    get().logout();
                }
            },
            logout: () => {
                set({ token: null, user: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage', // name of the item in the storage (must be unique)
        }
    )
);
