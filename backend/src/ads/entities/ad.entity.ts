import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('ads')
export class Ad {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string; // For admin reference, e.g., "Nike Summer Sale Ad"

    @Column()
    imageUrl: string; // URL to the ad image

    @Column({ default: true })
    isActive: boolean; // Controls whether the ad is shown on kiosks

    @Column({ type: 'int', nullable: true })
    displayOrder: number; // To control the sequence of ads, lower numbers first
}
