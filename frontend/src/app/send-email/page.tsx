"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SendEmailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [status, setStatus] = useState<"idle" | "exchanging" | "loading" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    to: "metacitizen.general@gmail.com",
    subject: "Verifiable Credential Request",
    body: `Hello,\n\nBy sending this email, you are requesting a verifiable credential.\nThe server will automatically issue a credential based on the domain of your email address (e.g., @company.com).\n\nNo further action is needed — simply send this message.\nOnce the email is received, you will get a confirmation response shortly.\n\nThank you!`,
    from: "",
  });

  function utf8ToBase64(str: string) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  useEffect(() => {
    if (!code) return;

    const getUserInfo = async (access_token: string) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
        const data = await res.json();
        setFormData((prev) => ({ ...prev, from: data.email || "" }));
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };

    const exchangeAndFetch = async () => {
      setStatus("exchanging");
      try {
        const tokenRes = await fetch("/api/exchange-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!tokenRes.ok) throw new Error("Failed to exchange code");

        const { access_token } = await tokenRes.json();
        await getUserInfo(access_token);
        sessionStorage.setItem("access_token", access_token);
        setStatus("idle");
      } catch (err) {
        console.error("Token exchange failed:", err);
        setStatus("error");
      }
    };

    exchangeAndFetch();
  }, [code]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSend = async () => {
    setStatus("loading");
    const access_token = sessionStorage.getItem("access_token");
    if (!access_token) {
      console.error("Missing token");
      setStatus("error");
      return;
    }

    try {
      const rawMessage = [
        `From: ${formData.from}`,
        `To: ${formData.to}`,
        `Subject: ${formData.subject}`,
        "",
        formData.body,
      ].join("\n");

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: utf8ToBase64(rawMessage),
        }),
      });

      if (!res.ok) throw new Error("Failed to send email");

      setStatus("success");
    } catch (err) {
      console.error("Email send failed:", err);
      setStatus("error");
    }
  };


  const openGmail = () => {
    window.open("https://mail.google.com/mail/u/0/#sent", "_blank");
  };


  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-8.5rem)] bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="bg-white p-8 rounded shadow-lg w-full max-w-2xl">

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">From</label>
                <input
                type="email"
                name="from"
                value={formData.from}
                onChange={handleChange}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">To</label>
                <input
                type="email"
                name="to"
                value={formData.to}
                onChange={handleChange}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
                />
            </div>
            <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Body</label>
                <textarea
                name="body"
                rows={10}
                value={formData.body}
                onChange={handleChange}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
                />
            </div>
            {status !== "success" ? (
              <button
                type="submit"
                disabled={status === "loading" || status === "error"}
                className={`font-bold py-3 px-6 rounded w-full transition duration-300 
                  ${status === "loading" || status === "error" 
                    ? "bg-gray-400 cursor-not-allowed text-white" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"}`}
              >
                Send Email
              </button>
            ) : (
              <button
                type="button"
                onClick={openGmail}
                className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded w-full transition duration-300"
              >
                📫 Open Gmail
              </button>
            )}
        </form>

        <div className="h-6 mt-4">
            {status === "loading" && <p className="text-gray-600 font-bold text-center">⏳ Loading...</p>}
            {status === "success" && <p className="text-green-600 font-bold text-center">✅ Email sent successfully!</p>}
            {status === "error" && <p className="text-red-600 font-bold text-center">❌ Failed to send email</p>}
        </div>
      </div>
    </div>
  );
}
