'use client';

import { useProofStore } from '@/hooks/useProofStore';
import { useEffect, useState } from 'react';

interface Rule {
  key: string;
  operation: '=' | '>' | '<';
  value: string;
}

const operationOptions = ['=', '>', '<'] as const;

export default function VerifierPage() {
  const { ZKCredential, setZKCredential } = useProofStore();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<Rule[]>([]);
  const [keysAvailable, setKeysAvailable] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  const simulateProofGeneration = async () => {
    setStatusMessage('Generating ZK-Proof to verify that all conditions are met...');
    
    await new Promise((resolve) => setTimeout(resolve, 3000)); // delay simulado
    
    const subject = ZKCredential?.credentialSubject || {};
    const subjectData = ZKCredential?.circuitInputs?.credentialSubject || {};
  
    const allValid = rules.every((rule) => {
      const fieldPath = rule.key.replace(/^credentialSubject\./, '').replace(/\[(\d+)\]/g, '.$1').split('.');
      const valueInVC = fieldPath.reduce((obj, key) => obj?.[key], subject);
  
      if (!valueInVC) return false;
      if (rule.operation === '=') {
        return String(valueInVC) === rule.value;
      } else if (rule.operation === '>') {
        return Number(valueInVC) > Number(rule.value);
      } else if (rule.operation === '<') {
        return Number(valueInVC) < Number(rule.value);
      }
      return false;
    });
  
    if (allValid) {
      setStatusMessage('success');
    } else {
      setStatusMessage('fail');
    }
  };
  


  if (loading) return <p>Loading credential...</p>;

  return (
    <div className="min-h-[calc(100vh-8.5rem)] bg-blue-50 flex justify-center p-6 pt-12">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl w-full">
      <h1 className="text-2xl font-bold mb-4 text-center">Proof Composer (simulated for now)</h1>
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
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              >
                {keysAvailable.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>

              <select
                value={rule.operation}
                onChange={(e) => handleRuleChange(i, { operation: e.target.value as Rule['operation'] })}
                className="w-16 border border-gray-300 rounded-md px-2 py-2"
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
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={addRule}
            className="text-blue-600 hover:underline text-sm"
            disabled={rules.length >= 10}
          >
            + Add condition
          </button>

          <button
            onClick={simulateProofGeneration}
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-lg text-md transition duration-300 transform hover:scale-105 shadow-md"
          >
            Generate proof (mock)
          </button>
        </div>
        <div className='h-12 mb-4'>
        {statusMessage && (
            <div className="mt-6 text-center">
                {statusMessage === "success" ? (
                <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg shadow-sm">
                    <p className="font-semibold">🎉 Proof created successfully!</p>
                    <p className="text-sm mt-1">
                    You can now share it securely via QR code or other channels. Your secrets are safe. 🕵️‍♂️
                    </p>
                </div>
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