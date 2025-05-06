// src/zk/zk.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ZkService } from './zk.service';
import { VerifyProofsDto } from './dto/verify-proofs.dto';

@Controller('zk')
export class ZkController {
  constructor(private readonly zkService: ZkService) {}

  @Post('generate')
  async verifyProofs(@Body() body: VerifyProofsDto) {
    return this.zkService.verifyCombinedProofs(body.zkEmailProof, body.zkPassportProof);
  }
}
