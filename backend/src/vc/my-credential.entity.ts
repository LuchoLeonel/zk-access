import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class MyCredential {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  token: string = '';

  @Column({ default: false })
  used: boolean = false;

  @Column({ nullable: true })
  organization: string = '';

  @Column({ nullable: true })
  email: string = '';

  @Column({ nullable: true })
  credentialId: string = '';
}
