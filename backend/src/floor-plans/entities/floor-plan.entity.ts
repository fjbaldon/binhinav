import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Place } from '../../places/entities/place.entity';
import { Kiosk } from 'src/kiosks/entities/kiosk.entity';

@Entity('floor_plans')
export class FloorPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  imageUrl: string;

  @Column({ type: 'int', nullable: true })
  displayOrder: number;

  @OneToMany(() => Place, (place) => place.floorPlan)
  places: Place[];

  @OneToMany(() => Kiosk, (kiosk) => kiosk.floorPlan)
  kiosks: Kiosk[];
}
