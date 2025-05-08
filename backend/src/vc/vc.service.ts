import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { setupVeramoAgent } from './setupVeramo';
import { ConfigService } from '@nestjs/config';
import { ICreateVerifiableCredentialArgs,W3CVerifiableCredential, IIdentifier } from '@veramo/core';
import { v4 as uuidv4 } from 'uuid'; 
import { capitalize } from 'lodash';
import dbConnection from '../db.connection.js';
import { convertHashToString, getPublicKeyBabyJub, poseidonHash, signDelegationWithVeramo, signWithEddsaBabyJub } from './utils';


@Injectable()
export class VCService {
    private readonly logger = new Logger(VCService.name);
    private readonly privateKeyBabyJub: string;
    private agent;

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
      const token = uuidv4();
      const { signer_x, signer_y, signer_hex } = await getPublicKeyBabyJub(this.privateKeyBabyJub);
      console.log(JSON.stringify(values));
    
      const {
        emails,
        zkPassportProof: {
          firstname,
          lastname,
          birthdate,
          nationality,
          documentType,
          documentNumber
        }
      } = values;
    
      const fields = [
        { key: 'firstname', value: firstname },
        { key: 'lastname', value: lastname },
        { key: 'birthdate', value: birthdate },
        { key: 'nationality', value: nationality },
        { key: 'documentType', value: documentType },
        { key: 'documentNumber', value: documentNumber },
      ];
    
      const credentialHashes: any = {};
    
      for (const { key, value } of fields) {
        const hash = await poseidonHash(key, value);
        credentialHashes[key] = {
          hash: await convertHashToString(hash),
          signature: await signWithEddsaBabyJub(hash, this.privateKeyBabyJub)
        };
      }
    
      const processedOffers = await emails.reduce(async (accPromise, email, index) => {
        const acc = await accPromise;
      
        const fields = ["emailRecipient", "emailSender", "emailTimestamp", "offer", "currency", "company"];
        const result: any = {};
      
        for (const field of fields) {
          const key = `offerAc[${index}].${field}`;
          const value = email[field].toString();
          const hash = await poseidonHash(key, value);
          result[field] = {
            hash: await convertHashToString(hash),
            signature: await signWithEddsaBabyJub(hash, this.privateKeyBabyJub)
          };
        }
      
        acc[index] = result;
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
            id: `urn:uuid:${token}`,
            firstname,
            lastname,
            birthdate,
            nationality,
            documentType,
            documentNumber,
            offerAc: emails.reduce((acc: any, email: any) => {
              acc[email.index] = {
                emailRecipient: email.emailRecipient,
                emailSender: email.emailSender,
                emailTimestamp: email.emailTimestamp,
                offer: email.offer,
                currency: email.currency,
                company: email.company
              };
              return acc;
            }, {})
          },
          circuitInputs: {
            delegation: {
              did: identifier.did,
              signer_x,
              signer_y,
              signature: await signDelegationWithVeramo(this.agent, signer_hex)
            },
            credentialSubject: {
              ...credentialHashes,
              offerAc: processedOffers
            }
          }
        },
        proofFormat: 'jwt'
      };
    
      const verifiableCredential = await this.agent.createVerifiableCredential(credentialArgs);
      return verifiableCredential;
    }
    
    
    async emitMockCredential(values: any) {
      const identifier = await this.getOrCreateDidManager(this.agent);
      const token = uuidv4();
      const { signer_x, signer_y, signer_hex } = await getPublicKeyBabyJub(this.privateKeyBabyJub);
    
      const firstname = "John";
      const lastname = "Smith";
      const birthdate = "1995-11-12T00:00:00.000Z";
      const nationality = "ZKR";
      const documentType = "passport";
      const documentNumber = "ZP1111111";
    
      const emails = [
        {
          index: 0,
          emailSender: "luciano.carreno@ramelax.com",
          offer: "800000",
          currency: "USD",
          company: "Stellar",
          emailRecipient: "luciano@ramelax.com",
          emailTimestamp: "1746704736"
        },
        {
          index: 1,
          emailSender: "luciano.carreno@ramelax.com",
          offer: "1000000",
          currency: "USD",
          company: "AztecLabs",
          emailRecipient: "luciano@ramelax.com",
          emailTimestamp: "1746704744"
        },
        {
          index: 2,
          emailSender: "luciano.carreno@ramelax.com",
          offer: "1500000",
          currency: "USD",
          company: "Arbitrum",
          emailRecipient: "luciano@ramelax.com",
          emailTimestamp: "1746704757"
        }
      ];
    
      const fields = [
        { key: 'firstname', value: firstname },
        { key: 'lastname', value: lastname },
        { key: 'birthdate', value: birthdate },
        { key: 'nationality', value: nationality },
        { key: 'documentType', value: documentType },
        { key: 'documentNumber', value: documentNumber },
      ];
    
      const credentialHashes: any = {};
    
      for (const { key, value } of fields) {
        const hash = await poseidonHash(key, value);
        credentialHashes[key] = {
          hash: await convertHashToString(hash),
          signature: await signWithEddsaBabyJub(hash, this.privateKeyBabyJub)
        };
      }
    
      const processedOffers = await emails.reduce(async (accPromise, email, index) => {
        const acc = await accPromise;
      
        const fields = ["emailRecipient", "emailSender", "emailTimestamp", "offer", "currency", "company"];
        const result: any = {};
      
        for (const field of fields) {
          const key = `offerAc[${index}].${field}`;
          const value = email[field].toString();
          const hash = await poseidonHash(key, value);
          result[field] = {
            hash: await convertHashToString(hash),
            signature: await signWithEddsaBabyJub(hash, this.privateKeyBabyJub)
          };
        }
      
        acc[index] = result;
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
            id: `urn:uuid:${token}`,
            firstname,
            lastname,
            birthdate,
            nationality,
            documentType,
            documentNumber,
            offerAc: emails.reduce((acc: any, email: any) => {
              acc[email.index] = {
                emailRecipient: email.emailRecipient,
                emailSender: email.emailSender,
                emailTimestamp: email.emailTimestamp,
                offer: email.offer,
                currency: email.currency,
                company: email.company
              };
              return acc;
            }, {})
          },
          circuitInputs: {
            delegation: {
              did: identifier.did,
              signer_x,
              signer_y,
              signature: await signDelegationWithVeramo(this.agent, signer_hex)
            },
            credentialSubject: {
              ...credentialHashes,
              offerAc: processedOffers
            }
          }
        },
        proofFormat: 'jwt'
      };
    
      const verifiableCredential = await this.agent.createVerifiableCredential(credentialArgs);
      return verifiableCredential;
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