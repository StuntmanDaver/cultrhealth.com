// Healthie → PortalOrder mapper
// Maps Healthie appointment data to the portal order display shape

import type { HealthieAppointment } from './types'
import type { PortalOrder } from '@/lib/portal-orders'

/**
 * Map a Healthie appointment to the PortalOrder shape used by the portal dashboard.
 */
export function mapAppointmentToPortalOrder(appt: HealthieAppointment): PortalOrder {
  // appt.provider is the clinician; appt.user is the patient
  const providerName = appt.provider
    ? [appt.provider.first_name, appt.provider.last_name].filter(Boolean).join(' ') || null
    : null

  return {
    id: appt.id,
    status: appt.pm_status || 'Scheduled',
    sourceType: 'appointment',
    displayName: appt.appointment_type?.name || 'Appointment',
    appointmentDate: appt.date || null,
    appointmentTime: appt.date || null,
    contactType: appt.contact_type || null,
    providerName,
    orderType: null,
    doctorId: appt.provider?.id || null,
    partnerNote: null,
    medicationName: appt.appointment_type?.name || 'Appointment',
    createdAt: appt.date || new Date().toISOString(),
    updatedAt: appt.date || new Date().toISOString(),
  }
}
