'use client';

import { signUpWithPassword } from '@/lib/auth/actions';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Anchor,
  Button,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { GoogleButton } from './GoogleButton';
import { PasswordStrength } from './PasswordStrength';

const signUpSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 letters'),
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: signUpWithPassword,
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const onSubmit = (data: SignUpFormValues) => {
    mutate(data);
  };

  if (isSuccess) {
    return (
      <Paper withBorder p={30} radius="xl" className="text-center">
        <Text size="lg" fw={500}>
          check your email
        </Text>
        <Text mt="md">
          we&apos;ve sent a confirmation link to your email address.
        </Text>
      </Paper>
    );
  }

  return (
    <Stack gap="lg">
      <Paper withBorder p={30} radius="xl">
        <Group grow mb="md" mt="md">
          <GoogleButton radius="xl">continue with google</GoogleButton>
        </Group>

        <Divider
          label="or continue with email"
          labelPosition="center"
          my="lg"
        />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack>
            <TextInput
              label="username"
              radius="md"
              {...register('username')}
              error={errors.username?.message}
            />
            <TextInput
              label="email"
              radius="md"
              {...register('email')}
              error={errors.email?.message}
            />
            <PasswordStrength
              radius="md"
              {...register('password')}
              error={errors.password?.message}
            />
            <PasswordInput
              label="confirm password"
              type="password"
              radius="md"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
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
              radius="lg"
              fullWidth
              mt="xl"
            >
              Sign Up
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt="md">
          already have an account?{' '}
          <Anchor
            component="button"
            type="button"
            size="sm"
            onClick={() => router.push('/login')}
          >
            sign in
          </Anchor>
        </Text>
      </Paper>
    </Stack>
  );
}
