import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { subject, message, category } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    // Log the support ticket (in production, integrate with support system)
    console.log('Creator support ticket:', {
      creatorId: auth.creatorId,
      email: auth.email,
      subject,
      message,
      category: category || 'general',
    })

    return NextResponse.json({
      success: true,
      message: 'Support ticket submitted. We\'ll respond within 24 hours.',
    })
  } catch (error) {
    console.error('Support ticket error:', error)
    return NextResponse.json({ error: 'Failed to submit ticket' }, { status: 500 })
  }
}
