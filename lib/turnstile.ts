interface TurnstileVerifyResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

export async function verifyTurnstileToken(token: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY environment variable is not set')
    return { success: false, error: 'Turnstile not configured' }
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data: TurnstileVerifyResponse = await response.json()

    if (!data.success) {
      const errorCodes = data['error-codes']?.join(', ') || 'Unknown error'
      console.error('Turnstile verification failed:', errorCodes)
      return { success: false, error: `Verification failed: ${errorCodes}` }
    }

    return { success: true }
  } catch (err) {
    console.error('Turnstile verification error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Verification request failed' }
  }
}
