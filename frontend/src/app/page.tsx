"use client";
import { useState } from "react";
import Image from "next/image";"use client";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const handleRequestCredential = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!);
    const scope = encodeURIComponent("https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email");
    const state = uuidv4();
  
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=online&prompt=consent&state=${state}`;
  
    window.location.href = oauthUrl;
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-8.5rem)] bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <img src="/isotipo-black-transparent.png" alt="logo" className="h-48 w-40 mx-auto my-auto py-4" />
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to ZK-Access
          </h1>
          
          <h2 className="text-2xl text-gray-700 mb-8">
            Get verifiable credentials using ZK-Email
          </h2>
  
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <p className="text-lg text-gray-600 leading-relaxed">
              ZK-Access allows you to obtain verifiable credentials for the company you belong to, 
              using ZK-Email to securely and privately verify ownership of your email address before generating your credential.
            </p>
          </div>
  
          <button
            onClick={handleRequestCredential}
            className="bg-gray-900 hover:bg-gray-900 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-300 transform hover:scale-105"
          >
            Request Credential
          </button>
        </div>
      </div>
    </div>
  );
}