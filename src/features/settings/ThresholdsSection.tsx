import { useState, useRef, useEffect, useTransition } from "react";
import type { Gender } from "../../types/index.ts";
import { useUserStore } from "../../store/user.ts";
import { Input } from "../../components/ui/Input.tsx";
import { Label } from "../../components/ui/Label.tsx";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/ui/Select.tsx";
import { parsePaceInput, formatPaceInput } from "../../lib/utils.ts";
import { PaceEstimatorDialog } from "./PaceEstimatorDialog.tsx";
import { Info } from "lucide-react";

const DEBOUNCE_MS = 500;

export const ThresholdsSection = () => {
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const updateThresholds = useUserStore((s) => s.updateThresholds);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [, startTransition] = useTransition();

  const thresholds = profile?.thresholds;

  const [gender, setGender] = useState<Gender>(profile?.gender ?? "male");
  const [restHr, setRestHr] = useState(String(thresholds?.restHr ?? ""));
  const [maxHr, setMaxHr] = useState(String(thresholds?.maxHr ?? ""));
  const [ftp, setFtp] = useState(String(thresholds?.ftp ?? ""));
  const [thresholdPace, setThresholdPace] = useState(
    thresholds?.thresholdPace ? formatPaceInput(thresholds.thresholdPace) : "",
  );

  const [restHrError, setRestHrError] = useState("");
  const [maxHrError, setMaxHrError] = useState("");
  const [ftpError, setFtpError] = useState("");
  const [thresholdPaceError, setThresholdPaceError] = useState("");

  const [estimatorOpen, setEstimatorOpen] = useState(false);

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const debounce = (key: string, fn: () => void) => {
    clearTimeout(timersRef.current[key]);
    timersRef.current[key] = setTimeout(fn, DEBOUNCE_MS);
  };

  const tryCreateProfile = (
    nextRestHr: string,
    nextMaxHr: string,
    nextGender: Gender,
    nextFtp: string,
    nextThresholdPace: string,
  ) => {
    const restNum = Number(nextRestHr);
    const maxNum = Number(nextMaxHr);
    if (!nextRestHr || isNaN(restNum) || restNum < 30 || restNum > 100) return;
    if (!nextMaxHr || isNaN(maxNum) || maxNum < 120 || maxNum > 230) return;
    if (maxNum <= restNum) return;

    const newThresholds: {
      restHr: number;
      maxHr: number;
      ftp?: number;
      thresholdPace?: number;
    } = {
      restHr: restNum,
      maxHr: maxNum,
    };

    const ftpNum = Number(nextFtp);
    if (nextFtp && !isNaN(ftpNum) && ftpNum >= 50 && ftpNum <= 500) {
      newThresholds.ftp = ftpNum;
    }

    const parsedPace = parsePaceInput(nextThresholdPace);
    if (parsedPace !== undefined) {
      newThresholds.thresholdPace = parsedPace;
    }

    startTransition(() =>
      setProfile({
        gender: nextGender,
        thresholds: newThresholds,
        showMetricHelp: true,
      }),
    );
  };

  const save = (field: "restHr" | "maxHr" | "ftp", value: string) => {
    const num = Number(value);

    const constraints: Record<
      string,
      {
        min: number;
        max: number;
        minLabel: string;
        maxLabel: string;
        setError: (e: string) => void;
      }
    > = {
      restHr: {
        min: 30,
        max: 100,
        minLabel: "Min 30 bpm",
        maxLabel: "Max 100 bpm",
        setError: setRestHrError,
      },
      maxHr: {
        min: 120,
        max: 230,
        minLabel: "Min 120 bpm",
        maxLabel: "Max 230 bpm",
        setError: setMaxHrError,
      },
      ftp: {
        min: 50,
        max: 500,
        minLabel: "Min 50W",
        maxLabel: "Max 500W",
        setError: setFtpError,
      },
    };

    const c = constraints[field];

    if (field === "ftp") {
      if (!value) {
        c.setError("");
        if (profile) {
          const current = { ...thresholds! };
          current[field] = undefined;
          startTransition(() => updateThresholds(current));
        }
        return;
      }
    }

    if (!value || isNaN(num)) {
      c.setError("Required");
      return;
    }
    if (num < c.min) {
      c.setError(c.minLabel);
      return;
    }
    if (num > c.max) {
      c.setError(c.maxLabel);
      return;
    }

    if (field === "maxHr" && num <= (Number(restHr) || 0)) {
      c.setError("Max HR must be greater than resting HR");
      return;
    }
    if (field === "restHr" && (Number(maxHr) || Infinity) <= num) {
      c.setError("Resting HR must be less than max HR");
      return;
    }

    c.setError("");

    if (!profile) {
      const nextRestHr = field === "restHr" ? value : restHr;
      const nextMaxHr = field === "maxHr" ? value : maxHr;
      tryCreateProfile(nextRestHr, nextMaxHr, gender, ftp, thresholdPace);
      return;
    }

    const current = { ...thresholds! };
    if (field === "ftp") {
      current[field] = num;
    } else {
      (current as Record<string, number>)[field] = num;
    }

    startTransition(() => updateThresholds(current));
  };

  const saveThresholdPace = (value: string) => {
    if (!value) {
      setThresholdPaceError("");
      if (profile) {
        const current = { ...thresholds! };
        current.thresholdPace = undefined;
        startTransition(() => updateThresholds(current));
      }
      return;
    }

    const parsed = parsePaceInput(value);
    if (parsed === undefined) {
      setThresholdPaceError("Format: m:ss (2:30-9:00)");
      return;
    }

    setThresholdPaceError("");

    if (!profile) {
      tryCreateProfile(restHr, maxHr, gender, ftp, value);
      return;
    }

    const current = { ...thresholds! };
    current.thresholdPace = parsed;
    startTransition(() => updateThresholds(current));
  };

  const handleGenderChange = (v: Gender) => {
    setGender(v);
    if (profile) {
      startTransition(() => updateProfile({ gender: v }));
    } else {
      tryCreateProfile(restHr, maxHr, v, ftp, thresholdPace);
    }
  };

  const handleChange = (
    field: "restHr" | "maxHr" | "ftp",
    value: string,
    setter: (v: string) => void,
  ) => {
    setter(value);
    debounce(field, () => save(field, value));
  };

  const handlePaceChange = (value: string) => {
    setThresholdPace(value);
    debounce("pace", () => saveThresholdPace(value));
  };

  const handleEstimatorSave = (paceSecPerKm: number) => {
    const formatted = formatPaceInput(paceSecPerKm);
    setThresholdPace(formatted);
    setThresholdPaceError("");
    saveThresholdPace(formatted);
  };

  return (
    <Card>
      <CardHeader
        title="Thresholds"
        subtitle="Your heart rate and power baselines"
      />

      <div className="space-y-4">
        <div>
          <Label>Gender</Label>
          <SelectRoot
            value={gender}
            onValueChange={(v) => handleGenderChange(v as Gender)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </SelectRoot>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="thresh-restHr">Resting HR (bpm)</Label>
            <Input
              id="thresh-restHr"
              type="number"
              value={restHr}
              onChange={(e) =>
                handleChange("restHr", e.target.value, setRestHr)
              }
              helperText={restHrError || undefined}
              error={!!restHrError}
            />
          </div>
          <div>
            <Label htmlFor="thresh-maxHr">Max HR (bpm)</Label>
            <Input
              id="thresh-maxHr"
              type="number"
              value={maxHr}
              onChange={(e) => handleChange("maxHr", e.target.value, setMaxHr)}
              helperText={maxHrError || undefined}
              error={!!maxHrError}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="thresh-ftp">
              FTP (watts){" "}
              <span className="text-text-quaternary font-normal">optional</span>
            </Label>
            <Input
              id="thresh-ftp"
              type="number"
              value={ftp}
              onChange={(e) => handleChange("ftp", e.target.value, setFtp)}
              helperText={ftpError || undefined}
              error={!!ftpError}
            />
          </div>
          <div>
            <Label htmlFor="thresh-pace">
              Threshold Pace (min/km){" "}
              <span className="text-text-quaternary font-normal">optional</span>
            </Label>
            <Input
              id="thresh-pace"
              type="text"
              value={thresholdPace}
              onChange={(e) => handlePaceChange(e.target.value)}
              helperText={
                thresholdPaceError || (
                  <div className="flex gap-1 align-center text-accent">
                    <Info size={16} strokeWidth={1.5} className="shrink-0" />
                    <button
                      type="button"
                      className="cursor-pointer hover:underline"
                      onClick={() => setEstimatorOpen(true)}
                    >
                      Estimate from a race time
                    </button>
                  </div>
                )
              }
              error={!!thresholdPaceError}
            />
          </div>
        </div>
      </div>

      <PaceEstimatorDialog
        open={estimatorOpen}
        onOpenChange={setEstimatorOpen}
        onSave={handleEstimatorSave}
      />
    </Card>
  );
};
