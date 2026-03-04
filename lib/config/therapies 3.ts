export interface Therapy {
  name: string;
  badge: string;
  note?: string;
  description: string;
}

export interface TherapySection {
  title: string;
  subtitle: string;
  description: string;
  therapies: Therapy[];
}

export const THERAPY_SECTIONS: TherapySection[] = [
  {
    title: 'Cut \u2014 Weight Loss',
    subtitle: 'GLP-1 & dual-agonist therapies',
    description:
      'Physician-supervised weight management protocols using the latest incretin-based therapies for sustainable fat loss.',
    therapies: [
      {
        name: 'Semaglutide',
        badge: 'Physician use only',
        note: 'Reconstituted - ready to inject',
        description:
          'GLP-1 receptor agonist for appetite regulation, metabolic improvement, and sustained weight loss.',
      },
      {
        name: 'Tirzepatide',
        badge: 'Physician use only',
        note: 'Reconstituted - ready to inject',
        description:
          'Dual GIP/GLP-1 agonist offering enhanced glycemic control and significant body composition changes.',
      },
      {
        name: 'Retatrutide',
        badge: 'Physician use only',
        description:
          'Triple-agonist peptide targeting GLP-1, GIP, and glucagon receptors for next-generation metabolic optimization.',
      },
    ],
  },
  {
    title: 'Enhancement',
    subtitle: 'Peptides & regenerative therapies',
    description:
      'Advanced peptide protocols for recovery, longevity, and performance optimization \u2014 tailored to your biomarkers.',
    therapies: [
      {
        name: 'Tesamorelin',
        badge: 'Physician use only',
        description:
          'Growth-hormone releasing peptide that targets visceral fat reduction and supports lean body composition.',
      },
      {
        name: 'Sermorelin',
        badge: 'Physician use only',
        description:
          'GHRH analog that stimulates natural growth hormone production for recovery, sleep quality, and vitality.',
      },
      {
        name: 'NAD+',
        badge: 'Physician use only',
        description:
          'Essential coenzyme for cellular energy, DNA repair, and metabolic function \u2014 foundational to longevity.',
      },
      {
        name: 'GHK-CU',
        badge: 'Physician use only',
        description:
          'Copper peptide complex supporting skin remodeling, wound healing, and tissue regeneration.',
      },
      {
        name: 'BPC-157',
        badge: 'Physician use only',
        description:
          'Body Protection Compound for accelerated gut healing, tendon repair, and systemic anti-inflammatory support.',
      },
      {
        name: 'TB-500',
        badge: 'Physician use only',
        description:
          'Thymosin Beta-4 fragment for tissue repair, reduced inflammation, and enhanced recovery from injury.',
      },
      {
        name: 'Glutathione',
        badge: 'Physician use only',
        note: 'Reconstituted - ready to inject',
        description:
          'Master antioxidant for detoxification, immune support, and protection against oxidative stress.',
      },
      {
        name: 'NAD+ / GHK-Cu / Glutathione Blend',
        badge: 'Physician use only',
        note: 'Reconstituted - ready to inject',
        description:
          'Synergistic triple-compound blend combining cellular energy restoration (NAD+), copper peptide tissue remodeling (GHK-Cu), and master antioxidant detoxification (Glutathione) for comprehensive rejuvenation.',
      },
      {
        name: 'AOD9604',
        badge: 'Physician use only',
        description:
          'Modified growth hormone fragment targeting fat metabolism without affecting blood sugar or growth.',
      },
      {
        name: 'Lipo B',
        badge: 'Physician use only',
        description:
          'Lipotropic injection blend supporting liver function, fat mobilization, and energy metabolism.',
      },
      {
        name: 'MOT-C',
        badge: 'Physician use only',
        description:
          'Mitochondrial-derived peptide that enhances metabolic flexibility, insulin sensitivity, and exercise capacity.',
      },
      {
        name: 'Semax/Selank',
        badge: 'Physician use only',
        description:
          'Neuropeptide stack for cognitive enhancement, stress resilience, and focus without stimulant side effects.',
      },
    ],
  },
];
