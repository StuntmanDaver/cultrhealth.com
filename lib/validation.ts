import { z } from 'zod'

export const waitlistSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
      'Please enter a valid phone number'
    ),
  
  social_handle: z
    .string()
    .max(100, 'Social handle must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  treatment_reason: z
    .string()
    .max(500, 'Response must be less than 500 characters')
    .optional()
    .or(z.literal('')),
})

export type WaitlistFormData = z.infer<typeof waitlistSchema>

export function formatPhoneE164(phone: string): string {
  // Basic cleanup - remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  
  // If it doesn't start with +, assume US and add +1
  if (!cleaned.startsWith('+')) {
    // Remove leading 1 if present, then add +1
    const digits = cleaned.replace(/^1/, '')
    return `+1${digits}`
  }
  
  return cleaned
}
