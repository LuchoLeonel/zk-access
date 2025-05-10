// src/zk/zk.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ZkService } from './zk.service';
import { VerifyProofsDto } from './dto/verify-proofs.dto';
import { GenerateProofDto } from './dto/generate-proofs.dto';
import fs from 'fs';

@Controller('zk')
export class ZkController {
  constructor(private readonly zkService: ZkService) {}

  @Post('create-credential')
  async verifyProofs(@Body() body: VerifyProofsDto) {
    return await this.zkService.issueCredential(body.zkEmailProofs, body.zkPassportProof);
  }

  @Post('generate-proof')
  async generate(@Body() dto: GenerateProofDto) {
    return await this.zkService.generateProof(dto);
  }

  @Post('verify-proof')
  async verifyProof(@Body() body: any) {
    const { proof } = body;
    return await this.zkService.verifyProof(proof);
  }
}
