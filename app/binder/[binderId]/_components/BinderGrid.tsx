'use client';
import { type BinderGridProps, type Card } from '@/lib/types';
import { SimpleGrid } from '@mantine/core';
import { useMemo } from 'react';
import { BinderCardItem } from './BinderCardItem';
import { EmptyCardSlot } from './EmptyCardSlot';

export function BinderGrid({
  binder,
  currentPage,
  isOwner,
  onSlotClick,
  isDragging: _isDragging, // Currently not used but may be needed for future features
  activeCard,
  previewSlot,
  onDeleteCard,
  onInsertBefore,
  onInsertAfter,
  onDeleteEmptySlot,
  onCardClick,
}: BinderGridProps & { onCardClick?: (card: Card) => void }) {
  const cardsPerPage = binder.page_rows * binder.page_columns;
  const startIndex = (currentPage - 1) * cardsPerPage;

  // Create a map of cards by their index for quick lookup
  const cardsMap = useMemo(() => {
    const map = new Map<number, Card>();
    (binder.cards || []).forEach((card: Card) => {
      map.set(card.index, card);
    });
    return map;
  }, [binder.cards]);

  const renderSlot = (slotIndex: number) => {
    const card = cardsMap.get(slotIndex);

    if (card) {
      return (
        <BinderCardItem
          key={card.id}
          card={card}
          isOwner={isOwner}
          isDragEnabled={isOwner}
          isPreviewSlot={slotIndex === previewSlot}
          previewCard={activeCard}
          isBeingDragged={activeCard?.id === card.id}
          onDelete={onDeleteCard}
          onInsertBefore={onInsertBefore}
          onInsertAfter={onInsertAfter}
          onCardClick={onCardClick}
        />
      );
    }

    return (
      <EmptyCardSlot
        key={slotIndex}
        slotIndex={slotIndex}
        isOwner={isOwner}
        binderId={binder.id}
        isDropEnabled={isOwner}
        isPreviewSlot={slotIndex === previewSlot}
        previewCard={activeCard}
        onClick={onSlotClick}
        onDeleteEmptySlot={onDeleteEmptySlot}
        onInsertBefore={onInsertBefore}
        onInsertAfter={onInsertAfter}
      />
    );
  };

  const slots = Array.from({ length: cardsPerPage }, (_, i) => {
    const slotIndex = startIndex + i;
    return renderSlot(slotIndex);
  });

  return (
    <SimpleGrid
      cols={binder.page_columns}
      spacing="sm"
      className="mx-auto max-w-fit"
    >
      {slots}
    </SimpleGrid>
  );
}
