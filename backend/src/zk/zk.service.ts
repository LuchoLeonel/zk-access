import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GmailService } from '../gmail/gmail.service';
import { VCService } from '../vc/vc.service';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import zkEmailSdk from '@zk-email/sdk';
import { join } from 'path';

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

          const credential = await this.vcService.createCredentialAndGetToken(emailAddress, organization);
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
    const blueprint = await sdk.getBlueprint('LuchoLeonel/VerifiableCredentialCheck@v9');

    const prover = blueprint.createProver();

    this.logger.log('📤 Generando prueba remota...');
    const proof = await prover.generateProof(eml);

    this.logger.log('🧪 Verificando prueba...');
    const isValid = await blueprint.verifyProof(proof);

    this.logger.log(`✅ Proof verified: ${isValid}`);
    return { proof, isValid };
  }
}
