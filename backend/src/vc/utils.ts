import * as circomlib from 'circomlibjs';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { stringToUtf8Bytes } from '@veramo/utils'; // Util para encoding
import { hexlify } from 'ethers'; // Para convertir Buffer a hex

ed.etc.sha512Sync = sha512;

const FIELD_MODULUS = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");


export const poseidonHash = async (key: string, value: any) => {
    if (!key || value === undefined || value === null) {
      throw new Error("poseidonHash recibió un key o value vacío");
    }
  
    const poseidon = await circomlib.buildPoseidon();
  
    const keyBigInt = BigInt('0x' + Buffer.from(key).toString('hex'));
  
    let valueBigInt: bigint;
    if (typeof value === 'number' || typeof value === 'bigint') {
        valueBigInt = BigInt(value);
    } else if (typeof value === 'string') {
        try {
            valueBigInt = BigInt(value);
        } catch {
            valueBigInt = BigInt('0x' + Buffer.from(value).toString('hex'));
        }
    } else {
        throw new Error('Tipo de value no soportado');
    }
  
    console.log({ key, keyBigInt });
    console.log({ value, valueBigInt });

    if (BigInt(keyBigInt) >= FIELD_MODULUS || BigInt(valueBigInt) >= FIELD_MODULUS) {
        throw new Error('fields have a wrong len');
    }
    const keyHash = poseidon([keyBigInt]);
    const valueHash = poseidon([valueBigInt]);

    const hash = poseidon([keyHash, valueHash]);
    return hash;
};

export const convertHashToString = async (hash) => {
    const poseidon = await circomlib.buildPoseidon();
    return poseidon.F.toObject(hash).toString();
}
export const signWithEddsaBabyJub = async (poseidonHash: any, privateKeyHex: string) => {
    const eddsa = await circomlib.buildEddsa();
    const babyJub = await circomlib.buildBabyjub();

    // Validar privateKeyHex
    if (!/^[0-9a-fA-F]{64}$/.test(privateKeyHex)) {
        throw new Error('privateKeyHex debe ser un string hexadecimal de 64 caracteres');
    }
    const privateKey = Buffer.from(privateKeyHex, 'hex'); // Uint8Array de 32 bytes

    // Firmar el hash con eddsa.signPoseidon
    const signature = eddsa.signPoseidon(privateKey, poseidonHash);

    const R8x = babyJub.F.toObject(signature.R8[0]).toString();
    const R8y = babyJub.F.toObject(signature.R8[1]).toString();
    const S = signature.S.toString();

    if (BigInt(R8x) >= FIELD_MODULUS || BigInt(R8y) >= FIELD_MODULUS || BigInt(S) >= FIELD_MODULUS) {
        throw new Error('signature has a wrong len');
    }

    return {
        R8x,
        R8y,
        S,
    }; 
};


export const getPublicKeyBabyJub = async (privateKeyBabyJub: string) => {
    const eddsa = await circomlib.buildEddsa();
    const babyJub = await circomlib.buildBabyjub();

    const privateKeyBuff = Buffer.from(privateKeyBabyJub, 'hex');
    const publicKey = eddsa.prv2pub(privateKeyBuff);

    const signerX = babyJub.F.toObject(publicKey[0]);
    const signerY = babyJub.F.toObject(publicKey[1]);
  
    if (signerX >= FIELD_MODULUS || signerY >= FIELD_MODULUS) {
        throw new Error('signer has a wrong len');
    }
  
    const signerXHex = signerX.toString(16).padStart(64, '0');
    const signerYHex = signerY.toString(16).padStart(64, '0');
    const signer_hex = signerXHex + signerYHex;

    return {
        signer_x: signerX.toString(),
        signer_y: signerY.toString(),
        signer_hex,
    };
};
  
  
export const createPrivateKey = async (hi) => {
    const babyJub = await circomlib.buildBabyjub();
    const privateKey = babyJub.F.random(); // BigInt

    const hexKey = Array.from(privateKey)
        .map((byte: any) => byte.toString(16).padStart(2, '0'))
        .join('');

    console.log(`PRIVATE_KEY_HEX=${hexKey}`);
    return hexKey;
};


export const signDelegationWithVeramo = async (
    agent: any,
    signerPubKeyHex: string        // clave pública del signer en hex
): Promise<string> => {
    const dataToSign = stringToUtf8Bytes(signerPubKeyHex); // convierte a Uint8Array
    const identifier = await agent.didManagerGetByAlias({ alias: 'default' });
    const keyRef = identifier.keys[0].kid;

    const result = await agent.keyManagerSign({
        data: dataToSign,
        encoding: 'hex',
        keyRef,
    });

    return result as string; // retorna la firma en hex
};
