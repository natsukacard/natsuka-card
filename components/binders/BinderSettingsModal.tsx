import { useUpdateBinder } from '@/lib/binders/queries.client';
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
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const updateBinderSchema = z.object({
  name: z.string().min(1, 'binder name is required'),
  type: z.enum(['collection', 'trading', 'wishlist']),
  is_private: z.boolean(),
});

type UpdateBinderFormValues = z.infer<typeof updateBinderSchema>;

interface BinderSettingsModalProps {
  opened: boolean;
  onClose: () => void;
  binder: {
    id: string;
    name: string;
    type?: 'collection' | 'trading' | 'wishlist';
    is_private?: boolean;
  };
}

export function BinderSettingsModal({
  opened,
  onClose,
  binder,
}: BinderSettingsModalProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBinderFormValues>({
    resolver: zodResolver(updateBinderSchema),
    defaultValues: {
      name: binder.name,
      type: binder.type,
      is_private: binder.is_private,
    },
  });

  // Resets form when binder data changes
  useEffect(() => {
    reset({
      name: binder.name,
      type: binder.type,
      is_private: binder.is_private,
    });
  }, [binder, reset]);

  const { mutate, isPending } = useUpdateBinder();

  const onSubmit = (data: UpdateBinderFormValues) => {
    mutate(
      { id: binder.id, ...data },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="binder settings">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label="binder name"
            required
            {...register('name')}
            error={errors.name?.message}
          />
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                label="type"
                required
                data={[
                  { value: 'collection', label: 'Collection' },
                  { value: 'trading', label: 'Trading' },
                  { value: 'wishlist', label: 'Wishlist' },
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
            <Button type="submit" loading={isPending}>
              save changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
