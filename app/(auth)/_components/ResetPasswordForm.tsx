'use client';

import { updatePassword } from '@/lib/auth/actions';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Paper, Stack, Text, Title } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PasswordStrength } from './PasswordStrength';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    mutate({ password: data.password });
  };

  if (isSuccess) {
    return (
      <Paper withBorder p={30} radius="xl" className="text-center">
        <Title
          order={2}
          size="h3"
          fw={500}
          mb="md"
          style={{ textTransform: 'none' }}
        >
          password updated
        </Title>
        <Text size="sm" c="dimmed" mb="lg" style={{ textTransform: 'none' }}>
          your password has been successfully updated.
        </Text>
        <Button
          color="#8d84b0"
          onClick={() => router.push('/profile')}
          radius="lg"
          fullWidth
        >
          continue to profile
        </Button>
      </Paper>
    );
  }

  return (
    <Stack gap="lg">
      <Paper withBorder p={30} radius="xl">
        <Title
          order={2}
          size="h3"
          fw={500}
          mb="md"
          style={{ textTransform: 'none' }}
        >
          set new password
        </Title>
        <Text size="sm" c="dimmed" mb="lg" style={{ textTransform: 'none' }}>
          please enter your new password below.
        </Text>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack>
            <PasswordStrength
              radius="md"
              {...register('password')}
              error={errors.password?.message}
            />

            <input
              type="password"
              placeholder="confirm new password"
              {...register('confirmPassword')}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                fontSize: '14px',
              }}
            />
            {errors.confirmPassword && (
              <Text c="red" size="sm">
                {errors.confirmPassword.message}
              </Text>
            )}

            {error && (
              <Text c="red" size="sm" ta="center">
                {error.message}
              </Text>
            )}

            <Button
              color="#8d84b0"
              type="submit"
              loading={isPending}
              radius="lg"
              fullWidth
              mt="md"
            >
              update password
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
