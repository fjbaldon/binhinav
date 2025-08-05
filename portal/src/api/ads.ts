import { apiClient } from ".";
import type { Ad } from "./types";

export const getAdminAds = async (): Promise<Ad[]> => {
    const response = await apiClient.get('/ads');
    return response.data;
};

export const createAd = async (formData: FormData): Promise<Ad> => {
    const response = await apiClient.post('/ads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateAd = async ({ id, formData }: { id: string, formData: FormData }): Promise<Ad> => {
    const response = await apiClient.patch(`/ads/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteAd = async (id: string): Promise<void> => {
    await apiClient.delete(`/ads/${id}`);
};

export const reorderAds = async (ids: string[]): Promise<void> => {
    await apiClient.patch('/ads/reorder', { ids });
};
