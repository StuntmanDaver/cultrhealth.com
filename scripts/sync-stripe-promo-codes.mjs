// Idempotent sync: backfill Stripe coupon/promotion-code IDs for affiliate codes.
// Usage:
//   node --env-file=.env.local scripts/sync-stripe-promo-codes.mjs
//   DRY_RUN=true node --env-file=.env.local scripts/sync-stripe-promo-codes.mjs

import { sql } from '@vercel/postgres';
import Stripe from 'stripe';
import { config } from 'dotenv';

config({ path: '.env.local', override: false, quiet: true });
config({ path: '.env', override: false, quiet: true });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY not set');
  process.exit(1);
}

const dryRun = process.env.DRY_RUN === 'true';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',
});

function getCouponId(coupon) {
  if (!coupon) return null;
  return typeof coupon === 'string' ? coupon : coupon.id;
}

async function findExistingPromotionCode(code) {
  const promotions = await stripe.promotionCodes.list({
    code,
    limit: 100,
  });

  return promotions.data.find((promo) => promo.code.toUpperCase() === code.toUpperCase() && promo.active)
    || promotions.data.find((promo) => promo.code.toUpperCase() === code.toUpperCase())
    || null;
}

async function createPromotionCode(code, discountType, discountValue) {
  const couponParams = {
    duration: 'once',
    name: code,
    metadata: { source: 'cultr_affiliate', code },
  };

  if (discountType === 'fixed') {
    couponParams.amount_off = Math.round(Number(discountValue) * 100);
    couponParams.currency = 'usd';
  } else {
    couponParams.percent_off = Number(discountValue);
  }

  const coupon = await stripe.coupons.create(couponParams);
  const promo = await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: coupon.id },
    code,
    metadata: { source: 'cultr_affiliate', code },
  });

  return { couponId: coupon.id, promotionCodeId: promo.id, source: 'created' };
}

try {
  // Get all active affiliate codes without Stripe promotion codes
  const result = await sql`
    SELECT
      ac.id,
      ac.code,
      ac.discount_value,
      ac.discount_type,
      ac.stripe_coupon_id,
      ac.stripe_promotion_code_id,
      c.full_name
    FROM affiliate_codes ac
    JOIN creators c ON c.id = ac.creator_id
    WHERE ac.active = TRUE
      AND (
        ac.stripe_coupon_id IS NULL
        OR ac.stripe_promotion_code_id IS NULL
      )
    ORDER BY ac.created_at ASC
  `;

  const codes = result.rows;
  console.log(`Found ${codes.length} affiliate codes to sync to Stripe${dryRun ? ' (dry run)' : ''}\n`);

  let synced = 0;
  let reused = 0;
  let created = 0;
  let failed = 0;

  for (const code of codes) {
    try {
      let syncResult;
      const existingPromo = await findExistingPromotionCode(code.code);

      if (existingPromo) {
        syncResult = {
          couponId: getCouponId(existingPromo.coupon),
          promotionCodeId: existingPromo.id,
          source: 'reused',
        };
      } else if (dryRun) {
        syncResult = {
          couponId: 'dry_run_would_create',
          promotionCodeId: 'dry_run_would_create',
          source: 'would_create',
        };
      } else {
        syncResult = await createPromotionCode(code.code, code.discount_type, code.discount_value);
      }

      if (!syncResult.couponId || !syncResult.promotionCodeId) {
        throw new Error('Stripe promotion code did not include both coupon and promotion IDs');
      }

      // Store IDs in DB
      if (!dryRun) {
        await sql`
          UPDATE affiliate_codes
          SET stripe_coupon_id = ${syncResult.couponId},
              stripe_promotion_code_id = ${syncResult.promotionCodeId},
              updated_at = NOW()
          WHERE id = ${code.id}
        `;
      }

      if (syncResult.source === 'reused') reused++;
      if (syncResult.source === 'created' || syncResult.source === 'would_create') created++;
      console.log(`  ✓ ${code.code} (${code.full_name}) ${syncResult.source} → coupon: ${syncResult.couponId}, promo: ${syncResult.promotionCodeId}`);
      synced++;
    } catch (err) {
      console.error(`  ✗ ${code.code} (${code.full_name}): ${err.message}`);
      failed++;
    }
  }

  console.log(`\nSync complete: ${synced} synced (${reused} reused, ${created} created), ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} catch (err) {
  console.error('Sync failed:', err.message);
  process.exit(1);
}
