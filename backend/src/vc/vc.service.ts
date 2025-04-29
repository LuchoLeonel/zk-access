import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { setupVeramoAgent } from './setupVeramo';
import { ConfigService } from '@nestjs/config';
import { ICreateVerifiableCredentialArgs,W3CVerifiableCredential, IIdentifier } from '@veramo/core';
import { v4 as uuidv4 } from 'uuid'; 
import { capitalize } from 'lodash';
import { MyCredential } from './my-credential.entity';
import * as QRCode from 'qrcode';
import dbConnection from '../db.connection.js';

@Injectable()
export class VCService {
    private readonly logger = new Logger(VCService.name);
    private readonly baseUrl: string;
    private agent;

    constructor(private configService: ConfigService) {
        this.agent = setupVeramoAgent(configService);
        this.baseUrl = this.configService.get<string>('BASE_URL')!;
    }

    async createCredentialAndGetToken(email: string, organization: string): Promise<MyCredential> {
      let credential = new MyCredential();
      try{
        // Create a new token
        credential.token = uuidv4();  // Generates a unique token
        credential.used = false;
        credential.email = email;
        credential.organization = organization;
        credential.credentialId = uuidv4();
        const myCredential = (await dbConnection).getRepository(MyCredential);
        await myCredential.save(credential);
        return credential;
      } catch(error) {
        console.error('Error generating Credential:', error);
        throw new Error('Failed to create credential');
      }
    }

    async generateQR(credential: MyCredential) {
        const protocol = "openid-credential-offer://";
        const credentialOfferUri = `${this.baseUrl}/offer-credential/ZKAccess?token=${credential.token}`;
        const query = new URLSearchParams({
            credential_offer_uri: credentialOfferUri,
        });
        const url = `${protocol}?${query.toString()}`;
        this.logger.log(url);
        const qrCodeDataURL = await QRCode.toDataURL(url);
        return qrCodeDataURL.split(',')[1];
    }

    /**
     * Emits a Verifiable Credential
     * @returns {Promise<string>} The DID of the credential
     */
    async emitCredential(token: string) {
        const myCredential = (await dbConnection).getRepository(MyCredential);
        const credential = await myCredential.findOne({
          where: { token },
        });
        
        const identifier = await this.getOrCreateDidManager(this.agent);

        const credentialArgs: ICreateVerifiableCredentialArgs = {
            credential: {
                "@context": [
                    "https://www.w3.org/2018/credentials/v1",
                    {
                    organization: "schema:organization",
                    email: "schema:email",
                    schema: "https://schema.org/",
                    type: "@type",
                    }
                ],
                type: ['VerifiableCredential', 'ZKAccess'],
                issuer: {id: identifier.did},
                issuanceDate: new Date().toISOString(),
                credentialSubject: {
                    id: `urn:uuid:${credential?.token}`,
                    organization: credential?.organization,
                    email: credential?.email
                }
            },
            save: true,
            proofFormat: 'jwt'
        }

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

    getDomainFromEmail(email: string): string {
      if (!email.includes('@')) throw new UnauthorizedException('Invalid email address');
    
      const domainPart = email.split('@')[1];
      const domain = domainPart.split('.')[0];
      
      return capitalize(domain);
    }

    async verifyToken(token: string): Promise<boolean> {
      try{
        const myCredential = (await dbConnection).getRepository(MyCredential);
        const credential = await myCredential.findOneBy({ token });
        return !!credential && !credential?.used;
      } catch(error) {
        throw new Error('Failed to create and save token');
      }
    }


    /**
     * Verifies a Verifiable Credential
     * @param {W3CVerifiableCredential} credential - The credential to verify
     * @returns {Promise<boolean>} True if the credential is valid, false otherwise
     */
    async verifyCredential(credential: W3CVerifiableCredential) {
        const result = await this.agent.verifyCredential({
            credential: credential,
            proofFormat: 'jwt'
        })

        if(!result.verified) throw new UnauthorizedException('Invalid credential' + result.error);

        return result.verified;
    }
}