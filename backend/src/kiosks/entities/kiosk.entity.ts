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

    // Location on the map (e.g., pixel coordinates)
    @Column('float')
    locationX: number;

    @Column('float')
    locationY: number;

    @ManyToOne(() => FloorPlan, (floorPlan) => floorPlan.kiosks, {
        // Eager loading automatically includes the floor plan when we fetch a kiosk.
        // This is useful for the public endpoint where the kiosk needs to know its floor.
        eager: true,
        onDelete: 'SET NULL', // If a floor plan is deleted, the kiosk remains but its floorPlanId becomes null.
        nullable: false, // A kiosk must always be on a floor plan.
    })
    @JoinColumn({ name: 'floorPlanId' }) // Explicitly name the foreign key column
    floorPlan: FloorPlan;

    // TypeORM also automatically creates a `floorPlanId` column, but this makes it explicit.
    @Column({ nullable: true })
    floorPlanId: string;
}
