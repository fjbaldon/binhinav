export interface KioskData {
    id: string;
    name: string;
    locationX: number;
    locationY: number;
    floorPlan: FloorPlan;
}

export interface FloorPlan {
    id: string;
    name: string;
    imageUrl: string;
}

export interface Place {
    id: string;
    name: string;
    description: string;
    logoUrl: string | null;
    coverUrl: string | null;
    businessHours: string;
    locationX: number;
    locationY: number;
    category: Category | null;
    floorPlan: FloorPlan;
}

export interface Category {
    id: string;
    name: string;
    iconKey: string;
}

export interface Ad {
    id: string;
    name: string;
    imageUrl: string;
    isActive: boolean;
    displayOrder: number;
}
