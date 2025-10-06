'use client';

import { Badge, Button, Card, Grid, Stack, Text, Title } from '@mantine/core';

interface PlanDetails {
  link: string | undefined;
  priceId: string | undefined;
  priceTotal: number;
  pricePerMonth: number;
}

interface Tier {
  annual: PlanDetails;
}

interface PricingCardsProps {
  plans: {
    pro: Tier;
    proPlus: Tier;
  };
  user: any;
}

export default function PricingCards({ plans, user }: PricingCardsProps) {
  const handleSubscription = (link: string | undefined) => {
    const userId = user?.data?.claims?.sub;
    const userEmail = user?.data?.claims?.email;

    if (!link) {
      alert('Payment link not configured');
      return;
    }

    if (!userId || !userEmail) {
      alert('Please log in to subscribe');
      return;
    }

    const url = new URL(link);
    url.searchParams.append('client_reference_id', userId);
    url.searchParams.append('prefilled_email', userEmail);

    window.open(url.toString(), '_blank');
  };

  return (
    <Grid gutter="xl" justify="center">
      {/* Pro Plan */}
      <Grid.Col span={{ base: 12, md: 6 }} maw={400}>
        <Card shadow="lg" padding="xl" radius="md" withBorder h="100%">
          <Stack justify="space-between" h="100%">
            <Stack gap="md">
              <Title order={2} ta="center">
                Pro
              </Title>

              <Stack align="center" gap={0}>
                <Text size="3rem" fw={700} c="blue">
                  ${plans.pro.annual.priceTotal}
                </Text>
                <Text c="dimmed">
                  per year (${plans.pro.annual.pricePerMonth}/month)
                </Text>
              </Stack>

              <Stack gap="xs">
                <Text>✅ Advanced features</Text>
                <Text>✅ Priority support</Text>
                <Text>✅ Extended storage</Text>
              </Stack>
            </Stack>

            <Button
              size="lg"
              fullWidth
              onClick={() => handleSubscription(plans.pro.annual.link)}
            >
              Choose Pro
            </Button>
          </Stack>
        </Card>
      </Grid.Col>

      {/* Pro Plus Plan */}
      <Grid.Col span={{ base: 12, md: 6 }} maw={400}>
        <Card
          shadow="lg"
          padding="xl"
          radius="md"
          withBorder
          h="100%"
          style={{
            borderColor: 'var(--mantine-color-orange-4)',
            borderWidth: '2px',
            position: 'relative',
          }}
        >
          {/* Recommended Badge */}
          <Badge
            color="orange"
            size="lg"
            radius="xl"
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
          >
            Most Popular
          </Badge>

          <Stack justify="space-between" h="100%">
            <Stack gap="md">
              <Title order={2} ta="center">
                Pro Plus
              </Title>

              <Stack align="center" gap={0}>
                <Text size="3rem" fw={700} c="orange">
                  ${plans.proPlus.annual.priceTotal}
                </Text>
                <Text c="dimmed">
                  per year (${plans.proPlus.annual.pricePerMonth}/month)
                </Text>
              </Stack>

              <Stack gap="xs">
                <Text>✅ Everything in Pro</Text>
                <Text>✅ Premium features</Text>
                <Text>✅ White-label options</Text>
                <Text>✅ API access</Text>
              </Stack>
            </Stack>

            <Button
              size="lg"
              fullWidth
              color="orange"
              onClick={() => handleSubscription(plans.proPlus.annual.link)}
            >
              Choose Pro Plus
            </Button>
          </Stack>
        </Card>
      </Grid.Col>
    </Grid>
  );
}
