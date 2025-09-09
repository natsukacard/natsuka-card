import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ binderId: string }> } // Updated to Promise
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newIndex } = await request.json();
    const { binderId } = await params; // Await params here

    // Get all user's binders ordered by current order
    const { data: binders, error: fetchError } = await supabase
      .from('binders')
      .select('*')
      .eq('user_id', user.id)
      .order('order', { ascending: true });

    if (fetchError) {
      console.error('Error fetching binders:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch binders' },
        { status: 500 }
      );
    }

    // Find the binder being moved
    const binderToMove = binders?.find((b) => b.id === binderId);
    if (!binderToMove) {
      return NextResponse.json({ error: 'Binder not found' }, { status: 404 });
    }

    const currentIndex = binders?.findIndex((b) => b.id === binderId) ?? -1;

    if (currentIndex === newIndex) {
      return NextResponse.json({ success: true });
    }

    // Simple approach: reassign all order values
    const updates = [];

    // Remove the binder from its current position
    const bindersCopy = [...(binders || [])];
    const [movedBinder] = bindersCopy.splice(currentIndex, 1);

    // Insert it at the new position
    bindersCopy.splice(newIndex, 0, movedBinder);

    // Update all binders with their new order values
    for (let i = 0; i < bindersCopy.length; i++) {
      updates.push(
        supabase
          .from('binders')
          .update({ order: i })
          .eq('id', bindersCopy[i].id)
      );
    }

    // Execute all updates
    const results = await Promise.all(updates);

    // Check for errors
    const hasError = results.some((result) => result.error);
    if (hasError) {
      console.error('Error updating binder order:', results);
      return NextResponse.json(
        { error: 'Failed to reorder binder' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering binder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
