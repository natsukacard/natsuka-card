"use client";
import { useBinder, useReorderBinderPages } from '@/lib/binders/queries.client';
import { Card as BinderCardType, getPreferredPokemonCard } from '@/lib/types';
import {
  Alert,
  AspectRatio,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';

interface PagesReorderViewProps {
  binderId: string;
}

const PageTile = ({
  page,
  cardCount,
  previewImages,
  columns,
  onClick,
}: {
  page: number;
  cardCount: number;
  previewImages: (string | null)[];
  columns: number;
  onClick: () => void;
}) => {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `page-drop-${page}`,
    data: { type: 'page', page },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `page-drag-${page}`,
    data: { type: 'page', page },
  });

  const setRefs = (node: HTMLElement | null) => {
    setDropRef(node);
    setDragRef(node);
  };

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 5,
    }
    : undefined;

  return (
    <Paper
      ref={setRefs}
      {...listeners}
      {...attributes}
      onClick={onClick}
      shadow={isDragging ? 'lg' : 'sm'}
      radius="md"
      withBorder
      style={{
        cursor: 'grab',
        borderColor: isOver ? '#6796ec' : undefined,
        background: isOver
          ? 'rgba(103,150,236,0.1)'
          : isDragging
            ? 'rgba(103,150,236,0.15)'
            : 'white',
        ...style,
      }}
    >
      <Stack gap="xs" p="sm">
        <Group justify="space-between" align="center">
          <Text fw={700}>Page {page}</Text>
          <Text size="sm" c="dimmed">
            {cardCount} cards
          </Text>
        </Group>
        <SimpleGrid cols={columns} spacing={6}>
          {previewImages.map((src, idx) => (
            <AspectRatio key={idx} ratio={63 / 88}>
              {src ? (
                <img
                  src={src}
                  alt={`page-${page}-preview-${idx}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 6,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 6,
                    background: '#f1f3f5',
                  }}
                />
              )}
            </AspectRatio>
          ))}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
};

export function PagesReorderView({ binderId }: PagesReorderViewProps) {
  const { data: binder, isLoading, error } = useBinder(binderId);
  const { mutate: reorderPages } = useReorderBinderPages();
  const [activePage, setActivePage] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const cardsPerPage = useMemo(() => {
    if (!binder) return 0;
    return binder.page_rows * binder.page_columns;
  }, [binder]);

  const pages = useMemo(() => {
    if (!binder || !cardsPerPage) return [] as { page: number; cards: BinderCardType[] }[];
    return Array.from({ length: binder.total_pages }, (_, idx) => {
      const pageNumber = idx + 1;
      const start = idx * cardsPerPage;
      const end = start + cardsPerPage - 1;
      const pageCards = (binder.cards || []).filter(
        (card: BinderCardType) => card.index >= start && card.index <= end
      );
      return { page: pageNumber, cards: pageCards };
    });
  }, [binder, cardsPerPage]);

  const handleDragStart = (event: DragStartEvent) => {
    const page = event.active.data.current?.page as number | undefined;
    if (page) setActivePage(page);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePage(null);
    const sourcePage = event.active.data.current?.page as number | undefined;
    const targetPage = event.over?.data.current?.page as number | undefined;

    if (!sourcePage || !targetPage || sourcePage === targetPage) return;

    reorderPages(
      { binderId, sourcePage, targetPage },
      {
        onSuccess: () => {
          notifications.show({
            title: 'Pages reordered',
            message: `Moved page ${sourcePage} to position ${targetPage}`,
            color: 'green',
          });
        },
        onError: (err) => {
          notifications.show({
            title: 'Error',
            message: err.message || 'Failed to reorder pages',
            color: 'red',
          });
        },
      }
    );
  };

  if (!mounted || isLoading) {
    return (
      <Container size="lg" my="xl">
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      </Container>
    );
  }

  if (error || !binder) {
    return (
      <Container size="lg" my="xl">
        <Alert color="red" title="Error">
          Failed to load binder
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" my="xl">
      <Group justify="space-between" align="center" mb="lg">
        <div>
          <Title order={2}>Reorder pages</Title>
          <Text c="dimmed">Drag pages to change their order</Text>
        </div>
        <Group>
          <Button variant="subtle" component={Link} href={`/binder/${binderId}`}>
            Back to binder
          </Button>
        </Group>
      </Group>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {pages.map(({ page, cards }) => (
            <PageTile
              key={page}
              page={page}
              cardCount={cards.length}
              columns={binder.page_columns}
              previewImages={Array.from({ length: cardsPerPage }).map((_, i) => {
                const slotIndex = (page - 1) * cardsPerPage + i;
                const card = cards.find((c: BinderCardType) => c.index === slotIndex);
                return card
                  ? getPreferredPokemonCard(card)?.image_small ||
                  getPreferredPokemonCard(card)?.image_large ||
                  null
                  : null;
              })}
              onClick={() => notifications.show({
                title: 'Page selected',
                message: `Drag to move page ${page}`,
                color: 'blue',
                autoClose: 1500,
              })}
            />
          ))}
        </SimpleGrid>

        <DragOverlay>
          {activePage ? (
            <Paper radius="md" withBorder shadow="lg" p="md">
              <Text fw={700}>Page {activePage}</Text>
            </Paper>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Container>
  );
}
