import { unzip } from 'fflate';

const ARCHIVE_EXTENSIONS = ['.zip'] as const;
const IGNORED_PREFIXES = ['__MACOSX/', '.'];
// Supported activity file extensions to extract from archives.
// .tcx extraction is ready — parsing support will be added in a future PR.
const ACTIVITY_EXTENSIONS = ['.fit', '.tcx'] as const;

type ActivityExtension = (typeof ACTIVITY_EXTENSIONS)[number];

export const isArchiveFile = (fileName: string): boolean => {
  const lower = fileName.toLowerCase();
  return ARCHIVE_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

export const extractActivityFiles = (
  buffer: ArrayBuffer,
): Promise<Array<{ fileName: string; data: ArrayBuffer; extension: ActivityExtension }>> => {
  return new Promise((resolve, reject) => {
    unzip(new Uint8Array(buffer), (err, entries) => {
      if (err) {
        reject(err);
        return;
      }

      const files: Array<{ fileName: string; data: ArrayBuffer; extension: ActivityExtension }> =
        [];

      for (const [path, data] of Object.entries(entries)) {
        const name = path.split('/').pop() ?? path;
        if (IGNORED_PREFIXES.some((p) => path.startsWith(p))) continue;
        const lower = name.toLowerCase();
        const ext = ACTIVITY_EXTENSIONS.find((e) => lower.endsWith(e));
        if (!ext) continue;
        files.push({ fileName: name, data: data.buffer as ArrayBuffer, extension: ext });
      }

      resolve(files);
    });
  });
};
