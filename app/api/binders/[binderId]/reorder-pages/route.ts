import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface Params {
  binderId: string;
}

interface ReorderPayload {
  sourcePage: number;
  targetPage: number;
}

const movePageIndices = (
  cards: { id: string; index: number }[],
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

  return cards.map((card) => {
    const { index } = card;

    if (index >= sourceStart && index <= sourceEnd) {
      return {
        ...card,
        index: adjustedTargetStart + (index - sourceStart),
      };
    }

    if (movingForward && index > sourceEnd && index < targetStart) {
      return { ...card, index: index - cardsPerPage };
    }

    if (!movingForward && index >= targetStart && index < sourceStart) {
      return { ...card, index: index + cardsPerPage };
    }

    return card;
  });
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const supabase = await createClient();
    const { binderId } = await params;

    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourcePage, targetPage } = (await request.json()) as ReorderPayload;
    if (!sourcePage || !targetPage) {
      return NextResponse.json(
        { error: 'sourcePage and targetPage are required' },
        { status: 400 }
      );
    }

    const { data: binder, error: binderError } = await supabase
      .from('binders')
      .select('id, user_id, page_rows, page_columns, total_pages')
      .eq('id', binderId)
      .single();

    if (binderError || !binder) {
      return NextResponse.json({ error: 'Binder not found' }, { status: 404 });
    }

    if (binder.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (sourcePage < 1 || sourcePage > binder.total_pages) {
      return NextResponse.json({ error: 'Invalid sourcePage' }, { status: 400 });
    }

    if (targetPage < 1 || targetPage > binder.total_pages) {
      return NextResponse.json({ error: 'Invalid targetPage' }, { status: 400 });
    }

    if (sourcePage === targetPage) {
      return NextResponse.json({ success: true });
    }

    const cardsPerPage = binder.page_rows * binder.page_columns;

    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, index')
      .eq('binder_id', binderId)
      .order('index', { ascending: true });

    if (cardsError) {
      console.error('Error fetching cards for reorder:', cardsError);
      return NextResponse.json(
        { error: 'Failed to fetch cards' },
        { status: 500 }
      );
    }

    const updatedCards = movePageIndices(
      cards || [],
      cardsPerPage,
      sourcePage,
      targetPage
    );

    if (!updatedCards.length) {
      return NextResponse.json({ success: true });
    }

    const results = await Promise.all(
      updatedCards.map((card) =>
        supabase.from('cards').update({ index: card.index }).eq('id', card.id)
      )
    );

    const hasError = results.some((result) => result.error);
    if (hasError) {
      console.error('Error updating card order:', results);
      return NextResponse.json(
        { error: 'Failed to reorder pages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering pages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
