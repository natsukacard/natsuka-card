import {
  TCGCSVApiResponse,
  TCGPlayerPricing,
  TCGPlayerProduct,
} from '@/lib/types';
import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = 'https://tcgcsv.com/tcgplayer';

export const useCardPrice = (
  groupId: number | null | undefined,
  cardName: string | undefined,
  cardNumber: string | undefined,
  cardRarity?: string | undefined
) => {
  return useQuery({
    queryKey: [
      'tcgplayer-card-price',
      groupId,
      cardName,
      cardNumber,
      cardRarity,
    ],
    queryFn: async () => {
      if (!groupId || !cardName || !cardNumber) return null;

      console.log(
        `[useCardPrice] Looking for card: ${cardName} #${cardNumber} (${cardRarity}) in group ${groupId}`
      );

      try {
        // Step 1: Fetch all products for this group
        const productsResponse = await fetch(
          `${API_BASE_URL}/3/${groupId}/products`
        );

        if (!productsResponse.ok) {
          console.error(
            `[useCardPrice] Products API failed: ${productsResponse.status}`
          );
          return null;
        }

        const productsData: TCGCSVApiResponse<TCGPlayerProduct> =
          await productsResponse.json();

        if (!productsData.success || !productsData.results) {
          console.error(
            '[useCardPrice] Invalid products response:',
            productsData
          );
          return null;
        }

        const products = productsData.results;
        console.log(
          `[useCardPrice] Found ${products.length} products in group ${groupId}`
        );

        // Step 2: Find the BEST matching product
        let bestMatch: TCGPlayerProduct | null = null;
        let bestScore = 0;

        for (const product of products) {
          let score = 0;

          // Exact number match (highest priority) - handle leading zeros
          const numberData = product.extendedData?.find(
            (data) => data.name === 'Number'
          );
          const productNumber = numberData?.value.split('/')[0];

          // Normalize both numbers by removing leading zeros for comparison
          const normalizedCardNumber = cardNumber.replace(/^0+/, ''); // "049" -> "49"
          const normalizedProductNumber =
            productNumber?.replace(/^0+/, '') || ''; // "049" -> "49"

          console.log(
            `[useCardPrice] Comparing: "${cardNumber}" vs "${productNumber}" (normalized: "${normalizedCardNumber}" vs "${normalizedProductNumber}")`
          );

          // Try multiple matching strategies
          if (productNumber === cardNumber) {
            score += 100; // Exact match (e.g., "049" === "049")
            console.log(
              `[useCardPrice] Exact number match for ${product.cleanName}`
            );
          } else if (normalizedProductNumber === normalizedCardNumber) {
            score += 100; // Normalized match (e.g., "049" normalized === "49" normalized)
            console.log(
              `[useCardPrice] Normalized number match for ${product.cleanName}`
            );
          } else if (productNumber === cardNumber.padStart(3, '0')) {
            score += 100; // Padded match (e.g., "049" === "49".padStart(3, '0'))
            console.log(
              `[useCardPrice] Padded number match for ${product.cleanName}`
            );
          }

          // Name similarity
          const normalizedCardName = cardName.toLowerCase().trim();
          const normalizedProductName =
            product.cleanName?.toLowerCase().trim() || '';
          if (normalizedProductName.includes(normalizedCardName)) {
            score += 50;
            console.log(`[useCardPrice] Name match for ${product.cleanName}`);
          }

          // Rarity matching (if available)
          if (cardRarity) {
            const rarityData = product.extendedData?.find(
              (data) => data.name === 'Rarity'
            );
            if (rarityData) {
              const productRarity = rarityData.value.toLowerCase();
              const searchRarity = cardRarity.toLowerCase();

              if (productRarity === searchRarity) {
                score += 30;
                console.log(
                  `[useCardPrice] Rarity match for ${product.cleanName}`
                );
              }
            }
          }

          // Update best match
          if (score > bestScore) {
            bestScore = score;
            bestMatch = product;
            console.log(
              `[useCardPrice] New best match: ${product.cleanName} (Score: ${score})`
            );
          }
        }

        if (!bestMatch) {
          console.warn(
            `[useCardPrice] No matching product found for ${cardName} #${cardNumber} (${cardRarity})`
          );

          // Show all products with similar numbers for debugging
          const similarNumberProducts = products.filter((p) => {
            const numberData = p.extendedData?.find((d) => d.name === 'Number');
            const productNumber = numberData?.value.split('/')[0];
            const normalizedProductNumber =
              productNumber?.replace(/^0+/, '') || '';
            const normalizedCardNumber = cardNumber.replace(/^0+/, '');
            return normalizedProductNumber === normalizedCardNumber;
          });

          console.log(
            '[useCardPrice] Products with similar numbers:',
            similarNumberProducts.map((p) => {
              const number = p.extendedData?.find(
                (d) => d.name === 'Number'
              )?.value;
              const rarity = p.extendedData?.find(
                (d) => d.name === 'Rarity'
              )?.value;
              return `${p.cleanName}: #${number} (${rarity})`;
            })
          );

          return null;
        }

        console.log(
          `[useCardPrice] Best match: ${bestMatch.name} (ID: ${bestMatch.productId}, Score: ${bestScore})`
        );

        // Step 3: Fetch pricing for this specific product
        const pricesResponse = await fetch(
          `${API_BASE_URL}/3/${groupId}/prices`
        );

        if (!pricesResponse.ok) {
          console.error(
            `[useCardPrice] Prices API failed: ${pricesResponse.status}`
          );
          return null;
        }

        const pricesData: TCGCSVApiResponse<TCGPlayerPricing> =
          await pricesResponse.json();

        if (!pricesData.success || !pricesData.results) {
          console.error('[useCardPrice] Invalid prices response:', pricesData);
          return null;
        }

        const prices = pricesData.results;

        // Get all price variants for this product
        const productPrices = prices.filter(
          (price) => price.productId === bestMatch!.productId
        );

        if (productPrices.length === 0) {
          console.warn(
            `[useCardPrice] Price not found for product ID: ${bestMatch!.productId}`
          );
          return null;
        }

        console.log(
          `[useCardPrice] Found ${productPrices.length} price variants for ${cardName} (${bestMatch!.name})`
        );

        // Return all price variants
        return {
          product: bestMatch!,
          prices: productPrices,
        };
      } catch (error) {
        console.error('[useCardPrice] Error:', error);
        return null;
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!groupId && !!cardName && !!cardNumber,
  });
};

export const useCardPrices = (tcgplayerProductId: number | undefined) => {
  return useQuery({
    queryKey: ['tcgplayer-product-price', tcgplayerProductId],
    queryFn: async () => {
      console.log(
        `[useCardPrices] Query started for productId: ${tcgplayerProductId}`
      );
      if (!tcgplayerProductId) return null;
      throw new Error('Need group ID to fetch prices efficiently');
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!tcgplayerProductId,
  });
};

export const useCardPricesWithGroup = (groupId: number | null | undefined) => {
  return useQuery({
    queryKey: ['tcgplayer-group-prices', groupId],
    queryFn: async () => {
      if (!groupId) return null;

      const response = await fetch(`${API_BASE_URL}/3/${groupId}/prices`);
      if (!response.ok) {
        throw new Error('Failed to fetch TCGplayer group prices');
      }

      // Handle wrapped response format
      const pricesData: TCGCSVApiResponse<TCGPlayerPricing> =
        await response.json();
      if (!pricesData.success || !pricesData.results) {
        throw new Error('Invalid prices response format');
      }

      const prices = pricesData.results;
      if (prices.length > 0) {
        return prices[0].marketPrice;
      }
      return null;
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!groupId,
  });
};
