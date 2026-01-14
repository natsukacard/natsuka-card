'use client';

import { Button, Paper, Stack, Text, Title } from '@mantine/core';
import { useRouter } from 'next/navigation';

export default function ConfirmSuccessPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md">
                <Stack gap="lg">
                    <Paper withBorder p={30} radius="xl" className="text-center">
                        <Title order={2} size="h3" fw={500} mb="md">
                            email verified
                        </Title>
                        <Text size="sm" c="dimmed" mb="lg">
                            your email has been successfully verified. you can now access your account.
                        </Text>
                        <Button
                            color="#6796ec"
                            onClick={() => router.push('/profile')}
                            radius="lg"
                            fullWidth
                        >
                            continue to profile
                        </Button>
                    </Paper>
                </Stack>
            </div>
        </div>
    );
}
