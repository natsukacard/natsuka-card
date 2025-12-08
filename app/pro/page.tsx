import { createClient } from '@/lib/supabase/server';
import { Container } from '@mantine/core';
import ComparisonTable from './_components/ComparisonTable';
import PricingContainer from './_components/PricingContainer';

// Main Pricing Page Component
export default async function PricingPage() {
  // --- Stripe Integration Logic ---
  const plans = {
    pro: {
      monthly: {
        link: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PAYMENT_LINK,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
        priceTotal: 4.99,
        pricePerMonth: 4.99,
      },
      annual: {
        link: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PAYMENT_LINK,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID,
        priceTotal: 34.99,
        pricePerMonth: 2.92,
      },
    },
  };

  // --- Session Management ---
  const supabase = await createClient();
  const user = await supabase.auth.getClaims();

  return (
    <Container size="lg" py="xl" className="lowercase">
      {/* Pricing Container */}
      <PricingContainer plans={plans} user={user} />

      {/* Feature Comparison Table */}
      <ComparisonTable />
    </Container>
  );
}
