import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Place } from '../../places/entities/place.entity';
import { Kiosk } from 'src/kiosks/entities/kiosk.entity';

@Entity('floor_plans')
export class FloorPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g., "Ground Floor", "Level 1", "0", "1"

  @Column()
  imageUrl: string; // URL to the high-definition image

  @OneToMany(() => Place, (place) => place.floorPlan)
  places: Place[];

  @OneToMany(() => Kiosk, (kiosk) => kiosk.floorPlan)
  kiosks: Kiosk[];
}
