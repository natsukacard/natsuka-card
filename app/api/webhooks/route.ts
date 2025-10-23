import { StripeSync } from '@supabase/stripe-sync-engine';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function processWebhookEvent(body: string, signature: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔄 Processing webhook with StripeSync...');

  const sync = new StripeSync({
    poolConfig: {
      connectionString: process.env.DATABASE_CONNECTION_STRING!,
      max: 20,
    },
    stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    schema: 'stripe',
  });

  try {
    await sync.processWebhook(body, signature);
    console.log('✅ StripeSync processed webhook successfully');
  } catch (error) {
    console.error('❌ StripeSync error:', error);
  }

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  console.log('📨 Webhook event type:', event.type);

  if (event.type === 'customer.created' || event.type === 'customer.updated') {
    const customer = event.data.object as Stripe.Customer;
    console.log('👤 Customer event:', {
      id: customer.id,
      email: customer.email,
    });

    if (customer.email) {
      const { error, data } = await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('email', customer.email)
        .select();

      if (error) {
        console.error('❌ Error updating user with Stripe customer ID:', error);
      } else {
        console.log('✅ Updated user with Stripe customer ID:', data);
      }
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('🛒 Checkout completed:', {
      customer: session.customer,
      email: session.customer_email,
      subscription: session.subscription,
    });

    if (session.customer && session.customer_email) {
      const { error, data } = await supabase
        .from('users')
        .update({ stripe_customer_id: session.customer as string })
        .eq('email', session.customer_email)
        .select();

      if (error) {
        console.error('❌ Error updating user:', error);
      } else {
        console.log('✅ Updated user:', data);
      }

      // Check if subscription was created
      const { data: subData, error: subError } = await supabase
        .from('stripe.subscriptions')
        .select('*')
        .eq('customer', session.customer)
        .single();

      console.log('🔍 Subscription check:', { subData, subError });
    }
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature') as string;

  console.log('🎣 Webhook received, signature present:', !!signature);

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    // Verify the webhook signature first
    stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log('✅ Webhook signature verified');

    // Return 200 immediately to Stripe
    const response = NextResponse.json({ received: true });

    // Process webhook asynchronously (don't await)
    processWebhookEvent(body, signature).catch((error) => {
      if (
        error instanceof Error &&
        error.message === 'Unhandled webhook event'
      ) {
        console.log(`Unhandled event type: ${JSON.parse(body).type}`);
      } else {
        console.error('❌ Error processing webhook:', error);
      }
    });

    return response;
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
}
