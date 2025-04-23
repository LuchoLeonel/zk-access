import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { GmailService } from '../gmail/gmail.service';
import { ZkEmailService } from './zk-email.service';
import { Logger } from '@nestjs/common';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { DidService } from '../did/did.service';

@Controller('zk')
export class ZkController {
  private readonly logger = new Logger(ZkController.name); 
  constructor(
    private readonly gmailService: GmailService,
    private readonly zkEmailService: ZkEmailService,
    private readonly didService: DidService
  ) {}

  @Get('generate')
  async generateProofFromEmail() {
    const eml = await this.gmailService.getLatestUnreadEmail();
    if (!eml) return 'No unread emails';

    saveEml(eml, this.logger);

    // Generate proof from email and check if it's valid
    const {proof, isValid} = await this.zkEmailService.generateProof(eml);
    
    if (!isValid) throw new UnauthorizedException('Invalid proof');

    const emailAddress = 'Temp, preguntar a lucho como extraerlo de la eml'

    // Generate credential
    const did = await this.didService.emitCredential(emailAddress);
    
    return { status: 'ok', proof, did };
  }
}


const saveEml = (eml, logger) => {
  const emlDir = join(__dirname, '..', '..', 'eml');
  if (!existsSync(emlDir)) {
    mkdirSync(emlDir);
  }
  
  const timestamp = Date.now();
  const filePath = join(emlDir, `email-${timestamp}.eml`);
  writeFileSync(filePath, eml);

  logger.log(`.eml guardado en: ${filePath}`);
}