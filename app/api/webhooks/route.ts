import { StripeSync } from '@supabase/stripe-sync-engine';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const sync = new StripeSync({
    poolConfig: {
      connectionString: process.env.DATABASE_CONNECTION_STRING!,
      max: 20,
    },
    stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    schema: 'stripe',
  });

  const body = await request.text();
  const signature = (await headers()).get('stripe-signature') as string;

  try {
    await sync.processWebhook(body, signature);
  } catch (error) {
    // Handle unhandled webhook events gracefully
    if (error instanceof Error && error.message === 'Unhandled webhook event') {
      const event = JSON.parse(body);
      return NextResponse.json({
        received: true,
        message: `Unhandled event type: ${event.type}`,
      });
    }

    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
  return NextResponse.json({ received: true });
}
