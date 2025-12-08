import { PagesReorderView } from '@/app/binder/[binderId]/_components/PagesReorderView';
import { getBinderByIdServer } from '@/lib/binders/queries.server';
import { createClient } from '@/lib/supabase/server';
import type { Binder } from '@/lib/types';
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import { notFound, redirect } from 'next/navigation';

export default async function BinderPagesReorder({
  params,
}: {
  params: Promise<{ binderId: string }>;
}) {
  const { binderId } = await params;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const claims = authData?.claims;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
      },
    },
  });

  await queryClient.prefetchQuery({
    queryKey: ['binder', binderId],
    queryFn: () => getBinderByIdServer(binderId),
  });

  type ServerBinder = Binder & { user_id: string; is_private: boolean };
  const binder = queryClient.getQueryData(['binder', binderId]) as
    | ServerBinder
    | undefined;

  if (!binder) notFound();

  const isOwner = claims?.sub === binder.user_id;

  if (!isOwner) {
    redirect(`/binder/${binderId}`);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PagesReorderView binderId={binderId} />
    </HydrationBoundary>
  );
}
