"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import zkEmailSdk, { testBlueprint } from "@zk-email/sdk";
import { useProofStore } from "@/hooks/useProofStore";
import pLimit from "p-limit";

type EmailRow = {
  id: string;
  subject: string;
  sentAt: Date;
  valid: boolean;
  emlContent: string;
};

export default function InboxPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const router = useRouter();
  const { setProof } = useProofStore();
  const [dotCount, setDotCount] = useState(0);
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "generating" | "error">("loading");

  useEffect(() => {
    if (status !== 'loading') return;
  
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4); // 0 → 1 → 2 → 3 → 0 ...
    }, 300);
  
    return () => clearInterval(interval);
  }, [status]);
  

  useEffect(() => {
    if (!code) return;

    const fetchAndVerifyEmails = async () => {
      setStatus("loading");

      try {
        const sdk = zkEmailSdk();
        const blueprint = await sdk.getBlueprint("LuchoLeonel/ZkAccess@v1");

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

        const fetched: EmailRow[] = await Promise.all(
          messages.map((msg: any) =>
            limit(async () => {
              const emlRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=raw`,
                { headers: { Authorization: `Bearer ${access_token}` } }
              );
              const { raw } = await emlRes.json();
              const emlContent = Buffer.from(raw, "base64").toString("utf-8");

              const isCompatible = await testBlueprint(emlContent, blueprint.props);

              const subjectMatch = emlContent.match(/^Subject: (.+)$/m);
              const dateMatch = emlContent.match(/^Date: (.+)$/m);

              const subject = subjectMatch?.[1] ?? "(No subject)";
              const sentAt = dateMatch ? new Date(dateMatch[1]) : new Date();

              return {
                id: msg.id,
                subject,
                sentAt,
                valid: !!isCompatible,
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
  }, [code]);

  const handleEmailProof = async (email: EmailRow) => {
    try {
      setStatus("generating");
      const sdk = zkEmailSdk();
      const blueprint = await sdk.getBlueprint("LuchoLeonel/ZkAccess@v1");
      const prover = blueprint.createProver();

      const proof = await prover.generateProof(email.emlContent);
      setProof(proof);
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push("/zk-passport");
    } catch (err) {
      console.error("Error al generar la prueba:", err);
      setStatus("error");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8 text-blue-700 flex items-center gap-2">
        <span role="img" aria-label="mail">📬</span>
        Welcome Emails
      </h1>

      <p className="mb-6 text-gray-700 text-base leading-relaxed">
        Select the email you received confirming your hiring. It should contain a subject like <strong>"Welcome aboard!!"</strong>.
        This message will be used to generate your <span className="font-semibold text-blue-700">Verifiable Credential</span>, which proves your employment.
      </p>

      {status === "loading" && <p className="text-blue-500 text-lg font-medium animate-pulse">
        Loading emails{".".repeat(dotCount)}
      </p>
      }
      {status === "error" && <p className="text-red-500">Failed to fetch emails.</p>}

      <div className="h-10">
        {status === "generating" && (
          <p className="text-blue-600 text-lg font-semibold flex items-center gap-2">
            <span className="animate-spin">⚙️</span>
            Generating ZK proof...
          </p>
        )}
      </div>

      {emails.length > 0 ? (
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-sm">
                <th className="p-4 border-b font-semibold">Validity</th>
                <th className="p-4 border-b font-semibold">Sent on</th>
                <th className="p-4 border-b font-semibold">Subject</th>
                <th className="p-4 border-b font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email, idx) => (
                <tr key={email.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      email.valid ? "bg-green-50 text-green-700 border border-green-100" : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                    }`}>
                      {email.valid ? "Valid" : "Invalid"}
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
                  <td className="p-4 text-right">
                    <button
                      disabled={!email.valid}
                      className={`px-4 py-2 text-sm rounded font-semibold ${
                        email.valid
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                      onClick={() => handleEmailProof(email)}
                    >
                      {email.valid ? "Use to create credential" : "Not compatible"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        status === "idle" && <p className="text-blue-300 text-lg">No matching emails found.</p>
      )}
    </div>
  );
}
