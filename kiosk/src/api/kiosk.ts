import { apiClient } from ".";
import type { KioskData, FloorPlan, Place, Category, Ad } from "./types";

interface GetPlacesParams {
    searchTerm?: string;
    categoryId?: string | null;
}

export const getKioskData = async (id: string): Promise<KioskData> => {
    const response = await apiClient.get(`/kiosks/${id}/public`);
    return response.data;
};

export const getFloorPlans = async (): Promise<FloorPlan[]> => {
    const response = await apiClient.get('/floor-plans');
    return response.data;
};

export const getPlaces = async (params: GetPlacesParams): Promise<Place[]> => {
    const response = await apiClient.get('/places', { params });
    return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return response.data;
};

export const getActiveAds = async (): Promise<Ad[]> => {
    const response = await apiClient.get('/ads/active');
    return response.data;
};
