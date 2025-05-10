import { IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class ZKPassportProofDto {
  @IsString()
  firstname: string;

  @IsString()
  lastname: string;

  @IsString()
  birthdate: string;

  @IsString()
  nationality: string;

  @IsString()
  documentType: string;

  @IsString()
  documentNumber: string;
}

export class VerifyProofsDto {
  @IsArray()
  zkEmailProofs: any[]; // Podés reemplazar 'any' con una interfaz más estricta si tenés el schema

  @ValidateNested()
  @Type(() => ZKPassportProofDto)
  zkPassportProof: ZKPassportProofDto;
}
