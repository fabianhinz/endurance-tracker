import { create } from 'zustand';

interface MessageToastItem {
  id: string;
  kind: 'message';
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  persistent?: boolean;
  testId?: string;
}

interface ProgressToastItem {
  id: string;
  kind: 'progress';
  label: string;
  processed: number;
  total: number;
  saving: boolean;
}

type ToastItem = MessageToastItem | ProgressToastItem;

const PROGRESS_TOAST_ID = 'upload-progress';

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<MessageToastItem, 'id' | 'kind'> & { id?: string }) => void;
  removeToast: (id: string) => void;
  upsertProgress: (data: Omit<ProgressToastItem, 'id' | 'kind'>) => void;
  replaceProgressWithMessage: (title: string, variant: 'success' | 'error' | 'warning') => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => {
      const id = toast.id ?? crypto.randomUUID();
      if (toast.id && state.toasts.some((t) => t.id === id)) return state;
      const updated = [...state.toasts, { ...toast, id, kind: 'message' as const }];
      return { toasts: updated.slice(-5) };
    }),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  upsertProgress: (data) =>
    set((state) => {
      const item: ProgressToastItem = { ...data, id: PROGRESS_TOAST_ID, kind: 'progress' };
      const idx = state.toasts.findIndex((t) => t.id === PROGRESS_TOAST_ID);
      if (idx >= 0) {
        const updated = [...state.toasts];
        updated[idx] = item;
        return { toasts: updated };
      }
      return { toasts: [...state.toasts, item].slice(-5) };
    }),
  replaceProgressWithMessage: (title, variant) =>
    set((state) => {
      const messageToast: MessageToastItem = {
        id: crypto.randomUUID(),
        kind: 'message',
        title,
        variant,
        testId: 'upload-done',
      };
      const toasts = state.toasts.filter((t) => t.id !== PROGRESS_TOAST_ID);
      return { toasts: [...toasts, messageToast].slice(-5) };
    }),
}));

export const toast = (
  title: string,
  description?: string,
  variant?: MessageToastItem['variant'],
) => {
  useToastStore.getState().addToast({ title, description, variant });
};

export type { ToastItem, MessageToastItem, ProgressToastItem };
