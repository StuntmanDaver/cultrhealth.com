import { Metadata } from 'next';
import Link from 'next/link';
import { CTASection } from '@/components/site/CTASection';
import { FAQAccordion } from '@/components/site/FAQAccordion';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import Button from '@/components/ui/Button';
import { ArrowRight, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ — CULTR Health',
  description: 'Find answers to frequently asked questions about CULTR Health memberships, telehealth services, and protocols.',
};

export default function FAQPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-24 md:py-32 px-6 bg-cultr-forest text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="none" duration={800}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Frequently asked <span className="italic">questions</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Everything you need to know about CULTR Health, our memberships, and how we can help you optimize your health.
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

      {/* FAQ Sections */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto space-y-16">

          {/* Membership */}
          <ScrollReveal>
            <div>
              <h2 className="text-2xl font-display font-bold text-cultr-forest mb-6 pb-2 border-b border-cultr-sage">
                Membership
              </h2>
              <FAQAccordion items={[
                {
                  question: 'What is included in my membership?',
                  answer: 'All memberships include access to our HIPAA-compliant platform, telehealth consultations with licensed providers, comprehensive lab panel reviews, secure messaging with your care team, and educational resources. Higher tiers unlock more frequent consultations, priority messaging, and access to advanced features like the Peptide Library and Protocol Engine.',
                },
                {
                  question: 'Can I cancel my membership?',
                  answer: 'Yes, memberships are month-to-month with no long-term contracts. You can cancel at any time before your next renewal date through your member portal. There are no cancellation fees, and your access continues until the end of your current billing period.',
                },
                {
                  question: 'Can I switch plans?',
                  answer: 'Absolutely. You can upgrade or downgrade your tier at any time through your billing portal. Upgrades take effect immediately with prorated billing. Downgrades apply at the start of your next billing cycle.',
                },
                {
                  question: 'Do you accept HSA/FSA?',
                  answer: 'Yes! CULTR memberships are HSA/FSA eligible. We accept HSA/FSA cards directly and provide all necessary documentation for reimbursement from your health savings account.',
                },
              ]} />
            </div>
          </ScrollReveal>

          {/* Medical & Telehealth */}
          <ScrollReveal>
            <div>
              <h2 className="text-2xl font-display font-bold text-cultr-forest mb-6 pb-2 border-b border-cultr-sage">
                Medical & Telehealth
              </h2>
              <FAQAccordion items={[
                {
                  question: 'Who is CULTR Health for?',
                  answer: 'CULTR is for adults looking to optimize their health through longevity science, metabolic health, and personalized protocols. We specialize in preventive care and optimization—not acute illnesses or primary care conditions. Our members typically want more comprehensive testing and personalized guidance than traditional healthcare provides.',
                },
                {
                  question: 'What if I am not eligible for treatment?',
                  answer: 'Our providers adhere to strict medical guidelines and only prescribe when clinically appropriate. If you are not a candidate for a specific treatment (e.g., GLP-1s, TRT) due to safety reasons or contraindications, we will discuss alternative options. If no services can be rendered, we offer a full refund of your initial consultation fee.',
                },
                {
                  question: 'Do you prescribe medications?',
                  answer: 'Yes, when clinically indicated. Our licensed providers can prescribe medications including GLP-1 agonists (semaglutide, tirzepatide), hormone therapy, peptides, and other longevity-focused treatments. All prescriptions are sent to licensed compounding pharmacies or your preferred retail pharmacy.',
                },
                {
                  question: 'How do telehealth visits work?',
                  answer: 'Visits are conducted via secure, HIPAA-compliant video calls within our Healthie portal. You can join from your phone, tablet, or computer. Most appointments are available within 24-48 hours of booking. Your provider will review your health history, discuss your goals, and create a personalized protocol.',
                },
                {
                  question: 'What states do you operate in?',
                  answer: 'CULTR operates in most US states. During signup, we verify availability in your location. Telehealth regulations vary by state, and we ensure full compliance with local requirements. If we don\'t currently serve your state, join our waitlist and we\'ll notify you when we expand.',
                },
              ]} />
            </div>
          </ScrollReveal>

          {/* Products & Protocols */}
          <ScrollReveal>
            <div>
              <h2 className="text-2xl font-display font-bold text-cultr-forest mb-6 pb-2 border-b border-cultr-sage">
                Products & Protocols
              </h2>
              <FAQAccordion items={[
                {
                  question: 'What is the Peptide Library?',
                  answer: 'The Peptide Library is our comprehensive database of research-backed peptide protocols. Each entry includes mechanism of action, dosing guidelines, cycling recommendations, potential side effects, and real-world outcomes data. It\'s designed to help you understand your options and have informed conversations with your provider.',
                },
                {
                  question: 'How does the Protocol Engine work?',
                  answer: 'The Protocol Engine analyzes your biomarkers, health history, and goals to generate personalized protocol recommendations. It considers interactions between different treatments, optimal timing, and your unique biology to suggest the most effective approach. Your provider reviews and approves all recommendations.',
                },
                {
                  question: 'What labs are included?',
                  answer: 'We test 50+ biomarkers including comprehensive metabolic panels, full hormone profiles (testosterone, thyroid, cortisol), inflammation markers (hs-CRP), vitamins and minerals, and advanced lipid panels. Lab interpretation is included in all memberships; lab draw fees are billed separately through our partner labs.',
                },
                {
                  question: 'Where do medications come from?',
                  answer: 'All medications are sourced from licensed US pharmacies, including 503A and 503B compounding pharmacies for specialized formulations. We only work with pharmacies that meet our quality standards and comply with all FDA regulations.',
                },
              ]} />
            </div>
          </ScrollReveal>

          {/* Support & Safety */}
          <ScrollReveal>
            <div>
              <h2 className="text-2xl font-display font-bold text-cultr-forest mb-6 pb-2 border-b border-cultr-sage">
                Support & Safety
              </h2>
              <FAQAccordion items={[
                {
                  question: 'How fast do you respond to messages?',
                  answer: 'Response times vary by membership tier. Core members receive standard response times (24-48 hours). Higher tiers have priority access with faster response times. Concierge and Club members have 24/7 messaging access with expedited responses.',
                },
                {
                  question: 'What if I have side effects?',
                  answer: 'We provide detailed education on managing common side effects for all treatments. For mild issues, message your care team through the portal. For moderate concerns, schedule a follow-up consultation. For severe reactions or emergencies, seek immediate medical attention by calling 911 or visiting your nearest emergency room.',
                },
                {
                  question: 'Is my data secure?',
                  answer: 'Absolutely. Our platform is fully HIPAA-compliant with end-to-end encryption. We never sell your data to third parties. Your health information is protected by the same standards used by major healthcare systems.',
                },
                {
                  question: 'How do I contact support?',
                  answer: 'You can reach our team through the messaging feature in your member portal, or email us at support@cultrhealth.com. For billing questions, visit the billing portal or contact our support team directly.',
                },
              ]} />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 px-6 bg-cultr-offwhite border-y border-cultr-sage">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <div className="w-16 h-16 rounded-full bg-cultr-mint flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-cultr-forest" />
            </div>
            <h3 className="text-2xl font-display font-bold text-cultr-forest mb-4">
              Still have questions?
            </h3>
            <p className="text-cultr-textMuted mb-6">
              Our team is here to help. Reach out and we&apos;ll get back to you within 24 hours.
            </p>
            <a href="mailto:support@cultrhealth.com">
              <Button variant="secondary">
                Contact Support <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Ready to optimize your health?"
        subtitle="Join thousands taking control of their biology with CULTR."
        ctaText="Get Started"
      />
    </div>
  );
}
