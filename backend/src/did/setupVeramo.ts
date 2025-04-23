// Core interfaces
import {
    createAgent,
    IDIDManager,
    IResolver,
    IDataStore,
    IDataStoreORM,
    IKeyManager,
    ICredentialPlugin,
} from '@veramo/core'

// Core identity manager plugin
import { DIDManager } from '@veramo/did-manager'

// Ethr did identity provider
import { EthrDIDProvider } from '@veramo/did-provider-ethr'

// Core key manager plugin
import { KeyManager } from '@veramo/key-manager'

// Custom key management system for RN
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'

// W3C Verifiable Credential plugin
import { CredentialPlugin } from '@veramo/credential-w3c'

// Custom resolvers
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
import { getResolver as webDidResolver } from 'web-did-resolver'

// Storage plugin using TypeOrm
import { Entities, KeyStore, DIDStore, PrivateKeyStore, migrations } from '@veramo/data-store'
import dbConnection from 'src/db.connection'

import { Provider } from 'ethers'
import { ConfigService } from '@nestjs/config'

// Create a factory function that takes ConfigService
export const setupVeramoAgent = (configService: ConfigService) => {
    // Get values from config service
    const RPC_URL = configService.get<string>('RPC_URL')
    const KMS_SECRET_KEY = configService.get<string>('KMS_SECRET_KEY')

    if(!KMS_SECRET_KEY) {
        throw new Error("KMS_SECRET_KEY is not set")
    }

    return createAgent<IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver & ICredentialPlugin>({
        plugins: [
            new KeyManager({
                store: new KeyStore(dbConnection),
                kms: {
                    local: new KeyManagementSystem(new PrivateKeyStore(dbConnection, new SecretBox(KMS_SECRET_KEY))),
                },
            }),
            new DIDManager({
                store: new DIDStore(dbConnection),
                defaultProvider: 'did:ethr:sepola',
                providers: {},
            }),
            new DIDResolverPlugin({
                resolver: new Resolver({
                    ...webDidResolver(),
                }),
            }),
            new CredentialPlugin(),
        ],
    })
}