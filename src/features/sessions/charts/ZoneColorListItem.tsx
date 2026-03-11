import { Switch } from '@/components/ui/Switch.tsx';
import { ListItem } from '@/components/ui/List.tsx';
import { m } from '@/paraglide/messages.js';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import type { ZoneColorMode } from '@/features/map/zoneColoredPath.ts';

interface ZoneColorListItemProps {
  availableModes: ZoneColorMode[];
}

export const ZoneColorListItem = (props: ZoneColorListItemProps) => {
  const zoneColorMode = useMapFocusStore((s) => s.zoneColorMode);
  const isActive = zoneColorMode !== null;

  const handleToggle = (checked: boolean) => {
    useMapFocusStore.getState().setZoneColorMode(checked ? props.availableModes[0] : null);
  };

  return (
    <ListItem primary={m.ui_zone_color_title()} secondary={m.ui_zone_color_desc()}>
      <Switch checked={isActive} onCheckedChange={handleToggle} />
    </ListItem>
  );
};
