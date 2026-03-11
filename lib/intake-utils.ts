/**
 * Utility functions for intake form data processing.
 * Extracted from route file because Next.js route files cannot export non-route fields.
 */

/**
 * Format medications list preserving dosage and frequency.
 * Handles both object arrays and string arrays/strings.
 */
export function formatMedicationsList(
  medications: unknown
): string | undefined {
  if (!medications) return undefined;

  if (typeof medications === 'string') return medications;

  if (Array.isArray(medications) && medications.length > 0) {
    return medications
      .map((med) => {
        if (typeof med === 'string') return med;
        if (typeof med === 'object' && med !== null) {
          const m = med as Record<string, unknown>;
          const parts = [m.name || m.medication];
          if (m.dosage) parts.push(m.dosage);
          if (m.frequency) parts.push(m.frequency);
          return parts.filter(Boolean).join(' - ');
        }
        return String(med);
      })
      .join(', ');
  }

  return undefined;
}

/**
 * Build partner note from form data with all treatment preference fields.
 */
export function buildPartnerNote(body: Record<string, unknown>): string {
  const sections: string[] = [];

  // Treatment preferences section
  if (body.treatmentPreferences) {
    const prefs = body.treatmentPreferences as Record<string, unknown>;
    const prefLines: string[] = [];

    if (prefs.preferredContactMethod) {
      prefLines.push(`Preferred contact: ${prefs.preferredContactMethod}`);
    }
    if (prefs.bestTimeToContact) {
      prefLines.push(`Best time to contact: ${prefs.bestTimeToContact}`);
    }
    if (prefs.pharmacyPreference) {
      prefLines.push(`Pharmacy preference: ${prefs.pharmacyPreference}`);
    }
    if (prefs.customSolution !== undefined) {
      prefLines.push(`Custom solution requested: ${prefs.customSolution ? 'Yes' : 'No'}`);
    }
    if (prefs.additionalNotes) {
      prefLines.push(`Patient notes: ${prefs.additionalNotes}`);
    }

    if (prefLines.length > 0) {
      sections.push(`--- TREATMENT PREFERENCES ---\n${prefLines.join('\n')}`);
    }
  }

  // Current medications section
  if (body.currentMedications && Array.isArray(body.currentMedications) && body.currentMedications.length > 0) {
    const medLines = body.currentMedications.map((med: unknown, i: number) => {
      if (typeof med === 'string') return `${i + 1}. ${med}`;
      if (typeof med === 'object' && med !== null) {
        const m = med as Record<string, unknown>;
        const parts = [m.name || m.medication];
        if (m.dosage) parts.push(m.dosage);
        if (m.frequency) parts.push(m.frequency);
        return `${i + 1}. ${parts.filter(Boolean).join(' - ')}`;
      }
      return `${i + 1}. ${String(med)}`;
    });

    sections.push(`--- CURRENT MEDICATIONS ---\n${medLines.join('\n')}`);
  }

  // Plan tier section
  if (body.planTier) {
    sections.push(`--- PLAN ---\nCULTR Plan: ${body.planTier}`);
  }

  return sections.join('\n\n');
}
