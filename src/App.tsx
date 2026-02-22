import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store/user.ts';
import { useStoresHydrated } from './lib/use-hydrated.ts';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { DashboardPage } from './features/dashboard/DashboardPage.tsx';
import { TrainingPage } from './features/training/TrainingPage.tsx';
import { SessionDetailPage } from './features/training/SessionDetailPage.tsx';
import { SettingsPage } from './features/settings/SettingsPage.tsx';
import { RecordsPage } from './features/records/RecordsPage.tsx';
import { CoachPage } from './features/coach/CoachPage.tsx';

export const App = () => {
  const hydrated = useStoresHydrated();
  const initializeProfile = useUserStore((s) => s.initializeProfile);

  useEffect(() => {
    if (hydrated) initializeProfile();
  }, [hydrated, initializeProfile]);

  if (!hydrated) return null;

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/training/:id" element={<SessionDetailPage />} />
          <Route path="/coach" element={<CoachPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};
