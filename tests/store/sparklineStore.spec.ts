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
    cache: new Map(),
    loadingIds: new Set(),
  });
};

describe('useSparklineStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('defaults to empty state', () => {
    const state = useSparklineStore.getState();
    expect(state.cache.size).toBe(0);
    expect(state.loadingIds.size).toBe(0);
  });

  it('loadSparklineData populates cache', async () => {
    const records = makeRunningRecords('test', 10);
    mockedGetSessionRecords.mockResolvedValue(records);

    await useSparklineStore.getState().loadSparklineData('s1');

    expect(mockedGetSessionRecords).toHaveBeenCalledWith('s1');
    expect(useSparklineStore.getState().cache.has('s1')).toBe(true);
    expect(useSparklineStore.getState().loadingIds.has('s1')).toBe(false);
  });

  it('does not reload cached id', async () => {
    const records = makeRunningRecords('test', 10);
    mockedGetSessionRecords.mockResolvedValue(records);

    await useSparklineStore.getState().loadSparklineData('s1');
    await useSparklineStore.getState().loadSparklineData('s1');

    expect(mockedGetSessionRecords).toHaveBeenCalledTimes(1);
  });

  it('handles load error gracefully', async () => {
    mockedGetSessionRecords.mockRejectedValue(new Error('DB error'));

    await useSparklineStore.getState().loadSparklineData('s1');

    expect(useSparklineStore.getState().loadingIds.has('s1')).toBe(false);
    expect(useSparklineStore.getState().cache.has('s1')).toBe(false);
  });

  it('produces all-null series for empty records', async () => {
    mockedGetSessionRecords.mockResolvedValue([]);

    await useSparklineStore.getState().loadSparklineData('s1');

    const data = useSparklineStore.getState().cache.get('s1');
    expect(data?.hr).toBeNull();
    expect(data?.power).toBeNull();
    expect(data?.pace).toBeNull();
    expect(data?.speed).toBeNull();
  });
});
