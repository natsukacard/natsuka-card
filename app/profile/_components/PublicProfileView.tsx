'use client';
import { Container, SimpleGrid, Skeleton, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

import { useUser } from '@/lib/auth/queries';
import {
  getPublicBinders,
  useUpdateBinderOrder,
} from '@/lib/binders/queries.client';
import { BindersList } from './BinderList';

export function PublicProfileView({ userId }: { userId: string }) {
  const { data: currentUser } = useUser();
  const isOwner = currentUser?.sub === userId;

  const { mutate: reorderBinders } = useUpdateBinderOrder();

  const handleReorder = (updatedBinders: { id: string; order: number }[]) => {
    reorderBinders({ binders: updatedBinders });
  };

  const {
    data: binders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['public-binders', userId],
    queryFn: () => getPublicBinders(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Container size="md" my="lg">
        <Skeleton height={40} width={200} mb="xl" />
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          <Skeleton height={250} />
          <Skeleton height={250} />
          <Skeleton height={250} />
        </SimpleGrid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container my="md">
        <Text c="red">This profile is private or doesn&apos;t exist.</Text>
      </Container>
    );
  }

  return (
    <Container size="md" my="lg">
      <Title order={2} fz={{ base: 24, sm: 28 }} mb="xl">
        {isOwner
          ? 'My Binders'
          : `${binders?.[0]?.user?.name || 'User'}'s Binders`}
      </Title>

      {binders && binders.length > 0 ? (
        <BindersList
          binders={binders}
          isOwner={isOwner}
          onReorder={isOwner ? handleReorder : undefined}
        />
      ) : (
        <Text>This user has no public binders.</Text>
      )}
    </Container>
  );
}
