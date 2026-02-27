import { describe, it, expect, beforeEach } from 'vitest';
import { useUploadProgressStore } from '../../src/store/uploadProgress.ts';

describe('upload-progress store', () => {
  beforeEach(() => {
    useUploadProgressStore.getState().reset();
  });

  it('startUpload sets fileCount to the original total', () => {
    useUploadProgressStore.getState().startUpload(158);
    const state = useUploadProgressStore.getState();
    expect(state.fileCount).toBe(158);
    expect(state.total).toBe(158);
    expect(state.uploading).toBe(true);
    expect(state.processed).toBe(0);
  });

  it('advance increments processed', () => {
    useUploadProgressStore.getState().startUpload(10);
    useUploadProgressStore.getState().advance();
    useUploadProgressStore.getState().advance();
    expect(useUploadProgressStore.getState().processed).toBe(2);
  });

  it('finish sets doneMessage and doneVariant, clears uploading', () => {
    useUploadProgressStore.getState().startUpload(5);
    useUploadProgressStore.getState().finish('5 sessions uploaded', 'success');
    const state = useUploadProgressStore.getState();
    expect(state.doneMessage).toBe('5 sessions uploaded');
    expect(state.doneVariant).toBe('success');
    expect(state.uploading).toBe(false);
  });

  it('startUpload clears previous doneMessage', () => {
    useUploadProgressStore.getState().finish('done', 'success');
    useUploadProgressStore.getState().startUpload(10);
    const state = useUploadProgressStore.getState();
    expect(state.doneMessage).toBeNull();
    expect(state.doneVariant).toBeNull();
  });

  it('reset clears everything including doneMessage and fileCount', () => {
    useUploadProgressStore.getState().startUpload(50);
    useUploadProgressStore.getState().advance();
    useUploadProgressStore.getState().finish('50 sessions uploaded', 'success');
    useUploadProgressStore.getState().reset();
    const state = useUploadProgressStore.getState();
    expect(state.fileCount).toBe(0);
    expect(state.total).toBe(0);
    expect(state.processed).toBe(0);
    expect(state.uploading).toBe(false);
    expect(state.doneMessage).toBeNull();
    expect(state.doneVariant).toBeNull();
  });
});
