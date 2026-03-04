// Recommendation Quiz Configuration
// Client-side quiz that recommends a plan tier + medications

import type { PlanTier } from './plans';

export interface QuizOption {
  id: string;
  label: string;
  emoji?: string;
  scores: Record<string, number>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  subtitle?: string;
  type: 'visual' | 'single' | 'multi';
  options: QuizOption[];
}

export interface QuizResult {
  recommendedTier: PlanTier;
  tierName: string;
  tierPrice: number;
  recommendedMedications: { id: string; name: string; description: string }[];
  primaryGoal: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'primary-goal',
    question: 'What brings you to CULTR?',
    subtitle: 'Pick your top priority',
    type: 'visual',
    options: [
      { id: 'weight-loss', label: 'Lose weight', emoji: '🔥', scores: { core: 3, catalyst: 2, metabolic: 5 } },
      { id: 'performance', label: 'Peak performance', emoji: '⚡', scores: { catalyst: 4, concierge: 3, growth_factor: 4 } },
      { id: 'longevity', label: 'Live longer', emoji: '🧬', scores: { catalyst: 4, concierge: 3, bioregulator: 4 } },
      { id: 'recovery', label: 'Recover faster', emoji: '💪', scores: { catalyst: 3, core: 2, repair: 5 } },
      { id: 'hormones', label: 'Optimize hormones', emoji: '📈', scores: { core: 3, catalyst: 4, hormonal: 4 } },
      { id: 'learn', label: 'Learn & self-guide', emoji: '📚', scores: { club: 5, core: 1 } },
    ],
  },
  {
    id: 'experience',
    question: 'Have you used peptides or hormone therapy before?',
    type: 'single',
    options: [
      { id: 'never', label: 'Never — I\'m new to this', scores: { club: 2, core: 3 } },
      { id: 'some', label: 'Some experience', scores: { catalyst: 3, core: 2 } },
      { id: 'experienced', label: 'Very experienced', scores: { catalyst: 4, concierge: 2 } },
    ],
  },
  {
    id: 'provider-access',
    question: 'How much provider access do you want?',
    type: 'single',
    options: [
      { id: 'minimal', label: 'Self-guided is fine', scores: { club: 5 } },
      { id: 'monthly', label: 'Monthly check-ins', scores: { core: 3, catalyst: 3 } },
      { id: 'frequent', label: 'Frequent access', scores: { catalyst: 3, concierge: 2 } },
      { id: 'vip', label: 'White-glove, weekly', scores: { concierge: 5 } },
    ],
  },
  {
    id: 'symptoms',
    question: 'What are you experiencing?',
    subtitle: 'Select all that apply',
    type: 'multi',
    options: [
      { id: 'fatigue', label: 'Low energy', emoji: '😴', scores: { metabolic: 2, bioregulator: 2 } },
      { id: 'weight', label: 'Stubborn weight', emoji: '⚖️', scores: { metabolic: 4 } },
      { id: 'sleep', label: 'Poor sleep', emoji: '🌙', scores: { bioregulator: 3, neuropeptide: 2 } },
      { id: 'focus', label: 'Brain fog', emoji: '🧠', scores: { neuropeptide: 4 } },
      { id: 'joints', label: 'Joint pain', emoji: '🦴', scores: { repair: 5 } },
      { id: 'libido', label: 'Low libido', emoji: '❤️', scores: { hormonal: 4 } },
      { id: 'aging', label: 'Feeling old', emoji: '⏳', scores: { bioregulator: 3, growth_factor: 2 } },
    ],
  },
  {
    id: 'budget',
    question: 'What monthly investment feels right?',
    type: 'single',
    options: [
      { id: 'budget', label: 'Under $500/mo', scores: { club: 5 } },
      { id: 'moderate', label: '$500 – $800/mo', scores: { core: 3, catalyst: 2 } },
      { id: 'invested', label: '$800 – $1,000/mo', scores: { concierge: 4 } },
      { id: 'premium', label: '$1,000+/mo', scores: { concierge: 5 } },
    ],
  },
];

