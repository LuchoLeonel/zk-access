'use client';

import { useProofStore } from '@/hooks/useProofStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClaimCredentialPage() {
  const { qrCode } = useProofStore();
  const router = useRouter();

  useEffect(() => {
    if (!qrCode) {
      router.replace('/');
    }
  }, [qrCode]);

  return (
    <main className="min-h-[calc(100vh-8.5rem)] bg-blue-50 flex items-center justify-center px-6">
      <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-8 max-w-md w-full text-center">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">🎫 Claim Your Work ID</h1>
      <p className="text-gray-700 mb-6 text-sm leading-relaxed">
        This Work ID is a <strong>Verifiable Credential</strong> that proves your role and organization using <strong>Zero-Knowledge Proofs</strong>. 
        Scan the QR with the <strong>ZK-Access Wallet</strong> to claim it securely.
      </p>

        {qrCode ? (
          <img
            src={`data:image/png;base64,${qrCode}`}
            alt="QR Code"
            className="w-64 h-64 mx-auto border border-gray-300 rounded"
          />
        ) : (
          <div className="text-blue-600 text-sm font-medium tracking-wide">
            Generating QR code<span className="inline-block w-3 animate-[pulse_1.2s_ease-in-out_infinite]">.</span>
            <span className="inline-block w-3 animate-[pulse_1.2s_ease-in-out_0.2s_infinite]">.</span>
            <span className="inline-block w-3 animate-[pulse_1.2s_ease-in-out_0.4s_infinite]">.</span>
          </div>
        )}
      </div>
    </main>
  );
}
