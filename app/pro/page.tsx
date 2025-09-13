// Use default imports for your components
import { createClient } from '@/lib/supabase/server';
import ComparisonTable from './_components/ComparisonTable';
import PricingCards from './_components/PricingCards';

// Main Pricing Page Component
export default async function PricingPage() {
  // --- Stripe Integration Logic ---
  const plans = {
    pro: {
      monthly: {
        link:
          process.env.NODE_ENV === 'development'
            ? process.env.NEXT_PUBLIC_STRIPE_TEST_MONTHLY_LINK
            : process.env.NEXT_PUBLIC_STRIPE_LIVE_MONTHLY_LINK,
        priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
        priceTotal: 3.99,
        pricePerMonth: 3.99,
      },
      yearly: {
        link:
          process.env.NODE_ENV === 'development'
            ? process.env.NEXT_PUBLIC_STRIPE_TEST_YEARLY_LINK
            : process.env.NEXT_PUBLIC_STRIPE_LIVE_YEARLY_LINK,
        priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID,
        priceTotal: 34.99,
        pricePerMonth: 2.92,
      },
    },
    proPlus: {
      monthly: {
        link:
          process.env.NODE_ENV === 'development'
            ? process.env.NEXT_PUBLIC_STRIPE_TEST_MONTHLY_LINK
            : process.env.NEXT_PUBLIC_STRIPE_LIVE_MONTHLY_LINK,
        priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
        priceTotal: 9.99,
        pricePerMonth: 9.99,
      },
      yearly: {
        link:
          process.env.NODE_ENV === 'development'
            ? process.env.NEXT_PUBLIC_STRIPE_TEST_YEARLY_LINK
            : process.env.NEXT_PUBLIC_STRIPE_LIVE_YEARLY_LINK,
        priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID,
        priceTotal: 99.99,
        pricePerMonth: 8.34,
      },
    },
  };
  // --- Session Management ---
  const supabase = await createClient();
  const user = await supabase.auth.getClaims();

  return (
    <div className="min-h-screen font-sans text-[#71698f]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            unlock natsuka pro
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400 sm:text-xl">
            get access to more binders, personalize your profile, customize your
            collecting and trading experience and so many other exclusive
            features!
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards plans={plans} user={user} />

        {/* Feature Comparison Table */}
        <ComparisonTable />
      </div>
    </div>
  );
}
