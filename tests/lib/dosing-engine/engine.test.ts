import { describe, it, expect } from 'vitest';
import { evaluateRecommendation } from '@/lib/dosing-engine/engine';
import { UserIntakeResponse } from '@/lib/dosing-engine/types';

describe('Dosing Engine Evaluation', () => {
  const baseIntake: UserIntakeResponse = {
    sex: 'Male',
    age: 40,
    weightLb: 180,
    heightInches: 70,
    priorGlp1History: false,
    priorGlp1Details: 'never_used',
    priorToleranceOrSideEffects: '',
    goal: 'weight_loss',
    requestedProduct: 'semaglutide',
  };

  it('should return eligible for semaglutide without contraindications', () => {
    const result = evaluateRecommendation(baseIntake);
    expect(result.eligible).toBe(true);
    expect(result.product.id).toBe('semaglutide');
    expect(result.schedule).toBeDefined();
    expect(result.disclaimers.some(d => d.id === 'not_medical_advice')).toBe(true);
    expect(result.requiresProviderEscalation).toBe(false);
  });

  it('should flag contraindication and require provider escalation', () => {
    const result = evaluateRecommendation({
      ...baseIntake,
      priorToleranceOrSideEffects: 'Unknown prior GLP-1 history',
    });
    expect(result.eligible).toBe(false);
    expect(result.redFlags.length).toBeGreaterThan(0);
    expect(result.requiresProviderEscalation).toBe(true);
  });

  it('should apply investigational disclaimer and require provider escalation without a schedule', () => {
    const result = evaluateRecommendation({
      ...baseIntake,
      requestedProduct: 'tesa-ipa',
    });
    expect(result.disclaimers.some(d => d.id === 'investigational')).toBe(true);
    expect(result.eligible).toBe(false);
    expect(result.requiresProviderEscalation).toBe(true);
    expect(result.redFlags[0]).toContain('No valid titration schedule found');
  });

  it('should provide math-only for conversion_only products', () => {
    const result = evaluateRecommendation({
      ...baseIntake,
      requestedProduct: 'ghk-cu',
    });
    expect(result.eligible).toBe(false); // Math-only implies no prescribed schedule
    expect(result.conversionOnlyMath).toBeDefined();
    expect(result.disclaimers.some(d => d.id === 'conversion_only')).toBe(true);
    expect(result.conversionOnlyMath?.examples.length).toBe(3);
    // 1mg of GHK-Cu (100mg/3mL = 33.3mg/mL) -> 1/33.3 = 0.03mL -> 3 units
    expect(result.conversionOnlyMath?.examples[0].doseMg).toBe(1);
    expect(Math.round(result.conversionOnlyMath?.examples[0].drawUnitsU100 || 0)).toBe(3);
  });

  it('should calculate tirzepatide units correctly', () => {
    const result = evaluateRecommendation({
      ...baseIntake,
      requestedProduct: 'tirzepatide',
    });
    expect(result.eligible).toBe(true);
    // 2.5mg (20mg/3mL = 6.67mg/mL) -> 2.5 / 6.67 = 0.375 mL = 37.5 units
    const firstStepUnits = result.schedule?.steps[0].conversion.drawUnitsU100;
    expect(Math.round((firstStepUnits || 0) * 10) / 10).toBe(37.5);
  });
});
