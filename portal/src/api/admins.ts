import { apiClient } from ".";
import type { Admin, AdminPayload } from "./types";

export const getAdminProfile = async (): Promise<Admin> => {
    const response = await apiClient.get('/admins/me');
    return response.data;
};

export const updateAdminProfile = async (payload: AdminPayload): Promise<Admin> => {
    const response = await apiClient.patch('/admins/me', payload);
    return response.data;
};
