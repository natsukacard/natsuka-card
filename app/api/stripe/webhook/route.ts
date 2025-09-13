import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET!;

// Helper function to convert Unix timestamp to ISO 8601 string
const toDateTime = (secs: number) => {
  const t = new Date(0);
  t.setUTCSeconds(secs);
  return t.toISOString();
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = await createClient();

  // Handle the event
  switch (event.type) {
    // This event fires when a subscription is created or updated.
    // It's the most important one for keeping your DB in sync.
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;

      // The user ID should be passed in the subscription's metadata
      // when you first create it. This is more reliable than using checkout session metadata.
      const userId = subscription.metadata.userId;

      if (!userId) {
        console.error(
          '❌ Webhook Error: Missing userId in subscription metadata.'
        );
        return new NextResponse('Webhook Error: Missing userId', {
          status: 400,
        });
      }

      const subscriptionData = {
        user_id: userId,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0].price.id,
        stripe_product_id: subscription.items.data[0].price.product as string,
        status: subscription.status,
        current_period_start: toDateTime(
          subscription.items.data[0].current_period_start
        ),
        current_period_end: toDateTime(
          subscription.items.data[0].current_period_end
        ),
        trial_start: subscription.trial_start
          ? toDateTime(subscription.trial_start)
          : null,
        trial_end: subscription.trial_end
          ? toDateTime(subscription.trial_end)
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
          ? toDateTime(subscription.canceled_at)
          : null,
      };

      // Use upsert to either create a new subscription record or update an existing one.
      const { error } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'stripe_subscription_id' });

      if (error) {
        console.error('Supabase upsert error:', error);
        return new NextResponse(
          'Webhook Error: Could not upsert subscription',
          { status: 500 }
        );
      }

      console.log(
        `✅ Subscription synced for user: ${userId}, subscription: ${subscription.id}`
      );
      break;
    }

    // This event fires when a subscription is permanently deleted.
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      // Update the status to 'canceled' and record the cancellation time.
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled', // Ensure status reflects deletion
          canceled_at: subscription.canceled_at
            ? toDateTime(subscription.canceled_at)
            : new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Supabase update error on deletion:', error);
        return new NextResponse(
          'Webhook Error: Could not update subscription on deletion',
          { status: 500 }
        );
      }

      console.log(
        `✅ Subscription deleted for subscription: ${subscription.id}`
      );
      break;
    }

    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
