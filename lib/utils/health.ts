// Health calculation utilities

/**
 * Calculate BMI from height (inches) and weight (lbs)
 */
export function calculateBMI(heightInches: number, weightLbs: number): number {
  const bmi = (weightLbs / (heightInches * heightInches)) * 703;
  return Math.round(bmi * 10) / 10;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}
