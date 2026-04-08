import { DoseConversion, ConcentrationProfile } from './types';

// Rule: on a U-100 insulin syringe, 1 unit = 0.01 mL
export function calculateDoseUnits(doseMg: number, concentration: ConcentrationProfile): DoseConversion {
  const drawMl = doseMg / concentration.mgPerMl;
  const drawUnitsU100 = drawMl * 100;
  const doseMcg = doseMg * 1000;

  const result: DoseConversion = {
    doseMg,
    doseMcg,
    drawMl,
    drawUnitsU100,
  };

  if (concentration.isBlend && concentration.secondaryMgPerMl && concentration.secondaryMcgPerUnitU100) {
    result.secondaryDoseMg = drawMl * concentration.secondaryMgPerMl;
    result.secondaryDoseMcg = result.secondaryDoseMg * 1000;
  }

  return result;
}

export function getConversionExamples(productId: string, concentration: ConcentrationProfile): DoseConversion[] {
  // Pre-calculated examples for conversion-only products
  const examples: Record<string, number[]> = {
    'ghk-cu': [1, 2, 5],
    'cjc-ipa': [3.33, 6.66, 9.99], // approx 10u, 20u, 30u
    'nad-plus': [10, 25, 50, 100],
    'semax-selank': [1.67, 3.33, 5], // approx 10u, 20u, 30u
    'bpc157-tb500': [3.33, 5, 10], // approx 10u, 15u, 30u
    'melanotan-2': [0.167, 0.333, 0.5, 1.0], // 5u, 10u, 15u, 30u
  };

  const doses = examples[productId] || [1, 5, 10];
  return doses.map(doseMg => calculateDoseUnits(doseMg, concentration));
}
