import { Injectable, Logger } from '@nestjs/common';
import { VCService } from '../vc/vc.service';
import zkEmailSdk from '@zk-email/sdk';
import { GenerateProofDto } from './dto/generate-proofs.dto';
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import type { CompiledCircuit } from '@noir-lang/noir_js';
import { readFileSync } from 'fs';
import { join } from 'path';


const BLUEPRINT = "LuchoLeonel/ZkAccess@v8";


@Injectable()
export class ZkService {
  private readonly logger = new Logger(ZkService.name);

  constructor(
    private readonly vcService: VCService,
  ) {}

  async issueCredential(zkEmailProofs: any[], zkPassportProof: any) {
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
 
  async generateProof(s: GenerateProofDto) {
    const rawCircuitPath = join(__dirname, '../../circuit/target/zk_access.json');
    const rawCircuit = JSON.parse(readFileSync(rawCircuitPath, 'utf8'));

    const circuit = rawCircuit as CompiledCircuit;
    const noir = new Noir(circuit);
    const backend = new UltraHonkBackend(circuit.bytecode);
  
    const inputs = {
      values: s.values.map((v) => BigInt(v).toString()),
      keys: s.keys.map((v) => BigInt(v).toString()),
      hashes: s.hashes.map((v) => BigInt(v).toString()),
      compared_values: s.compared_values.map((v) => BigInt(v).toString()),
      operations: s.operations.map((v) => BigInt(v).toString()),
      signature_R8xs: s.signature_R8xs.map((v) => BigInt(v).toString()),
      signature_R8ys: s.signature_R8ys.map((v) => BigInt(v).toString()),
      signature_Ss: s.signature_Ss.map((v) => BigInt(v).toString()),
      signer_x: BigInt(s.signer_x).toString(),
      signer_y: BigInt(s.signer_y).toString(),
    };
  
    const { witness } = await noir.execute(inputs);
    const proof = await backend.generateProof(witness, { keccak: true });
    console.log("Proof length (bytes):", proof.proof.length);
    console.log("Public inputs length (bytes):", proof.publicInputs.length * 32);
    return { proof };
  }
  
  async verifyProof({ proof, publicInputs }: any) {
    const rawCircuitPath = join(__dirname, '../../circuit/target/zk_access.json');
    const rawCircuit = JSON.parse(readFileSync(rawCircuitPath, 'utf8'));
    const circuit = rawCircuit as CompiledCircuit;
    const backend = new UltraHonkBackend(circuit.bytecode);

    const reconstructedProof = this.objectToUint8Array(proof);
    const isValid = await backend.verifyProof({ proof: reconstructedProof, publicInputs }, { keccak: true });
    return { isValid };
  }

  objectToUint8Array(proofObj: Record<string, number>): Uint8Array {
    const sorted = Object.entries(proofObj)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, val]) => val);
    return new Uint8Array(sorted);
  }
}
