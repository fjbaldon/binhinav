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
  name: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @OneToOne(() => Place, (place) => place.merchant, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  place: Place | null;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  toJSON() {
    const { password, ...rest } = this;
    return rest;
  }
}
