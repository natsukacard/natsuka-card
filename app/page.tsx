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
import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
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
              <Text
                size="lg"
                c="dimmed"
                ta="center"
                maw={600}
                style={{ textTransform: 'none' }}
              >
                organize, track, and trade your cards like never before. natsuka
                is designed with real collectors in mind.
              </Text>
            </Stack>

            <Group justify="center" gap="md">
              <Button
                component={Link}
                href="/signup"
                color="#6796ec"
                radius="xl"
                size="lg"
                style={{ textTransform: 'none' }}
              >
                sign up
              </Button>
            </Group>
          </Stack>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <Container size="md">
          <Stack align="center" gap="md" mb="xl">
            <Title
              order={2}
              size="h2"
              fw={600}
              ta="center"
              style={{ textTransform: 'none' }}
            >
              with natsuka, you can...
            </Title>
            <Text
              size="lg"
              c="dimmed"
              ta="center"
              style={{ textTransform: 'none' }}
            >
              everything you need to manage your collection professionally
            </Text>
          </Stack>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1: Plan Your Binders */}
            <Card
              withBorder
              radius="lg"
              className="transition-colors hover:border-[#8d84b0]/50"
            >
              <Stack gap="md" p="md">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg">
                  <FontAwesomeIcon
                    icon={faBook}
                    size="2x"
                    style={{ color: '#6796ec' }}
                  />
                </div>
                <Text fw={500} size="lg" style={{ textTransform: 'none' }}>
                  plan your binders
                </Text>
                <Text size="sm" c="dimmed" style={{ textTransform: 'none' }}>
                  track, organize and display your collection in binders exactly
                  the way you envision it
                </Text>
              </Stack>
            </Card>

            {/* Feature 2: Track the Markets */}
            <Card
              withBorder
              radius="lg"
              className="transition-colors hover:border-[#8d84b0]/50"
            >
              <Stack gap="md" p="md">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg">
                  <FontAwesomeIcon
                    icon={faChartLine}
                    size="2x"
                    style={{ color: '#6796ec' }}
                  />
                </div>
                <Text fw={500} size="lg" style={{ textTransform: 'none' }}>
                  track the markets
                </Text>
                <Text size="sm" c="dimmed" style={{ textTransform: 'none' }}>
                  see real-time pricing, supply & demand, and market trends for
                  your favorite cards
                </Text>
              </Stack>
            </Card>

            {/* Feature 3: Find Trades */}
            <Card
              withBorder
              radius="lg"
              className="transition-colors hover:border-[#8d84b0]/50"
            >
              <Stack gap="md" p="md">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg">
                  <FontAwesomeIcon
                    icon={faArrowRightArrowLeft}
                    size="2x"
                    style={{ color: '#6796ec' }}
                  />
                </div>
                <Text fw={500} size="lg" style={{ textTransform: 'none' }}>
                  find trades
                </Text>
                <Text size="sm" c="dimmed" style={{ textTransform: 'none' }}>
                  connect with other collectors, find trades, and buy & sell
                  cards with confidence
                </Text>
              </Stack>
            </Card>
          </div>
        </Container>
      </section>

      {/* Coming Soon Section */}
      <section className="py-16">
        <Container size="xl">
          <Stack align="center" gap="md" mb="xl">
            <Title
              order={2}
              size="h2"
              fw={600}
              ta="center"
              style={{ textTransform: 'none' }}
            >
              more features coming soon
            </Title>
          </Stack>
        </Container>
      </section>
    </div>
  );
}
