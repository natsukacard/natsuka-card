'use client';

import {
  Alert,
  Button,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconLock } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PasswordPromptProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PasswordPrompt({
  opened,
  onClose,
  onSuccess,
}: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const { mutate: verifyPassword, isPending } = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid password');
      }

      return response.json();
    },
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
        router.push('/dashboard');
      }
    },
    onError: (error: Error) => {
      setError(error.message);
      setPassword('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    verifyPassword(password);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      withCloseButton={true}
      closeOnClickOutside={true}
      closeOnEscape={true}
      centered
      size="sm"
      radius="md"
      className="lowercase"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="xl" p="md">
          <Stack align="center" gap="md">
            <IconLock size={48} color="#6796ec" />
            <Stack gap="xs" align="center">
              <Title order={2} size="h3" fw={600}>
                Password Required
              </Title>
              <Text size="sm" c="dimmed" ta="center">
                This site is currently in private beta. Please enter the access
                password to continue.
              </Text>
            </Stack>
          </Stack>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">
              {error}
            </Alert>
          )}

          <TextInput
            type="password"
            placeholder="Enter access password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            size="md"
            radius="md"
          />

          <Button
            type="submit"
            loading={isPending}
            fullWidth
            size="md"
            radius="md"
            style={{ backgroundColor: '#6796ec' }}
          >
            Access Site
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
