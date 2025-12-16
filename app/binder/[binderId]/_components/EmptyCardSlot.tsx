import { CardSearchSidebar } from '@/components/cards/CardSearchSidebar';
import { ContextMenu } from '@/components/ui/ContextMenu';
import { useAddCardToBinder } from '@/lib/cards/queries.client';
import { getPreferredPokemonCard, type Card } from '@/lib/types';
import { useDroppable } from '@dnd-kit/core';
import { AspectRatio, Box, Image, Paper, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

interface EmptyCardSlotProps {
  slotIndex: number;
  isOwner: boolean;
  binderId: string;
  isDropEnabled?: boolean;
  isPreviewSlot?: boolean;
  previewCard?: Card | null;
  onClick: (index: number) => void;
  onDeleteEmptySlot?: (index: number) => void;
  onInsertBefore?: (index: number) => void;
  onInsertAfter?: (index: number) => void;
}

export function EmptyCardSlot({
  slotIndex,
  isOwner,
  binderId,
  isDropEnabled = true,
  isPreviewSlot = false,
  previewCard = null,
  onClick,
  onDeleteEmptySlot,
  onInsertBefore,
  onInsertAfter,
}: EmptyCardSlotProps) {
  const [searchModalOpened, setSearchModalOpened] = useState(false);
  const { mutate: addCard, isPending } = useAddCardToBinder();

  const handleCardSelect = (pokemonCardId: string) => {
    addCard(
      {
        binderId,
        pokemonCardId,
        index: slotIndex,
      },
      {
        onSuccess: () => {
          notifications.show({
            title: 'Success',
            message: 'Card added to binder',
            color: 'green',
          });
          setSearchModalOpened(false);
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

  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slotIndex}`,
    disabled: !isDropEnabled,
    data: {
      type: 'binder-slot',
      slotIndex,
      binderId,
    },
  });

  const showPreview = isPreviewSlot && previewCard;

  // Context menu handlers
  const handleDeleteEmptySlot = () => {
    console.log('Delete empty slot at index:', slotIndex);
    onDeleteEmptySlot?.(slotIndex);
  };

  const handleInsertBefore = () => {
    console.log('Insert before empty slot at index:', slotIndex);
    onInsertBefore?.(slotIndex);
  };

  const handleInsertAfter = () => {
    console.log(
      'Insert after empty slot at index:',
      slotIndex,
      'inserting at:',
      slotIndex + 1
    );
    onInsertAfter?.(slotIndex + 1);
  };

  // Responsive sizing
  const isMobile = useMediaQuery('(max-width: 480px)');
  const isTablet = useMediaQuery('(max-width: 768px)');

  const getSlotStyles = () => {
    if (isMobile) {
      return {
        padding: 0, // Reduced from 2
        borderRadius: 'sm' as const,
      };
    }
    if (isTablet) {
      return {
        padding: 0, // Reduced from 4
        borderRadius: 'md' as const,
      };
    }
    return {
      padding: 0, // Reduced from 6
      borderRadius: 'lg' as const,
    };
  };

  const slotStyles = getSlotStyles();

  const emptySlotContent = (
    <Box
      style={{
        width: '100%',
        height: '100%',
        minWidth: 'var(--card-min-width)',
      }}
    >
      <div
        ref={setNodeRef}
        className={`
          relative transition-all duration-200 cursor-pointer
          ${isOver ? 'ring-2 ring-blue-400 ring-opacity-75' : ''}
          ${showPreview ? 'ring-2 ring-green-400 ring-opacity-50' : ''}
          ${isPending ? 'opacity-50 pointer-events-none' : ''}
        `}
        onClick={() => isOwner && !isPending && onClick?.(slotIndex)}
      >
        {/* Empty Slot */}
        <Paper
          radius={slotStyles.borderRadius}
          p={slotStyles.padding}
          withBorder
          style={{
            borderStyle: showPreview ? 'solid' : 'dashed',
            background: isOver
              ? 'rgba(0, 100, 255, 0.1)'
              : showPreview
                ? 'rgba(34, 197, 94, 0.1)'
                : undefined,
          }}
          className={`overflow-hidden transition-transform ${showPreview ? 'opacity-30' : ''}`}
        >
          <AspectRatio ratio={63 / 88}>
            <div className="flex h-full w-full items-center justify-center rounded-lg">
              {isOwner && !showPreview ? (
                <Text size="xs" c="dimmed">
                  + add card
                </Text>
              ) : (
                <div />
              )}
            </div>
          </AspectRatio>
        </Paper>

        {/* Preview Card */}
        {showPreview && (
          <div className="absolute inset-0 z-10">
            <Paper
              radius={slotStyles.borderRadius}
              className="overflow-hidden shadow-md opacity-80 ring-2 ring-green-400 ring-opacity-75"
            >
              <AspectRatio ratio={63 / 88}>
                {getPreferredPokemonCard(previewCard!)?.image_large ? (
                  <Image
                    src={getPreferredPokemonCard(previewCard!)?.image_large}
                    alt={getPreferredPokemonCard(previewCard!)?.name || 'card preview'}
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

            {/* Preview indicator */}
            <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
              Preview
            </div>
          </div>
        )}

        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      <CardSearchSidebar
        opened={searchModalOpened}
        onClose={() => setSearchModalOpened(false)}
        onCardSelect={handleCardSelect}
      />
    </Box>
  );

  // Wrap with context menu if owner and handlers are provided
  if (isOwner && onDeleteEmptySlot && onInsertBefore && onInsertAfter) {
    return (
      <ContextMenu
        onDelete={handleDeleteEmptySlot}
        onInsertBefore={handleInsertBefore}
        onInsertAfter={handleInsertAfter}
        disabled={!isOwner}
      >
        {emptySlotContent}
      </ContextMenu>
    );
  }

  return emptySlotContent;
}
