'use client';
import { type Binder, type Card } from '@/lib/types';
import { Box } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
import { BinderCardItem } from './BinderCardItem';
import { EmptyCardSlot } from './EmptyCardSlot';

interface BinderGridProps {
  binder: Binder;
  currentPage: number;
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
}

export function BinderGrid({
  binder,
  currentPage,
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
}: BinderGridProps) {
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();

  // Calculate the maximum card size that fits all cards on screen
  const calculateCardSize = () => {
    // Reduced reserved space - be more aggressive about using available space
    const availableHeight = viewportHeight - 150; // Reduced from 200
    const availableWidth = viewportWidth - 20; // Reduced from 40 - minimal padding

    // Minimal spacing
    const spacingPx = 1;

    // Calculate maximum card width based on columns
    const maxCardWidth =
      (availableWidth - (binder.page_columns - 1) * spacingPx) /
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

  // Calculate pagination
  const cardsPerPage = binder.page_columns * binder.page_rows;
  const startIndex = (currentPage - 1) * cardsPerPage;

  // Create card map for quick lookup
  const cardMap = new Map<number, Card>();
  binder.cards?.forEach((card) => {
    cardMap.set(card.index, card);
  });

  // Generate slots for current page
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
    <Box
      p={0}
      m={0}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 150px)', // Reduced from 200px
        overflow: 'hidden', // Prevent scrollbars
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${binder.page_columns}, ${cardWidth}px)`,
          gridTemplateRows: `repeat(${binder.page_rows}, ${cardHeight}px)`,
          gap: `${spacingValue}px`,
          width: 'fit-content',
          margin: 0,
          padding: 0,
        }}
      >
        {slots}
      </div>
    </Box>
  );
}