// Medication category → specific medication recommendations
const MEDICATION_MAP: Record<string, { id: string; name: string; description: string }[]> = {
  metabolic: [
    { id: 'retatrutide', name: 'Retatrutide (RTA)', description: 'Triple GLP-1/GIP/Glucagon agonist for maximum metabolic optimization' },
    { id: 'tirzepatide', name: 'Tirzepatide', description: 'Dual GIP/GLP-1 for significant weight loss' },
    { id: 'semaglutide', name: 'Semaglutide', description: 'GLP-1 receptor agonist for weight management' },
  ],
  repair: [
    { id: 'bpc157-tb500', name: 'BPC-157 / TB-500', description: 'Recovery and healing peptide stack' },
    { id: 'ghk-cu', name: 'GHK-Cu', description: 'Copper peptide for tissue repair' },
  ],
  growth_factor: [
    { id: 'sermorelin', name: 'Sermorelin', description: 'Growth hormone releasing peptide' },
  ],
  bioregulator: [
    { id: 'nad-plus', name: 'NAD+', description: 'Cellular energy and longevity support' },
  ],
  neuropeptide: [
    { id: 'semax-selank', name: 'Semax / Selank', description: 'Nootropic peptides for cognitive enhancement' },
  ],
  hormonal: [
    { id: 'sermorelin', name: 'Sermorelin', description: 'Growth hormone releasing peptide' },
  ],
};

const TIER_INFO: Record<string, { name: string; price: number }> = {
  club: { name: 'CULTR Club', price: 0 },
  core: { name: 'CULTR Core', price: 199 },
  catalyst: { name: 'CULTR Catalyst+', price: 499 },
  concierge: { name: 'CULTR Concierge', price: 1099 },
};

export function calculateRecommendation(answers: Record<string, string | string[]>): QuizResult {
  const tierScores: Record<string, number> = { club: 0, core: 0, catalyst: 0, concierge: 0 };
  const medScores: Record<string, number> = {};

  for (const [questionId, answer] of Object.entries(answers)) {
    const question = QUIZ_QUESTIONS.find(q => q.id === questionId);
    if (!question) continue;

    const selectedIds = Array.isArray(answer) ? answer : [answer];

    for (const selectedId of selectedIds) {
      const option = question.options.find(o => o.id === selectedId);
      if (!option) continue;

      for (const [key, score] of Object.entries(option.scores)) {
        if (key in tierScores) {
          tierScores[key] += score;
        } else {
          medScores[key] = (medScores[key] || 0) + score;
        }
      }
    }
  }

  // Find best tier
  const bestTier = Object.entries(tierScores)
    .sort(([, a], [, b]) => b - a)[0][0] as PlanTier;

  // Find top 2-3 medication categories
  const topMedCategories = Object.entries(medScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);

  // Map categories to specific medications (deduplicated)
  const seen = new Set<string>();
  const recommendedMedications = topMedCategories
    .flatMap(cat => MEDICATION_MAP[cat] || [])
    .filter(med => {
      if (seen.has(med.id)) return false;
      seen.add(med.id);
      return true;
    })
    .slice(0, 3);

  const primaryGoalAnswer = answers['primary-goal'];
  const goalId = Array.isArray(primaryGoalAnswer) ? primaryGoalAnswer[0] : primaryGoalAnswer;
  const goalOption = QUIZ_QUESTIONS[0].options.find(o => o.id === goalId);

  return {
    recommendedTier: bestTier,
    tierName: TIER_INFO[bestTier]?.name || 'CULTR Core',
    tierPrice: TIER_INFO[bestTier]?.price || 199,
    recommendedMedications,
    primaryGoal: goalOption?.label || 'Optimize your health',
  };
}
