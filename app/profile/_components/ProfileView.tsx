'use client';
import { CreateBinderModal } from '@/components/binders/CreateBinderModal';
import { useBinders, useUpdateBinderOrder } from '@/lib/binders/queries.client';
import {
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
  const [opened, { open, close }] = useDisclosure(false);
  const { mutate: reorderBinders } = useUpdateBinderOrder();

  const handleBinderReorder = (
    updatedBinders: { id: string; order: number }[]
  ) => {
    reorderBinders({ binders: updatedBinders });
  };

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
            <Title order={2} fz={{ base: 24, sm: 28 }}>
              my binders
            </Title>
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
