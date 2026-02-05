import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Switch to Node.js runtime for better compatibility and debugging
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

export async function POST(req: Request) {
  console.log('[Meal Plan API] Request received');
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Meal Plan API] OPENAI_API_KEY is missing in environment variables');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('[Meal Plan API] Request body:', JSON.stringify(body, null, 2));
    
    // useCompletion sends data with a 'prompt' field at the top level
    // and additional body data merged in
    const { calories, protein, carbs, fat, goal, bmr, tdee } = body;

    // Validate inputs
    if (!calories || !protein || !carbs || !fat) {
      return new Response(
        JSON.stringify({ error: 'Missing required macro targets' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build the goal context
    const goalContext = {
      'aggressive-cut': 'aggressive weight loss (high protein, low carb)',
      'cut': 'moderate fat loss (caloric deficit)',
      'maintain': 'weight maintenance',
      'lean-bulk': 'lean muscle gain (slight surplus)',
      'bulk': 'muscle building (caloric surplus)',
    }[goal] || 'general health';

    const prompt = `Create a daily meal plan for someone with these targets:

**Daily Targets:**
- Calories: ${calories} kcal
- Protein: ${protein}g
- Carbohydrates: ${carbs}g
- Fat: ${fat}g

**Goal:** ${goalContext}
${bmr ? `**BMR:** ${bmr} kcal` : ''}
${tdee ? `**TDEE:** ${tdee} kcal` : ''}

Generate a practical, delicious meal plan that hits these macros as closely as possible. Focus on whole foods that support metabolic health and longevity.`;

    console.log('[Meal Plan API] Creating stream with prompt:', prompt.substring(0, 100) + '...');
    
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      prompt,
      temperature: 0.7,
      maxOutputTokens: 1500,
    });

    console.log('[Meal Plan API] Returning stream response');
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[Meal Plan API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate meal plan', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
