import { useCreateBinder } from '@/lib/binders/queries.client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
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
          <Group justify="flex-end" mt="md">
            <Button variant="default" radius="xl" onClick={onClose}>
              cancel
            </Button>
            <Button
              color="#6796ec"
              type="submit"
              radius="xl"
              loading={isPending}
            >
              create binder
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
