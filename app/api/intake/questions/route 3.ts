import { NextRequest, NextResponse } from 'next/server';
import { getNewIntakeQuestions, getRenewalQuestions } from '@/lib/asher-med-api';

/**
 * GET /api/intake/questions
 *
 * Fetches intake questions from Asher Med API.
 * Query params:
 *   - type: 'new' | 'renewal' (default: 'new')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'new';

    let questions;
    if (type === 'renewal') {
      questions = await getRenewalQuestions();
    } else {
      questions = await getNewIntakeQuestions();
    }

    return NextResponse.json({
      success: true,
      type,
      questions,
    });
  } catch (error) {
    console.error('Failed to fetch intake questions:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch questions';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
