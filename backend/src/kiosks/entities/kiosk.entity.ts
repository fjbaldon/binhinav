import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { FloorPlan } from '../../floor-plans/entities/floor-plan.entity';

@Entity('kiosks')
export class Kiosk {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string; // e.g., "Main Entrance Kiosk", "West Wing Kiosk"

    @Column('float')
    locationX: number;

    @Column('float')
    locationY: number;

    // By setting nullable to false and using JoinColumn, TypeORM ensures
    // a `floorPlanId` column is created and required in the database.
    @ManyToOne(() => FloorPlan, (floorPlan) => floorPlan.kiosks, {
        eager: true,
        onDelete: 'CASCADE', // If a floor plan is deleted, its kiosks are also deleted.
        nullable: false, // A kiosk MUST belong to a floor plan.
    })
    @JoinColumn({ name: 'floorPlanId' }) // Explicitly name the foreign key column
    floorPlan: FloorPlan;

    // The explicit `floorPlanId` column is removed. TypeORM handles it.
    // If you need the ID, you can get it from the loaded `floorPlan` object.
    // For DTOs, you will continue to pass `floorPlanId` and the service will handle the relation.
}
