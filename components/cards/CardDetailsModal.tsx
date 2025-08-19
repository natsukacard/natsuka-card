import { AspectRatio, Group, Image, Modal, Stack, Text } from '@mantine/core';

interface CardDetailsModalProps {
  opened: boolean;
  onClose: () => void;
  card: {
    id: string;
    name: string;
    image_small?: string | null;
    image_large?: string | null;
    set_name?: string;
    card_number?: string;
    rarity?: string;
    artist?: string;
  } | null;
}

export function CardDetailsModal({
  opened,
  onClose,
  card,
}: CardDetailsModalProps) {
  if (!card) return null;

  const imageUrl = card.image_large;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={card.name}
      size="lg"
      centered
    >
      <Stack>
        {imageUrl && (
          <AspectRatio
            ratio={5 / 7}
            style={{ maxWidth: 200, margin: '0 auto' }}
          >
            <Image
              src={imageUrl}
              alt={card.name}
              radius="md"
              fallbackSrc="/placeholder-card.png"
            />
          </AspectRatio>
        )}

        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              name
            </Text>
            <Text size="sm">{card.name}</Text>
          </Group>

          {card.set_name && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                set
              </Text>
              <Text size="sm">{card.set_name}</Text>
            </Group>
          )}
          {card.card_number && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                card number
              </Text>
              <Text size="sm">#{card.card_number}</Text>
            </Group>
          )}

          {card.rarity && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                rarity
              </Text>
              <Text size="sm">{card.rarity}</Text>
            </Group>
          )}

          {card.artist && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                artist
              </Text>
              <Text size="sm">{card.artist}</Text>
            </Group>
          )}
        </Stack>
      </Stack>
    </Modal>
  );
}
