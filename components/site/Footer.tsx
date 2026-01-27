import Link from 'next/link';
import { Shield, Lock, UserCheck, BadgeCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-cultr-sage py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10 pb-10 border-b border-cultr-sage">
          <div className="flex items-center gap-2 text-cultr-forest">
            <Shield className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wide">HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-cultr-forest">
            <Lock className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wide">Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 text-cultr-forest">
            <UserCheck className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wide">Licensed Providers</span>
          </div>
          <div className="flex items-center gap-2 text-cultr-forest">
            <BadgeCheck className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wide">Verified Practice</span>
          </div>
        </div>

        {/* Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-cultr-textMuted text-sm">
            © {new Date().getFullYear()} CULTR Health. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-cultr-textMuted">
            <Link href="/legal/terms" className="hover:text-cultr-forest transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-cultr-forest transition-colors">Privacy</Link>
            <Link href="/legal/medical-disclaimer" className="hover:text-cultr-forest transition-colors">Medical Disclaimer</Link>
            <Link href="mailto:support@cultrhealth.com" className="hover:text-cultr-forest transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
