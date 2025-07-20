import { apiClient } from ".";
import type { Ad } from "./types";

// --- API Functions ---

/**
 * Fetches all ads for the admin dashboard.
 */
export const getAdminAds = async (): Promise<Ad[]> => {
    const response = await apiClient.get('/ads');
    return response.data;
};

/**
 * Creates a new ad on the server.
 * @param formData - The FormData object containing the ad details and image file.
 */
export const createAd = async (formData: FormData): Promise<Ad> => {
    const response = await apiClient.post('/ads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Updates an existing ad on the server.
 * @param id - The ID of the ad to update.
 * @param formData - The FormData object containing the optional new details and/or image file.
 */
export const updateAd = async ({ id, formData }: { id: string, formData: FormData }): Promise<Ad> => {
    const response = await apiClient.patch(`/ads/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Deletes an ad from the server.
 * @param id - The ID of the ad to delete.
 */
export const deleteAd = async (id: string): Promise<void> => {
    await apiClient.delete(`/ads/${id}`);
};
