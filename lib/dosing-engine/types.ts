export type ProductCategory = 'labeled_reference' | 'investigational' | 'conversion_only';

export type Sex = 'Male' | 'Female';

export type Goal = 'weight_loss' | 'maintenance' | 'transition' | 'informational';

export type PriorGlp1History = 'never_used' | 'semaglutide' | 'tirzepatide' | 'unknown';

export interface UserIntakeResponse {
  sex: Sex;
  age: number;
  weightLb: number;
  heightInches: number;
  priorGlp1History: boolean;
  priorGlp1Details: PriorGlp1History;
  priorToleranceOrSideEffects: string;
  goal: Goal;
  requestedProduct: string;
}

export interface ConcentrationProfile {
  vialSizeMg: number;
  diluentVolumeMl: number;
  mgPerMl: number;
  mcgPerUnitU100: number;
  // If it's a blend, we can track the secondary compound too.
  isBlend?: boolean;
  secondaryVialSizeMg?: number;
  secondaryMgPerMl?: number;
  secondaryMcgPerUnitU100?: number;
}

export interface DosingProduct {
  id: string;
  name: string;
  category: ProductCategory;
  concentration: ConcentrationProfile;
  requiresProviderEscalation: boolean;
  isFdaApprovedForMaintenance: boolean;
}

export interface DisclaimerBlock {
  id: string;
  title?: string;
  text: string;
  type: 'warning' | 'info' | 'error';
}

export interface TitrationStep {
  month: number;
  doseMg: number;
  durationWeeks: number;
  notes?: string;
}

export interface TitrationSchedule {
  id: string;
  steps: TitrationStep[];
  maintenanceDoseMg?: number; // Might be a range or array
  notes?: string;
}

export interface WeightBandRule {
  minWeightLb: number;
  maxWeightLb: number;
  // Based on the band, it might map to a specific schedule or escalation
  escalateToProvider: boolean;
  recommendedScheduleId?: string;
}

export interface EligibilityRule {
  productId: string;
  // Can contain logic branches like weight bands or sex constraints
  weightBands?: WeightBandRule[];
  allowedSex?: Sex[];
  allowedGoals?: Goal[];
  contraindications?: string[];
}

export interface RuleTrace {
  version: string;
  timestamp: string;
  productId: string;
  weightBandMatched?: string;
  escalatedToProvider: boolean;
  scheduleApplied?: string;
}

export interface DoseConversion {
  doseMg: number;
  doseMcg: number;
  drawMl: number;
  drawUnitsU100: number;
  secondaryDoseMg?: number;
  secondaryDoseMcg?: number;
}

export interface TitrationScheduleResult {
  steps: Array<TitrationStep & { conversion: DoseConversion }>;
  maintenanceDoseMg?: number;
  maintenanceConversion?: DoseConversion;
}

export interface RecommendationResult {
  eligible: boolean;
  product: DosingProduct;
  schedule?: TitrationScheduleResult;
  conversionOnlyMath?: {
    examples: DoseConversion[];
  };
  redFlags: string[];
  disclaimers: DisclaimerBlock[];
  ruleTrace: RuleTrace;
  requiresProviderEscalation: boolean;
}
