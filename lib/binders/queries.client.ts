import { createClient } from '@/lib/supabase/client';
import { Binder, QueryResult } from '@/lib/types';
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

  // Get cards with pokemon_cards data - fix the relationship name
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
        image_large,
        number,
        artist,
        rarity,
        pokemon_sets(name, id, tcgplayer_group_id)
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
