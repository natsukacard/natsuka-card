'use client';

import { PasswordPrompt } from '@/components/ui/PasswordPrompt';
import {
  faArrowRightArrowLeft,
  faBook,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Page() {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('protected') === 'true') {
      setShowPasswordPrompt(true);
    }
  }, [searchParams]);

  const handleCloseModal = () => {
    setShowPasswordPrompt(false);
    router.replace('/', undefined);
  };

  const handleLinkClick = (href: string) => {
    setShowPasswordPrompt(true);
  };

  return (
    <>
      <div className="min-h-screen lowercase">
        <section className="relative overflow-hidden py-24">
          <Container size="lg">
            <Stack align="center" gap="xl">
              <Badge
                variant="outline"
                color="#fc66a7"
                size="md"
                style={{ textTransform: 'none' }}
              >
                currently in beta
              </Badge>

              <Stack align="center" gap="md">
                <Title
                  order={1}
                  size="h1"
                  fw={600}
                  ta="center"
                  style={{ textTransform: 'none' }}
                >
                  elevate your{' '}
                  <span style={{ color: '#6796ec' }}>collection game</span>
                </Title>
                <Text size="lg" c="dimmed" ta="center" maw={600}>
                  Track, organize, and showcase your Pokemon card collection
                  with powerful tools designed for serious collectors.
                </Text>
              </Stack>

              <Group gap="md">
                <Button
                  onClick={() => handleLinkClick('/signup')}
                  size="lg"
                  radius="md"
                  style={{ backgroundColor: '#6796ec' }}
                >
                  get started
                </Button>
                <Button
                  onClick={() => handleLinkClick('/login')}
                  variant="outline"
                  size="lg"
                  radius="md"
                  color="#6796ec"
                >
                  sign in
                </Button>
              </Group>
            </Stack>
          </Container>
        </section>

        <section className="py-24 bg-gray-50">
          <Container size="lg">
            <Stack gap="xl">
              <Stack align="center" gap="md">
                <Title order={2} ta="center" fw={600}>
                  Everything you need to manage your collection
                </Title>
                <Text size="lg" c="dimmed" ta="center" maw={600}>
                  From inventory tracking to market analysis, we've got you
                  covered.
                </Text>
              </Stack>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Stack gap="md">
                    <FontAwesomeIcon icon={faBook} size="2x" color="#6796ec" />
                    <Title order={3} size="h4">
                      Digital Binders
                    </Title>
                    <Text c="dimmed">
                      Organize your cards in customizable digital binders with
                      detailed tracking and sorting options.
                    </Text>
                  </Stack>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Stack gap="md">
                    <FontAwesomeIcon
                      icon={faChartLine}
                      size="2x"
                      color="#6796ec"
                    />
                    <Title order={3} size="h4">
                      Market Insights
                    </Title>
                    <Text c="dimmed">
                      Track card values and market trends to make informed
                      collecting decisions.
                    </Text>
                  </Stack>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Stack gap="md">
                    <FontAwesomeIcon
                      icon={faArrowRightArrowLeft}
                      size="2x"
                      color="#6796ec"
                    />
                    <Title order={3} size="h4">
                      Trade Management
                    </Title>
                    <Text c="dimmed">
                      Manage trades and wishlist items with integrated
                      communication tools.
                    </Text>
                  </Stack>
                </Card>
              </div>
            </Stack>
          </Container>
        </section>
      </div>

      <PasswordPrompt opened={showPasswordPrompt} onClose={handleCloseModal} />
    </>
  );
}
