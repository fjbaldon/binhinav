import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner'; // Import the toast function

// Your NestJS backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
    baseURL: API_URL,
});

// --- Request Interceptor ---
// Use an interceptor to add the auth token to every request
apiClient.interceptors.request.use(
    (config) => {
        // We can't use the hook directly here, so we get the state from the store
        const token = useAuth.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- Response Interceptor ---
// Use an interceptor to handle global errors, like expired tokens
apiClient.interceptors.response.use(
    // The first function handles successful responses (2xx status codes)
    // We don't need to do anything here, so we just return the response.
    (response) => response,

    // The second function handles errors
    (error) => {
        // Check if the error is a 401 Unauthorized response
        if (error.response && error.response.status === 401) {
            const { logout, isAuthenticated } = useAuth.getState();

            // Only perform the logout if the user was previously authenticated.
            // This prevents a logout loop if an initial request fails before login.
            if (isAuthenticated) {
                toast.error("Session Expired", {
                    description: "You have been logged out. Please log in again.",
                });
                logout();
            }
        }

        // It's crucial to reject the promise so that the original caller
        // (e.g., useQuery) still receives the error and can handle its own state.
        return Promise.reject(error);
    }
);


// Function to serve static files from the backend
export const getAssetUrl = (path?: string | null) => {
    if (!path) return '';

    try {
        // The API_URL could be 'http://localhost:3000/api' or 'https://api.example.com'.
        // new URL().origin provides a robust way to get the base URL (e.g., 'http://localhost:3000').
        const serverOrigin = new URL(API_URL).origin;

        // Construct the full URL to the static asset.
        return `${serverOrigin}/${path}`;
    } catch (error) {
        console.error("Invalid API_URL for generating asset URL:", API_URL);
        // Fallback for invalid URLs, though less likely with environment variables.
        return path;
    }
}
