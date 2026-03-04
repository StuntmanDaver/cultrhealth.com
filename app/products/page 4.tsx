import { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
import { PRODUCTS } from '@/lib/config/products';
import {
  Check,
  ArrowRight,
  Syringe,
  Pill,
  Activity,
  FlaskConical,
  Dna,
  Sparkles,
  BookOpen,
  Shield,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Products — CULTR Health',
  description: 'Explore CULTR Health products including compounded peptides, hormone optimization, and comprehensive diagnostic labs.',
};

const iconMap = {
  syringe: Syringe,
  pill: Pill,
  activity: Activity,
  flask: FlaskConical,
};

export default function ProductsPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-24 md:py-32 px-6 bg-cultr-forest text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="none" duration={800}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Science-backed <span className="italic">products</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              From cutting-edge peptide protocols to comprehensive lab panels. Everything you need to optimize your biology.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={400} direction="up" duration={600}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button size="lg">View Plans</Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="ghost" size="lg" className="text-white hover:text-cultr-sage">
                  How It Works <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Our <span className="italic">offerings</span>
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              All products are available through membership. Prescriptions issued only when clinically appropriate.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8">
            {PRODUCTS.map((product, i) => {
              const IconComponent = iconMap[product.icon];
              return (
                <ScrollReveal key={product.slug} delay={i * 100} direction="up">
                  <div className="p-8 rounded-2xl bg-cultr-offwhite border border-cultr-sage hover:border-cultr-forest/40 transition-colors h-full">
                    {product.isBestseller && (
                      <span className="inline-block text-xs font-bold text-cultr-forest tracking-widest bg-cultr-mint px-3 py-1 rounded-full mb-4">
                        BESTSELLER
                      </span>
                    )}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-14 h-14 rounded-xl bg-cultr-forest flex items-center justify-center shrink-0">
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-cultr-text mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-cultr-forest font-medium">{product.priceTeaser}</p>
                      </div>
                    </div>
                    <p className="text-cultr-textMuted mb-6 leading-relaxed">
                      {product.description}
                    </p>
                    <ul className="space-y-3 mb-8">
                      {product.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-cultr-forest flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-cultr-text text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={product.href}>
                      <Button variant="secondary" className="w-full">
                        View Plans <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Peptide Library Feature */}
      <section className="py-24 px-6 bg-cultr-forest text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="none">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                  <BookOpen className="w-4 h-4 text-cultr-sage" />
                  <span className="text-sm">Coming Soon</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                  The CULTR <span className="italic">Peptide Library</span>
                </h2>
                <p className="text-white/80 mb-8 leading-relaxed">
                  Access our comprehensive library of research-backed peptide protocols. Each entry includes mechanism of action, dosing guidelines, cycling recommendations, and real-world outcomes data.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    '60+ peptide protocols documented',
                    'Evidence-based dosing guidelines',
                    'Stacking and cycling recommendations',
                    'Provider-reviewed safety data',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-cultr-sage" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/pricing">
                  <Button size="lg">Join for Access</Button>
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200} direction="up">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="space-y-4">
                  {[
                    { name: 'BPC-157', category: 'Recovery', status: 'Popular' },
                    { name: 'Semaglutide', category: 'Metabolic', status: 'Bestseller' },
                    { name: 'Tirzepatide', category: 'Metabolic', status: 'Bestseller' },
                    { name: 'PT-141', category: 'Performance', status: 'Available' },
                    { name: 'Thymosin Alpha-1', category: 'Immune', status: 'Available' },
                  ].map((peptide, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                      <div>
                        <div className="font-medium text-white">{peptide.name}</div>
                        <div className="text-sm text-white/60">{peptide.category}</div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        peptide.status === 'Bestseller' ? 'bg-cultr-sage text-cultr-forest' :
                        peptide.status === 'Popular' ? 'bg-white/20 text-white' :
                        'bg-white/10 text-white/80'
                      }`}>
                        {peptide.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Protocol Engine Feature */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="none" className="order-2 lg:order-1">
              <div className="bg-cultr-offwhite rounded-2xl p-8 border border-cultr-sage">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-cultr-textMuted">Protocol Generated</span>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-xl border border-cultr-sage">
                    <div className="text-sm text-cultr-textMuted mb-1">Based on your labs</div>
                    <div className="font-display font-bold text-cultr-forest">Metabolic Optimization Protocol</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-xl border border-cultr-sage">
                      <div className="text-sm text-cultr-textMuted mb-1">Primary</div>
                      <div className="font-medium text-cultr-text">Tirzepatide</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-cultr-sage">
                      <div className="text-sm text-cultr-textMuted mb-1">Support</div>
                      <div className="font-medium text-cultr-text">B12 Complex</div>
                    </div>
                  </div>
                  <div className="p-4 bg-cultr-mint rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-cultr-forest" />
                      <span className="text-sm font-medium text-cultr-forest">Recommendation</span>
                    </div>
                    <p className="text-sm text-cultr-textMuted">
                      Based on your A1C and metabolic markers, we recommend starting with 2.5mg weekly.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200} direction="none" className="order-1 lg:order-2">
              <div>
                <div className="inline-flex items-center gap-2 bg-cultr-mint rounded-full px-4 py-2 mb-6">
                  <Sparkles className="w-4 h-4 text-cultr-forest" />
                  <span className="text-sm text-cultr-forest font-medium">AI-Powered</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-6">
                  The <span className="italic">Protocol Engine</span>
                </h2>
                <p className="text-cultr-textMuted mb-8 leading-relaxed">
                  Our intelligent protocol engine analyzes your biomarkers and generates personalized recommendations. No more guesswork—just data-driven protocols tailored to your unique biology.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    'Analyzes 28–59 biomarkers (SiPho Health)',
                    'Considers your health history',
                    'Optimizes for your specific goals',
                    'Adjusts based on progress',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-cultr-forest flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-cultr-text">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/how-it-works">
                  <Button variant="secondary">
                    Learn How It Works <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Lab Testing */}
      <section className="py-24 px-6 bg-cultr-offwhite">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Comprehensive <span className="italic">lab testing</span>
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              We test more markers than standard care. Get a complete picture of your health.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Metabolic Panel',
                markers: ['Fasting Glucose', 'HbA1c', 'Insulin', 'Lipid Panel', 'Liver Enzymes', 'Kidney Function'],
              },
              {
                title: 'Hormone Panel',
                markers: ['Total Testosterone', 'Free Testosterone', 'Estradiol', 'Thyroid (TSH, T3, T4)', 'DHEA-S', 'Cortisol'],
              },
              {
                title: 'Advanced Markers',
                markers: ['hs-CRP', 'Homocysteine', 'Vitamin D', 'B12', 'Ferritin', 'Magnesium RBC'],
              },
            ].map((panel, i) => (
              <ScrollReveal key={i} delay={i * 100} direction="up">
                <div className="p-6 rounded-xl bg-white border border-cultr-sage h-full">
                  <div className="w-12 h-12 rounded-xl bg-cultr-mint flex items-center justify-center mb-4">
                    <FlaskConical className="w-6 h-6 text-cultr-forest" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-cultr-text mb-4">{panel.title}</h3>
                  <ul className="space-y-2">
                    {panel.markers.map((marker, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-cultr-textMuted">
                        <Check className="w-4 h-4 text-cultr-forest shrink-0" />
                        {marker}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Note */}
      <section className="py-16 px-6 bg-white border-t border-cultr-sage">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="flex items-start gap-4 p-6 rounded-xl bg-cultr-mint border border-cultr-sage">
              <Shield className="w-6 h-6 text-cultr-forest shrink-0 mt-1" />
              <div>
                <h4 className="font-display font-bold text-cultr-text mb-2">Medical Disclaimer</h4>
                <p className="text-sm text-cultr-textMuted leading-relaxed">
                  All products require a valid prescription from a licensed provider. Individual results may vary.
                  Medications are prescribed only when clinically appropriate based on your health history and lab results.
                  CULTR does not guarantee specific outcomes. These statements have not been evaluated by the FDA.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Ready to optimize your biology?"
        subtitle="Get access to our full product line through membership."
        ctaText="Choose Your Plan"
      />
    </div>
  );
}
