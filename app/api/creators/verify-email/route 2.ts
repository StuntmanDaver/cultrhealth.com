import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkToken } from '@/lib/auth'
import { getCreatorByEmail, updateCreatorEmailVerified } from '@/lib/creators/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const verified = await verifyMagicLinkToken(token)
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 400 }
      )
    }

    const creator = await getCreatorByEmail(verified.email)
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    if (creator.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        status: creator.status,
      })
    }

    await updateCreatorEmailVerified(creator.id)

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Your application is pending admin review.',
      status: creator.status,
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
