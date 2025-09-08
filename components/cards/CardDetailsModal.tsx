import { useCardPrice } from '@/lib/pricing/queries.client';
import {
  Anchor,
  AspectRatio,
  Group,
  Image,
  Loader,
  Modal,
  Stack,
  Text,
} from '@mantine/core';

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
    year?: number | null;
    tcgplayer_product_id?: number | null;
    pokemon_sets?: {
      tcgplayer_group_id?: number | null;
    };
  } | null;
}

export function CardDetailsModal({
  opened,
  onClose,
  card,
}: CardDetailsModalProps) {
  const groupId = card?.pokemon_sets?.tcgplayer_group_id;
  const cardName = card?.name;
  const cardNumber = card?.card_number;
  const cardRarity = card?.rarity;

  // Use the new dynamic pricing hook
  const {
    data: priceData,
    isLoading: isLoadingPrice,
    error,
  } = useCardPrice(groupId, cardName, cardNumber, cardRarity);

  if (!card) return null;

  const imageUrl = card.image_large;
  const product = priceData?.product;
  const prices = priceData?.prices || [];
  const productUrl = product?.url;

  // Fallback URL if no direct product URL
  const finalUrl =
    productUrl ||
    (cardName && cardNumber
      ? `https://www.tcgplayer.com/search/pokemon-cards?q=${encodeURIComponent(cardName)}+${cardNumber}&productLineName=pokemon-cards`
      : null);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      centered
      radius="lg"
      padding="xl"
      className="lowercase"
      title={`${card.year ? `${card.year} ` : ''}${card.set_name || ''} - ${card.name} #${card.card_number || ''}`.trim()}
      styles={{
        header: { display: 'flex', alignItems: 'center' },
        title: { flex: 1, textAlign: 'center' },
      }}
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

          {/* Market Prices Section */}
          <Group
            justify="space-between"
            align="flex-start"
            className="lowercase"
          >
            <Text size="sm" c="dimmed">
              market prices
            </Text>
            <Stack gap={4} style={{ minWidth: 120 }}>
              {isLoadingPrice ? (
                <Loader size="xs" />
              ) : error ? (
                <Text size="sm" c="red">
                  Error loading price
                </Text>
              ) : prices.length > 0 ? (
                prices.map((price, index) => (
                  <Group
                    key={index}
                    justify="space-between"
                    gap="xs"
                    className="lowercase"
                  >
                    <Text size="xs" c="dimmed">
                      {price.subTypeName || 'Standard'}
                    </Text>
                    {finalUrl ? (
                      <Anchor
                        href={finalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        style={{
                          color: '#228be6',
                          textDecoration: 'underline',
                        }}
                      >
                        ${price.marketPrice?.toFixed(2) || 'N/A'}
                      </Anchor>
                    ) : (
                      <Text size="sm">
                        ${price.marketPrice?.toFixed(2) || 'N/A'}
                      </Text>
                    )}
                  </Group>
                ))
              ) : (
                <Text size="sm">-</Text>
              )}
            </Stack>
          </Group>
        </Stack>
      </Stack>
    </Modal>
  );
}
