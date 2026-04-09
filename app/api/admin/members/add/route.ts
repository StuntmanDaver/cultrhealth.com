import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSession, isProviderEmail, createMagicLinkToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { createMembership } from '@/lib/db'
import crypto from 'crypto'
import { PLANS } from '@/lib/config/plans'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  })
}

/** Map tier slug to Stripe price ID from plan config */
function getPriceIdForTier(tier: string): string | null {
  const plan = PLANS.find(p => p.slug === tier)
  return plan?.stripePriceId || null
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
    const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    const isAdmin = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, tier } = body

    if (!firstName || !lastName || !email || !tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const name = `${firstName.trim()} ${lastName.trim()}`

    if (tier === 'club') {
      // Insert into local DB directly
      if (!process.env.POSTGRES_URL) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      await sql`
        INSERT INTO club_members (
          name, email, phone, signup_type, source, created_at, updated_at
        )
        VALUES (
          ${name}, ${normalizedEmail}, ${phone || null}, 'membership', 'admin_added', NOW(), NOW()
        )
        ON CONFLICT (LOWER(email)) DO UPDATE SET
          name = EXCLUDED.name,
          phone = COALESCE(EXCLUDED.phone, club_members.phone),
          updated_at = NOW()
      `
    } else {
      // It's a paid tier - integrate with Stripe
      const stripe = getStripe()
      
      // Check if Stripe customer exists
      const existingCustomers = await stripe.customers.list({
        email: normalizedEmail,
        limit: 1,
      })

      let customerId = ''
      
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
      } else {
        // Create new Stripe customer
        const newCustomer = await stripe.customers.create({
          email: normalizedEmail,
          name: name,
          phone: phone || undefined,
        })
        customerId = newCustomer.id
      }

      // Generate a placeholder subscription ID so they can be registered in the system immediately.
      // In reality, the user hasn't paid yet, but this grants them access. 
      // Ideally they would enter their card later.
      const placeholderSubId = `sub_admin_generated_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`

      // Insert into memberships table
      await createMembership({
        stripe_customer_id: customerId,
        stripe_subscription_id: placeholderSubId,
        plan_tier: tier,
        subscription_status: 'active',
        email: normalizedEmail,
      })
    }

    // Generate Magic Link
    const token = await createMagicLinkToken(normalizedEmail)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const magicLink = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}&redirect=/members`

    // Send Welcome Email
    const { baseEmailTemplate, getFromEmail } = await import('@/lib/resend')
    const { Resend } = await import('resend')
    
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)
      const fromEmail = getFromEmail()

      const subjectTitle = 'Welcome to CULTR Health'
      const bodyText = `An administrator has set up your <strong style="color: #c9a962; text-transform: capitalize;">${tier}</strong> membership. Click the button below to log in and access your member dashboard. This link expires in 15 minutes.`

      await resend.emails.send({
        from: fromEmail,
        to: normalizedEmail,
        subject: subjectTitle,
        html: baseEmailTemplate(`
      <h1 style="font-size: 28px; font-weight: 300; color: #fff; margin-bottom: 24px; text-align: center; font-family: 'Playfair Display', Georgia, serif;">
        Welcome, ${firstName.trim()}
      </h1>
      
      <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
        ${bodyText}
      </p>
      
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${magicLink}" style="display: inline-block; background-color: #B7E4C7; color: #2A4542; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 600; font-size: 16px;">
          Log In to Dashboard
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center; margin: 0;">
        If you didn't expect this, you can safely ignore this email.
      </p>
        `),
      })
    }

    return NextResponse.json({ success: true, message: 'Member added successfully' })
  } catch (error) {
    console.error('Failed to add member:', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}
