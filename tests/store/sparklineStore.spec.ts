import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSparklineStore } from '@/store/sparklineStore.ts';
import { makeRunningRecords } from '@tests/factories/records.ts';

vi.mock('@/lib/indexeddb.ts', () => ({
  getSessionRecords: vi.fn(),
}));

import { getSessionRecords } from '@/lib/indexeddb.ts';

const mockedGetSessionRecords = vi.mocked(getSessionRecords);

const resetStore = () => {
  useSparklineStore.setState({
    toggledIds: new Set(),
    cache: new Map(),
    loadingIds: new Set(),
    domains: { hr: null, power: null, pace: null, speed: null },
  });
};

describe('useSparklineStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('defaults to empty state', () => {
    const state = useSparklineStore.getState();
    expect(state.toggledIds.size).toBe(0);
    expect(state.cache.size).toBe(0);
    expect(state.loadingIds.size).toBe(0);
    expect(state.domains.hr).toBeNull();
  });

  it('toggleSparkline adds id to toggledIds', () => {
    mockedGetSessionRecords.mockResolvedValue([]);
    useSparklineStore.getState().toggleSparkline('s1');
    expect(useSparklineStore.getState().toggledIds.has('s1')).toBe(true);
  });

  it('toggleSparkline removes id on second call', () => {
    mockedGetSessionRecords.mockResolvedValue([]);
    useSparklineStore.getState().toggleSparkline('s1');
    useSparklineStore.getState().toggleSparkline('s1');
    expect(useSparklineStore.getState().toggledIds.has('s1')).toBe(false);
  });

  it('toggleSparkline triggers loadSparklineData for uncached id', async () => {
    const records = makeRunningRecords('test', 10);
    mockedGetSessionRecords.mockResolvedValue(records);

    useSparklineStore.getState().toggleSparkline('s1');

    expect(mockedGetSessionRecords).toHaveBeenCalledWith('s1');

    await vi.waitFor(() => {
      expect(useSparklineStore.getState().cache.has('s1')).toBe(true);
    });

    expect(useSparklineStore.getState().loadingIds.has('s1')).toBe(false);
  });

  it('does not reload cached id on re-toggle', async () => {
    const records = makeRunningRecords('test', 10);
    mockedGetSessionRecords.mockResolvedValue(records);

    useSparklineStore.getState().toggleSparkline('s1');
    await vi.waitFor(() => {
      expect(useSparklineStore.getState().cache.has('s1')).toBe(true);
    });

    // Toggle off then on again
    useSparklineStore.getState().toggleSparkline('s1');
    useSparklineStore.getState().toggleSparkline('s1');

    expect(mockedGetSessionRecords).toHaveBeenCalledTimes(1);
  });

  it('recomputes domains when cache updates', async () => {
    const records = makeRunningRecords('test', 10);
    mockedGetSessionRecords.mockResolvedValue(records);

    useSparklineStore.getState().toggleSparkline('s1');

    await vi.waitFor(() => {
      expect(useSparklineStore.getState().cache.has('s1')).toBe(true);
    });

    const domains = useSparklineStore.getState().domains;
    expect(domains.hr).not.toBeNull();
  });

  it('recomputes domains scoped to toggled ids only', async () => {
    const records = makeRunningRecords('test', 10);
    mockedGetSessionRecords.mockResolvedValue(records);

    useSparklineStore.getState().toggleSparkline('s1');
    await vi.waitFor(() => {
      expect(useSparklineStore.getState().cache.has('s1')).toBe(true);
    });

    // Toggle off — domains should reset
    useSparklineStore.getState().toggleSparkline('s1');
    const domains = useSparklineStore.getState().domains;
    expect(domains.hr).toBeNull();
  });

  it('handles load error gracefully', async () => {
    mockedGetSessionRecords.mockRejectedValue(new Error('DB error'));

    useSparklineStore.getState().toggleSparkline('s1');

    await vi.waitFor(() => {
      expect(useSparklineStore.getState().loadingIds.has('s1')).toBe(false);
    });

    expect(useSparklineStore.getState().cache.has('s1')).toBe(false);
  });

  it('produces all-null series for empty records', async () => {
    mockedGetSessionRecords.mockResolvedValue([]);

    useSparklineStore.getState().toggleSparkline('s1');

    await vi.waitFor(() => {
      expect(useSparklineStore.getState().cache.has('s1')).toBe(true);
    });

    const data = useSparklineStore.getState().cache.get('s1')!;
    expect(data.hr).toBeNull();
    expect(data.power).toBeNull();
    expect(data.pace).toBeNull();
    expect(data.speed).toBeNull();
  });
});
