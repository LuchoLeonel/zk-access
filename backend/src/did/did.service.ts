import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { setupVeramoAgent } from './setupVeramo';
import { ConfigService } from '@nestjs/config';
import { ICreateVerifiableCredentialArgs,W3CVerifiableCredential } from '@veramo/core';

@Injectable()
export class DidService {
    private agent;

    constructor(private configService: ConfigService) {
        this.agent = setupVeramoAgent(configService);
    }

    /**
     * Emits a Verifiable Credential
     * @returns {Promise<string>} The DID of the credential
     */
    async emitCredential(userEmail: string) {
        const identifier = await this.agent.didManagerGetByAlias({ alias: 'default' })

        const credentialArgs: ICreateVerifiableCredentialArgs = {
            credential: {
                type: ['VerifiableCredential', 'EmployeeCredential'],
                issuer: {id: identifier.did},
                issuanceDate: new Date().toISOString(),
                credentialSubject: {
                    id: 'did:web:example.com',
                    name: 'Example Organization',
                    employeeOf: true,
                    email: userEmail
                }
            },
            proofFormat: 'jwt'
        }

        const did = await this.agent.createVerifiableCredential(credentialArgs)

        Logger.log(`DID created: ${did}`)
        
        return did;
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
