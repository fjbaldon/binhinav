import { apiClient } from ".";
import type { Merchant, MerchantPayload } from "./types";

export const getMerchantProfile = async (): Promise<Merchant> => {
    const response = await apiClient.get('/merchants/me');
    return response.data;
};

export const getMerchants = async (): Promise<Merchant[]> => {
    const response = await apiClient.get('/merchants');
    return response.data;
};

export const createMerchant = async (payload: MerchantPayload): Promise<Merchant> => {
    const response = await apiClient.post('/merchants', payload);
    return response.data;
};

export const updateMerchant = async ({ id, payload }: { id: string, payload: Partial<MerchantPayload> }): Promise<Merchant> => {
    const response = await apiClient.patch(`/merchants/${id}`, payload);
    return response.data;
};

export const deleteMerchant = async (id: string): Promise<void> => {
    await apiClient.delete(`/merchants/${id}`);
};

export const updateMerchantProfile = async (payload: Partial<MerchantPayload>): Promise<Merchant> => {
    const response = await apiClient.patch('/merchants/me', payload);
    return response.data;
};
