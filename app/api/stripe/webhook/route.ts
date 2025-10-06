import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  console.log('=== WEBHOOK RECEIVED ===');

  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('Event verified successfully:', event.type);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      console.log('CHECKOUT SESSION COMPLETED - Processing...');
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Session ID:', session.id);
      console.log('Client Reference ID:', session.client_reference_id);
      console.log('Customer ID:', session.customer);
      console.log('Subscription ID:', session.subscription);
      console.log('Amount Total:', session.amount_total);

      if (session.client_reference_id) {
        let planType = 'pro';
        const amount = session.amount_total || 0;
        if (amount >= 9999) {
          planType = 'pro_plus';
        }

        console.log('Plan type determined:', planType);
        console.log(
          'Updating user profile for user:',
          session.client_reference_id
        );

        // Update user_profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .update({
            is_premium: true,
            plan_type: planType,
            stripe_customer_id: session.customer,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.client_reference_id)
          .select();

        if (profileError) {
          console.error('FAILED to update user profile:', profileError);
        } else {
          console.log('SUCCESS: User profile updated:', profileData);
        }

        // Handle subscription if present
        if (session.subscription) {
          console.log(
            'Session has subscription, creating subscription record...'
          );
          try {
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            );
            console.log('Retrieved subscription from Stripe:', subscription.id);

            // Use type assertion and handle the API version differences
            const sub = subscription as any;
            console.log('Raw subscription data:', {
              current_period_start: sub.current_period_start,
              current_period_end: sub.current_period_end,
              created: sub.created,
            });

            // Helper function to safely convert timestamps
            const safeTimestamp = (timestamp: any) => {
              if (!timestamp) return null;
              try {
                const date = new Date(timestamp * 1000);
                if (isNaN(date.getTime())) {
                  console.warn('Invalid timestamp:', timestamp);
                  return null;
                }
                return date.toISOString();
              } catch (error) {
                console.warn('Error converting timestamp:', timestamp, error);
                return null;
              }
            };

            const subscriptionData = {
              user_id: session.client_reference_id,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: sub.id,
              stripe_price_id: sub.items?.data?.[0]?.price?.id || null,
              stripe_product_id:
                (sub.items?.data?.[0]?.price?.product as string) || null,
              status: sub.status,
              current_period_start: safeTimestamp(sub.current_period_start),
              current_period_end: safeTimestamp(sub.current_period_end),
              trial_start: safeTimestamp(sub.trial_start),
              trial_end: safeTimestamp(sub.trial_end),
              cancel_at_period_end: sub.cancel_at_period_end || false,
              canceled_at: safeTimestamp(sub.canceled_at),
              created_at:
                safeTimestamp(sub.created) || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            console.log('Subscription data to insert:', subscriptionData);

            const { data: subData, error: subError } = await supabase
              .from('subscriptions')
              .upsert(subscriptionData)
              .select();

            if (subError) {
              console.error('FAILED to create subscription record:', subError);
            } else {
              console.log('SUCCESS: Subscription record created:', subData);
            }
          } catch (stripeError) {
            console.error(
              'FAILED to fetch subscription from Stripe:',
              stripeError
            );
          }
        } else {
          console.log('No subscription ID in session');
        }
      } else {
        console.error('No client_reference_id found in checkout session');
      }
      break;

    default:
      console.log('Unhandled event type:', event.type);
  }

  return NextResponse.json({ received: true });
}
