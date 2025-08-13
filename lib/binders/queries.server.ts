import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Fetches a single binder by its ID (server version)
 */
export const getBinderByIdServer = async (binderId: string) => {
  if (!binderId) return null;
  const supabase = await createServerClient();

  // Get binder
  const { data: binder, error: binderError } = await supabase
    .from('binders')
    .select('*')
    .eq('id', binderId)
    .single();

  if (binderError) {
    console.error('Binder query error:', binderError);
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
    console.error('Cards query error:', cardsError);
    throw new Error(cardsError.message);
  }

  return {
    ...binder,
    cards: cards || [],
  };
};
