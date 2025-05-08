import { Injectable, Logger } from '@nestjs/common';
import { VCService } from '../vc/vc.service';
import zkEmailSdk from '@zk-email/sdk';

const BLUEPRINT = "LuchoLeonel/ZkAccess@v8";


@Injectable()
export class ZkService {
  private readonly logger = new Logger(ZkService.name);

  constructor(
    private readonly vcService: VCService,
  ) {}

  async verifyCombinedProofs(zkEmailProofs: any[], zkPassportProof: any) {
    const sdk = zkEmailSdk();
    const blueprint = await sdk.getBlueprint(BLUEPRINT);
    
    const emails: any = [];
    for (const [index, zkEmailProof] of zkEmailProofs.entries()) {
      const isValid = await blueprint.verifyProof(zkEmailProof);
      if (!isValid) {
        return { success: false, reason: 'Invalid zkEmail proof' };
      }
      const publicData = (zkEmailProof as any).props.publicData;
      const subject = publicData.subject?.[0] ?? '';
      const { offer, currency, company } = this.parseSubject(subject);
      const emailSender = publicData.email_sender?.[0] ?? '';
      emails.push({index, emailSender, offer, currency, company, emailRecipient: "luciano@gmail.com", emailTimestamp: Math.floor(Date.now() / 1000).toString()});
    }
    
    const credential = await this.vcService.emitCredential({emails, zkPassportProof});

    return { credential };
  }


  parseSubject(subject: string): {
    offer: string;
    currency: string;
    company: string;
  } {
    const result: Record<string, string> = {};

    const cleanSubject = subject.replace(/^\.\s*/, '');

    cleanSubject.split(';').forEach((pair) => {
      const [key, value] = pair.trim().split('=');
      if (key && value) {
        result[key.trim().toLowerCase()] = value.trim();
      }
    });
  
    return {
      offer: result.offer ?? '',
      currency: result.currency ?? '',
      company: result.company ?? '',
    };
  }
  
}
