'use client';
import { type Binder, type Card } from '@/lib/types';
import { Box } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
import { useDroppable } from '@dnd-kit/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { BinderCardItem } from './BinderCardItem';
import { EmptyCardSlot } from './EmptyCardSlot';

function EdgeZone({
  direction,
  isActive,
}: {
  direction: 'prev' | 'next';
  isActive: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `edge-${direction}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [direction === 'prev' ? 'left' : 'right']: -60,
        width: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isActive ? 1 : 0,
        transition: 'opacity 0.2s ease, background 0.2s ease',
        background: isOver
          ? 'rgba(103, 150, 236, 0.3)'
          : 'rgba(103, 150, 236, 0.1)',
        borderRadius: 8,
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      {direction === 'prev' ? (
        <IconChevronLeft
          size={28}
          style={{
            color: isOver ? '#6796ec' : '#999',
            transition: 'color 0.2s ease',
          }}
        />
      ) : (
        <IconChevronRight
          size={28}
          style={{
            color: isOver ? '#6796ec' : '#999',
            transition: 'color 0.2s ease',
          }}
        />
      )}
    </div>
  );
}

interface BinderGridProps {
  binder: Binder;
  pages: number[];
  isOwner: boolean;
  onSlotClick: (slotIndex: number) => void;
  isDragging: boolean;
  activeCard: Card | null;
  previewSlot: number | null;
  onDeleteCard?: (cardId: string, index: number) => void;
  onInsertBefore?: (index: number) => void;
  onInsertAfter?: (index: number) => void;
  onDeleteEmptySlot?: (index: number) => void;
  onCardClick?: (card: Card) => void;
  totalPages?: number;
}

export function BinderGrid({
  binder,
  pages,
  isOwner,
  onSlotClick,
  isDragging,
  activeCard,
  previewSlot,
  onDeleteCard,
  onInsertBefore,
  onInsertAfter,
  onDeleteEmptySlot,
  onCardClick,
  totalPages = 1,
}: BinderGridProps) {
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();
  const pageCount = Math.max(pages.length, 1);
  const pageGap = 24;

  // Calculate the maximum card size that fits all cards on screen
  const calculateCardSize = () => {
    // Reduced reserved space - be more aggressive about using available space
    const availableHeight = viewportHeight - 150; // Reduced from 200
    const availableWidthPerPage =
      (viewportWidth - 20 - pageGap * (pageCount - 1)) / pageCount;

    // Minimal spacing
    const spacingPx = 1;

    // Calculate maximum card width based on columns
    const maxCardWidth =
      (availableWidthPerPage - (binder.page_columns - 1) * spacingPx) /
      binder.page_columns;

    // Calculate maximum card height based on rows (Pokemon card ratio is 63:88)
    const cardAspectRatio = 88 / 63; // height / width
    const maxCardHeightFromWidth = maxCardWidth * cardAspectRatio;
    const maxCardHeight =
      (availableHeight - (binder.page_rows - 1) * spacingPx) / binder.page_rows;

    // Use the smaller constraint to ensure everything fits
    let finalCardWidth: number;
    if (maxCardHeightFromWidth <= maxCardHeight) {
      // Width is the limiting factor
      finalCardWidth = maxCardWidth;
    } else {
      // Height is the limiting factor
      finalCardWidth = maxCardHeight / cardAspectRatio;
    }

    // Increased minimum and maximum sizes for bigger cards
    finalCardWidth = Math.max(120, Math.min(finalCardWidth, 400)); // Increased min from 80 to 120, max from 300 to 400

    return {
      cardWidth: finalCardWidth,
      cardHeight: finalCardWidth * cardAspectRatio,
      spacingValue: spacingPx,
    };
  };

  const { cardWidth, cardHeight, spacingValue } = calculateCardSize();

  const hasPrevPage = Math.min(...pages) > 1;
  const hasNextPage = Math.max(...pages) < totalPages;
  const showEdgeZones = isDragging && isOwner && activeCard !== null;

  // Calculate pagination
  const cardsPerPage = binder.page_columns * binder.page_rows;

  // Create card map for quick lookup
  const cardMap = new Map<number, Card>();
  binder.cards?.forEach((card) => {
    cardMap.set(card.index, card);
  });

  return (
    <Box
      p={0}
      m={0}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 150px)',
        overflowX: 'auto',
        overflowY: 'hidden',
        position: 'relative',
        padding: '0 12px',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          gap: `${pageGap}px`,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          flexWrap: 'nowrap',
          margin: 0,
          padding: 0,
        }}
      >
        {pages.map((page) => {
          const startIndex = (page - 1) * cardsPerPage;

          const slots = Array.from({ length: cardsPerPage }, (_, pageSlotIndex) => {
            const globalIndex = startIndex + pageSlotIndex;
            const card = cardMap.get(globalIndex);
            const isPreview = previewSlot === globalIndex && isDragging;
            const isBeingDragged = activeCard?.id === card?.id;

            if (card) {
              return (
                <div
                  key={`card-${card.id}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    padding: 0,
                  }}
                >
                  <BinderCardItem
                    card={card}
                    isOwner={isOwner}
                    isDragEnabled={isOwner}
                    isPreviewSlot={isPreview}
                    previewCard={isPreview ? activeCard : null}
                    isBeingDragged={isBeingDragged}
                    onDelete={
                      isOwner && onDeleteCard
                        ? () => onDeleteCard(card.id, card.index)
                        : undefined
                    }
                    onInsertBefore={
                      isOwner && onInsertBefore
                        ? () => onInsertBefore(card.index)
                        : undefined
                    }
                    onInsertAfter={
                      isOwner && onInsertAfter
                        ? () => onInsertAfter(card.index + 1)
                        : undefined
                    }
                    onCardClick={onCardClick ? () => onCardClick(card) : undefined}
                  />
                </div>
              );
            }

            return (
              <div
                key={`slot-${globalIndex}`}
                style={{
                  width: '100%',
                  height: '100%',
                  margin: 0,
                  padding: 0,
                }}
              >
                <EmptyCardSlot
                  slotIndex={globalIndex}
                  isOwner={isOwner}
                  binderId={binder.id}
                  isDropEnabled={true}
                  isPreviewSlot={isPreview}
                  previewCard={activeCard}
                  onClick={onSlotClick}
                  onDeleteEmptySlot={onDeleteEmptySlot}
                  onInsertBefore={onInsertBefore}
                  onInsertAfter={onInsertAfter}
                />
              </div>
            );
          });

          return (
            <div
              key={`page-${page}`}
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: `repeat(${binder.page_columns}, ${cardWidth}px)`,
                gridTemplateRows: `repeat(${binder.page_rows}, ${cardHeight}px)`,
                gap: `${spacingValue}px`,
                width: 'fit-content',
                margin: 0,
                padding: 0,
                flexShrink: 0,
              }}
            >
              {slots}
            </div>
          );
        })}
        {showEdgeZones && hasPrevPage && (
          <EdgeZone direction="prev" isActive={true} />
        )}
        {showEdgeZones && hasNextPage && (
          <EdgeZone direction="next" isActive={true} />
        )}
      </div>
    </Box>
  );
}
