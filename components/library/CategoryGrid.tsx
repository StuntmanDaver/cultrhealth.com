'use client'

import Link from 'next/link'
import { Activity, Zap, Heart, Brain, BookOpen, Search, ArrowRight, Pill, Dumbbell } from 'lucide-react'

// Define the categories manually to assign icons and specific layouts
const CATEGORIES = [
  {
    id: 'growth-factors',
    name: 'Growth Factors & Anabolic',
    description: 'Muscle building, strength enhancement, anabolic pathways',
    icon: Activity,
    color: 'emerald',
    tags: ['IGF-1 LR3', 'Follistatin', 'Sermorelin', 'Hexarelin']
  },
  {
    id: 'repair-recovery',
    name: 'Repair & Recovery',
    description: 'Tissue repair, tendon/ligament healing, wound recovery',
    icon: Heart,
    color: 'rose',
    tags: ['Glutathione', 'L-Carnitine', 'Lipo-C', 'B-Complex']
  },
  {
    id: 'metabolic',
    name: 'Metabolic & Weight Loss',
    description: 'Fat loss, appetite control, GLP-1 agonists, metabolic health',
    icon: Zap,
    color: 'amber',
    tags: ['Tirzepatide', 'Semaglutide', 'Lipo-C']
  },
  {
    id: 'bioregulators',
    name: 'Bioregulators & Neuropeptides',
    description: 'Immune support, sleep, cognition, anti-aging',
    icon: Brain,
    color: 'indigo',
    tags: ['NAD+', 'Sermorelin', 'Methylene Blue']
  }
]

// DEACTIVATED — peptide library category grid hidden for now; re-enable later
export function CategoryGrid() {
  return null
}
