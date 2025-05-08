import { create } from 'zustand';

type ProofStore = {
  proofs: any[];
  ZKCredential: any | null;
  setProofs: (proofs: any[]) => void;
  resetProofs: () => void;
  setZKCredential: (credential: any) => void;
};

export const useProofStore = create<ProofStore>((set) => ({
  proofs: [],
  ZKCredential: null,
  setProofs: (proofs) => set({ proofs }),
  resetProofs: () => set({ proofs: [], ZKCredential: null }),
  setZKCredential: (ZKCredential) => set({ ZKCredential }),
}));
