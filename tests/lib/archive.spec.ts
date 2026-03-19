import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { isArchiveFile, extractActivityFiles } from '@/lib/archive.ts';

describe('isArchiveFile', () => {
  it('returns true for .zip files', () => {
    expect(isArchiveFile('activities.zip')).toBe(true);
    expect(isArchiveFile('ACTIVITIES.ZIP')).toBe(true);
    expect(isArchiveFile('my.archive.zip')).toBe(true);
  });

  it('returns false for non-archive files', () => {
    expect(isArchiveFile('activity.fit')).toBe(false);
    expect(isArchiveFile('data.csv')).toBe(false);
    expect(isArchiveFile('zipfile.txt')).toBe(false);
  });
});

describe('extractActivityFiles', () => {
  const makeZip = (entries: Record<string, Uint8Array>): ArrayBuffer => {
    return zipSync(entries).buffer as ArrayBuffer;
  };

  const dummyFit = new Uint8Array([0x2e, 0x46, 0x49, 0x54]);
  const dummyTcx = new Uint8Array([0x3c, 0x54, 0x43, 0x58]);
  const dummyTxt = new Uint8Array([0x48, 0x45, 0x4c, 0x4c, 0x4f]);

  it('extracts a single FIT file', async () => {
    const zip = makeZip({ 'activity.fit': dummyFit });
    const result = await extractActivityFiles(zip);

    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe('activity.fit');
    expect(result[0].extension).toBe('.fit');
    expect(new Uint8Array(result[0].data)).toEqual(dummyFit);
  });

  it('extracts FIT and TCX files with correct extensions', async () => {
    const zip = makeZip({
      'run.fit': dummyFit,
      'ride.tcx': dummyTcx,
    });
    const result = await extractActivityFiles(zip);

    expect(result).toHaveLength(2);
    const extensions = result.map((r) => r.extension);
    expect(extensions).toContain('.fit');
    expect(extensions).toContain('.tcx');
  });

  it('filters out non-activity files', async () => {
    const zip = makeZip({
      'activity.fit': dummyFit,
      'readme.txt': dummyTxt,
      'photo.jpg': dummyTxt,
    });
    const result = await extractActivityFiles(zip);

    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe('activity.fit');
  });

  it('ignores __MACOSX entries', async () => {
    const zip = makeZip({
      'activity.fit': dummyFit,
      '__MACOSX/._activity.fit': dummyFit,
    });
    const result = await extractActivityFiles(zip);

    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe('activity.fit');
  });

  it('ignores dotfiles', async () => {
    const zip = makeZip({
      'activity.fit': dummyFit,
      '.hidden.fit': dummyFit,
    });
    const result = await extractActivityFiles(zip);

    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe('activity.fit');
  });

  it('extracts FIT files from nested directories', async () => {
    const zip = makeZip({
      'exports/2024/morning_run.fit': dummyFit,
      'exports/2024/evening_ride.tcx': dummyTcx,
    });
    const result = await extractActivityFiles(zip);

    expect(result).toHaveLength(2);
    expect(result[0].fileName).toBe('morning_run.fit');
    expect(result[1].fileName).toBe('evening_ride.tcx');
  });

  it('returns empty array when no activity files are present', async () => {
    const zip = makeZip({
      'readme.txt': dummyTxt,
      'data.csv': dummyTxt,
    });
    const result = await extractActivityFiles(zip);

    expect(result).toHaveLength(0);
  });

  it('handles case-insensitive extensions', async () => {
    const zip = makeZip({
      'ACTIVITY.FIT': dummyFit,
      'Ride.Tcx': dummyTcx,
    });
    const result = await extractActivityFiles(zip);

    expect(result).toHaveLength(2);
  });

  it('rejects on invalid ZIP data', async () => {
    const garbage = new ArrayBuffer(16);
    await expect(extractActivityFiles(garbage)).rejects.toThrow();
  });
});
