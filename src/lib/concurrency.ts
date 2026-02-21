export type SettledResult<R> =
  | { status: "fulfilled"; value: R }
  | { status: "rejected"; reason: unknown };

export const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
  onSettle?: () => void,
): Promise<SettledResult<R>[]> => {
  const results: SettledResult<R>[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      try {
        const value = await fn(items[i]);
        results[i] = { status: "fulfilled", value };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
      onSettle?.();
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);

  return results;
};
