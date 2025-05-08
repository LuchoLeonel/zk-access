"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import zkEmailSdk, { testBlueprint } from "@zk-email/sdk";
import { useProofStore } from "@/hooks/useProofStore";
import pLimit from "p-limit";
import { isEmpty } from "lodash";

const EmailTable = ({ emails, handleEmailProof }: any) => {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedEmails((prev) =>
      prev.includes(id)
        ? prev.filter((emailId) => emailId !== id)
        : [...prev, id]
    );
  };

  const handleNext = () => {
    const selected = emails.filter((email: any) => selectedEmails.includes(email.id));
    handleEmailProof(selected);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-700 text-sm">
              <th className="p-4 border-b font-semibold">Select</th>
              <th className="p-4 border-b font-semibold">Validity</th>
              <th className="p-4 border-b font-semibold">Sent on</th>
              <th className="p-4 border-b font-semibold">Subject</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email: any, idx: number) => (
              <tr
                key={email.id}
                className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    className="accent-blue-600 w-5 h-5 rounded border-gray-300"
                    disabled={!email.valid}
                    checked={selectedEmails.includes(email.id)}
                    onChange={() => toggleSelection(email.id)}
                  />
                </td>
                <td className="p-4">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      email.valid
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                    }`}
                  >
                    {email.valid ? 'Valid' : 'Invalid'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="block font-semibold text-gray-800">
                    {email.sentAt.toLocaleDateString()}
                  </span>
                  <span className="block text-xs text-gray-400">
                    {email.sentAt.toLocaleTimeString()}
                  </span>
                </td>
                <td className="p-4 font-mono text-gray-900">{email.subject}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={selectedEmails.length === 0}
          className={`px-6 py-2 rounded-lg font-semibold text-white transition-all ${
            selectedEmails.length > 0
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default function InboxPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const router = useRouter();
  const { proofs, setProofs } = useProofStore();
  const [dotCount, setDotCount] = useState(0);
  const [emails, setEmails] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "generating" | "error">("loading");

  useEffect(() => {
    if (status !== "loading") return;
    const interval = setInterval(() => setDotCount((prev) => (prev + 1) % 4), 300);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const isDemo = searchParams.get("demo") === "true";
  
    const fetchAndVerifyEmails = async () => {
      setStatus("loading");
      try {
        const sdk = zkEmailSdk();
  
        if (isDemo) {
          
          // MOCKED DEMO FLOW
          const demoFiles = ["email-1.eml", "email-2.eml", "email-3.eml"];
          const fetched = await Promise.all(
            demoFiles.map(async (filename, index) => {
              const res = await fetch(`/eml/${filename}`);
              const emlContent = await res.text();
              const subjectMatch = emlContent.match(/^Subject: (.+)$/m);
              const dateMatch = emlContent.match(/^Date: (.+)$/m);
              return {
                id: `demo-${index}`,
                subject: subjectMatch?.[1] ?? "(No subject)",
                sentAt: dateMatch ? new Date(dateMatch[1]) : new Date(),
                valid: true,
                emlContent,
              };
            })
          );
          setEmails(fetched);
          setStatus("idle");
          return;
        }
  
        if (!code) return;
        const tokenRes = await fetch("/api/exchange-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!tokenRes.ok) throw new Error("Token exchange failed");
        const { access_token } = await tokenRes.json();
  
        const listRes = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=subject:Welcome aboard!!",
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
        const { messages } = await listRes.json();
        if (!messages || messages.length === 0) {
          setEmails([]);
          setStatus("idle");
          return;
        }
  
        const limit = pLimit(4);
        const fetched = await Promise.all(
          messages.map((msg: any) =>
            limit(async () => {
              const emlRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=raw`,
                { headers: { Authorization: `Bearer ${access_token}` } }
              );
              const { raw } = await emlRes.json();
              const emlContent = Buffer.from(raw, "base64").toString("utf-8");
              const subjectMatch = emlContent.match(/^Subject: (.+)$/m);
              const dateMatch = emlContent.match(/^Date: (.+)$/m);
              return {
                id: msg.id,
                subject: subjectMatch?.[1] ?? "(No subject)",
                sentAt: dateMatch ? new Date(dateMatch[1]) : new Date(),
                valid: true,
                emlContent,
              };
            })
          )
        );
        setEmails(fetched);
        setStatus("idle");
      } catch (err) {
        console.error("Error:", err);
        setStatus("error");
      }
    };
  
    fetchAndVerifyEmails();
  }, [code, searchParams]);
  

  const handleEmailProof = async (emails: any[]) => {
    try {
      setStatus("generating");
      router.prefetch("/zk-passport");
      const sdk = zkEmailSdk();
      const blueprint = await sdk.getBlueprint("LuchoLeonel/ZkAccess@v8");
      const prover = blueprint.createProver();
  
      const tempProofs = [];
      for (const email of emails) {
        const proof = await prover.generateProof(email.emlContent);
        tempProofs.push(proof);
      }
  
      setProofs(tempProofs);
    } catch (err) {
      console.error("Error al generar pruebas:", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (!isEmpty(proofs)) {
      router.push("/zk-passport");
    }
  }, [proofs]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8 text-blue-700 flex items-center gap-2">
        <span role="img" aria-label="mail">📬</span> Welcome Emails
      </h1>

      <p className="mb-6 text-gray-700 text-base leading-relaxed">
        Select an email with a subject line that matches the <strong>Offer Acquisition</strong> format.  
  
        It should begin with <code className="bg-gray-100 px-1 rounded text-sm">Offer Acquisition.</code> followed by structured data like:  
        <br />
        <code className="bg-gray-100 px-1 rounded text-sm">offer=1000000; currency=USD; company=AztecLabs</code>.
        <br /><br />
        This email will be used to generate a <span className="font-semibold text-blue-700">modular credential</span> that proves the details of the offer—without revealing more than necessary.
      </p>

      {status === "loading" && <p className="text-blue-500 text-lg font-medium animate-pulse">Loading emails{".".repeat(dotCount)}</p>}
      {status === "error" && <p className="text-red-500">Failed to fetch emails.</p>}

      <div className="h-10">
        {status === "generating" && (
          <p className="text-blue-600 text-lg font-semibold flex items-center gap-2">
            <span className="animate-spin">⚙️</span> Generating zk proof...
          </p>
        )}
      </div>

      {emails.length > 0 ? (
        <Suspense fallback={<p className="text-gray-400">Loading table...</p>}>
          <EmailTable emails={emails} handleEmailProof={handleEmailProof} />
        </Suspense>
      ) : (
        status === "idle" && <p className="text-blue-300 text-lg">No matching emails found.</p>
      )}
    </div>
  );
}
