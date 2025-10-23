'use client';
import { CreateBinderModal } from '@/components/binders/CreateBinderModal';
import { useIsUserPro, useUser } from '@/lib/auth/queries';
import { useBinders, useUpdateBinderOrder } from '@/lib/binders/queries.client';
import {
  Badge,
  Button,
  Container,
  Group,
  SimpleGrid,
  Skeleton,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { BindersList } from './BinderList';

export function ProfileView() {
  const { data: binders, isLoading, error } = useBinders();
  const { data: user, isLoading: userLoading } = useUser();
  const { data: isUserPro, isLoading: isProLoading } = useIsUserPro();
  const [opened, { open, close }] = useDisclosure(false);
  const { mutate: reorderBinders } = useUpdateBinderOrder();

  const handleBinderReorder = (
    updatedBinders: { id: string; order: number }[]
  ) => {
    reorderBinders({ binders: updatedBinders });
  };

  const getUserDisplayName = () => {
    if (!user) return 'my binders';

    return (
      user.user_metadata?.username ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'my binders'
    );
  };

  if (isLoading || userLoading) {
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
        <Text c="red">{error.message}</Text>
      </Container>
    );
  }

  return (
    <>
      <CreateBinderModal opened={opened} onClose={close} />
      <Container size="md" my="lg">
        <Group justify="space-between" mb="xl">
          <div>
            <Group gap="sm" align="center">
              <Title order={2} fz={{ base: 24, sm: 28 }}>
                {getUserDisplayName()}&apos;s binders
              </Title>
              {!isProLoading && isUserPro && (
                <Badge
                  variant="gradient"
                  gradient={{ from: 'orange', to: 'red' }}
                  size="sm"
                  radius="xl"
                  style={{ textTransform: 'none' }}
                >
                  pro
                </Badge>
              )}
            </Group>
            <Text c="dimmed" fz={{ base: 'sm', sm: 'md' }}>
              manage your binders and cards
            </Text>
          </div>
          <Button
            color="#6796ec"
            leftSection={<IconPlus size={16} />}
            fullWidth
            radius="xl"
            maw={160}
            visibleFrom="xs"
            onClick={open}
          >
            create binder
          </Button>
        </Group>

        {binders && binders.length > 0 ? (
          <BindersList binders={binders} onReorder={handleBinderReorder} />
        ) : (
          <Text>no binders yet. create one to get started!</Text>
        )}
      </Container>
    </>
  );
}
