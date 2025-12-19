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

  const { data: cardsRaw, error: cardsError } = await supabase.rpc(
    'get_binder_cards',
    { binder_id_param: binderId }
  );

  if (cardsError) {
    console.error('Cards query error:', cardsError);
    throw new Error(cardsError.message);
  }

  const cards = (cardsRaw || []).map((card: any) => ({
    id: card.id,
    index: card.index,
    quantity: card.quantity,
    condition: card.condition,
    graded: card.graded,
    owned: card.owned,
    notes: card.notes,
    pokemon_cards_en: card.language === 'en' ? card.card_data : null,
    pokemon_cards_jp: card.language === 'jp' ? card.card_data : null,
  }));

  return {
    ...binder,
    cards: cards || [],
  };
};
