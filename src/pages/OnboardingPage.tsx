import { useRef, useState } from 'react';
import { Upload, ArrowRight, Database, FolderUp } from 'lucide-react';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useUploadProgressStore } from '@/store/uploadProgress.ts';
import { useFileUpload } from '@/features/sessions/hooks/useFileUpload.ts';
import { generateDevData } from '@/features/dashboard/generateDevData.ts';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import { ActionTile } from '@/components/ui/ActionTile.tsx';
import { ThresholdsSection } from '@/features/settings/ThresholdsSection.tsx';
import { ActionPromptCard } from '@/components/ui/ActionPromptCard.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { Typography } from '@/components/ui/Typography.tsx';

type OnboardingPath = 'your-data' | 'test-data' | null;

export const OnboardingPage = () => {
  const profile = useUserStore((s) => s.profile);
  const sessionCount = useSessionsStore((s) => s.sessions.length);
  const completeOnboarding = useLayoutStore((s) => s.completeOnboarding);
  const uploading = useUploadProgressStore((s) => s.uploading);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useFileUpload(fileInputRef);

  const [path, setPath] = useState<OnboardingPath>(null);

  const canFinish = profile !== null && sessionCount > 0;

  const handleGenerate = async () => {
    try {
      await generateDevData();
    } catch {
      useUploadProgressStore.getState().finish('Generation failed', 'error');
    }
  };

  const getStartedButton = (
    <Button onClick={completeOnboarding}>
      {m.ui_onboarding_get_started()}
      <ArrowRight size={16} />
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <ActionPromptCard
        title={m.ui_onboarding_welcome_title()}
        description={m.ui_onboarding_welcome_desc()}
        className="bg-[linear-gradient(rgba(3,7,18,0.8),rgba(3,7,18,0.8)),url('/logo.svg')] bg-[#030712] bg-right-bottom bg-no-repeat bg-[length:8rem]"
      />
      <Card>
        <div className="flex flex-col gap-6">
          <div>
            <Typography variant="h3">{m.ui_onboarding_choose_path_title()}</Typography>
            <Typography variant="body1" color="textSecondary">
              {m.ui_onboarding_choose_path_desc()}
            </Typography>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ActionTile
              icon={FolderUp}
              title={m.ui_onboarding_your_data_title()}
              description={m.ui_onboarding_your_data_desc()}
              selected={path === 'your-data'}
              onClick={() => setPath('your-data')}
            />
            <ActionTile
              icon={Database}
              title={m.ui_onboarding_testdata_title()}
              description={m.ui_onboarding_testdata_desc()}
              selected={path === 'test-data'}
              onClick={() => setPath('test-data')}
            />
          </div>

          {path === 'your-data' && (
            <>
              <hr className="border-white/10" />
              <ThresholdsSection variant="embedded" />
              <div className="flex justify-end">
                {canFinish ? (
                  getStartedButton
                ) : (
                  <>
                    <Button disabled={!profile || uploading} onClick={upload.triggerUpload}>
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
                      disabled={uploading}
                    />
                  </>
                )}
              </div>
            </>
          )}

          {path === 'test-data' && (
            <>
              <hr className="border-white/10" />
              <Typography variant="body1" color="textSecondary">
                {m.ui_onboarding_testdata_detail()}
              </Typography>
              <div className="flex justify-end">
                {canFinish ? (
                  getStartedButton
                ) : (
                  <Button onClick={handleGenerate} loading={uploading}>
                    {uploading
                      ? m.ui_onboarding_testdata_generating()
                      : m.ui_onboarding_testdata_generate()}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
