import { create } from 'zustand';
import { useToastStore } from '@/components/ui/toastStore.ts';

interface UploadProgressState {
  uploading: boolean;
  processed: number;
  total: number;
  fileCount: number;
  startUpload: (total: number) => void;
  advance: () => void;
  finish: (message: string, variant: 'success' | 'error' | 'warning') => void;
}

export const useUploadProgressStore = create<UploadProgressState>()((set, get) => ({
  uploading: false,
  processed: 0,
  total: 0,
  fileCount: 0,
  startUpload: (total) => {
    set({
      uploading: true,
      processed: 0,
      total,
      fileCount: total,
    });
    useToastStore.getState().upsertProgress({
      label: `${total} session${total !== 1 ? 's' : ''} processing`,
      processed: 0,
      total,
      saving: false,
    });
  },
  advance: () => {
    set((state) => ({ processed: state.processed + 1 }));
    const state = get();
    const processed = state.processed;
    const total = state.total;
    const saving = processed >= total && total > 0;
    useToastStore.getState().upsertProgress({
      label: saving
        ? 'Saving\u2026'
        : `${state.fileCount} session${state.fileCount !== 1 ? 's' : ''} processing`,
      processed,
      total,
      saving,
    });
  },
  finish: (message, variant) => {
    set({ uploading: false });
    useToastStore.getState().replaceProgressWithMessage(message, variant);
  },
}));
