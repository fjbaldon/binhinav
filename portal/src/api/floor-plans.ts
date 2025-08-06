import { apiClient } from ".";
import type { FloorPlan } from "./types";

export const getFloorPlans = async (): Promise<FloorPlan[]> => {
    const response = await apiClient.get('/floor-plans');
    return response.data;
};

export const createFloorPlan = async (formData: FormData): Promise<FloorPlan> => {
    const response = await apiClient.post('/floor-plans', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateFloorPlan = async ({ id, formData }: { id: string, formData: FormData }): Promise<FloorPlan> => {
    const response = await apiClient.patch(`/floor-plans/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteFloorPlan = async (id: string): Promise<void> => {
    await apiClient.delete(`/floor-plans/${id}`);
};

export const reorderFloorPlans = async (ids: string[]): Promise<void> => {
    await apiClient.patch('/floor-plans/reorder', { ids });
};
