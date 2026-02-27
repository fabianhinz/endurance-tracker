import { create } from "zustand";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
  persistent?: boolean;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id"> & { id?: string }) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => {
      const id = toast.id ?? crypto.randomUUID();
      if (toast.id && state.toasts.some((t) => t.id === id)) return state;
      const updated = [...state.toasts, { ...toast, id }];
      return { toasts: updated.slice(-5) };
    }),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = (
  title: string,
  description?: string,
  variant?: ToastItem["variant"],
) => {
  useToastStore.getState().addToast({ title, description, variant });
};
