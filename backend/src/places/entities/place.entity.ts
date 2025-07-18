import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
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
    nullable: true, // Category is optional
    onDelete: 'SET NULL', // If a category is deleted, the place's category is set to null
    eager: true, // Automatically load the category when fetching a place
  })
  category: Category;

  @Column({ type: 'text', nullable: true })
  logoUrl: string; // URL to the uploaded logo image

  @Column({ type: 'text', nullable: true })
  coverUrl: string; // URL to the uploaded cover image

  @Column({ default: '' })
  businessHours: string;

  // Location on the map (e.g., pixel coordinates)
  @Column('float')
  locationX: number;

  @Column('float')
  locationY: number;

  @ManyToOne(() => FloorPlan, (floorPlan) => floorPlan.places, {
    onDelete: 'CASCADE', // If a floor plan is deleted, delete its places
  })
  floorPlan: FloorPlan;

  @OneToOne(() => Merchant, (merchant) => merchant.place)
  merchant: Merchant;
}
