import { Kiosk } from 'src/kiosks/entities/kiosk.entity';
import { Place } from 'src/places/entities/place.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne } from 'typeorm';

@Entity('search_logs')
export class SearchLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    searchTerm: string;

    @Column()
    foundResults: boolean;

    @ManyToOne(() => Kiosk, { onDelete: 'SET NULL', nullable: true })
    kiosk: Kiosk | null;

    @ManyToOne(() => Place, { onDelete: 'SET NULL', nullable: true })
    selectedPlace: Place | null;

    @CreateDateColumn()
    timestamp: Date;
}
