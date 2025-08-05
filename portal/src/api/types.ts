export interface Admin {
    id: string;
    name: string;
    username: string;
    email: string | null;
    isSuperAdmin: boolean;
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
    places?: Place[];
    kiosks?: Kiosk[];
}

export interface Merchant {
    id: string;
    name: string;
    username: string;
    email: string | null;
    place?: Place;
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
    type: 'image' | 'video';
    fileUrl: string;
    isActive: boolean;
    displayOrder: number | null;
}

export interface AuditLog {
    id: string;
    changes: { [key: string]: { from: any; to: any } };
    username: string;
    timestamp: string;
}

export interface AdminPayload {
    name?: string;
    email?: string | null;
    username?: string;
    password?: string;
    isSuperAdmin?: boolean;
}

export interface MerchantPayload {
    name?: string;
    username?: string;
    password?: string;
    email?: string | null;
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
