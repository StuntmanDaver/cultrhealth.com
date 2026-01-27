import SectionWrapper from '@/components/ui/SectionWrapper'
import WaitlistForm from '@/components/WaitlistForm'

export default function Waitlist() {
  return (
    <SectionWrapper id="waitlist">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-cultr-copper font-display text-sm tracking-widest uppercase mb-4">
          Get Early Access
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-cultr-cream mb-6">
          Join the Waitlist
        </h2>
        <p className="text-lg text-cultr-cream/60 font-body mb-10">
          Be among the first to experience CULTR Health. Join our waitlist for 
          exclusive early access and special launch pricing.
        </p>

        <div className="bg-cultr-charcoal border border-cultr-lightgray/20 rounded-2xl p-8 md:p-12">
          <WaitlistForm />
        </div>

        <p className="text-sm text-cultr-cream/40 font-body mt-6">
          We respect your privacy. No spam, ever.
        </p>
      </div>
    </SectionWrapper>
  )
}
