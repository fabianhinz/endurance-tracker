import { useRef } from 'react';
import { Upload, ArrowRight } from 'lucide-react';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useFileUpload } from '@/features/sessions/hooks/useFileUpload.ts';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import { ActionPromptCard } from '@/components/ui/ActionPromptCard.tsx';
import { ThresholdsSection } from '@/features/settings/ThresholdsSection.tsx';

export const OnboardingPage = () => {
  const profile = useUserStore((s) => s.profile);
  const sessionCount = useSessionsStore((s) => s.sessions.length);
  const completeOnboarding = useLayoutStore((s) => s.completeOnboarding);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useFileUpload(fileInputRef);

  const canFinish = profile !== null && sessionCount > 0;

  return (
    <div className="flex flex-col gap-4">
      {canFinish ? (
        <ActionPromptCard
          title={m.ui_onboarding_all_set()}
          description={m.ui_onboarding_all_set_desc({
            sessionCount: sessionCount === 1
              ? m.ui_count_sessions_one()
              : m.ui_count_sessions_other({ count: String(sessionCount) }),
          })}
        >
          <Button onClick={completeOnboarding}>
            {m.ui_onboarding_get_started()}
            <ArrowRight size={16} />
          </Button>
        </ActionPromptCard>
      ) : (
        <>
          <ThresholdsSection />

          <ActionPromptCard
            title={m.ui_onboarding_upload_title()}
            description={
              profile
                ? m.ui_onboarding_upload_desc_ready()
                : m.ui_onboarding_upload_desc_thresholds()
            }
          >
            <Button disabled={!profile || upload.uploading} onClick={upload.triggerUpload}>
              <Upload size={16} />
              {m.ui_onboarding_upload_fit()}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".fit"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && upload.handleFiles(e.target.files)}
              disabled={upload.uploading}
            />
          </ActionPromptCard>
        </>
      )}
    </div>
  );
};
