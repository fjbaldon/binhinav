import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { ActionType } from '../enums/action-type.enum';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // The name of the entity that was changed, e.g., 'Place', 'Merchant'
    @Index()
    @Column()
    entityType: string;

    // The UUID of the specific entity instance that was changed
    @Index()
    @Column()
    entityId: string;

    // The action performed on the entity
    @Column({
        type: 'enum',
        enum: ActionType,
    })
    action: ActionType;

    // We use `jsonb` for PostgreSQL for efficient querying. Stores the actual changes.
    // e.g., { "name": { "from": "Old Store", "to": "New Store" } }
    @Column({ type: 'jsonb', nullable: true })
    changes: any;

    // The UUID of the user (Admin or Merchant) who performed the action
    @Index()
    @Column()
    userId: string;

    // The username for easy display in the admin panel
    @Column()
    username: string;

    // The role of the user, so we can filter for 'merchant' changes
    @Column()
    userRole: string;

    @CreateDateColumn()
    timestamp: Date;
}
