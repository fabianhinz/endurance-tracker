import { describe, it, expect } from 'vitest';
import { getFormMessage, getFormMessageDetailed } from '../../src/engine/coaching.ts';
import type { FormStatus } from '../../src/types/index.ts';

const ALL_STATUSES: FormStatus[] = [
  'detraining',
  'fresh',
  'neutral',
  'optimal',
  'overload',
];

describe('getFormMessageDetailed', () => {
  it.each(ALL_STATUSES)(
    '"%s" has a detailed message',
    (status) => {
      const detailed = getFormMessageDetailed(status);
      expect(detailed.length).toBeGreaterThan(0);
    },
  );

  it.each(ALL_STATUSES)(
    '"%s" detailed message differs from standard message',
    (status) => {
      const standard = getFormMessage(status);
      const detailed = getFormMessageDetailed(status);
      expect(detailed).not.toBe(standard);
    },
  );

  it.each(ALL_STATUSES)(
    '"%s" detailed message is longer than standard message',
    (status) => {
      const standard = getFormMessage(status);
      const detailed = getFormMessageDetailed(status);
      expect(detailed.length).toBeGreaterThan(standard.length);
    },
  );
});
