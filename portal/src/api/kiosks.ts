import { apiClient } from ".";
import type { Kiosk, KioskPayload } from "./types";

// --- API Functions ---

/**
 * Fetches all kiosks from the server.
 */
export const getKiosks = async (): Promise<Kiosk[]> => {
    const response = await apiClient.get('/kiosks');
    return response.data;
};

/**
 * Creates a new kiosk on the server.
 */
export const createKiosk = async (payload: KioskPayload): Promise<Kiosk> => {
    const response = await apiClient.post('/kiosks', payload);
    return response.data;
};

/**
 * Updates an existing kiosk on the server.
 */
export const updateKiosk = async ({ id, payload }: { id: string, payload: Partial<KioskPayload> }): Promise<Kiosk> => {
    const response = await apiClient.patch(`/kiosks/${id}`, payload);
    return response.data;
};

/**
 * Deletes a kiosk from the server.
 */
export const deleteKiosk = async (id: string): Promise<void> => {
    await apiClient.delete(`/kiosks/${id}`);
};
