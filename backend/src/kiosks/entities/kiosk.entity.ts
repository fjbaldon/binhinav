import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { FloorPlan } from '../../floor-plans/entities/floor-plan.entity';

@Entity('kiosks')
export class Kiosk {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column('float')
    locationX: number;

    @Column('float')
    locationY: number;

    @ManyToOne(() => FloorPlan, (floorPlan) => floorPlan.kiosks, {
        eager: true,
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'floorPlanId' })
    floorPlan: FloorPlan;

    @Column({ type: 'varchar', unique: true, nullable: true })
    provisioningKey: string | null;

    @Column({ default: false })
    isProvisioned: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
