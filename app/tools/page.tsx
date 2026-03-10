import Link from 'next/link'
import { Calculator, Utensils, HelpCircle, Layers, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Protocol Tools | CULTR Health',
  description: 'Free peptide dosing calculator, calorie & macro calculator, peptide FAQ, and stacking guides — no account required.',
}

const tools = [
  {
    href: '/tools/dosing-calculator',
    icon: Calculator,
    title: 'Dosing Calculator',
    description: 'Calculate exact peptide reconstitution ratios and draw amounts for any vial size and dose.',
  },
  {
    href: '/tools/calorie-calculator',
    icon: Utensils,
    title: 'Calorie & Macro Calculator',
    description: 'Advanced TDEE calculator with multiple BMR formulas, activity levels, and goal-based macro splits.',
  },
  {
    href: '/tools/peptide-faq',
    icon: HelpCircle,
    title: 'Peptide FAQ',
    description: 'Comprehensive answers to 100+ questions about peptide therapy, sourced from community and clinical research.',
  },
  {
    href: '/tools/stacking-guides',
    icon: Layers,
    title: 'Stacking Guides',
    description: 'Goal-based peptide stacking protocols for fat loss, recovery, growth, and longevity optimization.',
  },
]

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <section className="py-16 px-6 bg-brand-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Protocol Tools
          </h1>
          <p className="text-white/75 text-lg max-w-xl mx-auto">
            Free tools to help you calculate, plan, and optimize your peptide protocols — no account required.
          </p>
        </div>
      </section>

      {/* Tool Cards */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
          {tools.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-4 bg-white rounded-2xl p-7 border border-brand-primary/10 shadow-sm hover:shadow-md hover:border-brand-primary/25 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-mint rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-brand-primary" />
                </div>
                <ArrowRight className="w-5 h-5 text-brand-primary/30 group-hover:text-brand-primary group-hover:translate-x-1 transition-all duration-200" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-brand-primary mb-2">{title}</h2>
                <p className="text-brand-primary/65 text-sm leading-relaxed">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
