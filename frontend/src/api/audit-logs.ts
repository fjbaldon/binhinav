import { apiClient } from ".";
import type { AuditLog } from "./types";

// --- API Function ---

/**
 * Fetches the latest audit log entries for merchant changes.
 */
export const getMerchantChanges = async (): Promise<AuditLog[]> => {
    const response = await apiClient.get('/audit-logs/merchant-changes');
    return response.data;
};
