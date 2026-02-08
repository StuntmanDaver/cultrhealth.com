// Social Proof Configuration
// Centralized testimonials, provider data, and trust metrics

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  rating: number;
  highlight?: string;
}

export interface Provider {
  name: string;
  specialty: string;
  credentials: string;
  yearsExperience: number;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Down 32 lbs in 4 months. My provider adjusted my protocol twice — that's the difference.",
    name: "Michael R.",
    title: "Creator member, 6 months",
    rating: 5,
    highlight: "-32 lbs",
  },
  {
    quote: "The lab work alone is worth it. 50+ markers my PCP never tested. Found my thyroid was tanking.",
    name: "Sarah K.",
    title: "Catalyst+ member, 8 months",
    rating: 5,
    highlight: "50+ labs",
  },
  {
    quote: "BPC-157 stack got me back in the gym in 3 weeks after my shoulder surgery. Provider was on point.",
    name: "David L.",
    title: "Creator member, 4 months",
    rating: 5,
    highlight: "3 weeks",
  },
  {
    quote: "Went from 215 to 183. Semaglutide + the protocol engine made it almost too easy.",
    name: "James T.",
    title: "Core member, 5 months",
    rating: 5,
    highlight: "-32 lbs",
  },
  {
    quote: "I've tried 4 telehealth platforms. CULTR is the only one where the provider actually knows peptides.",
    name: "Rachel M.",
    title: "Concierge member, 10 months",
    rating: 5,
    highlight: "4 platforms tried",
  },
  {
    quote: "NAD+ protocol changed my energy levels completely. Sleeping better, thinking clearer, lifting heavier.",
    name: "Chris W.",
    title: "Catalyst+ member, 3 months",
    rating: 5,
    highlight: "More energy",
  },
  {
    quote: "The intake was easy, provider called within 24 hours, meds arrived in 4 days. That's how healthcare should work.",
    name: "Amanda P.",
    title: "Core member, 2 months",
    rating: 5,
    highlight: "4 day delivery",
  },
  {
    quote: "Finally a platform that treats optimization seriously. Not just weight loss pills — real protocols.",
    name: "Kevin H.",
    title: "Creator member, 7 months",
    rating: 5,
    highlight: "Real protocols",
  },
];

export const PROVIDERS: Provider[] = [
  {
    name: "Dr. Sarah Mitchell, DO",
    specialty: "Integrative & Longevity Medicine",
    credentials: "Board-certified Internal Medicine",
    yearsExperience: 12,
  },
  {
    name: "Dr. James Chen, MD",
    specialty: "Sports Medicine & Peptide Therapy",
    credentials: "Board-certified Sports Medicine",
    yearsExperience: 15,
  },
  {
    name: "Dr. Lisa Patel, MD",
    specialty: "Endocrinology & Metabolic Health",
    credentials: "Board-certified Endocrinology",
    yearsExperience: 10,
  },
];

export const TRUST_METRICS = {
  memberCount: "2,500+",
  statesCovered: 48,
  avgRating: 4.9,
  reviewCount: 847,
  labsProcessed: "15,000+",
  providerResponseTime: "< 24hrs",
};

export const TRUST_BADGES = [
  { label: 'HIPAA Compliant', icon: 'Shield' as const },
  { label: 'Licensed Providers', icon: 'Stethoscope' as const },
  { label: 'Licensed Pharmacy', icon: 'Building' as const },
  { label: 'HSA/FSA Eligible', icon: 'CreditCard' as const },
];
