import { createClient } from '@/lib/supabase/client';
import type { Binder, Card } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type SortOption =
  | 'relevance'
  | 'name'
  | 'set'
  | 'rarity'
  | 'artist'
  | 'number'
  | 'release_date';
type SortDirection = 'asc' | 'desc';

interface SearchFilters {
  setFilter?: string;
  rarityFilter?: string;
  sortBy?: SortOption;
  sortDirection?: SortDirection;
}

const searchPokemonCards = async (
  searchTerm: string,
  filters: SearchFilters = {}
) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }

  const supabase = createClient();

  console.log('Searching for:', searchTerm, 'with filters:', filters);

  const { data, error } = await supabase.rpc('search_cards', {
    search_term: searchTerm,
    set_filter: filters.setFilter || null,
    rarity_filter: filters.rarityFilter || null,
    sort_by: filters.sortBy || 'relevance',
    sort_direction: filters.sortDirection || 'desc',
  });

  if (error) {
    console.error('Search error:', error);
    throw new Error(error.message);
  }

  console.log('Search results:', data);
  return data || [];
};

export const useSearchPokemonCards = (
  searchTerm: string,
  filters: SearchFilters = {}
) => {
  return useQuery({
    queryKey: ['pokemon_card_search', searchTerm, filters],
    queryFn: () => searchPokemonCards(searchTerm, filters),
    enabled: !!searchTerm.trim() && searchTerm.length >= 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

const addCardToBinder = async ({
  binderId,
  pokemonCardId,
  index,
}: {
  binderId: string;
  pokemonCardId: string;
  index: number;
}) => {
  const supabase = createClient();

  // Use 'cards' table to match the server queries
  const { data, error } = await supabase
    .from('cards')
    .insert({
      binder_id: binderId,
      pokemon_card_id: pokemonCardId,
      index: index,
      quantity: 1,
      condition: 'near_mint',
      graded: false,
      owned: true,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const useAddCardToBinder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCardToBinder,
    onMutate: async ({ binderId, pokemonCardId, index }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['binder', binderId] });

      // Snapshot the previous value
      const previousBinder = queryClient.getQueryData(['binder', binderId]);

      // Create optimistic card entry
      const optimisticCard = {
        id: `temp-${Date.now()}`, // Temporary ID
        binder_id: binderId,
        pokemon_card_id: pokemonCardId,
        index,
        quantity: 1,
        condition: 'near_mint',
        graded: false,
        owned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pokemon_cards: null, // Will be filled in after server response
      };

      // Optimistically update by adding the card
      queryClient.setQueryData(
        ['binder', binderId],
        (old: Binder | undefined) => {
          if (!old) return old;

          // Remove any existing card at this index, then add the new one
          const filteredCards = (old.cards || []).filter(
            (card) => card.index !== index
          );

          return {
            ...old,
            cards: [...filteredCards, optimisticCard].sort(
              (a, b) => a.index - b.index
            ),
          };
        }
      );

      return { previousBinder, optimisticCard };
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic card with real data
      queryClient.setQueryData(
        ['binder', variables.binderId],
        (old: Binder | undefined) => {
          if (!old) return old;

          return {
            ...old,
            cards:
              old.cards?.map((card) =>
                card.id === context?.optimisticCard.id ? data : card
              ) || old.cards,
          };
        }
      );
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousBinder) {
        queryClient.setQueryData(
          ['binder', variables.binderId],
          context.previousBinder
        );
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure UI is in sync
      queryClient.invalidateQueries({
        queryKey: ['binder', variables.binderId],
      });
    },
  });
};

export type { SearchFilters, SortDirection, SortOption };

const deleteCardFromBinder = async ({
  cardId,
  binderId: _binderId, // Currently not used but may be needed for validation
}: {
  cardId: string;
  binderId: string;
}) => {
  const supabase = createClient();

  // Use 'cards' table to match the server queries
  const { error } = await supabase.from('cards').delete().eq('id', cardId);

  if (error) throw new Error(error.message);
};

export const useDeleteCardFromBinder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCardFromBinder,
    onMutate: async ({ cardId, binderId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['binder', binderId] });

      // Snapshot the previous value
      const previousBinder = queryClient.getQueryData(['binder', binderId]);

      // Optimistically update by removing the card
      queryClient.setQueryData(
        ['binder', binderId],
        (old: Binder | undefined) => {
          if (!old) return old;
          return {
            ...old,
            cards: old.cards?.filter((card) => card.id !== cardId) || old.cards,
          };
        }
      );

      // Return context with previous and new values
      return { previousBinder };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousBinder) {
        queryClient.setQueryData(
          ['binder', variables.binderId],
          context.previousBinder
        );
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to ensure UI is in sync
      queryClient.invalidateQueries({
        queryKey: ['binder', variables.binderId],
      });
    },
  });
};

