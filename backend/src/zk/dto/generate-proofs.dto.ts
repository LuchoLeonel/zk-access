import { IsArray, IsString } from 'class-validator';

export class GenerateProofDto {
  @IsArray()
  values: string[];

  @IsArray()
  keys: string[];

  @IsArray()
  compared_values: string[];

  @IsArray()
  hashes: string[];

  @IsArray()
  operations: string[];

  @IsArray()
  signature_R8xs: string[];

  @IsArray()
  signature_R8ys: string[];

  @IsArray()
  signature_Ss: string[];

  @IsString()
  signer_x: string;

  @IsString()
  signer_y: string;
}
