import { create } from 'zustand';

interface UploadProgressState {
  uploading: boolean;
  processed: number;
  total: number;
  fileCount: number;
  doneMessage: string | null;
  doneVariant: 'success' | 'error' | 'warning' | null;
  startUpload: (total: number) => void;
  advance: () => void;
  finish: (message: string, variant: 'success' | 'error' | 'warning') => void;
  reset: () => void;
}

export const useUploadProgressStore = create<UploadProgressState>()((set) => ({
  uploading: false,
  processed: 0,
  total: 0,
  fileCount: 0,
  doneMessage: null,
  doneVariant: null,
  startUpload: (total) => set({ uploading: true, processed: 0, total, fileCount: total, doneMessage: null, doneVariant: null }),
  advance: () => set((state) => ({ processed: state.processed + 1 })),
  finish: (message, variant) => set({ uploading: false, doneMessage: message, doneVariant: variant }),
  reset: () => set({ uploading: false, processed: 0, total: 0, fileCount: 0, doneMessage: null, doneVariant: null }),
}));
