import { TitrationSchedule, EligibilityRule } from '../types';

export const TITRATION_SCHEDULES: Record<string, TitrationSchedule> = {
  'semaglutide-standard': {
    id: 'semaglutide-standard',
    notes: 'Standard escalation: increase dose every 4 weeks.',
    steps: [
      { month: 1, doseMg: 0.25, durationWeeks: 4 },
      { month: 2, doseMg: 0.5, durationWeeks: 4 },
      { month: 3, doseMg: 1.0, durationWeeks: 4 },
      { month: 4, doseMg: 1.7, durationWeeks: 4 },
    ],
    maintenanceDoseMg: 2.4, // 1.7 or 2.4
  },
  'tirzepatide-standard': {
    id: 'tirzepatide-standard',
    notes: 'Increase by 2.5 mg increments no more often than every 4 weeks.',
    steps: [
      { month: 1, doseMg: 2.5, durationWeeks: 4 },
      { month: 2, doseMg: 5.0, durationWeeks: 4 },
      { month: 3, doseMg: 7.5, durationWeeks: 4 },
      { month: 4, doseMg: 10.0, durationWeeks: 4 },
    ],
    maintenanceDoseMg: 15.0,
  },
  'retatrutide-example': {
    id: 'retatrutide-example',
    notes: 'Example phased algorithm for Retatrutide.',
    steps: [
      { month: 1, doseMg: 1.0, durationWeeks: 2 },
      { month: 2, doseMg: 2.0, durationWeeks: 4 },
      { month: 3, doseMg: 2.0, durationWeeks: 4 },
      { month: 4, doseMg: 2.0, durationWeeks: 4 },
    ],
    maintenanceDoseMg: 2.0,
  }
};

export const ELIGIBILITY_RULES: Record<string, EligibilityRule> = {
  'semaglutide': {
    productId: 'semaglutide',
    contraindications: ['Unknown prior GLP-1 history'],
  },
  'tirzepatide': {
    productId: 'tirzepatide',
  },
  'retatrutide': {
    productId: 'retatrutide',
    weightBands: [
      {
        minWeightLb: 100,
        maxWeightLb: 120,
        escalateToProvider: true,
      },
      {
        minWeightLb: 121,
        maxWeightLb: 135,
        escalateToProvider: false,
        recommendedScheduleId: 'retatrutide-example',
      },
      {
        minWeightLb: 136,
        maxWeightLb: 999,
        escalateToProvider: false,
        recommendedScheduleId: 'retatrutide-example',
      }
    ]
  }
};
