import { type Binder } from '@/lib/types';
import { AspectRatio, Badge, Group, Paper, Stack, Text } from '@mantine/core';
import Link from 'next/link';

export function BinderCard({ binder }: { binder: Binder }) {
  return (
    <Paper
      component={Link}
      href={`/binder/${binder.id}`}
      withBorder
      p="md"
      radius="lg"
      className="hover:shadow-lg transition-shadow"
      maw={300}
    >
      <Stack gap="xs">
        <AspectRatio ratio={3 / 4}>
          <div className="flex items-center justify-center rounded-md">
            <Text c="dimmed" size="sm">
              no image
            </Text>
          </div>
        </AspectRatio>
        <div>
          <Text fw={500} truncate>
            {binder.name}
          </Text>
          <Group justify="space-between" mt="xs">
            <Badge variant="outline" style={{ textTransform: 'none' }}>
              {binder.type}
            </Badge>
            {binder.is_private && (
              <Badge variant="light" style={{ textTransform: 'none' }}>
                private
              </Badge>
            )}
          </Group>
        </div>
      </Stack>
    </Paper>
  );
}
