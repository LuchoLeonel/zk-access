import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GmailService } from '../gmail/gmail.service';
import { VCService } from '../vc/vc.service';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import zkEmailSdk from '@zk-email/sdk';
  import { join } from 'path';

const BLUEPRINT = "LuchoLeonel/ZkAccess@v1";

@Injectable()
export class ZkEmailProcessorService implements OnModuleInit {
  private readonly logger = new Logger(ZkEmailProcessorService.name);

  constructor(
    private readonly gmailService: GmailService,
    private readonly vcService: VCService,
  ) {}

  onModuleInit() {
    this.logger.log('🚀 Inicializando ZkEmailProcessorService...');
    this.startProcessingLoop();
  }

  private startProcessingLoop() {
    // Ejecutar apenas inicia
    this.logger.log('📥 Procesando emails inmediatamente...');
    this.processEmails().catch(error => {
      this.logger.error('❌ Error en el procesamiento inicial:', error);
    });
  
    // Después cada 5 minutos
    setInterval(async () => {
      this.logger.log('📥 Revisando emails no leídos...');
      try {
        await this.processEmails();
      } catch (error) {
        this.logger.error('❌ Error en el procesamiento de emails:', error);
      }
    }, 5 * 60 * 1000);
  }
  

  private async processEmails() {
    const unreadEmails = await this.gmailService.fetchAllUnreadEmails();
    
    if (unreadEmails.length === 0) {
      this.logger.log('📭 No hay emails nuevos.');
      return;
    }

    for (const eml of unreadEmails) {
      try {
        this.saveEml(eml);

        const { proof, isValid } = await this.generateProof(eml);
        if (isValid) {
          const emailAddress = (proof as any).props.publicData.email_sender[0];
          const organization = this.vcService.getDomainFromEmail(emailAddress);

          const credential = await this.vcService.createCredentialAndGetToken({emailAddress, organization});
          const qrCode = await this.vcService.generateQR(credential);

          await this.gmailService.sendEmail(qrCode, emailAddress);

          console.log({qrCode});
          this.logger.log(`✅ QR generado para ${emailAddress}`);
        } else {
          this.logger.warn('⚠️ Proof inválido, email ignorado.');
        }
      } catch (error) {
        this.logger.error('❌ Error procesando un email:', error);
      }
    }
  }

  private saveEml(eml: string) {
    const emlDir = join(__dirname, '..', '..', 'eml');
    if (!existsSync(emlDir)) {
      mkdirSync(emlDir);
    }

    const timestamp = Date.now();
    const filePath = join(emlDir, `email-${timestamp}.eml`);
    writeFileSync(filePath, eml);

    this.logger.log(`📝 .eml guardado en: ${filePath}`);
  }
  
  async generateProof(eml: string) {
    const sdk = zkEmailSdk();

    this.logger.log('📦 Obteniendo blueprint...');
    const blueprint = await sdk.getBlueprint(BLUEPRINT);

    const prover = blueprint.createProver();

    this.logger.log('📤 Generando prueba remota...');
    const proof = await prover.generateProof(eml);

    this.logger.log('🧪 Verificando prueba...');
    const isValid = await blueprint.verifyProof(proof);

    this.logger.log(`✅ Proof verified: ${isValid}`);
    return { proof, isValid };
  }
}


@Injectable()
export class ZkService {
  private readonly logger = new Logger(ZkEmailProcessorService.name);

  constructor(
    private readonly vcService: VCService,
  ) {}

  async verifyCombinedProofs(zkEmailProof: any, zkPassportProof: any) {

    const sdk = zkEmailSdk();
    const blueprint = await sdk.getBlueprint(BLUEPRINT);
    const isValid = await blueprint.verifyProof(zkEmailProof);

    if (!isValid) {
      return { success: false, reason: 'Invalid zkEmail proof' };
    }

    const publicData = (zkEmailProof as any).props.publicData;
    const subject = publicData.subject?.[0] ?? '';
    const emailSender = publicData.email_sender?.[0] ?? '';
    const emailDomain = publicData.sender_domain?.[0] ?? '';
    const maybeDomain = this.vcService.getDomainFromEmail(emailSender);
    if (maybeDomain !== emailDomain) {
      return { success: false, reason: 'Invalid Domain' };
    }
    const { email, role, organization } = this.parseSubject(subject);
    
    const params = {email, role, organization, ...zkPassportProof}
    const credential = await this.vcService.createCredentialAndGetToken(params);
    const qrCode = await this.vcService.generateQR(credential);

    return { qrCode };
  }


  parseSubject(subject: string): {
    organization: string;
    role: string;
    email: string;
  } {
    const result: Record<string, string> = {};
  
    subject.split(';').forEach((pair) => {
      const [key, value] = pair.trim().split('=');
      if (key && value) {
        result[key.trim().toLowerCase()] = value.trim();
      }
    });
  
    return {
      organization: result.organization ?? '',
      role: result.role ?? '',
      email: result.email ?? '',
    };
  }
  
}
