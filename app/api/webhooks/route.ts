import { StripeSync } from '@supabase/stripe-sync-engine';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function processWebhookEvent(
  event: Stripe.Event,
  body: string,
  signature: string
) {
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

  await sync.processWebhook(body, signature);

  if (event.type.startsWith('customer.')) {
    const customer = event.data.object as Stripe.Customer;

    let email =
      customer.email ?? (customer.metadata?.user_email as string | undefined);

    if (!email) {
      const { data, error } = await supabase
        .schema('stripe')
        .from('customers')
        .select('email')
        .eq('id', customer.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Failed to fetch email for customer', {
          customerId: customer.id,
          error,
        });
      }
      email = data?.email ?? undefined;
    }

    if (email) {
      const { error } = await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('email', email);

      if (error) {
        console.error('❌ Failed to sync customer to users', {
          customerId: customer.id,
          email,
          error,
        });
      } else {
        console.log('✅ Synced customer to users', {
          customerId: customer.id,
          email,
        });
      }
    } else {
      console.log('ℹ️ Skipped customer sync; no email available', {
        customerId: customer.id,
      });
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const email =
      session.customer_email ??
      session.customer_details?.email ??
      (session.metadata?.user_email as string | undefined);

    const customerId =
      typeof session.customer === 'string' ? session.customer : undefined;

    if (customerId && email) {
      const { error } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('email', email);

      if (error) {
        console.error('❌ Failed to sync checkout session', {
          customerId,
          email,
          error,
        });
      } else {
        console.log('✅ Synced checkout session', { customerId, email });
      }
    } else {
      console.log('ℹ️ Skipped checkout sync; missing customer/email', {
        customerId,
        email,
      });
    }
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await processWebhookEvent(event, body, signature);
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
