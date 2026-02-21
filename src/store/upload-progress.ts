import { create } from 'zustand';

interface UploadProgressState {
  uploading: boolean;
  backfilling: boolean;
  processed: number;
  total: number;
  fileCount: number;
  doneMessage: string | null;
  doneVariant: 'success' | 'error' | null;
  startUpload: (total: number) => void;
  startBackfill: (total: number) => void;
  adjustTotal: (newTotal: number) => void;
  advance: () => void;
  finish: (message: string, variant: 'success' | 'error') => void;
  reset: () => void;
}

export const useUploadProgressStore = create<UploadProgressState>()((set) => ({
  uploading: false,
  backfilling: false,
  processed: 0,
  total: 0,
  fileCount: 0,
  doneMessage: null,
  doneVariant: null,
  startUpload: (total) => set({ uploading: true, backfilling: false, processed: 0, total, fileCount: total, doneMessage: null, doneVariant: null }),
  startBackfill: (total) => set({ backfilling: true, processed: 0, total }),
  adjustTotal: (newTotal) => set({ total: newTotal }),
  advance: () => set((state) => ({ processed: state.processed + 1 })),
  finish: (message, variant) => set({ uploading: false, backfilling: false, doneMessage: message, doneVariant: variant }),
  reset: () => set({ uploading: false, backfilling: false, processed: 0, total: 0, fileCount: 0, doneMessage: null, doneVariant: null }),
}));
