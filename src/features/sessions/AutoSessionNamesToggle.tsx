import { startTransition } from 'react';
import { m } from '@/paraglide/messages.js';
import { ListItem } from '@/components/ui/List.tsx';
import { Switch } from '@/components/ui/Switch.tsx';
import { useUserStore } from '@/store/user.ts';

export const AutoSessionNamesToggle = () => {
  const checked = useUserStore((s) => s.profile?.useAutoSessionNames ?? false);

  return (
    <ListItem
      primary={m.ui_settings_auto_session_names()}
      secondary={m.ui_settings_auto_session_names_desc()}
    >
      <Switch
        checked={checked}
        onCheckedChange={() =>
          startTransition(() => useUserStore.getState().toggleAutoSessionNames())
        }
      />
    </ListItem>
  );
};
