'use client';
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { useState } from 'react';

interface User {
  data?: {
    claims?: {
      sub?: string;
      email?: string;
    };
  } | null;
  error?: unknown;
}

interface PricingContainerProps {
  plans: {
    pro: {
      monthly: {
        link: string | undefined;
        priceId: string | undefined;
        priceTotal: number;
        pricePerMonth: number;
      };
      annual: {
        link: string | undefined;
        priceId: string | undefined;
        priceTotal: number;
        pricePerMonth: number;
      };
    };
  };
  user: User;
}

export default function PricingContainer({
  plans,
  user,
}: PricingContainerProps) {
  const [isYearly, setIsYearly] = useState(true); // Default to yearly

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

  // Get current plan based on toggle
  const currentPlan = isYearly ? plans.pro.annual : plans.pro.monthly;
  const savingsPercentage = Math.round(
    (1 - plans.pro.annual.priceTotal / 12 / plans.pro.monthly.priceTotal) * 100
  );

  return (
    <Box py="xl">
      <Container size="md">
        <Stack align="center" gap="xl">
          <Title order={1} ta="center" size="h1">
            Unlock Natsuka Pro
          </Title>
          <Text size="xl" c="dimmed" ta="center" maw={600}>
            Get access to more binders, personalize your profile, and unlock
            exclusive features!
          </Text>

          {/* Toggle Switch */}
          <Group gap="md">
            <Text size="lg" fw={isYearly ? 400 : 600}>
              Monthly
            </Text>
            <Switch
              size="lg"
              checked={isYearly}
              onChange={(event) => setIsYearly(event.currentTarget.checked)}
            />
            <Group gap="xs">
              <Text size="lg" fw={isYearly ? 600 : 400}>
                Yearly
              </Text>
              <Badge color="green" size="sm" variant="light">
                Save {savingsPercentage}%
              </Badge>
            </Group>
          </Group>

          {/* Single Pricing Card */}
          <Card
            withBorder
            radius="lg"
            padding="xl"
            shadow="lg"
            maw={400}
            w="100%"
          >
            <Stack align="center" gap="lg">
              {/* Header */}
              <Title order={2} size="h2">
                Pro
              </Title>

              {/* Pricing */}
              <Stack gap={0} align="center">
                <Text size="3rem" fw={700} c="blue">
                  ${currentPlan.priceTotal}
                </Text>
                <Text c="dimmed" size="sm">
                  {isYearly
                    ? `per year ($${currentPlan.pricePerMonth}/month)`
                    : 'per month'}
                </Text>
              </Stack>

              {/* Features */}
              <Stack gap="xs" w="100%">
                {[
                  'More binders',
                  'Personalize your profile',
                  'Exclusive features',
                ].map((feature, index) => (
                  <Group key={index} gap="xs" align="flex-start">
                    <Text c="green" fw={600}>
                      ✓
                    </Text>
                    <Text size="sm">{feature}</Text>
                  </Group>
                ))}
              </Stack>

              {/* CTA Button */}
              <Button
                size="lg"
                fullWidth
                onClick={() => handleSubscription(currentPlan.link)}
              >
                Subscribe {isYearly ? 'Yearly' : 'Monthly'}
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
