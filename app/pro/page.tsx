import { createClient } from '@/lib/supabase/server';
import { Container, Stack, Text, Title } from '@mantine/core';
import ComparisonTable from './_components/ComparisonTable';
import PricingCards from './_components/PricingCards';

// Main Pricing Page Component
export default async function PricingPage() {
  // --- Stripe Integration Logic ---
  const plans = {
    pro: {
      annual: {
        link: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PAYMENT_LINK,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID,
        priceTotal: 34.99,
        pricePerMonth: 2.92,
      },
    },
    proPlus: {
      annual: {
        link: process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_ANNUAL_PAYMENT_LINK,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_ANNUAL_PRICE_ID,
        priceTotal: 99.99,
        pricePerMonth: 8.33,
      },
    },
  };
  // --- Session Management ---
  const supabase = await createClient();
  const user = await supabase.auth.getClaims();

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header Section */}
        <Stack gap="md" ta="center">
          <Title order={1} size="h1">
            Unlock Natsuka Pro
          </Title>
          <Text size="xl" c="dimmed" maw={600} mx="auto">
            Choose the plan that's right for you
          </Text>
        </Stack>

        {/* Pricing Cards */}
        <PricingCards plans={plans} user={user} />

        {/* Feature Comparison Table */}
        <ComparisonTable />
      </Stack>
    </Container>
  );
}
