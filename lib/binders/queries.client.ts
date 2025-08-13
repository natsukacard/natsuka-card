import { createClient } from '@/lib/supabase/client';
import type { Binder } from '@/lib/types';
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

type UpdateCardPositionsValues = {
  binderId: string;
  cards: { id: string; index: number }[];
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

      const firstError = results.find((r: any) => r.error)?.error;
      if (firstError) throw new Error(firstError.message);

      return { binderId, cards };
    },
    onMutate: async ({ binderId, cards: updatedCards }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['binder', binderId] });

      // Snapshot the previous value
      const previousBinder = queryClient.getQueryData(['binder', binderId]);

      // Optimistically update card positions
      queryClient.setQueryData(['binder', binderId], (old: any) => {
        if (!old) return old;

        const updatedCardsMap = new Map(
          updatedCards.map((c) => [c.id, c.index])
        );

        return {
          ...old,
          cards: old.cards
            .map((card: any) => ({
              ...card,
              index: updatedCardsMap.get(card.id) ?? card.index,
            }))
            .sort((a: any, b: any) => a.index - b.index),
        };
      });

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

  const { data: bindersData, error } = await query.order('created_at', {
    ascending: false,
  });

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

  // Get cards with pokemon_cards data
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
      pokemon_cards(
        id,
        name,
        image_small,
        image_large
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

// Mutation functions

/**
 * Creates a new binder in supabase
 */
const createBinder = async (values: CreateBinderValues) => {
  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims || !claims.sub) throw new Error('User not authenticated');

  const { data: newBinder, error } = await supabase
    .from('binders')
    .insert({
      ...values,
      user_id: claims.sub,
      total_pages: 10,
      type_name: values.type,
    })
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
