'use client';
import { type Binder, type Card } from '@/lib/types';
import { SimpleGrid } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { BinderCardItem } from './BinderCardItem';
import { EmptyCardSlot } from './EmptyCardSlot';

interface BinderGridProps {
  binder: Binder;
  currentPage: number;
  isOwner: boolean;
  onSlotClick?: (slotIndex: number) => void;
  isDragging: boolean;
  activeCard: Card | null;
  previewSlot: number | null;
}

export function BinderGrid({
  binder,
  currentPage,
  isOwner,
  onSlotClick,
  isDragging,
  activeCard,
  previewSlot,
}: BinderGridProps) {
  const [isClient, setIsClient] = useState(false);
  const { page_rows, page_columns, cards } = binder;
  const cardsPerPage = page_rows * page_columns;

  const validCards = useMemo(
    () =>
      (cards || [])
        .filter((card) => card.index !== null && card.index !== undefined)
        .sort((a, b) => a.index - b.index),
    [cards]
  );

  const [transientCards, setTransientCards] = useState<Card[]>(validCards);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isDragging) setTransientCards(validCards);
  }, [validCards, isDragging]);

  const { mutate: reorderCards } = useUpdateCardPositions();
  const { mutate: addCard } = useAddCardToBinder();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    const draggedCard = transientCards.find((c) => c.id === event.active.id);
    setActiveCard(draggedCard || null);
  };

  const rafId = useRef<number | null>(null);
  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const over = event.over;
      if (over) {
        const targetSlotIndex = parseInt(
          over.id.toString().replace('slot-', '')
        );
        setPreviewSlot((prev) =>
          prev === targetSlotIndex ? prev : targetSlotIndex
        );
      } else {
        setPreviewSlot((prev) => (prev === null ? prev : null));
      }
    });
  }, []);
  useEffect(
    () => () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    },
    []
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset all drag states
    setIsDragging(false);
    setActiveCard(null);
    setPreviewSlot(null);

    if (!over) {
      return;
    }

    if (active.data.current?.type === 'search-result') {
      const pokemonCardId = active.data.current.pokemonCardId;
      const targetSlotIndex = parseInt(over.id.toString().replace('slot-', ''));

      const existingCard = transientCards.find(
        (card) => card.index === targetSlotIndex
      );
      if (existingCard) {
        notifications.show({
          title: 'Error',
          message: 'This slot is already occupied',
          color: 'red',
        });
        return;
      }

      addCard({
        binderId: binder.id,
        pokemonCardId,
        index: targetSlotIndex,
      });
      return;
    }

    const activeCard = transientCards.find((c) => c.id === active.id);
    if (!activeCard) {
      console.error('Active card not found:', active.id);
      return;
    }

    // Extract target slot index from the over ID
    const targetSlotIndex = parseInt(over.id.toString().replace('slot-', ''));
    const sourceIndex = activeCard.index;

    if (sourceIndex === targetSlotIndex) {
      return;
    }

    // Find if there's already a card at the target position
    const targetCard = transientCards.find(
      (card) => card.index === targetSlotIndex
    );

    let newCards: Card[];
    const cardsToUpdate: { id: string; index: number }[] = [];

    if (targetCard) {
      // SWAP: There's a card at target position, swap them
      newCards = transientCards.map((card) => {
        if (card.id === activeCard.id) {
          cardsToUpdate.push({ id: card.id, index: targetSlotIndex });
          return { ...card, index: targetSlotIndex };
        }
        if (card.id === targetCard.id) {
          cardsToUpdate.push({ id: card.id, index: sourceIndex });
          return { ...card, index: sourceIndex };
        }
        return card;
      });
    } else {
      // MOVE TO EMPTY SLOT: No card at target position, just move active card
      newCards = transientCards.map((card) => {
        if (card.id === activeCard.id) {
          cardsToUpdate.push({ id: card.id, index: targetSlotIndex });
          return { ...card, index: targetSlotIndex };
        }
        return card;
      });
    }

    // Optimistic UI update (local transient only)
    setTransientCards(newCards);

    // Server update through React Query mutation - only update the cards that changed
    reorderCards({
      binderId: binder.id,
      cards: cardsToUpdate,
    });
  };

  // Calculate page slots
  const pageStartIndex = (currentPage - 1) * cardsPerPage;
  const pageEndIndex = pageStartIndex + cardsPerPage - 1;

  const pageCards = transientCards.filter(
    (card) => card.index >= pageStartIndex && card.index <= pageEndIndex
  );
  // Map lookup to avoid O(n^2) find operations.
  const cardByIndex = useMemo(() => {
    const m = new Map<number, Card>();
    for (const c of pageCards) m.set(c.index, c);
    return m;
  }, [pageCards]);

  const pageSlots = useMemo(
    () =>
      Array.from({ length: cardsPerPage }, (_, index) => {
        const slotIndex = pageStartIndex + index;
        return { slotIndex, card: cardByIndex.get(slotIndex) };
      }),
    [cardsPerPage, pageStartIndex, cardByIndex]
  );

  const GridContent = () => (
    <>
      <SimpleGrid cols={page_columns} spacing="sm" mb="lg">
        {pageSlots.map(({ slotIndex, card }) =>
          card ? (
            <BinderCardItem
              key={card.id}
              card={card}
              isOwner={isOwner}
              isDragEnabled={isClient && isOwner}
              isPreviewSlot={previewSlot === slotIndex}
              previewCard={previewSlot === slotIndex ? activeCard : null}
              isBeingDragged={activeCard?.id === card.id}
            />
          ) : (
            <EmptyCardSlot
              key={slotIndex}
              slotIndex={slotIndex}
              isOwner={isOwner}
              binderId={binder.id}
              isDropEnabled={isClient && isOwner}
              isPreviewSlot={previewSlot === slotIndex}
              previewCard={previewSlot === slotIndex ? activeCard : null}
              onSlotClick={onSlotClick}
            />
          )
        )}
      </SimpleGrid>

      <DragOverlay>
        {activeCard && (
          <Paper
            radius="lg"
            className="overflow-hidden shadow-lg opacity-80"
            style={{ transform: 'rotate(5deg)' }}
          >
            <AspectRatio ratio={63 / 88}>
              {activeCard.pokemon_cards?.image_large ? (
                <Image
                  src={activeCard.pokemon_cards.image_large}
                  alt={activeCard.pokemon_cards.name}
                  fit="contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <Text size="xs" c="dimmed">
                    no image
                  </Text>
                </div>
              )}
            </AspectRatio>
          </Paper>
        )}
      </DragOverlay>
    </>
  );

  // Render static version during SSR, DnD version after hydration
  if (!isClient) {
    return <GridContent />;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <GridContent />

      {/* Drag Overlay - shows the card being dragged */}
      <DragOverlay>
        {activeCard ? (
          <div className="rotate-2 scale-105 shadow-2xl opacity-90">
            <Paper radius="lg" className="overflow-hidden">
              <AspectRatio ratio={63 / 88}>
                {activeCard.pokemon_cards?.image_large ? (
                  <Image
                    src={activeCard.pokemon_cards.image_large}
                    alt={activeCard.pokemon_cards.name}
                    fit="contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <Text size="xs" c="dimmed">
                      no image
                    </Text>
                  </div>
                )}
              </AspectRatio>
            </Paper>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
