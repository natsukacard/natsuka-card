'use client';
import { BinderSettingsModal } from '@/components/binders/BinderSettingsModal';
import { CardDetailsModal } from '@/components/cards/CardDetailsModal';
import { CardSearchSidebar } from '@/components/cards/CardSearchSidebar';
import {
  useAddPage,
  useBinder,
  useUpdateCardPositions,
} from '@/lib/binders/queries.client';
import {
  useAddCardToBinder,
  useDeleteCardFromBinder,
  useShiftCardsInBinder,
} from '@/lib/cards/queries.client';
import { getPreferredPokemonCard, type Card } from '@/lib/types';
import { useSidebarStore } from '@/stores/sidebarStore';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  Alert,
  Box,
  AspectRatio,
  Button,
  Container,
  Group,
  Image,
  Loader,
  Paper,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconSettings } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BinderGrid } from './BinderGrid';
import { BinderPagination } from './BinderPagination';

// Add SearchResult type definition
type SearchResult = {
  id: string;
  name: string;
  image_small: string;
  image_large: string;
  set_name: string;
  card_number: string;
  rarity: string;
  match_type: string;
  artist: string;
  year?: number;
};

// Add CardDetails type for the modal
type CardDetails = {
  id: string;
  name: string;
  image_small?: string | null;
  image_large?: string | null;
  set_name?: string;
  card_number?: string;
  rarity?: string;
  artist?: string;
  set_id?: string;
  year?: number | null;
  tcgplayer_product_id?: number | null;
  pokemon_sets?: {
    tcgplayer_group_id?: number | null;
  };
};

interface BinderViewProps {
  binderId: string;
  currentPage: number;
  isOwner: boolean;
}

