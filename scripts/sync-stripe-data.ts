import { StripeSync } from '@supabase/stripe-sync-engine';
import 'dotenv/config';

async function syncStripeData() {
  try {
    console.log('🔄 Syncing existing Stripe data using stripe-sync-engine...');

    const sync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_CONNECTION_STRING!,
        max: 20,
      },
      stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      schema: 'stripe',
    });

    // Sync all products from Stripe to database
    console.log('📦 Syncing products...');
    await sync.syncProducts();
    console.log('✅ Products synced');

    // Sync all prices from Stripe to database
    console.log('💰 Syncing prices...');
    await sync.syncPrices();
    console.log('✅ Prices synced');

    // Sync all customers from Stripe to database
    console.log('👥 Syncing customers...');
    await sync.syncCustomers();
    console.log('✅ Customers synced');

    console.log('\n🎉 Stripe data sync completed!');
  } catch (error) {
    console.error('❌ Error syncing Stripe data:', error);
  }
}

syncStripeData();
