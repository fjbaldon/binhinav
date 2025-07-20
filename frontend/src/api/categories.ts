import { apiClient } from ".";
import type { Category, CategoryPayload } from "./types";

// --- API Functions ---

/**
 * Fetches all categories from the server.
 */
export const getCategories = async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return response.data;
};

/**
 * Creates a new category on the server.
 */
export const createCategory = async (payload: CategoryPayload): Promise<Category> => {
    const response = await apiClient.post('/categories', payload);
    return response.data;
};

/**
 * Updates an existing category on the server.
 */
export const updateCategory = async ({ id, payload }: { id: string, payload: Partial<CategoryPayload> }): Promise<Category> => {
    const response = await apiClient.patch(`/categories/${id}`, payload);
    return response.data;
};

/**
 * Deletes a category from the server.
 */
export const deleteCategory = async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
};
