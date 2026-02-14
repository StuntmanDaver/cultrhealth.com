import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are a certified nutritionist and meal planning expert for CULTR Health, a longevity-focused telehealth clinic. Generate practical, delicious daily meal plans that precisely match the user's macro targets.

Guidelines:
- Create a full day meal plan with Breakfast, Lunch, Dinner, and 1-2 Snacks
- Each meal should list specific foods with portions (in grams or common measurements)
- Include approximate macros for each meal (protein, carbs, fat, calories)
- Use common, accessible ingredients that are easy to prepare
- Focus on whole foods that support longevity and metabolic health
- Keep meals practical for busy professionals
- Ensure the total daily macros closely match the targets (within 5%)

Format your response as:

## Breakfast
[Meal description with portions]
**Macros:** Xg protein | Xg carbs | Xg fat | X kcal

## Lunch
[Meal description with portions]
**Macros:** Xg protein | Xg carbs | Xg fat | X kcal

## Dinner
[Meal description with portions]
**Macros:** Xg protein | Xg carbs | Xg fat | X kcal

## Snacks
[1-2 snack options with portions]
**Macros:** Xg protein | Xg carbs | Xg fat | X kcal

## Daily Total
**Macros:** Xg protein | Xg carbs | Xg fat | X kcal

Keep descriptions concise but specific. Include cooking methods where relevant.`;

function getFriendlyError(err: unknown): { message: string; status: number } {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes('insufficient_quota') || lower.includes('exceeded your current quota') || lower.includes('billing')) {
    return { message: 'OpenAI API quota exceeded. Please add credits to your OpenAI account and try again.', status: 502 };
  }
  if (lower.includes('rate_limit') || lower.includes('rate limit')) {
    return { message: 'Too many requests. Please wait a moment and try again.', status: 429 };
  }
  if (lower.includes('invalid_api_key') || lower.includes('incorrect api key') || lower.includes('authentication')) {
    return { message: 'OpenAI API key is invalid. Please check your API key configuration.', status: 502 };
  }
  if (lower.includes('model_not_found') || lower.includes('does not exist')) {
    return { message: 'AI model temporarily unavailable. Please try again later.', status: 502 };
  }
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('econnrefused') || lower.includes('fetch failed')) {
    return { message: 'Could not reach the AI service. Please check your connection and try again.', status: 504 };
  }

  return { message: 'Something went wrong generating your meal plan. Please try again.', status: 500 };
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Meal plan service is not configured. Please contact support.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { calories, protein, carbs, fat, goal, bmr, tdee } = body;

    if (!calories || !protein || !carbs || !fat) {
      return new Response(
        JSON.stringify({ error: 'Missing required macro targets' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const goalContext: Record<string, string> = {
      'aggressive-cut': 'aggressive weight loss (high protein, low carb)',
      'cut': 'moderate fat loss (caloric deficit)',
      'maintain': 'weight maintenance',
      'lean-bulk': 'lean muscle gain (slight surplus)',
      'bulk': 'muscle building (caloric surplus)',
    };

    const prompt = `Create a daily meal plan for someone with these targets:

**Daily Targets:**
- Calories: ${calories} kcal
- Protein: ${protein}g
- Carbohydrates: ${carbs}g
- Fat: ${fat}g

**Goal:** ${goalContext[goal] || 'general health'}
${bmr ? `**BMR:** ${bmr} kcal` : ''}
${tdee ? `**TDEE:** ${tdee} kcal` : ''}

Generate a practical, delicious meal plan that hits these macros as closely as possible. Focus on whole foods that support metabolic health and longevity.`;

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      prompt,
      temperature: 0.7,
      maxOutputTokens: 1500,
    });

    return new Response(result.text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('[Meal Plan API] Error:', error);
    const { message, status } = getFriendlyError(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
