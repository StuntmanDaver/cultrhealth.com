'use client'

import { useEffect, useRef } from 'react'
import { identifySession } from '@/lib/analytics'

interface Props {
  email: string
}

// Null-rendering component — drop it anywhere you have a confirmed email.
// Fires exactly once per mount: tags the Clarity session + pings the DB.
export function UserIdentifier({ email }: Props) {
  const fired = useRef(false)

  useEffect(() => {
    if (!email || fired.current) return
    fired.current = true
    identifySession(email)
  }, [email])

  return null
}
