'use client';
import { requestPasswordReset } from '@/lib/auth/actions';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Anchor,
  Button,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    mutate(data);
  };

  if (isSuccess) {
    return (
      <Paper className="text-center">
        <Title order={2} size="h3" fw={500} mb="md">
          check your email
        </Title>
        <Text size="sm" c="dimmed">
          we&apos;ve sent a password reset link to your email address.
        </Text>
        <Button
          variant="subtle"
          color="#8d84b0"
          mt="md"
          onClick={() => router.push('/login')}
        >
          back to sign in
        </Button>
      </Paper>
    );
  }

  return (
    <Stack gap="lg">
      <Paper>
        <Title order={2} size="h3" fw={500} mb="md">
          reset your password
        </Title>
        <Text size="sm" c="dimmed" mb="lg">
          enter your email address and we&apos;ll send you a link to reset your
          password.
        </Text>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack>
            <TextInput
              label="email"
              radius="md"
              {...register('email')}
              error={errors.email?.message}
            />
            {error && (
              <Text c="red" size="sm" ta="center">
                {error.message}
              </Text>
            )}

            <Button
              color="#8d84b0"
              type="submit"
              loading={isPending}
              radius="xl"
              fullWidth
              mt="md"
            >
              send reset link
            </Button>
          </Stack>
        </form>
        <Text c="dimmed" size="sm" ta="center" mt="md">
          remember your password?{' '}
          <Anchor
            component="button"
            type="button"
            size="sm"
            onClick={() => router.push('/login')}
          >
            sign in{' '}
          </Anchor>
        </Text>
      </Paper>
    </Stack>
  );
}
