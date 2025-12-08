'use client';
import { signInWithGoogle, signInWithPassword } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/client';
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
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { GoogleButton } from './GoogleButton';

// Validation schema
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  // Handle OAuth callback (same method as email/password)
  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Same redirect method as email/password
        setTimeout(() => {
          router.push('/profile');
          router.refresh();
        }, 100);
      }
    };

    // Check if we're returning from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code') || urlParams.has('access_token')) {
      handleAuthCallback();
    }
  }, [router]);

  // Email/password sign-in (existing)
  const { mutate, isPending, error } = useMutation({
    mutationFn: signInWithPassword,
    onSuccess: () => {
      setTimeout(() => {
        router.push('/profile');
        router.refresh();
      }, 100);
    },
  });

  // Google sign-in - simplified to use same redirect method
  const { mutate: googleMutate, isPending: googlePending } = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: () => {
      // Don't redirect here - let the useEffect handle it after OAuth callback
    },
  });

  const onSubmit = (data: SignInFormValues) => {
    mutate(data);
  };

  return (
    <Stack gap="lg">
      <Paper withBorder p={30} radius="xl">
        <Group mb="md" mt="md">
          <GoogleButton
            radius="xl"
            onClick={() => googleMutate()}
            loading={googlePending}
            fullWidth
          >
            continue with google
          </GoogleButton>
        </Group>

        <Divider
          label="or continue with email"
          labelPosition="center"
          my="lg"
        />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack>
            <TextInput
              label="email"
              radius="md"
              {...register('email')}
              error={errors.email?.message}
            />
            <PasswordInput
              label="password"
              radius="md"
              {...register('password')}
              error={errors.password?.message}
            />

            <Text ta="right">
              <Anchor
                component="button"
                type="button"
                size="xs"
                onClick={() => router.push('/forgot-password')}
              >
                forgot password?
              </Anchor>
            </Text>

            {error && (
              <Text c="red" size="sm" ta="center">
                {error.message}
              </Text>
            )}

            <Button
              color="#6796ec"
              type="submit"
              loading={isPending}
              radius="lg"
              fullWidth
              mt="xl"
            >
              sign in
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt="md">
          don&apos;t have an account?{' '}
          <Anchor
            component="button"
            type="button"
            size="sm"
            onClick={() => router.push('/signup')}
          >
            sign up
          </Anchor>
        </Text>
      </Paper>
    </Stack>
  );
}
