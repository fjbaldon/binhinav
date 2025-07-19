import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Place } from '../../places/entities/place.entity';
import * as bcrypt from 'bcrypt';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // The merchant's actual name

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @OneToOne(() => Place, (place) => place.merchant, {
    nullable: true, // A merchant might be created before being assigned a place
    onDelete: 'SET NULL', // If place is deleted, don't delete the merchant
  })
  // @JoinColumn() // This is now the inverse side of the relationship, so JoinColumn is removed.
  place: Place;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Add this check to only hash if a password was actually provided
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
