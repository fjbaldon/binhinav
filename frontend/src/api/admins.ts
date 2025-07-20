import { apiClient } from ".";
import type { Admin, AdminPayload } from "./types";

// --- API Function ---

/**
 * Updates the profile of the currently authenticated admin.
 */
export const updateAdminProfile = async (payload: AdminPayload): Promise<Admin> => {
    const response = await apiClient.patch('/admins/me', payload);
    return response.data;
};
