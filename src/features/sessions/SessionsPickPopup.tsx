import { Fragment, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useHoverIntent } from '@/hooks/useHoverIntent.ts';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { SessionItem } from '@/features/sessions/SessionItem.tsx';
import { SessionItemToolbar } from './SessionItemToolbar.tsx';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useExpandCard } from '@/lib/hooks/useExpandCard.ts';
import { usePopupPosition } from '../map/hooks/usePopupPosition.ts';
import { useDismiss } from '../map/hooks/useDismiss.ts';
import { useSessionSparklines } from '../map/hooks/useSessionSparklines.ts';
import { useItemToolbar } from '../map/hooks/useItemToolbar.ts';
import { cn } from '@/lib/utils.ts';
import type { TrainingSession } from '@/engine/types.ts';
import { m } from '@/paraglide/messages.js';
import { SessionSparklines } from './SessionSparklines.tsx';

export interface PopupInfo {
  x: number;
  y: number;
  sessions: TrainingSession[];
}

interface SessionsPickPopupProps {
  info: PopupInfo;
  onClose: () => void;
}

export const SessionsPickPopup = (props: SessionsPickPopupProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);
  const popupRef = useDismiss(props.onClose, !expandCard.isExpanded);
  const hover = useHoverIntent((id) => useMapFocusStore.getState().setHoveredSession(id));
  const toolbar = useItemToolbar();
  const sparklines = useSessionSparklines(toolbar.toggledIds, props.info.sessions);
  const navigate = useNavigate();

  const style = usePopupPosition(props.info.x, props.info.y);

  const sorted = useMemo(
    () => props.info.sessions.toSorted((a, b) => b.date - a.date),
    [props.info.sessions],
  );

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
          {sorted.map((session, index) => {
            if (expandCard.isExpanded) {
              const isHovered = toolbar.hoveredId === session.id;
              const isToggled = toolbar.toggledIds.has(session.id);

              return (
                <Fragment key={session.id}>
                  {index > 0 && <div className="ml-14 border-t border-white/10" />}
                  <SessionItem
                    session={session}
                    size="sm"
                    disableLink
                    onPointerEnter={() => toolbar.onPointerEnter(session.id)}
                    onPointerLeave={toolbar.onPointerLeave}
                    actions={
                      isHovered ? (
                        <SessionItemToolbar
                          onToggleSparkline={() => toolbar.toggleSparkline(session.id)}
                          onOpen={() => {
                            navigate(`/sessions/${session.id}`);
                            props.onClose();
                          }}
                        />
                      ) : undefined
                    }
                  >
                    {isToggled && (
                      <SessionSparklines
                        data={sparklines.data.get(session.id)}
                        domains={sparklines.domains}
                        sport={session.sport}
                        syncId={session.id}
                      />
                    )}
                  </SessionItem>
                </Fragment>
              );
            }

            return (
              <SessionItem
                key={session.id}
                session={session}
                size="sm"
                onClick={() => props.onClose()}
                onPointerEnter={() => hover.onPointerEnter(session.id)}
                onPointerLeave={hover.onPointerLeave}
              />
            );
          })}
        </div>
      </Card>
    </div>,
    document.body,
  );
};
