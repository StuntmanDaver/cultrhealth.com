import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getMembershipByCustomerId } from '@/lib/db'
import { HealthieSSOUrls } from '@/lib/healthie-sso'

// ============================================================
// HEALTHIE SSO TOKEN GENERATION ENDPOINT
// Generates secure SSO tokens for authenticated users
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const auth = await verifyAuth(request)
    
    if (!auth.authenticated || !auth.email || !auth.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { action } = body as { action?: string }

    // Get user's Healthie patient ID from database
    let healthiePatientId: string | undefined
    
    try {
      const membership = await getMembershipByCustomerId(auth.customerId)
      healthiePatientId = membership?.healthie_patient_id || undefined
    } catch (error) {
      console.error('Error fetching membership:', error)
      // Continue without patient ID - Healthie will look up by email
    }

    // Generate SSO URL based on requested action
    let ssoUrl: string

    switch (action) {
      case 'book':
        ssoUrl = await HealthieSSOUrls.bookAppointment(auth.email, healthiePatientId)
        break
      
      case 'appointments':
        ssoUrl = await HealthieSSOUrls.appointments(auth.email, healthiePatientId)
        break
      
      case 'message':
        ssoUrl = await HealthieSSOUrls.messages(auth.email, healthiePatientId)
        break
      
      case 'labs':
        ssoUrl = await HealthieSSOUrls.labs(auth.email, healthiePatientId)
        break
      
      case 'forms':
        ssoUrl = await HealthieSSOUrls.forms(auth.email, healthiePatientId)
        break
      
      case 'documents':
        ssoUrl = await HealthieSSOUrls.documents(auth.email, healthiePatientId)
        break
      
      case 'billing':
        ssoUrl = await HealthieSSOUrls.billing(auth.email, healthiePatientId)
        break
      
      case 'profile':
        ssoUrl = await HealthieSSOUrls.profile(auth.email, healthiePatientId)
        break
      
      case 'metrics':
        ssoUrl = await HealthieSSOUrls.metrics(auth.email, healthiePatientId)
        break
      
      case 'care-plans':
        ssoUrl = await HealthieSSOUrls.carePlans(auth.email, healthiePatientId)
        break
      
      case 'programs':
        ssoUrl = await HealthieSSOUrls.programs(auth.email, healthiePatientId)
        break
      
      case 'portal':
      default:
        ssoUrl = await HealthieSSOUrls.portal(auth.email, healthiePatientId)
        break
    }

    return NextResponse.json({
      ssoUrl,
      email: auth.email,
      healthiePatientId,
    })

  } catch (error) {
    console.error('SSO token generation error:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate SSO token' },
      { status: 500 }
    )
  }
}
