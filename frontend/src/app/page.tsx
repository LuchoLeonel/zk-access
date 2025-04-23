"use client";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const handleRequestCredential = () => {
    const email = "metacitizen.general@gmail.com";
    const subject = "Verifiable Credential Request";
    const body = `Hello,

I am requesting a verifiable credential corresponding to the company I belong to, from which I am sending you this email (e.g., @company.com).

Thank you very much.`;

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-7rem)] bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-300 transform hover:scale-105"
          >
            Request Credential
          </button>
        </div>
      </div>
    </div>
  );
}