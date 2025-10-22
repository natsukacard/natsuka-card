import { StripeSync } from '@supabase/stripe-sync-engine';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (
      event.type === 'customer.created' ||
      event.type === 'customer.updated'
    ) {
      const customer = event.data.object as Stripe.Customer;

      if (customer.email) {
        const { error } = await supabase
          .from('users')
          .update({ stripe_customer_id: customer.id })
          .eq('email', customer.email);

        if (error) {
          console.error('Error updating user with Stripe customer ID:', error);
        } else {
          console.log(
            `Updated user with email ${customer.email} to have Stripe customer ID ${customer.id}`
          );
        }
      }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.customer && session.customer_email) {
        const { error } = await supabase
          .from('users')
          .update({ stripe_customer_id: session.customer as string })
          .eq('email', session.customer_email);

        if (error) {
          console.error('Error updating user with Stripe customer ID:', error);
        } else {
          console.log(
            `Updated user with email ${session.customer_email} to have Stripe customer ID ${session.customer}`
          );
        }
      }
    }
  } catch (error) {
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
