import { ActionType } from "../enums/action-type.enum";

// This isn't for controllers, but for type-safe internal service calls.
export class CreateAuditLogDto {
    entityType: string;
    entityId: string;
    action: ActionType;
    changes: any;
    userId: string;
    username: string;
    userRole: string;
}
