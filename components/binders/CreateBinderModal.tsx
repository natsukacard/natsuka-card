import { MAX_BINDERS, useCreateBinder } from '@/lib/binders/queries.client';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const createBinderSchema = z.object({
  name: z.string().min(1, 'binder name is required'),
  presetSize: z.enum(['2x2', '3x3', '4x4'], {
    error: 'please select the dimensions for your binder',
  }),
  type: z.enum(['collection', 'trading', 'wishlist']),
  is_private: z.boolean(),
});

type CreateBinderFormValues = z.infer<typeof createBinderSchema>;

interface CreateBinderModalProps {
  opened: boolean;
  onClose: () => void;
}

const BINDER_SIZES = [
  { value: '2x2', label: '2x2', rows: 2, cols: 2 },
  { value: '3x3', label: '3x3', rows: 3, cols: 3 },
  { value: '4x4', label: '4x4', rows: 4, cols: 4 },
];

export function CreateBinderModal({ opened, onClose }: CreateBinderModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateBinderFormValues>({
    resolver: zodResolver(createBinderSchema),
    defaultValues: {
      name: '',
      presetSize: '3x3',
      type: 'collection',
      is_private: false,
    },
  });

  const { mutate, isPending } = useCreateBinder();

  const { data: binderCount } = useQuery({
    queryKey: ['binder-count'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      const userId = data?.claims?.sub;
      if (!userId) return 0;

      const { count } = await supabase
        .from('binders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return count || 0;
    },
    enabled: opened,
  });

  const isLimitReached = binderCount !== undefined && binderCount >= MAX_BINDERS;

  const onSubmit = (data: CreateBinderFormValues) => {
    const selectedSize = BINDER_SIZES.find((s) => s.value === data.presetSize);
    if (!selectedSize) return;

    mutate(
      {
        name: data.name,
        page_rows: selectedSize.rows,
        page_columns: selectedSize.cols,
        type: data.type,
        is_private: data.is_private,
      },
      {
        onSuccess: () => {
          onClose(); // Closes the modal on success
        },
      }
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="create new binder">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label="binder name"
            required
            {...register('name')}
            error={errors.name?.message}
          />

          <Controller
            name="presetSize"
            control={control}
            render={({ field }) => (
              <Select
                label="Page Size"
                required
                data={BINDER_SIZES.map((s) => ({
                  value: s.value,
                  label: s.label,
                }))}
                {...field}
                error={errors.presetSize?.message}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                label="Category"
                required
                data={[
                  { value: 'collection', label: 'collection' },
                  { value: 'trading', label: 'trading' },
                  { value: 'wishlist', label: 'wishlist' },
                ]}
                {...field}
                error={errors.type?.message}
              />
            )}
          />

          <Checkbox label="private" {...register('is_private')} />

          {isLimitReached && (
            <Alert color="red" title="Limit reached">
              <Text size="sm">Maximum {MAX_BINDERS} binders allowed</Text>
            </Alert>
          )}

          {!isLimitReached && binderCount !== undefined && (
            <Text size="xs" c="dimmed">
              {binderCount} of {MAX_BINDERS} binders
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" radius="xl" onClick={onClose}>
              cancel
            </Button>
            <Button
              color="#6796ec"
              type="submit"
              radius="xl"
              loading={isPending}
              disabled={isLimitReached}
            >
              create binder
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
