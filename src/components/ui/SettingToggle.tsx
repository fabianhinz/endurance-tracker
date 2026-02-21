import { Label } from "./Label.tsx";
import { Switch } from "./Switch.tsx";
import { Typography } from "./Typography.tsx";

interface SettingToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const SettingToggle = (props: SettingToggleProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label>{props.label}</Label>
        <Typography variant="caption" color="quaternary" as="p" className="mt-0.5">
          {props.description}
        </Typography>
      </div>
      <Switch checked={props.checked} onCheckedChange={props.onCheckedChange} />
    </div>
  );
};
