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
  role: string = '';

  @Column({ nullable: true })
  firstname: string = '';

  @Column({ nullable: true })
  lastname: string = '';

  @Column({ nullable: true })
  birthdate: string = '';

  @Column({ nullable: true })
  nationality: string = '';

  @Column({ nullable: true })
  documentType: string = '';

  @Column({ nullable: true })
  documentNumber: string = '';

  @Column({ nullable: true })
  credentialId: string = '';
}
