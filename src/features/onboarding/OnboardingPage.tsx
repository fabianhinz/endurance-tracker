import { useRef } from "react";
import { Upload, ArrowRight } from "lucide-react";
import { useUserStore } from "../../store/user.ts";
import { useSessionsStore } from "../../store/sessions.ts";
import { useLayoutStore } from "../../store/layout.ts";
import { useFileUpload } from "../training/hooks/useFileUpload.ts";
import { Button } from "../../components/ui/Button.tsx";
import { ActionPromptCard } from "../../components/ui/ActionPromptCard.tsx";
import { ThresholdsSection } from "../settings/ThresholdsSection.tsx";

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
          title="You're All Set"
          description={`${sessionCount} session${sessionCount !== 1 ? "s" : ""} uploaded. Ready to explore your training data.`}
        >
          <Button onClick={completeOnboarding}>
            Get Started
            <ArrowRight size={16} />
          </Button>
        </ActionPromptCard>
      ) : (
        <>
          <ThresholdsSection />

          <ActionPromptCard
            title="Upload Your First Session"
            description={
              profile
                ? "Import a .FIT file from your Garmin, Wahoo, or other device to get started."
                : "Set your thresholds first, then upload a .FIT file to get started."
            }
          >
            <Button
              disabled={!profile || upload.uploading}
              onClick={upload.triggerUpload}
            >
              <Upload size={16} />
              Upload .FIT Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".fit"
              multiple
              className="hidden"
              onChange={(e) =>
                e.target.files && upload.handleFiles(e.target.files)
              }
              disabled={upload.uploading}
            />
          </ActionPromptCard>
        </>
      )}
    </div>
  );
};
