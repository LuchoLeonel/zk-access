"use client";
import { useState } from "react";
import Image from "next/image";"use client";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const handleRequestCredential = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!);
    const scope = encodeURIComponent("https://www.googleapis.com/auth/gmail.readonly");
    const state = uuidv4();
  
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=online&prompt=consent&state=${state}`;
  
    window.location.href = oauthUrl;
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-8.5rem)] bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <img src="/isotipo-black-transparent.png" alt="logo" className="h-40 w-auto mx-auto py-4" />
  
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to ZK-Access
          </h1>
  
          <h2 className="text-lg text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
            We issue modular, privacy-preserving <strong>Work ID credentials</strong>&nbsp;that prove your employment and identity using <strong>Zero-Knowledge Proofs</strong>.
          </h2>
  
          <p className="text-sm text-gray-500 mb-8">
            We use <strong>ZK-Email</strong> and <strong>ZK-Passport</strong> to verify your onboarding and identity securely.
          </p>
  
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-left">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">What is ZK-Access?</h3>
  
            <ul className="space-y-4 text-gray-700 text-base leading-relaxed list-disc list-inside">
              <li>
                We provide <strong>Verifiable Credentials</strong> that prove your <span className="font-medium">role, organization, and identity</span>, while protecting your private data.
              </li>
              <li>
                Our credentials are <strong>modular</strong>: each attribute is independently verifiable and can be selectively disclosed.
              </li>
              <li>
                They can be used for <span className="font-medium">onboarding, access control, KYC simplification</span>, and more.
              </li>
            </ul>
          </div>
  
          <button
            onClick={handleRequestCredential}
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-300 transform hover:scale-105"
          >
            Connect your Email
          </button>
        </div>
      </div>
    </div>
  );
  
  
}