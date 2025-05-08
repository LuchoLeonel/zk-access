import { create } from 'zustand';

type ProofStore = {
  proofs: any[]; // en vez de `proof: any | null`
  qrCode: string | null;
  setProofs: (proofs: any[]) => void;
  resetProofs: () => void;
  setQrCode: (url: string) => void;
};

export const useProofStore = create<ProofStore>((set) => ({
  proofs: [],
  qrCode: null,
  setProofs: (proofs) => set({ proofs }),
  resetProofs: () => set({ proofs: [], qrCode: null }),
  setQrCode: (url) => set({ qrCode: url }),
}));
