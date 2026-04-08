import { 
  UserIntakeResponse, 
  RecommendationResult, 
  TitrationScheduleResult, 
  DosingProduct,
  DisclaimerBlock,
  RuleTrace
} from './types';
import { DOSING_PRODUCTS } from './config/products';
import { DISCLAIMERS } from './config/disclaimers';
import { ELIGIBILITY_RULES, TITRATION_SCHEDULES } from './config/rules';
import { calculateDoseUnits, getConversionExamples } from './conversions';

export function evaluateRecommendation(intake: UserIntakeResponse, rulesVersion: string = 'v1'): RecommendationResult {
  const product = DOSING_PRODUCTS[intake.requestedProduct];
  
  if (!product) {
    throw new Error(`Product not found: ${intake.requestedProduct}`);
  }

  const redFlags: string[] = [];
  const disclaimers: DisclaimerBlock[] = [
    DISCLAIMERS.NOT_MEDICAL_ADVICE,
    DISCLAIMERS.CONSULT_PROVIDER,
    DISCLAIMERS.AI_MAY_BE_WRONG
  ];

  let requiresProviderEscalation = product.requiresProviderEscalation;
  let eligible = true;
  let scheduleResult: TitrationScheduleResult | undefined = undefined;
  let conversionOnlyMath = undefined;
  let weightBandMatched = undefined;
  let scheduleApplied = undefined;

  // Eligibility evaluation
  const rule = ELIGIBILITY_RULES[product.id];
  if (rule) {
    if (rule.contraindications && rule.contraindications.includes(intake.priorToleranceOrSideEffects)) {
      redFlags.push('User reported severe side effects previously. Provider consultation required.');
      eligible = false;
      requiresProviderEscalation = true;
    }

    if (rule.weightBands && rule.weightBands.length > 0) {
      const band = rule.weightBands.find(b => intake.weightLb >= b.minWeightLb && intake.weightLb <= b.maxWeightLb);
      if (band) {
        weightBandMatched = `${band.minWeightLb}-${band.maxWeightLb}`;
        if (band.escalateToProvider) {
          redFlags.push(`Weight band ${weightBandMatched} lb requires direct provider escalation for this product.`);
          eligible = false;
          requiresProviderEscalation = true;
        } else if (band.recommendedScheduleId) {
          scheduleApplied = band.recommendedScheduleId;
        }
      } else {
         redFlags.push('Weight falls outside of allowed bands for this product.');
         eligible = false;
         requiresProviderEscalation = true;
      }
    }
  }

  if (product.category === 'investigational') {
    disclaimers.push(DISCLAIMERS.INVESTIGATIONAL);
  }

  if (product.category === 'conversion_only') {
    disclaimers.push(DISCLAIMERS.CONVERSION_ONLY);
    eligible = false; // We don't consider them "eligible" for a schedule, just math
    conversionOnlyMath = {
      examples: getConversionExamples(product.id, product.concentration)
    };
  } else if (eligible) {
    // Determine schedule
    const scheduleId = scheduleApplied || `${product.id}-standard`;
    const baseSchedule = TITRATION_SCHEDULES[scheduleId];
    
    if (baseSchedule) {
      scheduleResult = {
        steps: baseSchedule.steps.map(step => ({
          ...step,
          conversion: calculateDoseUnits(step.doseMg, product.concentration)
        })),
      };
      
      if (baseSchedule.maintenanceDoseMg) {
        scheduleResult.maintenanceDoseMg = baseSchedule.maintenanceDoseMg;
        scheduleResult.maintenanceConversion = calculateDoseUnits(baseSchedule.maintenanceDoseMg, product.concentration);
      }
    } else {
       // If no schedule found but eligible, it's an error in config
       redFlags.push(`No valid titration schedule found for ${product.name}.`);
       eligible = false;
       requiresProviderEscalation = true;
    }
  }

  const ruleTrace: RuleTrace = {
    version: rulesVersion,
    timestamp: new Date().toISOString(),
    productId: product.id,
    weightBandMatched,
    escalatedToProvider: requiresProviderEscalation,
    scheduleApplied,
  };

  return {
    eligible,
    product,
    schedule: scheduleResult,
    conversionOnlyMath,
    redFlags,
    disclaimers,
    ruleTrace,
    requiresProviderEscalation
  };
}
