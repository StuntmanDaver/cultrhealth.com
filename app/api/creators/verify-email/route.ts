import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkToken } from '@/lib/auth'
import { getCreatorByEmail, updateCreatorEmailVerified } from '@/lib/creators/db'

function getBaseUrl(request: NextRequest): string {
  return (
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

async function verifyCreatorEmailToken(token: string) {
  if (!token) {
    return {
      ok: false as const,
      error: 'Token is required',
      httpStatus: 400,
    }
  }

  const verified = await verifyMagicLinkToken(token)
  if (!verified) {
    return {
      ok: false as const,
      error: 'Invalid or expired verification link',
      httpStatus: 400,
    }
  }

  const creator = await getCreatorByEmail(verified.email)
  if (!creator) {
    return {
      ok: false as const,
      error: 'Creator not found',
      httpStatus: 404,
    }
  }

  if (!creator.email_verified) {
    await updateCreatorEmailVerified(creator.id)
  }

  return {
    ok: true as const,
    message: creator.email_verified
      ? 'Email already verified'
      : 'Email verified successfully. Your application is pending admin review.',
    creatorStatus: creator.status,
  }
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request)

  try {
    const token = request.nextUrl.searchParams.get('token') || ''
    const result = await verifyCreatorEmailToken(token)

    if (!result.ok) {
      return NextResponse.redirect(`${baseUrl}/creators/login?error=invalid_verification_link`)
    }

    if (result.creatorStatus === 'pending') {
      return NextResponse.redirect(`${baseUrl}/creators/pending`)
    }

    if (result.creatorStatus === 'active') {
      return NextResponse.redirect(`${baseUrl}/creators/login`)
    }

    return NextResponse.redirect(`${baseUrl}/creators/login?error=inactive_account`)
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(`${baseUrl}/creators/login?error=email_verification_failed`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body as { token?: string }
    const result = await verifyCreatorEmailToken(token || '')

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.httpStatus }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      status: result.creatorStatus,
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
