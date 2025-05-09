import { Injectable, Logger } from '@nestjs/common';
import { setupVeramoAgent } from './setupVeramo';
import { ConfigService } from '@nestjs/config';
import { ICreateVerifiableCredentialArgs, IIdentifier } from '@veramo/core';
import { v4 as uuidv4 } from 'uuid'; 
import { capitalize } from 'lodash';
import { convertHashToString, getPublicKeyBabyJub, poseidonHash, signDelegationWithVeramo, signWithEddsaBabyJub } from './utils';


@Injectable()
export class VCService {
    private readonly logger = new Logger(VCService.name);
    private readonly privateKeyBabyJub: string;
    private agent: any;

    constructor(private configService: ConfigService) {
        this.agent = setupVeramoAgent(configService);
        this.privateKeyBabyJub = this.configService.get<string>('PRIVATE_KEY_BABY_JUB')!;
    }

    /**
     * Emits a Verifiable Credential
     * @returns {Promise<string>} The DID of the credential
     */
    async emitCredential(values: any) {
      const identifier = await this.getOrCreateDidManager(this.agent);
      const uuid = uuidv4();
      const { signer_x, signer_y, signer_hex } = await getPublicKeyBabyJub(this.privateKeyBabyJub);
      
      console.log(JSON.stringify(values));
      const { emails, zkPassportProof } = values;
      const {
        firstname,
        lastname,
        birthdate,
        nationality,
        documentType,
        documentNumber
      } = zkPassportProof;
    
      const passportKeys = ['firstname', 'lastname', 'birthdate', 'nationality', 'documentType', 'documentNumber'];
      const passportCircuitInputs = await this.buildCircuitInputs.call(this, zkPassportProof, passportKeys);

    
      const offerKeys = ['emailRecipient', 'emailSender', 'emailTimestamp', 'offer', 'currency', 'company'];
      const offerCircuitInputs = await emails.reduce(async (accPromise, email, index) => {
        const acc = await accPromise;
        acc[index] = await this.buildCircuitInputs.call(this, email, offerKeys, `offerAc[${index}]`);
        return acc;
      }, Promise.resolve({}));
    
      const credentialArgs: ICreateVerifiableCredentialArgs = {
        credential: {
          "@context": [
            "https://www.w3.org/2018/credentials/v1",
            {
              firstname: "schema:givenName",
              lastname: "schema:familyName",
              birthdate: "schema:birthDate",
              nationality: "schema:nationality",
              documentType: "schema:documentType",
              documentNumber: "schema:documentNumber",
              offerAc: "schema:offerAc",
              zkBindings: "schema:zkBindings",
              schema: "https://schema.org/",
              type: "@type"
            }
          ],
          type: ['VerifiableCredential', 'ZKAccess'],
          issuer: { id: identifier.did },
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: `urn:uuid:${uuid}`,
            firstname,
            lastname,
            birthdate,
            nationality,
            documentType,
            documentNumber,
            offerAc: this.buildOfferAcObject(emails)
          },
          circuitInputs: {
            delegation: {
              did: identifier.did,
              signer_x,
              signer_y,
              signature: await signDelegationWithVeramo(this.agent, signer_hex)
            },
            credentialSubject: {
              ...passportCircuitInputs,
              offerAc: offerCircuitInputs
            }
          }
        },
        proofFormat: 'jwt'
      };
    
      const verifiableCredential = await this.agent.createVerifiableCredential(credentialArgs);
      return verifiableCredential;
    }
    
    private async buildCircuitInputs(obj: Record<string, any>, keys: string[], prefix = '') {
      const result: Record<string, any> = {};
    
      for (const key of keys) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key]?.toString?.() ?? '';
        const hash = await poseidonHash(fullKey, value);
    
        result[key] = {
          hash: await convertHashToString(hash),
          signature: await signWithEddsaBabyJub(hash, this.privateKeyBabyJub),
        };
      }
    
      return result;
    }

    private buildOfferAcObject(emails: any[]) {
      return emails.reduce((acc, email) => {
        acc[email.index] = {
          emailRecipient: email.emailRecipient,
          emailSender: email.emailSender,
          emailTimestamp: email.emailTimestamp,
          offer: email.offer,
          currency: email.currency,
          company: email.company,
        };
        return acc;
      }, {});
    }
    
    
    async getOrCreateDidManager(agent: any, alias = 'default'): Promise<IIdentifier> {
        try {
          const identifier = await agent.didManagerGetByAlias({ alias })
          console.log(`✅ Identifier found: ${identifier.did}`)
          return identifier
        } catch (error) {
          console.warn(`⚠️ Identifier with alias "${alias}" not found. Creating a new one...`)
      
          const newIdentifier = await agent.didManagerCreate({
            alias,
            provider: 'did:key',
            kms: 'local',
            options: {
              keyType: 'Secp256r1',
            },
          })
      
          console.log(`✅ New identifier created: ${newIdentifier.did}`)
          return newIdentifier
        }
      }
}