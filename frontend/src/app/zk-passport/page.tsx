'use client';

import { useEffect, useRef, useState } from 'react';
import { ZKPassport } from '@zkpassport/sdk';
import QRCode from 'react-qr-code';

const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function ZKPassportPage() {
  const [url, setUrl] = useState<string | null>(null);
  const zkpassportRef = useRef<ZKPassport | null>(null);

  useEffect(() => {
    const runZkPassport = async () => {
      if (!zkpassportRef.current) {
        zkpassportRef.current = new ZKPassport();
      }

      const queryBuilder = await zkpassportRef.current.request({
        name: 'ZK-Access Demo',
        logo: `${NEXT_PUBLIC_BASE_URL}/logo-black.png`,
        purpose: 'Verify your identity using ZKPassport',
        scope: 'identity-verification',
      });

      const {
        url,
        onRequestReceived,
        onGeneratingProof,
        onProofGenerated,
        onResult,
        onReject,
        onError,
      } = queryBuilder
        .disclose('firstname')
        .disclose('lastname')
        .disclose('birthdate')
        .disclose('nationality')
        .disclose('document_type')
        .disclose('document_number')
        .gte('age', 18)
        .done();

      console.log('🔗 URL para QR:', url);
      setUrl(url);

      onRequestReceived(() => console.log('📩 Request received by user'));
      onGeneratingProof(() => console.log('🔄 Generating proof...'));
      onProofGenerated(({ proof, vkeyHash, version, name }) =>
        console.log('✅ Proof generated:', { name, proof, vkeyHash, version })
      );
      onResult(({ uniqueIdentifier, verified, result }) => {
        console.log('🎯 Result received!');
        console.log('Firstname:', result.firstname?.disclose?.result);
        console.log('Lastname:', result.lastname?.disclose?.result);
        console.log('Birthdate:', result.birthdate?.disclose?.result);
        console.log('Nationality:', result.nationality?.disclose?.result);
        console.log('ID Type:', result.document_type?.disclose?.result);
        console.log('ID Number:', result.document_number?.disclose?.result);
        console.log('Age ≥ 18:', result.age?.gte?.result);
        console.log('Verified:', verified);
        console.log('Unique Identifier:', uniqueIdentifier);
      });
      onReject(() => console.warn('❌ User rejected the request'));
      onError((err) => console.error('💥 Error:', err));
    };

    runZkPassport();
  }, []);

  return (
    <main className="p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Verificación con ZKPassport</h1>

      {url ? (
        <>  
          <QRCode value={url} size={256} />
        </>
      ) : (
        <p>Cargando solicitud...</p>
      )}
    </main>
  );
}
