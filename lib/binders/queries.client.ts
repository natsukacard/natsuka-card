import { createClient } from '@/lib/supabase/client';
import { Binder, QueryResult, type Card } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Binder types
type CreateBinderValues = {
  name: string;
  page_rows: number;
  page_columns: number;
  type: string;
  is_private: boolean;
};

type UpdateBinderValues = {
  id: string;
  name?: string;
  is_private?: boolean;
  type?: string;
};

export const useUpdateCardPositions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      binderId,
      cards,
    }: {
      binderId: string;
      cards: { id: string; index: number }[];
    }) => {
      if (!cards.length) return { binderId, cards };
      const supabase = createClient();

      const results = await Promise.all(
        cards.map((c) =>
          supabase
            .from('cards')
            .update({ index: c.index })
            .eq('id', c.id)
            .select('id')
            .single()
        )
      );

      const firstError = results.find(
        (r: QueryResult<unknown>) => r.error
      )?.error;
      if (firstError) throw new Error(firstError.message);

      return { binderId, cards };
    },
    onMutate: async ({ binderId, cards: updatedCards }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['binder', binderId] });

      // Snapshot the previous value
      const previousBinder = queryClient.getQueryData(['binder', binderId]);

      // Optimistically update card positions
      queryClient.setQueryData(
        ['binder', binderId],
        (old: Binder | undefined) => {
          if (!old) return old;

          const updatedCardsMap = new Map(
            updatedCards.map((c) => [c.id, c.index])
          );

          return {
            ...old,
            cards: old.cards
              ? old.cards
                  .map((card) => ({
                    ...card,
                    index: updatedCardsMap.get(card.id) ?? card.index,
                  }))
                  .sort((a, b) => a.index - b.index)
              : old.cards,
          };
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
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['binder', variables.binderId],
      });
    },
  });
};

// Query functions

/**
 * Fetches all binders for current user, with an optional filter by type
 */
const getBinders = async ({ binderType }: { binderType?: string } = {}) => {
  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims || !claims.sub) throw new Error('User not authenticated');

  let query = supabase.from('binders').select('*').eq('user_id', claims.sub);

  if (binderType) {
    query = query.eq('type', binderType);
  }

  const { data: bindersData, error } = await query
    .order('order', {
      ascending: true,
    })
    .returns<Binder[]>();

  if (error) throw new Error(error.message);
  return bindersData;
};

/**
 * Fetches a single binder by its ID (client version)
 */
export const getBinderById = async (binderId: string) => {
  if (!binderId) return null;
  const supabase = createClient();

  // Get binder
  const { data: binder, error: binderError } = await supabase
    .from('binders')
    .select('*')
    .eq('id', binderId)
    .single();

  if (binderError) {
    throw new Error(binderError.message);
  }

  // Get cards with english/japanese relationships
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select(
      `
      id,
      index,
      quantity,
      condition,
      graded,
      owned,
      notes,
      pokemon_cards_en(
        id,
        name,
        image_small,
        image_large,
        number,
        artist,
        rarity,
        pokemon_sets_en(name, id, release_date)
      )
    `
    )
    .eq('binder_id', binderId)
    .order('index', { ascending: true });

  if (cardsError) {
    throw new Error(cardsError.message);
  }

  return {
    ...binder,
    cards: cards || [],
  };
};

/**
 * Fetches public binders for a specific user
 */
export const getPublicBinders = async (userId: string) => {
  const supabase = createClient();

  // Remove the problematic join for now
  const { data, error } = await supabase
    .from('binders')
    .select('*')
    .eq('user_id', userId)
    .eq('is_private', false)
    .order('order', { ascending: true });

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  return data;
};

// Mutation functions

/**
 * Creates a new binder in supabase
 */
