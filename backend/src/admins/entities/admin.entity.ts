import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

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