export function BinderView({
  binderId,
  currentPage,
  isOwner,
}: BinderViewProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [
    cardDetailsOpened,
    { open: openCardDetails, close: closeCardDetails },
  ] = useDisclosure(false);
  const [selectedCard, setSelectedCard] = useState<CardDetails | null>(null);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');

  // Add mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use Zustand store instead of local state
  const {
    searchOpened,
    selectedSlotIndex,
    openSearch,
    closeSearch,
    setSelectedSlotIndex,
  } = useSidebarStore();

  // Move DnD state here
  const [isDragging, setIsDragging] = useState(false);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [previewSlot, setPreviewSlot] = useState<number | null>(null);

  // Add state for tracking search card being dragged
  const [activeSearchCard, setActiveSearchCard] = useState<SearchResult | null>(
    null
  );

  // Edge zone navigation state
  const edgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingEdgeNavigation, setPendingEdgeNavigation] = useState<
    'prev' | 'next' | null
  >(null);
  const dragStateRef = useRef<{
    activeCard: Card | null;
    activeSearchCard: SearchResult | null;
  }>({ activeCard: null, activeSearchCard: null });

  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: binder, isLoading, error } = useBinder(binderId);
  const { mutate: addCard } = useAddCardToBinder();
  const { mutate: reorderCards } = useUpdateCardPositions();
  const { mutate: deleteCard } = useDeleteCardFromBinder();
  const { mutate: shiftCards } = useShiftCardsInBinder();
  const { mutate: addPage } = useAddPage();

  const navigateToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', page.toString());
      router.push(`/binder/${binderId}?${params.toString()}`);
    },
    [binderId, router, searchParams]
  );

  useEffect(() => {
    dragStateRef.current = { activeCard, activeSearchCard };
  }, [activeCard, activeSearchCard]);

  useEffect(() => {
    return () => {
      if (edgeTimerRef.current) {
        clearTimeout(edgeTimerRef.current);
      }
    };
  }, []);

  // DnD sensors - only initialize on client
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleSlotClick = (slotIndex: number) => {
    setSelectedSlotIndex(slotIndex);
    openSearch();
  };

  const handleCardSelect = (pokemonCardId: string) => {
    if (selectedSlotIndex === null) return;

    addCard(
      {
        binderId,
        pokemonCardId,
        index: selectedSlotIndex,
      },
      {
        onSuccess: () => {
          notifications.show({
            title: 'Success',
            message: 'Card added to binder',
            color: 'green',
          });
          closeSearch();
        },
        onError: (error) => {
          notifications.show({
            title: 'Error',
            message: error.message || 'Failed to add card',
            color: 'red',
          });
        },
      }
    );
  };

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    const { active } = event;

    if (active.data.current?.type === 'search-result') {
      // For search results, store the search card data
      setActiveSearchCard(active.data.current.card);
      return;
    }

    const cards = binder?.cards || [];
    const foundCard = cards.find((c: Card) => c.id === active.id);
    if (foundCard) {
      setActiveCard(foundCard);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    const overId = over?.id?.toString() || '';

    if (overId === 'edge-prev' || overId === 'edge-next') {
      setPreviewSlot(null);
      const direction = overId === 'edge-prev' ? 'prev' : 'next';

      if (pendingEdgeNavigation !== direction) {
        if (edgeTimerRef.current) {
          clearTimeout(edgeTimerRef.current);
        }
        setPendingEdgeNavigation(direction);

        edgeTimerRef.current = setTimeout(() => {
          const targetPage =
            direction === 'prev' ? currentPage - 1 : currentPage + 1;
          if (targetPage >= 1 && targetPage <= totalPages) {
            navigateToPage(targetPage);
          }
          setPendingEdgeNavigation(null);
        }, 400);
      }
      return;
    }

    if (edgeTimerRef.current) {
      clearTimeout(edgeTimerRef.current);
      edgeTimerRef.current = null;
    }
    setPendingEdgeNavigation(null);

    if (over && overId.startsWith('slot-')) {
      const slotIndex = parseInt(overId.replace('slot-', ''));
      setPreviewSlot(slotIndex);
    } else {
      setPreviewSlot(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (edgeTimerRef.current) {
      clearTimeout(edgeTimerRef.current);
      edgeTimerRef.current = null;
    }
    setPendingEdgeNavigation(null);

    setIsDragging(false);
    setActiveCard(null);
    setActiveSearchCard(null);
    setPreviewSlot(null);

    if (!over) return;

    const overId = over.id.toString();

    if (overId === 'edge-prev' || overId === 'edge-next') {
      return;
    }

    // Handle search result drops
    if (active.data.current?.type === 'search-result') {
      const pokemonCardId = active.data.current.pokemonCardId;
      const targetSlotIndex = parseInt(overId.replace('slot-', ''));

      const cards = binder?.cards || [];
      const existingCard = cards.find(
        (card: Card) => card.index === targetSlotIndex
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
        binderId,
        pokemonCardId,
        index: targetSlotIndex,
      });
      return;
    }

    // Handle binder card reordering (existing logic)
    const cards = binder?.cards || [];
    const activeCard = cards.find((c: Card) => c.id === active.id);
    if (!activeCard) return;

    const targetSlotIndex = parseInt(overId.replace('slot-', ''));
    if (activeCard.index === targetSlotIndex) return;

    // Create updated cards array with new positions
    const updatedCards = cards.map((card: Card) => {
      if (card.id === activeCard.id) {
        return { id: card.id, index: targetSlotIndex };
      }
      // If another card is at the target slot, swap it
      if (card.index === targetSlotIndex) {
        return { id: card.id, index: activeCard.index };
      }
      return { id: card.id, index: card.index };
    });

    reorderCards({
      binderId,
      cards: updatedCards,
    });
  };

  const handleDeleteCard = (cardId: string, index: number) => {
    console.log('handleDeleteCard called:', { cardId, index });

    // First delete the card
    deleteCard(
      { cardId, binderId },
      {
        onSuccess: () => {
          console.log('Delete card success, now shifting...');
          // Then shift remaining cards back - this will also be optimistic
          shiftCards(
            {
              binderId,
              fromIndex: index,
              insertEmpty: false,
            },
            {
              onSuccess: () => {
                notifications.show({
                  title: 'Success',
                  message: 'Card deleted',
                  color: 'green',
                });
              },
              onError: (error) => {
                console.error('Shift cards error:', error);
                notifications.show({
                  title: 'Error',
                  message: 'Card deleted but failed to reorganize slots',
                  color: 'orange',
                });
              },
            }
          );
        },
        onError: (error) => {
          console.error('Delete card error:', error);
          notifications.show({
            title: 'Error',
            message: error.message || 'Failed to delete card',
            color: 'red',
          });
        },
      }
    );
  };

  const handleInsertEmptySlot = (index: number) => {
    shiftCards(
      {
        binderId,
        fromIndex: index,
        insertEmpty: true,
      },
      {
        onSuccess: () => {
          notifications.show({
            title: 'Success',
            message: 'Empty slot inserted',
            color: 'green',
          });
        },
        onError: (error) => {
          notifications.show({
            title: 'Error',
            message: error.message || 'Failed to insert empty slot',
            color: 'red',
          });
        },
      }
    );
  };

  // Add this new handler in the BinderView component
  const handleDeleteEmptySlot = (index: number) => {
    console.log('handleDeleteEmptySlot called with index:', index);

    // For empty slots, we just need to shift all cards after this index back by 1
    shiftCards(
      {
        binderId,
        fromIndex: index,
        insertEmpty: false, // This will shift cards back (delete operation)
      },
      {
        onSuccess: () => {
          console.log('Delete empty slot success');
          notifications.show({
            title: 'Success',
            message: 'Empty slot removed',
            color: 'green',
          });
        },
        onError: (error) => {
          console.error('Delete empty slot error:', error);
          notifications.show({
            title: 'Error',
            message: error.message || 'Failed to remove empty slot',
            color: 'red',
          });
        },
      }
    );
  };

  const handleAddPage = () => {
    const newPageNumber = totalPages + 1;
    const notificationId = `add-page-${Date.now()}`;
    notifications.show({
      id: notificationId,
      title: 'Page added',
      message: (
        <Text
          size="sm"
          className="cursor-pointer underline"
          onClick={() => {
            notifications.hide(notificationId);
            navigateToPage(newPageNumber);
          }}
        >
          Go to page {newPageNumber}
        </Text>
      ),
      color: 'green',
      autoClose: 5000,
    });
    addPage(
      { binderId, atEnd: true },
      {
        onError: (error) => {
          notifications.show({
            title: 'Error',
            message: error.message || 'Failed to add page',
            color: 'red',
          });
        },
      }
    );
  };

  const handleInsertPage = (page: number, position: 'before' | 'after') => {
    const targetPage = position === 'before' ? page : page + 1;
    const notificationId = `insert-page-${Date.now()}`;
    notifications.show({
      id: notificationId,
      title: 'Page inserted',
      message: (
        <Text
          size="sm"
          className="cursor-pointer underline"
          onClick={() => {
            notifications.hide(notificationId);
            navigateToPage(targetPage);
          }}
        >
          Go to page {targetPage}
        </Text>
      ),
      color: 'green',
      autoClose: 5000,
    });
    addPage(
      { binderId, atEnd: false, beforePage: targetPage },
      {
        onError: (error) => {
          notifications.show({
            title: 'Error',
            message: error.message || 'Failed to insert page',
            color: 'red',
          });
        },
      }
    );
  };


  const handleCardClick = (card: Card) => {
    const pokemonCard = getPreferredPokemonCard(card);
    if (!pokemonCard) return;

    const resolvedSet =
      pokemonCard.pokemon_sets ||
      pokemonCard.pokemon_sets_en ||
      pokemonCard.pokemon_sets_jp ||
      null;
    const releaseDate = resolvedSet?.release_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined;

    setSelectedCard({
      id: card.id,
      name: pokemonCard.name,
      image_small: pokemonCard.image_small,
      image_large: pokemonCard.image_large,
      set_name: resolvedSet?.name || undefined,
      card_number: pokemonCard.number || undefined,
      rarity: pokemonCard.rarity || undefined,
      artist: pokemonCard.artist || undefined,
      year,
      tcgplayer_product_id: pokemonCard.tcgplayer_product_id || undefined,
      pokemon_sets: resolvedSet
        ? {
            tcgplayer_group_id: resolvedSet.tcgplayer_group_id,
          }
        : undefined,
    });
    openCardDetails();
  };

  const handleSearchCardClick = (card: SearchResult) => {
    setSelectedCard({
      id: card.id,
      name: card.name,
      image_small: card.image_small,
      image_large: card.image_large,
      set_name: card.set_name,
      card_number: card.card_number,
      rarity: card.rarity,
      artist: card.artist,
      year: card.year || undefined,
    });
    openCardDetails();
  };

  // Calculate pagination values
  const cardsPerPage = binder?.page_rows * binder?.page_columns || 9;
  const totalCards = binder?.cards?.length || 0;
  const totalPages = Math.ceil(
    (binder?.page_rows * binder?.page_columns * binder?.total_pages || 0) /
      cardsPerPage
  );
  const displayedPages =
    viewMode === 'double'
      ? [currentPage, currentPage + 1].filter(
          (page, index, arr) =>
            page >= 1 &&
            page <= Math.max(totalPages, currentPage) &&
            arr.indexOf(page) === index
        )
      : [currentPage];
  const pageLabel =
    viewMode === 'double' && displayedPages.length > 1
      ? `pages ${displayedPages.join(' & ')}`
      : `page ${displayedPages[0]}`;

  if (isLoading) {
    return (
      <Container size="md" my="lg">
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="md" my="lg">
        <Alert color="red" title="Error">
          Failed to load binder
        </Alert>
      </Container>
    );
  }

  if (!binder) {
    return (
      <Container size="md" my="lg">
        <Alert title="Not found">Binder not found</Alert>
      </Container>
    );
  }

  // Don't render DnD context until mounted on client
  if (!mounted) {
    return (
      <Container size="md" my="lg">
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={2}>{binder.name}</Title>
            <Text c="dimmed">
              {binder.cards?.length || 0} cards | {pageLabel}
            </Text>
          </div>
        </Group>

        {/* Render static grid without DnD until mounted */}
        <Box
          style={{
            width: '100vw',
            marginLeft: 'calc(50% - 50vw)',
            padding: '0 16px',
          }}
        >
          <BinderGrid
            binder={binder}
            pages={displayedPages}
            isOwner={false} // Disable interactions until mounted
            onSlotClick={() => {}}
            isDragging={false}
            activeCard={null}
            previewSlot={null}
            onDeleteCard={undefined}
            onInsertBefore={undefined}
            onInsertAfter={undefined}
            onDeleteEmptySlot={undefined}
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container size="md" my="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>{binder.name}</Title>
          <Text c="dimmed">
            {binder.cards?.length || 0} cards | {pageLabel}
          </Text>
        </div>
        <Group>
          <Button
            variant={viewMode === 'single' ? 'filled' : 'light'}
            onClick={() => setViewMode((mode) => (mode === 'single' ? 'double' : 'single'))}
          >
            {viewMode === 'single' ? 'Single page' : 'Double page'}
          </Button>
          {isOwner && ( // Add this condition
            <Button
              leftSection={<IconSearch size={16} />}
              variant="light"
              onClick={openSearch}
            >
              add cards
            </Button>
          )}
          {isOwner && (
            <Button
              variant="light"
              component={Link}
              href={`/binder/${binderId}/pages`}
            >
              reorder pages
            </Button>
          )}
          {isOwner && (
            <Button
              leftSection={<IconSettings size={16} />}
              variant="light"
              onClick={open}
            >
              settings
            </Button>
          )}
        </Group>
      </Group>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Box
          style={{
            width: '100vw',
            marginLeft: 'calc(50% - 50vw)',
            padding: '0 16px',
          }}
        >
          <BinderGrid
            binder={binder}
            pages={displayedPages}
            isOwner={isOwner}
            onSlotClick={handleSlotClick}
            isDragging={isDragging}
            activeCard={activeCard}
            previewSlot={previewSlot}
            onDeleteCard={handleDeleteCard}
            onInsertBefore={handleInsertEmptySlot}
            onInsertAfter={handleInsertEmptySlot}
            onDeleteEmptySlot={handleDeleteEmptySlot}
            onCardClick={handleCardClick}
            totalPages={totalPages}
          />
        </Box>

        {/* Add the pagination component here */}
        <BinderPagination
          binderId={binderId}
          currentPage={currentPage}
          totalPages={totalPages}
          cardsPerPage={cardsPerPage}
          totalCards={totalCards}
          isOwner={isOwner}
          onAddPage={handleAddPage}
          onInsertPage={handleInsertPage}
        />

        <DragOverlay>
          {activeCard && (
            <Paper
              radius="lg"
              className="overflow-hidden shadow-lg opacity-95"
              style={{ transform: 'rotate(5deg)' }}
            >
              <AspectRatio ratio={63 / 88}>
                {getPreferredPokemonCard(activeCard)?.image_large ? (
                  <Image
                    src={getPreferredPokemonCard(activeCard)?.image_large as string}
                    alt={getPreferredPokemonCard(activeCard)?.name || 'card image'}
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
          {activeSearchCard && (
            <Paper
              radius="lg"
              className="overflow-hidden shadow-lg opacity-95"
              style={{ transform: 'rotate(5deg)' }}
            >
              <AspectRatio ratio={63 / 88}>
                {activeSearchCard.image_large ||
                activeSearchCard.image_small ? (
                  <Image
                    src={
                      activeSearchCard.image_large ||
                      activeSearchCard.image_small
                    }
                    alt={activeSearchCard.name}
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

        <CardSearchSidebar
          opened={searchOpened}
          onClose={closeSearch}
          onCardSelect={handleCardSelect}
          onCardClick={handleSearchCardClick}
        />
      </DndContext>

      <BinderSettingsModal opened={opened} onClose={close} binder={binder} />
      <CardDetailsModal
        opened={cardDetailsOpened}
        onClose={closeCardDetails}
        card={selectedCard}
      />
    </Container>
  );
}