const createBinder = async (values: CreateBinderValues) => {
  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims || !claims.sub) throw new Error('User not authenticated');

  // Get the current count of binders for this user to set the order
  const { count } = await supabase
    .from('binders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', claims.sub);

  const { data: newBinder, error } = await supabase
    .from('binders')
    .insert({
      ...values,
      user_id: claims.sub,
      total_pages: 10,
      type_name: values.type,
      order: count || 0, // Set order to current count
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return newBinder;
};

/**
 * Updates existing binder in supabase
 */
const updateBinder = async (values: UpdateBinderValues) => {
  const supabase = createClient();
  const { id, ...updates } = values;
  const { data, error } = await supabase
    .from('binders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// Custom hooks

/**
 * Fetches all binders for the current user
 */
export const useBinders = (filters: { binderType?: string } = {}) => {
  return useQuery({
    queryKey: ['binders', filters],
    queryFn: () => getBinders(filters),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Fetch a single binder by ID
 */
export const useBinder = (binderId: string) => {
  return useQuery({
    queryKey: ['binder', binderId],
    queryFn: () => getBinderById(binderId),
    enabled: !!binderId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

/**
 * Creating a new binder
 */
export const useCreateBinder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBinder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binders'] });
    },
  });
};

/**
 * Updating an existing binder
 */
export const useUpdateBinder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBinder,
    onMutate: async (variables) => {
      // Cancel outgoing fetch
      await queryClient.cancelQueries({ queryKey: ['binder', variables.id] });

      // Snapshot previous value
      const previousBinder = queryClient.getQueryData(['binder', variables.id]);

      // Optimistically update
      queryClient.setQueryData(
        ['binder', variables.id],
        (old: Binder | undefined) =>
          ({
            ...old,
            ...variables,
          }) as Binder
      );

      return { previousBinder };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousBinder) {
        queryClient.setQueryData(
          ['binder', variables.id],
          context.previousBinder
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['binder', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['binders'] });
    },
  });
};

export function useUpdateBinderOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      binders,
    }: {
      binders: { id: string; order: number }[];
    }) => {
      if (!binders.length) return { binders };
      const supabase = createClient();

      const results = await Promise.all(
        binders.map((b) =>
          supabase
            .from('binders')
            .update({ order: b.order })
            .eq('id', b.id)
            .select('id')
            .single()
        )
      );

      const firstError = results.find(
        (r: QueryResult<unknown>) => r.error
      )?.error;
      if (firstError) throw new Error(firstError.message);

      return { binders };
    },
    onMutate: async ({ binders: updatedBinders }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['binders'] });

      // Snapshot the previous value
      const previousBinders = queryClient.getQueryData(['binders']);

      // Optimistically update binder positions (same as cards)
      queryClient.setQueryData(['binders'], (old: Binder[] | undefined) => {
        if (!old) return old;

        const updatedBindersMap = new Map(
          updatedBinders.map((b) => [b.id, b.order])
        );

        return old
          .map((binder) => ({
            ...binder,
            order: updatedBindersMap.get(binder.id) ?? binder.order,
          }))
          .sort((a, b) => a.order - b.order);
      });

      return { previousBinders };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousBinders) {
        queryClient.setQueryData(['binders'], context.previousBinders);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['binders'] });
    },
  });
}

/**
 * Fetches user profile data by user ID
 */
export const getUserProfile = async (userId: string) => {
  const supabase = createClient();

  console.log('getUserProfile called with userId:', userId);

  // Get the current authenticated user
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  // If the requested userId is the current user, we can access their metadata
  if (claims && claims.sub === userId) {
    const profile = {
      id: claims.sub,
      username:
        claims.user_metadata?.username ||
        claims.user_metadata?.name ||
        claims.email?.split('@')[0],
      avatar_url: claims.user_metadata?.avatar_url,
      is_premium: false,
    };
    return profile;
  }

  // For other users, check users table
  console.log('Querying user_profiles table for userId:', userId);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, is_premium')
    .eq('id', userId)
    .single();

  console.log('Raw database query result:', { profile, profileError });

  // Log the specific error details
  if (profileError) {
    console.error('Profile query error details:', {
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
    });
  }

  if (!profileError && profile) {
    console.log('Returning profile from database:', profile);
    return profile;
  }

  console.log('No profile found, returning default object');
  return {
    id: userId,
    username: null,
    avatar_url: null,
    is_premium: false,
  };
};

/**
 * Hook to fetch user profile data
 */
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => {
      console.log('Querying for userId:', userId); // Add this
      return getUserProfile(userId);
    },
    enabled: !!userId,
  });
}

const reorderBinderPages = async ({
  binderId,
  sourcePage,
  targetPage,
}: {
  binderId: string;
  sourcePage: number;
  targetPage: number;
}) => {
  const response = await fetch(`/api/binders/${binderId}/reorder-pages`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sourcePage, targetPage }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to reorder pages');
  }

  return payload;
};