const shiftCardsInBinder = async ({
  binderId,
  fromIndex,
  insertEmpty = false,
}: {
  binderId: string;
  fromIndex: number;
  insertEmpty?: boolean;
}) => {
  const supabase = createClient();

  console.log('shiftCardsInBinder called:', {
    binderId,
    fromIndex,
    insertEmpty,
  });

  // Get binder info separately
  const { data: binder, error: binderError } = await supabase
    .from('binders')
    .select('*')
    .eq('id', binderId)
    .single();

  if (binderError) {
    console.error('Binder query error:', binderError);
    throw new Error(binderError.message);
  }

  // Use 'cards' table with pokemon_cards relationship (matching server queries)
  const { data: cardEntries, error: cardsError } = await supabase
    .from('cards')
    .select('*, pokemon_cards(*)')
    .eq('binder_id', binderId)
    .order('index');

  if (cardsError) {
    console.error('Card entries query error:', cardsError);
    throw new Error(cardsError.message);
  }

  console.log('Binder data:', binder);
  console.log('Card entries:', cardEntries);

  // Calculate total slots
  const totalSlots =
    binder.page_rows * binder.page_columns * binder.total_pages;
  const cards = cardEntries || [];

  console.log('Total slots:', totalSlots, 'Current cards:', cards.length);

  if (insertEmpty) {
    // Get cards that need to be shifted (from fromIndex onwards)
    const cardsToShift = cards
      .filter((card) => card.index >= fromIndex)
      .sort((a, b) => b.index - a.index); // Sort in descending order to avoid conflicts

    console.log(
      'Cards to shift:',
      cardsToShift.map((c) => ({ id: c.id, index: c.index }))
    );

    // Delete cards that would exceed total slots after shifting
    const cardsToDelete = cardsToShift.filter(
      (card) => card.index + 1 >= totalSlots
    );

    console.log(
      'Cards to delete:',
      cardsToDelete.map((c) => ({ id: c.id, index: c.index }))
    );

    // Delete excess cards first - use 'cards' table
    for (const card of cardsToDelete) {
      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', card.id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(`Failed to delete card: ${deleteError.message}`);
      }
    }

    // Update remaining cards (shift them forward by 1) - use 'cards' table
    const cardsToUpdate = cardsToShift.filter(
      (card) => card.index + 1 < totalSlots
    );

    console.log(
      'Cards to update:',
      cardsToUpdate.map((c) => ({
        id: c.id,
        oldIndex: c.index,
        newIndex: c.index + 1,
      }))
    );

    for (const card of cardsToUpdate) {
      const { error: updateError } = await supabase
        .from('cards')
        .update({ index: card.index + 1 })
        .eq('id', card.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(
          `Failed to update card position: ${updateError.message}`
        );
      }
    }

    console.log('Successfully inserted empty slot at index:', fromIndex);
  } else {
    // Delete operation - shift cards back
    const cardsToShift = cards
      .filter((card) => card.index > fromIndex)
      .sort((a, b) => a.index - b.index); // Sort in ascending order

    console.log(
      'Cards to shift back:',
      cardsToShift.map((c) => ({
        id: c.id,
        oldIndex: c.index,
        newIndex: c.index - 1,
      }))
    );

    for (const card of cardsToShift) {
      const { error: updateError } = await supabase
        .from('cards')
        .update({ index: card.index - 1 })
        .eq('id', card.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(
          `Failed to update card position: ${updateError.message}`
        );
      }
    }

    console.log(
      'Successfully shifted cards back after deletion at index:',
      fromIndex
    );
  }
};

export const useShiftCardsInBinder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shiftCardsInBinder,
    onMutate: async ({ binderId, fromIndex, insertEmpty }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['binder', binderId] });

      // Snapshot the previous value
      const previousBinder = queryClient.getQueryData(['binder', binderId]);

      // Optimistically update the cards
      queryClient.setQueryData(
        ['binder', binderId],
        (old: Binder | undefined) => {
          if (!old) return old;

          const cards = [...(old.cards || [])];
          const totalSlots = old.page_rows * old.page_columns;

          if (insertEmpty) {
            // Shift cards forward and remove those that exceed total slots
            const updatedCards = cards
              .map((card: Card) => ({
                ...card,
                index: card.index >= fromIndex ? card.index + 1 : card.index,
              }))
              .filter((card: Card) => card.index < totalSlots);

            return {
              ...old,
              cards: updatedCards,
            };
          } else {
            // Shift cards back (for delete operation)
            const updatedCards = cards.map((card: Card) => ({
              ...card,
              index: card.index > fromIndex ? card.index - 1 : card.index,
            }));

            return {
              ...old,
              cards: updatedCards,
            };
          }
        }
      );

      return { previousBinder };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousBinder) {
        queryClient.setQueryData(
          ['binder', variables.binderId],
          context.previousBinder
        );
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure UI is in sync
      queryClient.invalidateQueries({
        queryKey: ['binder', variables.binderId],
      });
    },
  });
};
