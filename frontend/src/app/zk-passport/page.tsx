'use client';

import { useEffect, useRef, useState } from 'react';
import { ZKPassport } from '@zkpassport/sdk';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { useProofStore } from '@/hooks/useProofStore';

const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;
const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function ZKPassportPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dots, setDots] = useState('');

  const zkpassportRef = useRef<ZKPassport | null>(null);
  const proofRef = useRef<any | null>(null);

  const { proof: zkEmailProof, setQrCode } = useProofStore();
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 300);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    if (zkEmailProof === undefined) return;
    if (!zkEmailProof) {
      router.replace('/');
    }
  }, [zkEmailProof]);

  useEffect(() => {
    const runZkPassport = async () => {
      setLoading(true);

      try {
        if (!zkpassportRef.current) {
          zkpassportRef.current = new ZKPassport();
        }

        const queryBuilder = await zkpassportRef.current.request({
          name: 'ZK-Access Demo',
          logo: `${NEXT_PUBLIC_BASE_URL}/logo-black.png`,
          purpose: 'Verify your identity using ZKPassport',
          scope: 'identity-verification',
          devMode: true,
        });

        const {
          url,
          requestId,
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

        setUrl(url);
        setRequestId(requestId);
        setLoading(false); // listo para mostrar QR

        onRequestReceived(() => console.log('📩 Request received by user'));
        onGeneratingProof(() => {
          console.log('🔄 Generating proof...');
          setLoading(true);
        });

        onProofGenerated((proof) => {
          console.log('✅ Proof generated');
          proofRef.current = proof;
        });

        onResult(async ({ verified, result }) => {
          console.log('🎯 Result received:', result);

          if (!verified || !proofRef.current) {
            console.error('❌ Proof verification failed or proof missing');
            setLoading(false);
            return;
          }

          try {
            const passportData = {
              firstname: result.firstname?.disclose?.result ?? '',
              lastname: result.lastname?.disclose?.result ?? '',
              birthdate: result.birthdate?.disclose?.result ?? '',
              nationality: result.nationality?.disclose?.result ?? '',
              documentType: result.document_type?.disclose?.result ?? '',
              documentNumber: result.document_number?.disclose?.result ?? '',
            };

            const res = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/zk/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                zkEmailProof,
                zkPassportProof: passportData,
              }),
            });

            if (!res.ok) throw new Error('Failed to generate QR');

            const { qrCode } = await res.json();
            console.log('🎫 QR Code generado:', qrCode);

            setQrCode(qrCode);
            router.push('/claim-credential');
          } catch (err) {
            console.error('❌ Error al enviar datos al backend:', err);
            setLoading(false);
          }
        });

        onReject(() => {
          console.warn('❌ User rejected the request');
          setLoading(false);
        });

        onError((err) => {
          console.error('💥 Error:', err);
          setLoading(false);
        });
      } catch (e) {
        console.error('💥 Init error:', e);
        setLoading(false);
      }
    };

    runZkPassport();
  }, [zkEmailProof, router]);

  return (
    <main className="p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">ZK-Passport Verification</h1>
      <p className="text-center text-gray-700 max-w-xl mb-8">
        To create your Verifiable Credential, we now need to verify some personal data from your ZKPassport.
        This process uses <strong>Zero-Knowledge Proofs</strong>, which means your sensitive information stays private —
        only the necessary facts are proven, never exposed.
      </p>

      {loading ? (
        <p className="text-blue-600 font-semibold">
        ⏳ Processing proof. Please wait{dots}
          {Array(3 - dots.length).fill('.').map((d, i) => (
            <span key={i} className="invisible">{d}</span>
          ))}
        </p>
      ) : url ? (
        <QRCode value={url} size={256} />
      ) : (
        <p className="text-gray-500">Loading request...</p>
      )}
    </main>
  );
}
