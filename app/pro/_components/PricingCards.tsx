'use client';

import { useState } from 'react';

// The CheckIcon component is included directly in this file.
const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-6 h-6 ${className}`}
  >
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
      clipRule="evenodd"
    />
  </svg>
);

// FIX: Updated Plan interfaces to support multiple tiers with toggles
interface PlanDetails {
  link: string | undefined;
  priceId: string | undefined;
  priceTotal: number;
  pricePerMonth: number;
}

interface Tier {
  monthly: PlanDetails;
  yearly: PlanDetails;
}

interface PricingCardsProps {
  plans: {
    pro: Tier;
    proPlus: Tier;
  };
  user: any; // You might want to type this more specifically
}

export default function PricingCards({ plans, user }: PricingCardsProps) {
  // FIX: Reintroduced state for the toggle, with 'yearly' as the default
  const [isYearly, setIsYearly] = useState(true);

  const handleSubscription = (link: string | undefined) => {
    // 1. Get user data from the session
    const userId = user?.data?.claims?.sub;
    const userEmail = user?.data?.claims?.email;

    // 2. Check for required data
    if (!link) {
      console.error('Stripe payment link is not configured.');
      alert('Sorry, this plan is not available at the moment.');
      return;
    }
    if (!userId || !userEmail) {
      console.error('User is not logged in or session data is missing.');
      alert('You must be logged in to subscribe.');
      return;
    }

    // 3. Construct the secure URL with both parameters
    try {
      const url = new URL(link);
      url.searchParams.append('client_reference_id', userId);
      url.searchParams.append('prefilled_email', userEmail);
      window.open(url.toString(), '_blank');
    } catch (error) {
      console.error('Invalid Stripe payment link URL:', error);
      alert(
        'There was an error with the payment link. Please contact support.'
      );
    }
  };

  return (
    <>
      <div className="flex justify-center mt-10">
        <div className="relative flex items-center p-1 bg-gray-200 rounded-full">
          <button
            onClick={() => setIsYearly(false)}
            className={`relative z-10 w-28 text-sm font-medium py-2 rounded-full transition-colors duration-300 ${
              !isYearly ? 'text-white' : 'text-gray-800'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`relative z-10 w-28 text-sm font-medium py-2 rounded-full transition-colors duration-300 ${
              isYearly ? 'text-white' : 'text-gray-800'
            }`}
          >
            Yearly
          </button>
          <span
            className="absolute top-1 w-28 h-10 bg-gray-800 rounded-full transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(${isYearly ? '100%' : '0%'})` }}
          />
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Free Plan */}
        <div className="flex flex-col rounded-2xl border border-gray-700 p-8">
          <h3 className="text-2xl font-semibold">free</h3>
          <p className="mt-2 text-gray-400">
            for casual collectors and beginners
          </p>
          <div className="mt-6">
            <span className="text-5xl font-bold">$0</span>
          </div>
          <ul className="mt-8 flex-grow space-y-4 text-gray-600">
            <li className="flex items-center">
              <CheckIcon className="mr-3 flex-shrink-0 text-green-500" />
              <span>5 binders</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-3 flex-shrink-0 text-green-500" />
              <span>1 Custom Domain</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-3 flex-shrink-0 text-green-500" />
              <span>Community Support</span>
            </li>
          </ul>
          <button
            onClick={() => alert('Signing up for Free Plan!')}
            className="mt-8 w-full rounded-lg bg-gray-700 py-3 font-semibold text-white transition-colors duration-300 hover:bg-gray-600"
          >
            Get Started
          </button>
        </div>

        {/* Pro Plan (Dynamic) */}
        <div className="relative flex scale-105 flex-col rounded-2xl border border-purple-500 p-8 shadow-2xl shadow-purple-500/10">
          <div className="absolute top-0 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1 text-xs font-bold tracking-wider text-white uppercase">
            Recommended
          </div>
          <h3 className="text-2xl font-semibold">pro</h3>
          <p className="mt-2 text-gray-400">for collector enthusiasts</p>
          <div className="mt-6">
            <span className="text-5xl font-bold">
              {isYearly
                ? `$${plans.pro.yearly.pricePerMonth.toFixed(2)}`
                : `$${plans.pro.monthly.priceTotal.toFixed(2)}`}
            </span>
            <span className="text-gray-400"> / month</span>
            {isYearly && (
              <p className="mt-1 text-sm text-gray-400">
                Billed as ${plans.pro.yearly.priceTotal.toFixed(2)} per year
              </p>
            )}
          </div>
          <ul className="mt-8 flex-grow space-y-4 text-gray-600">
            <li className="flex items-center">
              <CheckIcon className="mr-3 flex-shrink-0 text-green-500" />
              <span>Unlimited binders</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-3 flex-shrink-0 text-green-500" />
              <span>Unlimited Custom Domains</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-3 flex-shrink-0 text-green-500" />
              <span>Dedicated IP Address</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-3 flex-shrink-0 text-green-500" />
              <span>Priority Email Support</span>
            </li>
          </ul>
          <button
            onClick={() =>
              handleSubscription(
                isYearly ? plans.pro.yearly.link : plans.pro.monthly.link
              )
            }
            className="mt-8 w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-semibold text-white transition-opacity duration-300 hover:opacity-90"
          >
            {isYearly ? 'Upgrade to Pro Yearly' : 'Upgrade to Pro Monthly'}
          </button>
        </div>

        {/* Pro+ Plan (Dynamic) */}
        <div className="flex flex-col rounded-2xl border border-gray-700 p-8">
          <h3 className="text-2xl font-semibold">pro+</h3>
          <p className="mt-2 text-gray-400">
            for aesthetic collectors and businesses
          </p>
          <div className="mt-6">
            <span className="text-5xl font-bold">
              {isYearly
                ? `$${plans.proPlus.yearly.pricePerMonth.toFixed(2)}`
                : `$${plans.proPlus.monthly.priceTotal.toFixed(2)}`}
            </span>
            <span className="text-gray-400"> / month</span>
            {isYearly && (
              <p className="mt-1 text-sm text-gray-400">
                Billed as ${plans.proPlus.yearly.priceTotal.toFixed(2)} per year
              </p>
            )}
          </div>
          <ul className="mt-8 flex-grow space-y-4 text-gray-600">
            <li className="flex items-center">
              <CheckIcon className="mr-3 flex-shrink-0 text-green-500" />
              <span>Unlimited binders</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-3 flex-shrink-0 text-green-500" />
              <span>Unlimited Custom Domains</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-3 flex-shrink-0 text-green-500" />
              <span>Dedicated IP Address</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-3 flex-shrink-0 text-green-500" />
              <span>Priority Email Support</span>
            </li>
          </ul>
          <button
            onClick={() =>
              handleSubscription(
                isYearly
                  ? plans.proPlus.yearly.link
                  : plans.proPlus.monthly.link
              )
            }
            className="mt-8 w-full rounded-lg bg-gray-700 py-3 font-semibold text-white transition-colors duration-300 hover:bg-gray-600"
          >
            {isYearly ? 'Upgrade to Pro+ Yearly' : 'Upgrade to Pro+ Monthly'}
          </button>
        </div>
      </div>
    </>
  );
}
