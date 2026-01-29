import Link from 'next/link';
import { Linkedin, Instagram } from 'lucide-react';

const productLinks = [
  { href: '/products', label: 'All Products' },
  { href: '/products#peptides', label: 'Peptides' },
  { href: '/products#bioregulators', label: 'Bioregulators' },
];

const learnLinks = [
  { href: '/faq#science', label: 'Science' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/library', label: 'Resources' },
  { href: '/faq#help', label: 'Help' },
];

const contactLinks = [
  { href: '/pricing', label: 'Partner' },
  { href: 'mailto:support@cultrhealth.com', label: 'Contact Us' },
  { href: '/login', label: 'Manage Account' },
];

export function Footer() {
  return (
    <footer>
      {/* Green Brand Section */}
      <div className="bg-brand-primary py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Newsletter */}
          <div>
            <h3 className="text-2xl font-display text-brand-cream mb-4">
              Stay in the <span className="italic">loop.</span>
            </h3>
            <form className="flex gap-2 max-w-md group">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-brand-cream/30 bg-transparent rounded-lg text-sm text-brand-cream placeholder:text-brand-cream/50 focus:outline-none focus:border-brand-cream focus:ring-2 focus:ring-brand-cream/20 transition-all duration-200"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-brand-cream text-brand-primary text-sm font-medium rounded-full hover:bg-white hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
              >
                Subscribe
              </button>
            </form>
          </div>
          {/* Big CULTR Logo - Right Justified */}
          <span className="text-6xl md:text-8xl font-display font-bold text-brand-cream tracking-tight">
            CULTR
          </span>
        </div>
      </div>

      {/* Links Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Footer Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {/* Products */}
            <div>
              <h4 className="font-display text-sm font-semibold text-brand-primary mb-4">Products</h4>
              <ul className="space-y-3">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center text-sm text-brand-primary/60 hover:text-brand-primary transition-all duration-200"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-brand-primary transition-all duration-300 ease-out group-hover:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Learn */}
            <div>
              <h4 className="font-display text-sm font-semibold text-brand-primary mb-4">Learn</h4>
              <ul className="space-y-3">
                {learnLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center text-sm text-brand-primary/60 hover:text-brand-primary transition-all duration-200"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-brand-primary transition-all duration-300 ease-out group-hover:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display text-sm font-semibold text-brand-primary mb-4">Contact</h4>
              <ul className="space-y-3">
                {contactLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center text-sm text-brand-primary/60 hover:text-brand-primary transition-all duration-200"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-brand-primary transition-all duration-300 ease-out group-hover:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div className="flex gap-4 md:justify-end items-start">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-brand-primary/60 hover:text-brand-primary transition-all duration-300 hover:scale-110 hover:-translate-y-0.5"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-brand-primary/60 hover:text-brand-primary transition-all duration-300 hover:scale-110 hover:-translate-y-0.5"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-brand-primary/10">
            <p className="text-xs text-brand-primary/50 mb-4">
              <strong>Important Information:</strong> The Cultr website, products, and services are intended to support a healthy lifestyle and are not for diagnosing, curing, managing, preventing, or treating any disease or condition. Always consult a licensed physician for medical advice.
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-xs text-brand-primary/50">
                © {new Date().getFullYear()} CULTR Health
              </p>
              <div className="flex gap-4 text-xs text-brand-primary/50">
                <Link href="/legal/privacy" className="hover:text-brand-primary transition-all duration-200 hover:translate-x-0.5">
                  Privacy
                </Link>
                <Link href="/legal/terms" className="hover:text-brand-primary transition-all duration-200 hover:translate-x-0.5">
                  Terms
                </Link>
                <Link href="/legal/medical-disclaimer" className="hover:text-brand-primary transition-all duration-200 hover:translate-x-0.5">
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
