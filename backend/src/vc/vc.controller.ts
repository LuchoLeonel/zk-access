// src/vc/vc.controller.ts
import { Controller, Get, Param, Query, Res, Logger, Post, Body, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { VCService } from './vc.service';
import * as jwt from 'jsonwebtoken';


@Controller('offer-credential')
export class VcController {
  private readonly logger = new Logger(VcController.name);
    private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private readonly vcService: VCService,
  ) {
    this.baseUrl = this.configService.get<string>('BASE_URL')!;
  }

  @Get(':type')
  async offerCredential(
    @Param('type') credentialType: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    this.logger.log("solicito los datos de la credencial");
    if (await this.vcService.verifyToken(token)) {
        this.logger.log("solicito los datos de la credencial");

        const payload = {
            credential_issuer: this.baseUrl,
            credentials: [credentialType],
            grants: {
                'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
                    'pre-authorized_code': token,
                    user_pin_required: false,
                },
            },
        };
        return res.json(payload);
    } else {
      return res.status(401);
    }
  }
}

@Controller('oauth2')
export class VcOauthController {
  private readonly logger = new Logger(VcOauthController.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('BASE_URL')!;
    this.apiKey = this.configService.get<string>('API_KEY')!;
  }

  @Post('token')
  async issueToken(
    @Body() body: any,
    @Res() res: Response
  ) {
    const token = body['pre-authorized_code'];
    this.logger.log(`Recibido token: ${token}`);

    try {
        const payload = {
            iss: 'default',
            aud: this.baseUrl,
            identifier_token: token,
            nonce: body.client_id,
            credential_configuration: {
                type: ["VerifiableCredential", "ZKAccess"],
                format: "jwt_vc",
            },
        };

        const accessToken = jwt.sign(payload, this.apiKey, { expiresIn: '10m' });
        const response = {
            access_token: accessToken,
            token_type: "bearer",
            expires_in: 300,
            c_nonce: "my_nonce",
            c_nonce_expires_in: 86400
        };

        return res.json(response);

    } catch (error) {
      return res.status(500);
    }
  }
}

@Controller('credential')
export class VcCredentialController {
  private readonly logger = new Logger(VcCredentialController.name);
  private readonly apiKey: string;
  private readonly privateKeyBabyJub: string;

  constructor(
    private configService: ConfigService,
    private readonly vcService: VCService,
  ) {
    this.apiKey = this.configService.get<string>('API_KEY')!;
    this.privateKeyBabyJub= this.configService.get<string>('PRIVATE_KEY_BABY_JUB')!;
  }

  @Post()
  async issueCredential(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.log('📥 Recibida solicitud de credencial');

    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401);
        }

      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, this.apiKey);
      const tokenIdentifier = decoded.identifier_token;
    
      const verifiableCredential = await this.vcService.emitCredential(tokenIdentifier, this.privateKeyBabyJub);

      this.logger.log('✅ Credencial generada correctamente');

      const response = {
        format: "jwt_vc",
        credential: verifiableCredential.proof.jwt,
        c_nonce: "my_nonce",
        c_nonce_expires_in: 86400,
      };
      return res.json(response);

    } catch (error) {
      return res.status(500);
    }
  }

  @Get('mock')
  async issueMockCredential(@Res() res: Response) {
    this.logger.log('⚙️ GET /credential/mock - Emitiendo credencial mockeada');

      const organization = "Constata";
      const email = "zk@constata.eu";

      const credential = await this.vcService.emitMockCredential(organization, email, this.privateKeyBabyJub);

      this.logger.log('✅ Credencial mockeada generada correctamente');

      return res.json({
        format: "jwt_vc",
        credential: credential.proof.jwt,
        c_nonce: "mock_nonce",
        c_nonce_expires_in: 86400,
      });
  }
}