const reorderCardsByPage = (
  cards: Card[],
  cardsPerPage: number,
  sourcePage: number,
  targetPage: number
) => {
  if (sourcePage === targetPage) return cards;

  const sourceStart = (sourcePage - 1) * cardsPerPage;
  const sourceEnd = sourceStart + cardsPerPage - 1;
  const targetStart = (targetPage - 1) * cardsPerPage;
  const movingForward = targetStart > sourceStart;
  const adjustedTargetStart = movingForward
    ? targetStart - cardsPerPage
    : targetStart;

  return cards
    .map((card) => {
      const idx = card.index;

      if (idx >= sourceStart && idx <= sourceEnd) {
        return { ...card, index: adjustedTargetStart + (idx - sourceStart) };
      }

      if (movingForward && idx > sourceEnd && idx < targetStart) {
        return { ...card, index: idx - cardsPerPage };
      }

      if (!movingForward && idx >= targetStart && idx < sourceStart) {
        return { ...card, index: idx + cardsPerPage };
      }

      return card;
    })
    .sort((a, b) => a.index - b.index);
};

export const useReorderBinderPages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderBinderPages,
    onMutate: async ({ binderId, sourcePage, targetPage }) => {
      await queryClient.cancelQueries({ queryKey: ['binder', binderId] });

      const previousBinder = queryClient.getQueryData(['binder', binderId]);

      queryClient.setQueryData(
        ['binder', binderId],
        (old: Binder | undefined) => {
          if (!old) return old;

          const cardsPerPage = old.page_rows * old.page_columns;

          return {
            ...old,
            cards: reorderCardsByPage(
              old.cards || [],
              cardsPerPage,
              sourcePage,
              targetPage
            ),
          };
        }
      );

      return { previousBinder };
    },
    onError: (error, variables, context) => {
      if (context?.previousBinder) {
        queryClient.setQueryData(
          ['binder', variables.binderId],
          context.previousBinder
        );
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['binder', variables.binderId],
      });
    },
  });
};

const addPageToBinder = async ({
  binderId,
  atEnd = true,
  beforePage,
}: {
  binderId: string;
  atEnd?: boolean;
  beforePage?: number;
}) => {
  const supabase = createClient();

  const { data: binder, error: binderError } = await supabase
    .from('binders')
    .select('*')
    .eq('id', binderId)
    .single();

  if (binderError) throw new Error(binderError.message);

  const cardsPerPage = binder.page_rows * binder.page_columns;

  if (!atEnd && beforePage !== undefined) {
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, index')
      .eq('binder_id', binderId)
      .gte('index', (beforePage - 1) * cardsPerPage)
      .order('index', { ascending: false });

    if (cardsError) throw new Error(cardsError.message);

    for (const card of cards || []) {
      const { error: updateError } = await supabase
        .from('cards')
        .update({ index: card.index + cardsPerPage })
        .eq('id', card.id);

      if (updateError) throw new Error(updateError.message);
    }
  }

  const { data, error } = await supabase
    .from('binders')
    .update({ total_pages: binder.total_pages + 1 })
    .eq('id', binderId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const useAddPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addPageToBinder,
    onMutate: async ({ binderId, atEnd, beforePage }) => {
      await queryClient.cancelQueries({ queryKey: ['binder', binderId] });

      const previousBinder = queryClient.getQueryData(['binder', binderId]);

      queryClient.setQueryData(
        ['binder', binderId],
        (old: Binder | undefined) => {
          if (!old) return old;

          const cardsPerPage = old.page_rows * old.page_columns;
          let updatedCards = old.cards || [];

          if (!atEnd && beforePage !== undefined) {
            const shiftFromIndex = (beforePage - 1) * cardsPerPage;
            updatedCards = updatedCards.map((card) => ({
              ...card,
              index:
                card.index >= shiftFromIndex
                  ? card.index + cardsPerPage
                  : card.index,
            }));
          }

          return {
            ...old,
            total_pages: old.total_pages + 1,
            cards: updatedCards,
          };
        }
      );

      return { previousBinder };
    },
    onError: (err, variables, context) => {
      if (context?.previousBinder) {
        queryClient.setQueryData(
          ['binder', variables.binderId],
          context.previousBinder
        );
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['binder', variables.binderId],
      });
    },
  });
};
