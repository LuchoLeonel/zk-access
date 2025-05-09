'use client';

import { useEffect, useState } from 'react';
import { useProofStore } from '@/hooks/useProofStore';
import { useRouter } from 'next/navigation';
    

export default function ClaimCredentialPage() {
  const { ZKCredential, setZKCredential } = useProofStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ZKCredential) {
      fetch('/mockCredential.json')
        .then((res) => res.json())
        .then((data) => {
          setZKCredential(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error loading mock credential:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [ZKCredential, setZKCredential]);

  const handleClick = () => {
    router.push('/proof-composer');
  };


  if (loading) return <p className="text-center p-6">Loading credential...</p>;

  return (
    <div className="min-h-[calc(100vh-8.5rem)] bg-blue-50 flex justify-center p-6 pt-12">
      <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-6 w-full max-w-screen-lg text-left">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-6">
            <div className="text-3xl font-bold">Your</div>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative max-w-[260px] max-h-[160px] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/background.png"
                  alt="Credencial"
                  className="rounded-xl w-full h-auto object-cover"
                />
                <div className="absolute top-2 left-2 h-7 m-1 shadow-sm">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="h-full w-auto object-contain"
                  />
                </div>
                <h1 className="absolute top-4 left-1/2 transform -translate-x-[30%] text-white text-xl font-semibold tracking-wide">
                  ZK-Access
                </h1>
              </div>
  
              <button
                onClick={handleClick}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg text-md transition duration-300 transform hover:scale-105 shadow-md"
              >
                Go to Proof Composer
              </button>
            </div>
          </div>
        </div>
  
        {ZKCredential ? (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto text-sm text-gray-800 font-mono leading-relaxed shadow-sm">
            <pre>{JSON.stringify(ZKCredential, null, 2)}</pre>
          </div>
        ) : (
          <p className="text-gray-500 text-sm mt-6">Loading credential...</p>
        )}
      </div>
    </div>
  );
  
  
}
