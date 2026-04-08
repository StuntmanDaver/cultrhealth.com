import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, getMembershipTier, hasFeatureAccess } from '@/lib/auth';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const maxDuration = 30; // Max execution time for Vercel functions

const SYSTEM_PROMPT = `
You are a helpful, professional health assistant acting as a guide for CULTR Health's Dosing Engine.
Your ONLY job is to explain the provided deterministic dosing calculations in a conversational, friendly way.

STRICT GUARDRAILS:
1. DO NOT invent, suggest, or alter any dosing numbers. Only summarize what is provided to you.
2. If the user is flagged as ineligible or requires provider escalation, you MUST emphasize that they need to consult their provider and CANNOT proceed without doing so.
3. NEVER present yourself as a doctor, and never give medical advice.
4. Remind the user that these are mathematical conversions or reference schedules, not a prescription.
`;

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
    const { recommendation, intake } = body;

    if (!recommendation || !intake) {
      return NextResponse.json({ error: 'Missing recommendation or intake data' }, { status: 400 });
    }

    const prompt = `
Please summarize the following recommendation for the user.
User Input:
- Age: ${intake.age}, Weight: ${intake.weightLb} lbs, Sex: ${intake.sex}
- Product: ${recommendation.product?.name}
- Goal: ${intake.goal}

Recommendation Output:
- Eligible: ${recommendation.eligible}
- Requires Escalation: ${recommendation.requiresProviderEscalation}
- Red Flags: ${recommendation.redFlags?.join(', ') || 'None'}

Please provide a 2-3 paragraph friendly summary of this result.
    `;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      prompt,
      temperature: 0.2, // Low temperature for safety
      maxOutputTokens: 500,
    });

    return NextResponse.json({ explanation: text });
  } catch (error) {
    console.error('LLM Dosing Explain error:', error);
    return NextResponse.json({ error: 'Failed to generate explanation.' }, { status: 500 });
  }
}
