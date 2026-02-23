import { useEffect, useRef } from "react";
import { useHoverIntent } from "../../hooks/useHoverIntent.ts";
import { X } from "lucide-react";
import { Button } from "../../components/ui/Button.tsx";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { SessionItem } from "../../components/ui/SessionItem.tsx";
import { useMapFocusStore } from "../../store/map-focus.ts";
import { usePopupPosition } from "./use-popup-position.ts";
import type { TrainingSession } from "../../types/index.ts";

export interface PopupInfo {
  x: number;
  y: number;
  sessions: TrainingSession[];
}

interface MapPickPopupProps {
  info: PopupInfo;
  onClose: () => void;
}

export const MapPickPopup = (props: MapPickPopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const hover = useHoverIntent(useMapFocusStore((s) => s.setHoveredSession));
  const onClose = props.onClose;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [onClose]);

  const style = usePopupPosition(props.info.x, props.info.y);

  return (
    <div ref={popupRef} style={style}>
      <Card
        variant="compact"
        className="max-w-[320px] max-h-[300px] flex flex-col overflow-hidden"
      >
        <CardHeader
          title={`${props.info.sessions.length} Sessions`}
          subtitle="Sessions recorded near this location"
          actions={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
          }
        />
        <div className="space-y-1 overflow-y-auto min-h-0">
          {props.info.sessions.toSorted((a, b) => b.date - a.date).map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              size="sm"
              onClick={() => props.onClose()}
              onPointerEnter={() => hover.onPointerEnter(session.id)}
              onPointerLeave={hover.onPointerLeave}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};
