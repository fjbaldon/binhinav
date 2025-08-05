import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum AdType {
    IMAGE = 'image',
    VIDEO = 'video',
}

@Entity('ads')
export class Ad {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: AdType,
        default: AdType.IMAGE,
    })
    type: AdType;

    @Column()
    fileUrl: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'int', nullable: true })
    displayOrder: number;
}
