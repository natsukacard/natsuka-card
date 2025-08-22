'use client';
import { ContextMenu } from '@/components/ui/ContextMenu';
import { type Card } from '@/lib/types';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { AspectRatio, Image, Paper, Text } from '@mantine/core';

interface BinderCardItemProps {
  card: Card;
  isOwner: boolean;
  isDragEnabled?: boolean;
  isPreviewSlot?: boolean;
  previewCard?: Card | null;
  isBeingDragged?: boolean;
  onDelete?: (cardId: string, index: number) => void;
  onInsertBefore?: (index: number) => void;
  onInsertAfter?: (index: number) => void;
  onCardClick?: (card: Card) => void;
}

export function BinderCardItem({
  card,
  isOwner,
  isDragEnabled,
  isPreviewSlot = false,
  previewCard = null,
  isBeingDragged = false,
  onDelete,
  onInsertBefore,
  onInsertAfter,
  onCardClick,
}: BinderCardItemProps) {
  const cardData = card.pokemon_cards;

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: card.id,
    disabled: !isDragEnabled,
  });

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: `slot-${card.index}`,
    disabled: !isDragEnabled,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
        cursor: 'grabbing',
      }
    : undefined;

  // Don't show the original card when it's being dragged (DragOverlay handles it)
  const showOriginalCard = !isDragging && !isBeingDragged;
  const showPreview =
    isPreviewSlot && previewCard && previewCard.id !== card.id;

  const handleDelete = () => {
    onDelete?.(card.id, card.index);
  };

  const handleInsertBefore = () => {
    console.log('Insert before card at index:', card.index);
    onInsertBefore?.(card.index);
  };

  const handleInsertAfter = () => {
    console.log(
      'Insert after card at index:',
      card.index,
      'inserting at:',
      card.index + 1
    );
    onInsertAfter?.(card.index + 1);
  };

  const handleCardClick = () => {
    // Only prevent click if we're in the middle of dragging
    if (isDragging) {
      return;
    }
    onCardClick?.(card);
  };

  const cardContent = (
    <div
      ref={setDroppableNodeRef}
      className="relative transition-all duration-200"
      style={{ opacity: isBeingDragged ? 0.3 : 1 }}
    >
      {/* Original Card */}
      {showOriginalCard && (
        <Paper
          ref={setDraggableNodeRef}
          {...(isDragEnabled ? listeners : {})}
          {...(isDragEnabled ? attributes : {})}
          style={style}
          radius="lg"
          className={`overflow-hidden shadow-sm transition-transform cursor-pointer ${showPreview ? 'opacity-30' : ''}`}
          onClick={handleCardClick}
          data-drag-handle
        >
          <AspectRatio ratio={63 / 88}>
            {cardData?.image_large ? (
              <Image
                src={cardData.image_large}
                alt={cardData.name}
                fit="contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <Text size="xs" c="dimmed">
                  no image available
                </Text>
              </div>
            )}
          </AspectRatio>
        </Paper>
      )}

      {/* Preview Card */}
      {showPreview && previewCard && (
        <Paper
          radius="lg"
          className="absolute inset-0 overflow-hidden shadow-sm border-2 border-blue-300"
        >
          <AspectRatio ratio={63 / 88}>
            {previewCard.pokemon_cards?.image_large ? (
              <Image
                src={previewCard.pokemon_cards.image_large}
                alt={previewCard.pokemon_cards.name}
                fit="contain"
                className="opacity-80"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-50">
                <Text size="xs" c="blue">
                  preview
                </Text>
              </div>
            )}
          </AspectRatio>
        </Paper>
      )}
    </div>
  );

  if (isOwner && onDelete && onInsertBefore && onInsertAfter) {
    return (
      <ContextMenu
        onDelete={handleDelete}
        onInsertBefore={handleInsertBefore}
        onInsertAfter={handleInsertAfter}
        disabled={!isOwner}
      >
        {cardContent}
      </ContextMenu>
    );
  }

  return cardContent;
}
