import { useEffect, useRef } from "react";
import { useHoverIntent } from "../../hooks/useHoverIntent.ts";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { SportBadge } from "../../components/ui/SportBadge.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { useMapFocusStore } from "../../store/map-focus.ts";
import { formatDate, formatDistance, formatDuration } from "../../lib/utils.ts";
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
  const navigate = useNavigate();
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
            <Button
              key={session.id}
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-2 text-left"
              onPointerEnter={() => hover.onPointerEnter(session.id)}
              onPointerLeave={hover.onPointerLeave}
              onClick={() => {
                props.onClose();
                navigate(`/training/${session.id}`);
              }}
            >
              <SportBadge sport={session.sport} size="sm" />
              <div className="min-w-0 flex-1">
                <Typography variant="emphasis" className="truncate">
                  {session.name ?? formatDate(session.date)}
                </Typography>
                <Typography variant="caption" as="p">
                  {session.name && <>{formatDate(session.date)} &middot; </>}
                  {formatDistance(session.distance)} &middot;{" "}
                  {formatDuration(session.duration)}
                </Typography>
              </div>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};
