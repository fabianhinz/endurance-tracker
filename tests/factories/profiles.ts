import type { UserProfile } from '@/types/index.ts';

export const makeUserProfile = (overrides?: Partial<UserProfile>): UserProfile => {
  return {
    id: 'test-user-id',
    gender: 'male',
    thresholds: {
      ftp: 250,
      maxHr: 190,
      restHr: 50,
    },
    showMetricHelp: true,
    useAutoSessionNames: false,
    createdAt: Date.now(),
    ...overrides,
  };
};
