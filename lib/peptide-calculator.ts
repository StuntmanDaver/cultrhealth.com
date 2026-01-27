// Cultr Calculator - Peptide Dilution Math Engine
// Core formulas for reconstitution calculations

export type DoseUnit = 'mcg' | 'mg';

export type PeptideCalcInput = {
  vialMg: number;      // e.g., 5, 10, 15
  waterMl: number;     // e.g., 1, 2, 3
  dose: number;        // dose in doseUnit
  doseUnit: DoseUnit;  // "mcg" or "mg"
  syringeMl?: number;  // optional: 0.3 | 0.5 | 1.0
};

export type PeptideCalcOutput = {
  doseMg: number;
  doseMcg: number;
  concentrationMgPerMl: number;
  drawMl: number;
  drawUnitsU100: number;  // "units" where 100 units = 1 mL
  dosesPerVial: number;
  warnings: string[];
};

/**
 * Calculate peptide dilution and syringe draw volumes.
 * 
 * Core formulas:
 * - concentration = vialMg / waterMl (mg/mL)
 * - drawMl = doseMg / concentration
 * - drawUnits = drawMl * 100 (U-100 insulin syringe scale)
 * - dosesPerVial = vialMg / doseMg
 * 
 * Example (Prime's walkthrough):
 * 5 mg vial + 3 mL water + 250 mcg dose → 0.15 mL = 15 units
 */
export function calcPeptide(input: PeptideCalcInput): PeptideCalcOutput {
  const warnings: string[] = [];
  const { vialMg, waterMl, dose, doseUnit, syringeMl } = input;

  // Validate inputs
  if (!(vialMg > 0)) warnings.push('Vial amount must be > 0 mg.');
  if (!(waterMl > 0)) warnings.push('Water volume must be > 0 mL.');
  if (!(dose > 0)) warnings.push('Dose must be > 0.');

  // Return early with NaN values if validation fails
  if (warnings.length) {
    return {
      doseMg: NaN,
      doseMcg: NaN,
      concentrationMgPerMl: NaN,
      drawMl: NaN,
      drawUnitsU100: NaN,
      dosesPerVial: NaN,
      warnings,
    };
  }

  // Convert dose units
  const doseMg = doseUnit === 'mg' ? dose : dose / 1000;
  const doseMcg = doseMg * 1000;

  // Check if dose exceeds vial content
  if (doseMg > vialMg) {
    warnings.push('Dose exceeds total peptide in vial.');
  }

  // Core calculations
  const concentrationMgPerMl = vialMg / waterMl;
  const drawMl = doseMg / concentrationMgPerMl;
  const drawUnitsU100 = drawMl * 100;
  const dosesPerVial = vialMg / doseMg;

  // Syringe capacity check (Particle-style warning)
  if (syringeMl != null && syringeMl > 0) {
    const maxUnits = syringeMl * 100;
    if (drawMl > syringeMl) {
      warnings.push(
        `Syringe volume insufficient: need ${drawMl.toFixed(3)} mL (${drawUnitsU100.toFixed(1)} units), max is ${syringeMl} mL (${maxUnits} units).`
      );
    }
  }

  return {
    doseMg,
    doseMcg,
    concentrationMgPerMl,
    drawMl,
    drawUnitsU100,
    dosesPerVial,
    warnings,
  };
}

/**
 * Format number for display with specified decimal places
 */
export function formatNumber(value: number, decimals: number): string {
  if (isNaN(value) || !isFinite(value)) return '—';
  return value.toFixed(decimals);
}
