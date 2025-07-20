import { apiClient } from ".";
import type { Place, PlacePayload, UpdatePlacePayload } from "./types";

// --- API Functions ---

/** Fetches all places. */
export const getPlaces = async (): Promise<Place[]> => {
    const response = await apiClient.get('/places');
    return response.data;
};

/** Fetches a single, detailed place by its ID. */
export const getPlaceById = async (id: string): Promise<Place> => {
    const response = await apiClient.get(`/places/${id}`);
    return response.data;
};

/** Creates a new place. */
export const createPlace = async (payload: PlacePayload): Promise<Place> => {
    const response = await apiClient.post('/places', payload);
    return response.data;
};

/** Updates an existing place. */
export const updatePlace = async ({ id, payload }: { id: string, payload: Partial<UpdatePlacePayload> }): Promise<Place> => {
    const response = await apiClient.patch(`/places/${id}`, payload);
    return response.data;
};

/** Deletes a place. */
export const deletePlace = async (id: string): Promise<void> => {
    await apiClient.delete(`/places/${id}`);
};

/** Updates an existing place with image data (logo/cover). */
export const updatePlaceWithImages = async ({ id, formData }: { id: string, formData: FormData }): Promise<Place> => {
    const response = await apiClient.patch(`/places/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};
