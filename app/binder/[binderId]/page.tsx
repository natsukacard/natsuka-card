import { getBinderByIdServer } from '@/lib/binders/queries.server';
import { createClient } from '@/lib/supabase/server';
import type { Binder } from '@/lib/types';
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import { notFound, redirect } from 'next/navigation';
import { BinderView } from './_components/BinderView';

export default async function BinderPage({
  params,
  searchParams,
}: {
  params: Promise<{ binderId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { binderId } = await params;
  const { page } = await searchParams;

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

  if (binder.is_private && !isOwner) {
    redirect('/profile');
  }

  const currentPage = parseInt(page || '1', 10);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BinderView
        binderId={binderId}
        currentPage={currentPage}
        isOwner={isOwner}
      />
    </HydrationBoundary>
  );
}
