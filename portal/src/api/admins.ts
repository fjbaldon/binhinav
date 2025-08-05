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

export const getAdmins = async (): Promise<Admin[]> => {
    const response = await apiClient.get('/admins');
    return response.data;
};

export const createAdmin = async (payload: AdminPayload): Promise<Admin> => {
    const response = await apiClient.post('/admins', payload);
    return response.data;
};

export const updateAdmin = async ({ id, payload }: { id: string, payload: Partial<AdminPayload> }): Promise<Admin> => {
    const response = await apiClient.patch(`/admins/${id}`, payload);
    return response.data;
};

export const deleteAdmin = async (id: string): Promise<void> => {
    await apiClient.delete(`/admins/${id}`);
};
