// One-time sync: Create Stripe promotion codes for existing affiliate codes
// Usage: node --env-file=.env.local scripts/sync-stripe-promo-codes.mjs

import { sql } from '@vercel/postgres';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY not set');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',
});

try {
  // Get all active affiliate codes without Stripe promotion codes
  const result = await sql`
    SELECT ac.id, ac.code, ac.discount_value, ac.discount_type, c.full_name
    FROM affiliate_codes ac
    JOIN creators c ON c.id = ac.creator_id
    WHERE ac.active = TRUE
      AND ac.stripe_promotion_code_id IS NULL
    ORDER BY ac.created_at ASC
  `;

  const codes = result.rows;
  console.log(`Found ${codes.length} affiliate codes to sync to Stripe\n`);

  let synced = 0;
  let failed = 0;

  for (const code of codes) {
    const percentOff = code.discount_type === 'percentage' ? Number(code.discount_value) : 10;

    try {
      // Create Stripe coupon
      const coupon = await stripe.coupons.create({
        percent_off: percentOff,
        duration: 'once',
        name: code.code,
        metadata: { source: 'cultr_affiliate', code: code.code },
      });

      // Create promotion code
      const promo = await stripe.promotionCodes.create({
        promotion: { type: 'coupon', coupon: coupon.id },
        code: code.code,
        metadata: { source: 'cultr_affiliate', code: code.code },
      });

      // Store IDs in DB
      await sql`
        UPDATE affiliate_codes
        SET stripe_coupon_id = ${coupon.id},
            stripe_promotion_code_id = ${promo.id},
            updated_at = NOW()
        WHERE id = ${code.id}
      `;

      console.log(`  ✓ ${code.code} (${code.full_name}) → coupon: ${coupon.id}, promo: ${promo.id}`);
      synced++;
    } catch (err) {
      console.error(`  ✗ ${code.code} (${code.full_name}): ${err.message}`);
      failed++;
    }
  }

  console.log(`\nSync complete: ${synced} synced, ${failed} failed`);
} catch (err) {
  console.error('Sync failed:', err.message);
  process.exit(1);
}
