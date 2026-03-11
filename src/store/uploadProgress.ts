import { create } from 'zustand';
import { useToastStore } from '@/components/ui/toastStore.ts';
import { m } from '@/paraglide/messages.js';

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
    let label = m.toast_upload_processing_plural({ count: total });
    if (total === 1) {
      label = m.toast_upload_processing({ count: total });
    }
    useToastStore.getState().upsertProgress({
      label,
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
    let label: string;
    if (saving) {
      label = m.toast_upload_saving();
    } else if (state.fileCount === 1) {
      label = m.toast_upload_processing({ count: state.fileCount });
    } else {
      label = m.toast_upload_processing_plural({ count: state.fileCount });
    }
    useToastStore.getState().upsertProgress({
      label,
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
