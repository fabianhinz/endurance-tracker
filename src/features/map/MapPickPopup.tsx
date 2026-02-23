import { useEffect, useRef } from "react";
import { useHoverIntent } from "../../hooks/useHoverIntent.ts";
import { X } from "lucide-react";
import { Button } from "../../components/ui/Button.tsx";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { SessionItem } from "../../components/ui/SessionItem.tsx";
import { useMapFocusStore } from "../../store/map-focus.ts";
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

  const flipX = props.info.x > window.innerWidth - 300;
  const flipY = props.info.y > window.innerHeight - 250;

  const style: React.CSSProperties = {
    position: "fixed",
    left: props.info.x,
    top: props.info.y,
    transform: `translate(${flipX ? "-100%" : "0"}, ${flipY ? "-100%" : "0"})`,
    zIndex: 50,
  };

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
          {props.info.sessions.map((session) => (
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
