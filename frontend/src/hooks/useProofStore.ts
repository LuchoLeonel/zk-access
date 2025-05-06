import { create } from 'zustand';

type ProofStore = {
  proof: any | null;
  qrCode: string | null;
  setProof: (proof: any) => void;
  resetProof: () => void;
  setQrCode: (url: string) => void;
};

export const useProofStore = create<ProofStore>((set) => ({
  proof: null,
  qrCode: null,
  setProof: (proof) => set({ proof }),
  resetProof: () => set({ proof: null, qrCode: null }),
  setQrCode: (url) => set({ qrCode: url }),
}));
