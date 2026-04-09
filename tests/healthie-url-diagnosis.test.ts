import { describe, it, expect } from 'vitest'
import { getConsultationBookingUrl } from '../lib/config/links'

describe('Healthie Booking URL Diagnosis', () => {
  it('diagnoses the availability issue', async () => {
    // We can simulate the process env
    process.env.NEXT_PUBLIC_CONSULTATION_BOOKING_URL = 'https://secure.gethealthie.com/appointments/embed_appt?dietitian_id=13052862&provider_ids=%5B13052862%5D&appt_type_ids=%5B510493,510494%5D&primary_color=4A9625'
    
    const url = getConsultationBookingUrl()
    console.log('Generated URL:', url)
    
    // Fetch the URL to see what Healthie returns
    if (url) {
      const res = await fetch(url)
      const text = await res.text()
      console.log('Response length:', text.length)
      // Check if it has availability data
    }
  })
})
