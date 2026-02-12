import Link from 'next/link';
import { Linkedin, Instagram, Facebook, Shield, Lock, Stethoscope, FlaskConical } from 'lucide-react';

const productLinks = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/pricing#plans', label: 'Membership Plans' },
  { href: '/pricing#faq', label: 'Pricing FAQ' },
];

const learnLinks = [
  { href: '/science', label: 'Science' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/library', label: 'Resources' },
  { href: '/how-it-works#faq', label: 'FAQ' },
];

const contactLinks = [
  { href: '/pricing', label: 'Partner' },
  { href: '/creators', label: 'Creator Program' },
  { href: 'mailto:support@cultrhealth.com', label: 'Contact Us' },
  { href: '/login', label: 'Manage Account' },
];

const trustBadges = [
  { icon: Shield, label: 'HIPAA Compliant' },
  { icon: Lock, label: '256-bit Encryption' },
  { icon: Stethoscope, label: 'Licensed Providers' },
  { icon: FlaskConical, label: 'Licensed Pharmacy' },
];

export function Footer() {
  return (
    <footer>
      {/* Trust Badges */}
      <div className="bg-cultr-mint border-b border-cultr-sage py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-cultr-forest">
                <badge.icon className="w-4 h-4" />
                <span className="text-xs font-display font-medium tracking-wide">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="relative bg-cultr-forest py-16 overflow-hidden">
        {/* Radial glow — top center mint */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 35% at 50% 0%, rgba(215,243,220,0.06) 0%, transparent 100%)' }} />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Footer Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {/* Products */}
            <div>
              <h4 className="font-display text-sm font-semibold text-cultr-sage mb-4">Products</h4>
              <ul className="space-y-3">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center text-sm text-white/60 hover:text-cultr-sage transition-all duration-200"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-cultr-sage transition-all duration-300 ease-out group-hover:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Learn */}
            <div>
              <h4 className="font-display text-sm font-semibold text-cultr-sage mb-4">Learn</h4>
              <ul className="space-y-3">
                {learnLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center text-sm text-white/60 hover:text-cultr-sage transition-all duration-200"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-cultr-sage transition-all duration-300 ease-out group-hover:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display text-sm font-semibold text-cultr-sage mb-4">Contact</h4>
              <ul className="space-y-3">
                {contactLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center text-sm text-white/60 hover:text-cultr-sage transition-all duration-200"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-cultr-sage transition-all duration-300 ease-out group-hover:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div className="flex gap-4 md:justify-end items-start">
              <a
                href="https://www.instagram.com/cultrhealth"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-white/50 hover:text-cultr-sage transition-all duration-300 hover:scale-110 hover:-translate-y-0.5"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/cultrhealth"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-white/50 hover:text-cultr-sage transition-all duration-300 hover:scale-110 hover:-translate-y-0.5"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/cultrhealth"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-white/50 hover:text-cultr-sage transition-all duration-300 hover:scale-110 hover:-translate-y-0.5"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-white/10">
            <p className="text-xs text-white/40 mb-4">
              <strong className="text-white/60">Important Information:</strong> The Cultr website, products, and services are intended to support a healthy lifestyle and are not for diagnosing, curing, managing, preventing, or treating any disease or condition. Always consult a licensed physician for medical advice.
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-xs text-white/40">
                © {new Date().getFullYear()} CULTR Health
              </p>
              <div className="flex gap-4 text-xs text-white/40">
                <Link href="/legal/privacy" className="hover:text-cultr-sage transition-all duration-200">
                  Privacy
                </Link>
                <Link href="/legal/terms" className="hover:text-cultr-sage transition-all duration-200">
                  Terms
                </Link>
                <Link href="/legal/medical-disclaimer" className="hover:text-cultr-sage transition-all duration-200">
                  Medical Disclaimer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
