// src/vc/vc.controller.ts
import { Controller, Get, Param, Query, Res, Logger, Post, Body, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { VCService } from './vc.service';
import * as jwt from 'jsonwebtoken';


@Controller('credential')
export class VcCredentialController {
  private readonly logger = new Logger(VcCredentialController.name);
  private readonly privateKeyBabyJub: string;

  constructor(
    private configService: ConfigService,
    private readonly vcService: VCService,
  ) {
    this.privateKeyBabyJub= this.configService.get<string>('PRIVATE_KEY_BABY_JUB')!;
  }

  @Get('mock')
  async issueMockCredential(@Res() res: Response) {
    this.logger.log('⚙️ GET /credential/mock - Emitiendo credencial mockeada');

    const credential = await this.vcService.emitMockCredential(this.privateKeyBabyJub);

    this.logger.log('✅ Credencial mockeada generada correctamente');

    return res.json({
      format: "jwt_vc",
      credential: credential.proof.jwt,
      c_nonce: "mock_nonce",
      c_nonce_expires_in: 86400,
    });
  }
}
