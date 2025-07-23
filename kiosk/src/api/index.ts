import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
    baseURL: API_URL,
});

export const getAssetUrl = (path?: string | null) => {
    if (!path) return '';
    try {
        const serverOrigin = new URL(API_URL).origin;
        return `${serverOrigin}/${path}`;
    } catch (error) {
        console.error("Invalid API_URL for generating asset URL:", API_URL);
        return path;
    }
}
