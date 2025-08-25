'use client';
import { signInWithPassword } from '@/lib/auth/actions';
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

  // useMutation handles form submission, loading, and errors
  const { mutate, isPending, error } = useMutation({
    mutationFn: signInWithPassword,
    onSuccess: () => {
      // Redirects on success
      router.push('/profile');
      router.refresh();
    },
  });

  const onSubmit = (data: SignInFormValues) => {
    mutate(data);
  };

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
              color="#8d84b0"
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
