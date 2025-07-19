import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
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
    nullable: true,
    onDelete: 'SET NULL',
  })
  place: Place;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Only hash the password if it exists and is NOT already hashed.
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  toJSON() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = this;
    return rest;
  }
}
