import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { FloorPlan } from '../../floor-plans/entities/floor-plan.entity';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('places')
export class Place {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @ManyToOne(() => Category, (category) => category.places, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  category: Category | null;

  @Column({ type: 'text', nullable: true })
  logoUrl: string;

  @Column({ type: 'text', nullable: true })
  coverUrl: string;

  @Column({ default: '' })
  businessHours: string;

  @Column('float')
  locationX: number;

  @Column('float')
  locationY: number;

  @ManyToOne(() => FloorPlan, (floorPlan) => floorPlan.places, {
    onDelete: 'CASCADE',
  })
  floorPlan: FloorPlan;

  @OneToOne(() => Merchant, (merchant) => merchant.place, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  merchant: Merchant | null;
}
