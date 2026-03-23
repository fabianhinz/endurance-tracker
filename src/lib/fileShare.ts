let cachedCanShare: boolean | null = null;

export const canShareFiles = (): boolean => {
  if (cachedCanShare !== null) return cachedCanShare;
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    cachedCanShare = false;
    return false;
  }
  const testFile = new File([''], 'test.gpx', { type: 'application/gpx+xml' });
  cachedCanShare = navigator.canShare({ files: [testFile] });
  return cachedCanShare;
};

export const downloadFile = (file: File) => {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
