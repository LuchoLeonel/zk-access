export interface Rule {
  key: string;
  operation: '=' | '>' | '<';
  value: string;
}


const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;


export async function generateZKProof(credential: any, rules: Rule[]) {
  try {
    const values: bigint[] = [];
    const keys: bigint[] = [];
    const hashes: bigint[] = [];
    const compared_values: bigint[] = [];
    const operations: number[] = [];
    const signature_R8xs: bigint[] = [];
    const signature_R8ys: bigint[] = [];
    const signature_Ss: bigint[] = [];

    for (const rule of rules) {
      const fieldPath = rule.key.replace(/\[(\d+)\]/g, '.$1').split('.');

      const valueFromVC = fieldPath.reduce((obj, k) => obj?.[k], credential?.credentialSubject);
      if (valueFromVC === undefined) throw new Error(`Missing value in credentialSubject for ${rule.key}`);

      const signedEntry = fieldPath.reduce((obj, k) => obj?.[k], credential?.circuitInputs?.credentialSubject);
      if (!signedEntry?.hash || !signedEntry?.signature) throw new Error(`Missing signature/hash for ${rule.key}`);

      let valueBigInt: bigint;
      try {
        valueBigInt = BigInt(valueFromVC);
      } catch {
        valueBigInt = transformToBigInt(valueFromVC)
      }
      let expectedBigInt: bigint;
      try {
        expectedBigInt = BigInt(rule.value);
      } catch {
        expectedBigInt = transformToBigInt(rule.value);
      }

      values.push(valueBigInt);
      compared_values.push(expectedBigInt);
      keys.push(transformToBigInt(rule.key));
      operations.push(rule.operation === '=' ? 0 : rule.operation === '>' ? 1 : 2);
      hashes.push(BigInt(signedEntry.hash));
      signature_R8xs.push(BigInt(signedEntry.signature.R8x));
      signature_R8ys.push(BigInt(signedEntry.signature.R8y));
      signature_Ss.push(BigInt(signedEntry.signature.S));
    }

    while (values.length < 10) {
      values.push(BigInt(0));
      keys.push(BigInt(0));
      compared_values.push(BigInt(0));
      operations.push(0);
      hashes.push(BigInt(0));
      signature_R8xs.push(BigInt(0));
      signature_R8ys.push(BigInt(0));
      signature_Ss.push(BigInt(0));
    }

    const signer_x = BigInt(credential.circuitInputs.delegation.signer_x);
    const signer_y = BigInt(credential.circuitInputs.delegation.signer_y);

    const input = {
      values: values.map(v => v.toString()),
      keys: keys.map(k => k.toString()),
      compared_values: compared_values.map(v => v.toString()),
      operations,
      hashes: hashes.map(h => h.toString()),
      signature_R8xs: signature_R8xs.map(x => x.toString()),
      signature_R8ys: signature_R8ys.map(y => y.toString()),
      signature_Ss: signature_Ss.map(s => s.toString()),
      signer_x: signer_x.toString(),
      signer_y: signer_y.toString(),
    };
    
    const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/zk/generate-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }
    
    const { proof } = await response.json();
    return proof;
  } catch (err) {
    console.error('[generateZKProof] Failed:', err);
    throw err;
  }
}

function transformToBigInt(key: string): bigint {
  return BigInt('0x' + Buffer.from(key).toString('hex'));
}