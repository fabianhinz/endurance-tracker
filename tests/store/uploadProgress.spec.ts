import { describe, it, expect, beforeEach } from 'vitest';
import { useUploadProgressStore } from '@/store/uploadProgress.ts';
import { useToastStore } from '@/components/ui/toastStore.ts';

describe('upload-progress store', () => {
  beforeEach(() => {
    useUploadProgressStore.setState({
      uploading: false,
      processed: 0,
      total: 0,
      fileCount: 0,
    });
    useToastStore.setState({ toasts: [] });
  });

  it('startUpload sets fileCount to the original total', () => {
    useUploadProgressStore.getState().startUpload(158);
    const state = useUploadProgressStore.getState();
    expect(state.fileCount).toBe(158);
    expect(state.total).toBe(158);
    expect(state.uploading).toBe(true);
    expect(state.processed).toBe(0);
  });

  it('startUpload creates a progress toast', () => {
    useUploadProgressStore.getState().startUpload(10);
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].kind).toBe('progress');
  });

  it('advance increments processed', () => {
    useUploadProgressStore.getState().startUpload(10);
    useUploadProgressStore.getState().advance();
    useUploadProgressStore.getState().advance();
    expect(useUploadProgressStore.getState().processed).toBe(2);
  });

  it('advance updates progress toast', () => {
    useUploadProgressStore.getState().startUpload(10);
    useUploadProgressStore.getState().advance();
    const toasts = useToastStore.getState().toasts;
    const progress = toasts.find((t) => t.kind === 'progress');
    expect(progress).toBeDefined();
    if (progress && progress.kind === 'progress') {
      expect(progress.processed).toBe(1);
    }
  });

  it('beginProcessing sets uploading and shows indeterminate progress toast', () => {
    useUploadProgressStore.getState().beginProcessing();
    const state = useUploadProgressStore.getState();
    expect(state.uploading).toBe(true);
    expect(state.fileCount).toBe(0);

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].kind).toBe('progress');
    if (toasts[0].kind === 'progress') {
      expect(toasts[0].saving).toBe(true);
      expect(toasts[0].total).toBe(0);
    }
  });

  it('cancel resets state and removes progress toast', () => {
    useUploadProgressStore.getState().startUpload(10);
    useUploadProgressStore.getState().advance();
    useUploadProgressStore.getState().cancel();

    const state = useUploadProgressStore.getState();
    expect(state.uploading).toBe(false);
    expect(state.processed).toBe(0);
    expect(state.total).toBe(0);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('finish sets uploading to false and replaces progress with message toast', () => {
    useUploadProgressStore.getState().startUpload(5);
    useUploadProgressStore.getState().finish('5 sessions uploaded', 'success');
    const state = useUploadProgressStore.getState();
    expect(state.uploading).toBe(false);

    const toasts = useToastStore.getState().toasts;
    expect(toasts.every((t) => t.kind === 'message')).toBe(true);
    expect(toasts.some((t) => t.kind === 'message' && t.title === '5 sessions uploaded')).toBe(
      true,
    );
  });
});
