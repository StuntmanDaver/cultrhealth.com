// Recommendation Quiz Configuration
// Client-side quiz that recommends a plan tier + medications
// 7 questions with conditional GLP-1 history question for weight-loss users

import type { PlanTier, CoreTherapy } from './plans';
import { CORE_THERAPIES } from './plans';

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
  /** If set, question is only shown when this condition returns true */
  showCondition?: (answers: Record<string, string | string[]>) => boolean;
}

export interface QuizResult {
  recommendedTier: PlanTier;
  tierName: string;
  tierPrice: number;
  recommendedMedications: { id: string; name: string; description: string }[];
  primaryGoal: string;
  /** Specific GLP-1 therapy recommendation when tier is core and determinable */
  coreTherapy?: CoreTherapy;
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
    id: 'therapy-depth',
    question: 'How many areas do you want to address?',
    type: 'single',
    options: [
      { id: 'learning-only', label: 'Just learning for now', scores: { club: 5 } },
      { id: 'single-therapy', label: 'Just one thing', scores: { core: 4 } },
      { id: 'multi-therapy', label: '2–3 areas', scores: { catalyst: 4 } },
      { id: 'full-protocol', label: 'Full optimization — as many as it takes', scores: { concierge: 5 } },
    ],
  },
  {
    id: 'glp1-history',
    question: 'Have you tried GLP-1 weight loss medications before?',
    type: 'single',
    showCondition: (answers) => {
      const goal = answers['primary-goal'];
      const symptoms = answers['symptoms'] as string[] | undefined;
      return goal === 'weight-loss' || (symptoms?.includes('weight') ?? false);
    },
    options: [
      { id: 'never-glp1', label: "No, I'm brand new", scores: { semaglutide: 5 } },
      { id: 'tried-sema', label: "Yes, I've tried one before", scores: { tirzepatide: 5 } },
      { id: 'tried-multiple', label: "Yes, I've tried multiple", scores: { tirzepatide: 5 } },
      { id: 'not-sure', label: 'Not sure', scores: { semaglutide: 3 } },
    ],
  },
  {
    id: 'provider-access',
    question: 'How much provider access do you want?',
    type: 'single',
    options: [
      { id: 'self-guided', label: "I'll handle it myself", scores: { club: 5 } },
      { id: 'light-touch', label: 'Check-ins when I need them', scores: { core: 3 } },
      { id: 'regular', label: 'Regular guidance (2x/month)', scores: { catalyst: 4 } },
      { id: 'white-glove', label: 'Unlimited — I want a full care team', scores: { concierge: 5 } },
    ],
  },
  {
    id: 'budget',
    question: 'How much are you willing to invest in your health monthly?',
    type: 'single',
    options: [
      { id: 'free', label: '$0 — just exploring', scores: { club: 5 } },
      { id: 'starter', label: '$149 – $239/mo', scores: { core: 4 } },
      { id: 'committed', label: '$499/mo', scores: { catalyst: 4 } },
      { id: 'all-in', label: '$1,049/mo', scores: { concierge: 5 } },
    ],
  },
  {
    id: 'values',
    question: 'What matters most to you?',
    type: 'single',
    options: [
      { id: 'affordability', label: 'Keeping costs low', scores: { core: 3, club: 2, semaglutide: 2 } },
      { id: 'results', label: 'Getting the best results', scores: { catalyst: 3, tirzepatide: 2 } },
      { id: 'convenience', label: 'Having everything handled for me', scores: { concierge: 4 } },
      { id: 'education', label: 'Understanding what I\'m putting in my body', scores: { club: 3 } },
    ],
  },
];

// Medication category → specific medication recommendations
const MEDICATION_MAP: Record<string, { id: string; name: string; description: string }[]> = {
  metabolic: [
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
  core: { name: 'CULTR Core', price: 149 },
  catalyst: { name: 'CULTR Catalyst+', price: 499 },
  concierge: { name: 'CULTR Concierge', price: 1049 },
};

// Tier priority for tie-breaking (higher index = preferred)
const TIER_PRIORITY: string[] = ['club', 'core', 'catalyst', 'concierge'];

// GLP-1 therapy score keys
const GLP1_KEYS = ['semaglutide', 'tirzepatide'];

/**
 * Returns the list of questions that should be shown based on current answers.
 * Filters out conditional questions whose showCondition is not met.
 */
export function getActiveQuestions(answers: Record<string, string | string[]>): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q => {
    if (q.showCondition) {
      return q.showCondition(answers);
    }
    return true;
  });
}

export function calculateRecommendation(answers: Record<string, string | string[]>): QuizResult {
  const tierScores: Record<string, number> = { club: 0, core: 0, catalyst: 0, concierge: 0 };
  const medScores: Record<string, number> = {};
  const glp1Scores: Record<string, number> = { semaglutide: 0, tirzepatide: 0 };

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
        } else if (GLP1_KEYS.includes(key)) {
          glp1Scores[key] += score;
        } else {
          medScores[key] = (medScores[key] || 0) + score;
        }
      }
    }
  }

  // Find best tier (tie-break: higher tier wins)
  const bestTier = Object.entries(tierScores)
    .sort(([tierA, a], [tierB, b]) => {
      if (b !== a) return b - a;
      return TIER_PRIORITY.indexOf(tierB) - TIER_PRIORITY.indexOf(tierA);
    })[0][0] as PlanTier;

  // GLP-1 therapy recommendation (only for core tier)
  let coreTherapy: CoreTherapy | undefined;
  if (bestTier === 'core') {
    const hasGlp1Answer = answers['glp1-history'] !== undefined;
    if (hasGlp1Answer) {
      const bestGlp1 = Object.entries(glp1Scores)
        .sort(([, a], [, b]) => b - a)[0];
      if (bestGlp1 && bestGlp1[1] > 0) {
        coreTherapy = CORE_THERAPIES.find(t => t.slug === bestGlp1[0]);
      }
    }
    // If no GLP-1 answer or no scores, coreTherapy stays undefined
    // Results page will show "Starting at $149" with all options
  }

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
    tierPrice: coreTherapy?.price ?? TIER_INFO[bestTier]?.price ?? 149,
    recommendedMedications,
    primaryGoal: goalOption?.label || 'Optimize your health',
    coreTherapy,
  };
}
