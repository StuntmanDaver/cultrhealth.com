// SiPhox → Healthie Lab Results Sync
// Uploads processed SiPhox blood test reports to the Healthie patient record
// as documents. Group tier may not have a native lab order format, so we use
// the document upload API as the pragmatic path.
//
// HIPAA: Never log biomarker values or report contents.

import { createDocument, isHealthieConfigured } from './index'

/**
 * Push a SiPhox report to Healthie as a patient document.
 * Call this after SiPhox results are processed in the siphox-results cron.
 *
 * @param healthiePatientId - The Healthie user ID for the patient
 * @param reportId - SiPhox report ID (for display name)
 * @param reportDate - ISO date string of when the report was generated
 * @param pdfBase64 - Optional base64-encoded PDF of the report
 */
export async function pushLabResultsToHealthie(
  healthiePatientId: string,
  reportId: string,
  reportDate: string,
  pdfBase64?: string,
): Promise<{ documentId: string } | null> {
  if (!isHealthieConfigured()) {
    return null
  }

  const displayName = `SiPhox Blood Test Report - ${reportDate}`

  const document = await createDocument({
    user_id: healthiePatientId,
    display_name: displayName,
    file_string: pdfBase64,
    share_with_rel: true,
  })

  return { documentId: document.id }
}
