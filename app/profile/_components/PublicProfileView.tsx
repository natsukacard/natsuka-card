'use client';

import { Container, SimpleGrid, Skeleton, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

import { useUser } from '@/lib/auth/queries';
import {
  getPublicBinders,
  getUserProfile,
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

  // Separate query for user profile
  const { data: userProfile, isLoading: userLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId,
  });

  // Query for binders
  const {
    data: binders,
    isLoading: bindersLoading,
    error,
  } = useQuery({
    queryKey: ['public-binders', userId],
    queryFn: () => getPublicBinders(userId),
    enabled: !!userId,
  });

  const getUserDisplayName = () => {
    console.log('userProfile:', userProfile); // Add this debug line
    console.log('userLoading:', userLoading); // Add this debug line

    if (!userProfile || !userProfile.username) {
      console.log('No userProfile or username, returning fallback'); // Debug
      return isOwner ? 'My' : 'User';
    }

    console.log('Using username:', userProfile.username); // Debug
    return userProfile.username;
  };

  if (bindersLoading || userLoading) {
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
        {isOwner ? 'My Binders' : `${getUserDisplayName()}'s Binders`}
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
