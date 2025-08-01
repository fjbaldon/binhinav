// --- Core Entities ---

export interface Admin {
    id: string;
    username: string;
}

export interface Category {
    id: string;
    name: string;
    iconKey: string;
    placesCount?: number;
}

export interface FloorPlan {
    id: string;
    name: string;
    imageUrl: string;
    // For displaying usage counts in the table
    places?: Place[];
    kiosks?: Kiosk[];
}

export interface Merchant {
    id: string;
    name: string;
    username: string;
    place?: Place; // Merchants can have an optional place
}

export interface Place {
    id: string;
    name: string;
    description: string;
    businessHours: string;
    logoUrl?: string | null;
    coverUrl?: string | null;
    locationX: number;
    locationY: number;
    category?: Category | null;
    floorPlan: FloorPlan;
    merchant?: Merchant | null;
}

export interface Kiosk {
    id: string;
    name: string;
    locationX: number;
    locationY: number;
    floorPlan: FloorPlan;
    provisioningKey?: string | null;
}

export interface Ad {
    id: string;
    name: string;
    imageUrl: string;
    isActive: boolean;
    displayOrder: number | null;
}

export interface AuditLog {
    id: string;
    changes: { [key: string]: { from: any; to: any } };
    username: string;
    timestamp: string;
}


// --- API Payloads (for POST/PATCH requests) ---

export interface AdminPayload {
    username?: string;
    password?: string;
}

export interface MerchantPayload {
    name?: string;
    username?: string;
    password?: string;
}

export interface PlacePayload {
    name: string;
    locationX: number;
    locationY: number;
    floorPlanId: string;
    merchantId?: string | null;
}

export interface UpdatePlacePayload {
    name?: string;
    description?: string;
    businessHours?: string;
    categoryId?: string | null;
    locationX?: number;
    locationY?: number;
    floorPlanId?: string;
    merchantId?: string | null;
}

export interface KioskPayload {
    name: string;
    locationX: number;
    locationY: number;
    floorPlanId: string;
}

export interface CategoryPayload {
    name: string;
    iconKey: string;
}
