import { Place } from '../../places/entities/place.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column()
    iconKey: string; // e.g., "FaStore", "IoFastFood", "MdPhoneIphone"

    @OneToMany(() => Place, (place) => place.category)
    places: Place[];
}
