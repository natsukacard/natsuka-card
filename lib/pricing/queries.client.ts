import {
  TCGCSVApiResponse,
  TCGPlayerPricing,
  TCGPlayerProduct,
} from '@/lib/types';
import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = 'https://tcgcsv.com/tcgplayer';

// Helper function to find best product match (extracted for clarity)
const findBestProductMatch = (
  products: TCGPlayerProduct[],
  cardName: string,
  cardNumber: string,
  cardRarity?: string
): { match: TCGPlayerProduct | null; score: number } => {
  // Pre-normalize search criteria once
  const normalizedCardName = cardName.toLowerCase().trim();
  const normalizedCardNumber = cardNumber.replace(/^0+/, '');

  let bestMatch: TCGPlayerProduct | null = null;
  let bestScore = 0;

  for (const product of products) {
    let score = 0;

    // Number matching logic (optimized)
    const numberData = product.extendedData?.find(
      (data) => data.name === 'Number'
    );
    const productNumber = numberData?.value.split('/')[0];

    if (productNumber) {
      const normalizedProductNumber = productNumber.replace(/^0+/, '');

      if (productNumber === cardNumber) {
        score += 100; // Exact match
      } else if (normalizedProductNumber === normalizedCardNumber) {
        score += 100; // Normalized match
      } else if (productNumber === cardNumber.padStart(3, '0')) {
        score += 100; // Padded match
      }
    }

    // Name similarity
    const normalizedProductName = product.cleanName?.toLowerCase().trim() || '';
    if (normalizedProductName.includes(normalizedCardName)) {
      score += 50;
    }

    // Rarity matching
    if (cardRarity) {
      const rarityData = product.extendedData?.find(
        (data) => data.name === 'Rarity'
      );
      if (rarityData?.value.toLowerCase() === cardRarity.toLowerCase()) {
        score += 30;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  return { match: bestMatch, score: bestScore };
};

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

      try {
        // Parallel API calls for better performance
        const [productsResponse, pricesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/3/${groupId}/products`),
          fetch(`${API_BASE_URL}/3/${groupId}/prices`),
        ]);

        if (!productsResponse.ok || !pricesResponse.ok) {
          return null;
        }

        const [productsData, pricesData] = await Promise.all([
          productsResponse.json() as Promise<
            TCGCSVApiResponse<TCGPlayerProduct>
          >,
          pricesResponse.json() as Promise<TCGCSVApiResponse<TCGPlayerPricing>>,
        ]);

        if (
          !productsData.success ||
          !pricesData.success ||
          !productsData.results ||
          !pricesData.results
        ) {
          return null;
        }

        const products = productsData.results;
        const prices = pricesData.results;

        // Find best match using optimized function
        const { match: bestMatch, score } = findBestProductMatch(
          products,
          cardName,
          cardNumber,
          cardRarity
        );

        if (!bestMatch || score === 0) {
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `[useCardPrice] No match found for ${cardName} #${cardNumber}`
            );
          }
          return null;
        }

        // Filter prices for the matched product
        const productPrices = prices.filter(
          (price) => price.productId === bestMatch.productId
        );

        if (productPrices.length === 0) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `[useCardPrice] No prices found for product ${bestMatch.productId}`
            );
          }
          return null;
        }

        return {
          product: bestMatch,
          prices: productPrices,
        };
      } catch (error) {
        // Only log errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('[useCardPrice] Error:', error);
        }
        return null;
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    enabled: !!groupId && !!cardName && !!cardNumber,
  });
};

// Clean up the other hooks too
export const useCardPrices = (tcgplayerProductId: number | undefined) => {
  return useQuery({
    queryKey: ['tcgplayer-product-price', tcgplayerProductId],
    queryFn: async () => {
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

      const pricesData: TCGCSVApiResponse<TCGPlayerPricing> =
        await response.json();
      if (!pricesData.success || !pricesData.results) {
        throw new Error('Invalid prices response format');
      }

      const prices = pricesData.results;
      return prices.length > 0 ? prices[0].marketPrice : null;
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!groupId,
  });
};
