import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useHoverIntent } from '@/hooks/useHoverIntent.ts';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { SessionItem } from '@/features/sessions/SessionItem.tsx';
import { SessionSparklines } from './SessionSparklines.tsx';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useExpandCard } from '@/lib/hooks/useExpandCard.ts';
import { usePopupPosition } from './hooks/usePopupPosition.ts';
import { useDismiss } from './hooks/useDismiss.ts';
import { useSessionSparklines } from './hooks/useSessionSparklines.ts';
import { cn } from '@/lib/utils.ts';
import type { TrainingSession } from '@/engine/types.ts';
import { m } from '@/paraglide/messages.js';

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
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);
  const popupRef = useDismiss(props.onClose, !expandCard.isExpanded);
  const hover = useHoverIntent((id) => useMapFocusStore.getState().setHoveredSession(id));
  const sparklines = useSessionSparklines(expandCard.isExpanded, props.info.sessions);

  const style = usePopupPosition(props.info.x, props.info.y);

  return createPortal(
    <div ref={popupRef} style={style}>
      <Card
        ref={cardRef}
        variant="compact"
        className={cn(
          'flex flex-col overflow-hidden',
          expandCard.isExpanded ? '' : 'w-[380px] max-h-[300px]',
        )}
      >
        <CardHeader
          title={`${props.info.sessions.length} Sessions`}
          subtitle={m.ui_map_popup_sessions_subtitle()}
          actions={
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={expandCard.isExpanded ? 'Collapse' : 'Expand'}
                onClick={expandCard.toggle}
              >
                {expandCard.isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={m.ui_btn_close()}
                onClick={props.onClose}
              >
                <X size={16} />
              </Button>
            </>
          }
        />
        <div
          className={cn('overflow-y-auto min-h-0', expandCard.isExpanded ? 'flex-1' : 'space-y-1')}
        >
          {props.info.sessions
            .toSorted((a, b) => b.date - a.date)
            .map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                size="sm"
                onClick={() => props.onClose()}
                onPointerEnter={() => hover.onPointerEnter(session.id)}
                onPointerLeave={hover.onPointerLeave}
                sparklineContent={
                  expandCard.isExpanded ? (
                    <SessionSparklines
                      data={sparklines.data.get(session.id)}
                      domains={sparklines.domains}
                      sport={session.sport}
                      syncId={session.id}
                    />
                  ) : undefined
                }
              />
            ))}
        </div>
      </Card>
    </div>,
    document.body,
  );
};
