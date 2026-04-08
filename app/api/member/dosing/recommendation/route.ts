import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, getMembershipTier, hasFeatureAccess } from '@/lib/auth';
import { UserIntakeResponseSchema } from '@/lib/dosing-engine/validation';
import { evaluateRecommendation } from '@/lib/dosing-engine/engine';
import { UserIntakeResponse } from '@/lib/dosing-engine/types';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.email || !auth.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getMembershipTier(auth.customerId, auth.email);
    if (!hasFeatureAccess(tier, 'dosingCalculators')) {
      return NextResponse.json({ error: 'Feature not available on current plan' }, { status: 403 });
    }

    const body = await request.json();
    const result = UserIntakeResponseSchema.safeParse(body);

    if (!result.success) {
      console.log('Validation error:', result.error.errors);
      return NextResponse.json(
        { error: 'Invalid intake data: ' + JSON.stringify(result.error.errors) },
        { status: 400 }
      );
    }

    const intake: UserIntakeResponse = result.data as UserIntakeResponse;
    const recommendation = evaluateRecommendation(intake);

    // Audit logging (fire and forget to not block response)
    sql`
      INSERT INTO dosing_recommendation_audit 
      (user_id, role, product_id, rule_version, intake_data, recommendation_data, escalated)
      VALUES 
      (${auth.customerId}, 'member', ${recommendation.product.id}, ${recommendation.ruleTrace.version}, ${JSON.stringify(intake)}, ${JSON.stringify(recommendation)}, ${recommendation.requiresProviderEscalation})
    `.catch(err => console.error('Failed to log dosing recommendation:', err));

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('Dosing recommendation error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'An error occurred processing the recommendation.' }, { status: 500 });
  }
}
