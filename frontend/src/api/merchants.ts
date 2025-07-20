import { apiClient } from ".";
import type { Merchant, MerchantPayload } from "./types";

// --- API Functions ---

/**
 * Fetches all merchants from the server. (For Admin use)
 */
export const getMerchants = async (): Promise<Merchant[]> => {
    const response = await apiClient.get('/merchants');
    return response.data;
};

/**
 * Creates a new merchant on the server. (For Admin use)
 */
export const createMerchant = async (payload: MerchantPayload): Promise<Merchant> => {
    const response = await apiClient.post('/merchants', payload);
    return response.data;
};

/**
 * Updates an existing merchant on the server. (For Admin use)
 */
export const updateMerchant = async ({ id, payload }: { id: string, payload: Partial<MerchantPayload> }): Promise<Merchant> => {
    const response = await apiClient.patch(`/merchants/${id}`, payload);
    return response.data;
};

/**
 * Deletes a merchant from the server. (For Admin use)
 */
export const deleteMerchant = async (id: string): Promise<void> => {
    await apiClient.delete(`/merchants/${id}`);
};

/**
 * Updates the profile of the currently authenticated merchant.
 */
export const updateMerchantProfile = async (payload: Partial<MerchantPayload>): Promise<Merchant> => {
    const response = await apiClient.patch('/merchants/me', payload);
    return response.data;
};
