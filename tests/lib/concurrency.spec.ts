import { describe, it, expect, vi } from 'vitest';
import { mapWithConcurrency } from '../../src/lib/concurrency.ts';

describe('mapWithConcurrency', () => {
  it('processes all items and returns results in order', async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await mapWithConcurrency(items, 3, async (n) => n * 2);

    expect(results).toEqual([
      { status: 'fulfilled', value: 2 },
      { status: 'fulfilled', value: 4 },
      { status: 'fulfilled', value: 6 },
      { status: 'fulfilled', value: 8 },
      { status: 'fulfilled', value: 10 },
    ]);
  });

  it('respects concurrency limit', async () => {
    let running = 0;
    let maxRunning = 0;

    const items = Array.from({ length: 20 }, (_, i) => i);
    await mapWithConcurrency(items, 4, async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 10));
      running--;
    });

    expect(maxRunning).toBeLessThanOrEqual(4);
    expect(maxRunning).toBeGreaterThan(1);
  });

  it('captures rejections without aborting other items', async () => {
    const items = [1, 2, 3, 4];
    const results = await mapWithConcurrency(items, 2, async (n) => {
      if (n === 2) throw new Error('fail');
      return n;
    });

    expect(results[0]).toEqual({ status: 'fulfilled', value: 1 });
    expect(results[1]).toEqual({ status: 'rejected', reason: new Error('fail') });
    expect(results[2]).toEqual({ status: 'fulfilled', value: 3 });
    expect(results[3]).toEqual({ status: 'fulfilled', value: 4 });
  });

  it('calls onSettle for every item (fulfilled and rejected)', async () => {
    const onSettle = vi.fn();
    const items = [1, 2, 3];
    await mapWithConcurrency(
      items,
      2,
      async (n) => {
        if (n === 2) throw new Error('fail');
        return n;
      },
      onSettle,
    );

    expect(onSettle).toHaveBeenCalledTimes(3);
  });

  it('handles empty input', async () => {
    const results = await mapWithConcurrency([], 4, async (n: number) => n);
    expect(results).toEqual([]);
  });

  it('handles concurrency greater than item count', async () => {
    const items = [1, 2];
    const results = await mapWithConcurrency(items, 100, async (n) => n * 3);

    expect(results).toEqual([
      { status: 'fulfilled', value: 3 },
      { status: 'fulfilled', value: 6 },
    ]);
  });
});
