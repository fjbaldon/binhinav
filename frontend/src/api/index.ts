import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

// Your NestJS backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
    baseURL: API_URL,
});

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

// Function to serve static files from the backend
export const getAssetUrl = (path?: string | null) => {
    if (!path) return '';

    // The API_URL is likely 'http://localhost:3000/api'.
    // Static assets are served from the server's root URL ('http://localhost:3000').
    // We derive this base URL by removing the '/api' suffix if it exists.
    const serverBaseUrl = API_URL.replace(/\/api$/, '');

    // Construct the full URL to the static asset.
    return `${serverBaseUrl}/${path}`;
}
