"use client";

import { v4 as uuidv4 } from "uuid";
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleRequestCredential = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!);
    const scope = encodeURIComponent("https://www.googleapis.com/auth/gmail.readonly");
    const state = uuidv4();
  
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=online&prompt=consent&state=${state}`;
  
    window.location.href = oauthUrl;
  };

  const handleDemo = () => {
    router.push('/zk-email?demo=true');
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-8.5rem)] bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center pb-4">
        <div className="flex items-center justify-center my-6 outline-2 ">
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
        </div>

        <h2 className="text-3xl text-gray-900 font-bold mb-4">
          Own your proofs. Share only what matters.
        </h2>
  
        <p className="text-sm text-gray-700 mb-8">
          We use zkEmail and zkPassport as proof sources, turning them into <strong>persistent, composable credentials</strong>—so you can <strong>selectively disclose claims</strong> through fresh zk proofs.
        </p>
          
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-left">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">How it works</h3>
  
            <ul className="space-y-4 text-gray-700 text-base leading-relaxed list-disc list-inside">
            <li>
            We extract <strong>verified data</strong> —like <em>job offers</em>, <em>sealed bids</em>, <em>age verification</em>, or <em>hackathon wins</em>— from zk proofs.
            </li>
            <li>
              These data are <strong>signed and structured</strong> into a modular identity that can live <strong>on-device</strong> or on <strong>private-by-default blockchains</strong>.
            </li>
            <li>
              Each claim in your identity lets you generate <strong>new zk proofs</strong> to <strong>selectively verify that specific data</strong>—without exposing anything else.
            </li>
            </ul>
          </div>
  
          <button
            onClick={handleDemo}
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-300 transform hover:scale-105"
          >
            Start Demo
          </button>
        </div>
      </div>
    </div>
  );
}