import { Injectable, Logger } from '@nestjs/common';
import zkEmailSdk from '@zk-email/sdk';

@Injectable()
export class ZkEmailService {
  private readonly logger = new Logger(ZkEmailService.name);

  async generateProof(eml: string) {
    this.logger.log('🔍 Inicializando SDK...');
    const sdk = zkEmailSdk();

    this.logger.log('📦 Obteniendo blueprint...');
    const blueprint = await sdk.getBlueprint('LuchoLeonel/VerifiableCredentialCheck@v1');

    this.logger.log('🧠 Creando prover...');
    const prover = blueprint.createProver();

    this.logger.log('📤 Generando prueba remota...');
    const proof = await prover.generateProof(eml);

    this.logger.log('🧪 Verificando prueba...');
    const isValid = await blueprint.verifyProof(proof);

    this.logger.log(`✅ Proof verified: ${isValid}`);
    return { proof, isValid };
  }
}
