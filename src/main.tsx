import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from './components/ui/Tooltip.tsx';
import { ToastViewport } from './components/ui/Toast.tsx';
import { App } from './App.tsx';
import { useUserStore } from './store/user.ts';
import { useSessionsStore } from './store/sessions.ts';
import { useCoachPlanStore } from './store/coach-plan.ts';
import './index.css';

const boot = async () => {
  await useUserStore.persist.rehydrate();
  await useSessionsStore.persist.rehydrate();
  await useCoachPlanStore.persist.rehydrate();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <TooltipProvider>
          <App />
          <ToastViewport />
        </TooltipProvider>
      </BrowserRouter>
    </StrictMode>,
  );
};

boot();
