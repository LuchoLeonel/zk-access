'use client';

import { useProofStore } from '@/hooks/useProofStore';
import { useEffect, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { generateZKProof, Rule } from './generate-proof';


const operationOptions = ['=', '>', '<'] as const;

export default function VerifierPage() {
  const { ZKCredential, setZKCredential } = useProofStore();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<Rule[]>([]);
  const [keysAvailable, setKeysAvailable] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [zkProof, setZkProof] = useState<any | null>(null);
  const [showProof, setShowProof] = useState(false);  
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid' | 'error'>('idle');


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

  useEffect(() => {
    if (!ZKCredential) return;
  
    const keys: string[] = [];
    const subject = ZKCredential.circuitInputs?.credentialSubject;
  
    if (subject) {
      for (const [k, v] of Object.entries(subject)) {
        if (typeof v === 'object' && 'hash' in v!) {
          keys.push(`${k}`); // removido 'credentialSubject.'
        } else if (typeof v === 'object') {
          for (const [subIndex, subObj] of Object.entries(v!)) {
            for (const [field, entry] of Object.entries(subObj as any)) {
              if (entry && typeof entry === 'object' && 'hash' in entry) {
                keys.push(`${k}[${subIndex}].${field}`); // removido 'credentialSubject.'
              }
            }
          }
        }
      }
    }
  
    setKeysAvailable(keys);
    setRules([{ key: keys[0], operation: '=', value: '' }]);
  }, [ZKCredential]);
  

  const handleRuleChange = (index: number, updated: Partial<Rule>) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updated };
    setRules(newRules);
  };

  const addRule = () => {
    if (rules.length < 10 && keysAvailable.length > 0) {
      setRules([...rules, { key: keysAvailable[0], operation: '=', value: '' }]);
    }
  };

  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
  };

  const handleGenerateRealProof = async () => {
    setStatusMessage('Generating ZK-Proof...');
    setShowProof(false);

    try {
      const proof = await generateZKProof(ZKCredential, rules);
      setZkProof(proof);
      setStatusMessage('success');
      console.log('ZK Proof:', proof);
    } catch (err) {
      console.error('Error generating ZK proof:', err);
      setStatusMessage('fail');
    }
  };

  const handleVerifyProof = async () => {
    if (!zkProof) return;
  
    setVerifyStatus('verifying');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/zk/verify-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof: zkProof }),
      });
  
      const result = await response.json();
      if (result.isValid) {
        setVerifyStatus('valid');
      } else {
        setVerifyStatus('invalid');
      }
    } catch (err) {
      console.error('Error verifying proof:', err);
      setVerifyStatus('error');
    }
  };
  
  
  
  if (loading) return <p>Loading credential...</p>;

  return (
    <div className="min-h-[calc(100vh-8.5rem)] bg-blue-50 flex justify-center p-6 pt-12 overflow-y-auto">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl w-full overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Proof Composer</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          In the real setup, your credential stays safe on your phone. From there, you can craft a <strong>zero-knowledge proof</strong> — fully tailored to a verifier and shared privately, like through a QR code.
          <br />
          <br />
          You choose what gets revealed.&nbsp;<strong>Modular. Private. Composable.</strong>&nbsp;That’s the magic of zk. 😎
        </p>


        <div className="flex flex-col gap-4">
        {rules.map((rule, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select
              value={rule.key}
              onChange={(e) => handleRuleChange(i, { key: e.target.value })}
              disabled={!!zkProof}
              className={`flex-1 rounded-md px-3 py-2 border ${
                zkProof
                  ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                  : 'border-gray-300'
              }`}
            >
              {keysAvailable.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>

            <select
              value={rule.operation}
              onChange={(e) => handleRuleChange(i, { operation: e.target.value as Rule['operation'] })}
              disabled={!!zkProof}
              className={`w-16 rounded-md px-2 py-2 border ${
                zkProof
                  ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                  : 'border-gray-300'
              }`}
            >
              {operationOptions.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            <input
              type="text"
              value={rule.value}
              onChange={(e) => handleRuleChange(i, { value: e.target.value })}
              placeholder="Value"
              disabled={!!zkProof}
              className={`flex-1 rounded-md px-3 py-2 border ${
                zkProof
                  ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                  : 'border-gray-300'
              }`}
            />

            <button
              onClick={() => removeRule(i)}
              disabled={!!zkProof}
              className={`text-sm px-2 py-1 rounded-md transition ${
                zkProof
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-red-500 hover:underline'
              }`}
              title="Delete condition"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={addRule}
            disabled={rules.length >= 10 || !!zkProof}
            className={`text-sm px-3 py-1 rounded-md transition 
              ${rules.length >= 10 || !!zkProof
                ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                : 'text-blue-600 hover:underline'}`}
          >
          
            + Add condition
          </button>

          <button
            onClick={handleGenerateRealProof}
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-lg text-md transition duration-300 transform hover:scale-105 shadow-md"
          >
            Generate proof
          </button>
        </div>
        <div className='h-12 mb-4'>
          {statusMessage && (
            <div className="mt-6 text-center">
              {statusMessage === "success" ? (
                <>
                  <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg shadow-sm">
                    <p className="font-semibold">🎉 Proof created successfully!</p>
                    <p className="text-sm mt-1">
                      You can now share it securely via QR code or other channels. Your secrets are safe. 🕵️‍♂️
                    </p>
                  </div>

                  {zkProof && (
                    <div className="mt-4 pb-4">
                      <div className="mt-4 flex justify-center flex-wrap gap-4 items-start">
                        <button
                          onClick={() => setShowProof(prev => !prev)}
                          className={`text-white font-semibold px-4 py-2 rounded-lg transition duration-300 ${
                            showProof
                              ? 'bg-gray-600 hover:bg-gray-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {showProof ? 'Hide Proof' : 'Show Proof'}
                        </button>

                        <button
                          onClick={handleVerifyProof}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition duration-300"
                        >
                          Verify Proof
                        </button>

                        <button
                          onClick={() => {
                            setZkProof(null);
                            setStatusMessage(null);
                            setVerifyStatus('idle');
                          }}
                          disabled={verifyStatus === "verifying"}
                          className={`text-white font-semibold px-4 py-2 rounded-lg transition duration-300 ${
                            verifyStatus === "verifying"
                              ? 'bg-gray-600 hover:bg-gray-700'
                              : 'bg-red-500 hover:bg-red-600'
                          }`}
                        >
                          Restart
                        </button>
                        
                      </div>
                      <div className="mt-4 text-center h-8">
                        {verifyStatus !== 'idle' && (
                          <>
                            {verifyStatus === 'verifying' && (
                              <p className="text-blue-600 font-medium animate-pulse">🔍 Verifying proof...</p>
                            )}
                            {verifyStatus === 'valid' && (
                              <p className="text-green-700 font-semibold">✅ Proof is valid! The verifier is convinced.</p>
                            )}
                            {verifyStatus === 'invalid' && (
                              <p className="text-red-600 font-semibold">❌ Invalid proof. Something doesn’t add up.</p>
                            )}
                            {verifyStatus === 'error' && (
                              <p className="text-red-500 font-medium">⚠️ There was an error while verifying the proof.</p>
                            )}
                          </>
                        )}
                      </div>

                      {showProof && (
                        <div className="mt-1 bg-gray-100 p-4 rounded overflow-x-auto text-sm text-gray-800 border border-gray-300 break-all">
                          {JSON.stringify(zkProof)}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : statusMessage === "fail" ? (
                <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg shadow-sm">
                  <p className="font-semibold">⚠️ Proof failed to generate</p>
                  <p className="text-sm mt-1">
                    The data didn’t match the conditions. That’s Noir telling you: "those constraints ain’t tight enough, boss." 😅
                  </p>
                </div>
              ) : (
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md shadow-sm text-sm italic animate-pulse">
                  {statusMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}