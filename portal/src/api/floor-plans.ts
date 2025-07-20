import { apiClient } from ".";
import type { FloorPlan } from "./types";

// --- API Functions ---

/**
 * Fetches all floor plans from the server.
 */
export const getFloorPlans = async (): Promise<FloorPlan[]> => {
    const response = await apiClient.get('/floor-plans');
    return response.data;
};

/**
 * Creates a new floor plan on the server.
 * @param formData - The FormData object containing the name and image file.
 */
export const createFloorPlan = async (formData: FormData): Promise<FloorPlan> => {
    const response = await apiClient.post('/floor-plans', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Updates an existing floor plan on the server.
 * @param id - The ID of the floor plan to update.
 * @param formData - The FormData object containing the optional name and/or image file.
 */
export const updateFloorPlan = async ({ id, formData }: { id: string, formData: FormData }): Promise<FloorPlan> => {
    const response = await apiClient.patch(`/floor-plans/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Deletes a floor plan from the server.
 * @param id - The ID of the floor plan to delete.
 */
export const deleteFloorPlan = async (id: string): Promise<void> => {
    await apiClient.delete(`/floor-plans/${id}`);
};
