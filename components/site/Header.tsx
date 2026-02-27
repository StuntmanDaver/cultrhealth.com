'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

const navLinks = [
  { href: '/pricing', label: 'Pricing', hasDropdown: false },
  { href: '/therapies', label: 'Core Therapies' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/science', label: 'Latest Research' },
];

const rightNavLinks = [
  { href: '/library', label: 'Members', hasDropdown: true },
  { href: '/creators', label: 'Creators' },
  { href: '/community', label: 'Community' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Navbar Wrapper — centers and adds padding when scrolled */}
      <div
        className={`
          fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none
          transition-[padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${scrolled ? 'py-3.5 px-6' : 'p-0'}
        `}
      >
        {/* Navbar — morphs from full-width bar to floating pill */}
        <nav
          className={`
            pointer-events-auto w-full
            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${scrolled
              ? 'max-w-[1080px] rounded-[60px] shadow-lux-lg'
              : 'max-w-full rounded-none shadow-[0_1px_8px_rgba(42,69,66,0.04)]'
            }
          `}
          style={scrolled ? {
            background: 'rgba(247, 246, 232, 0.72)',
            backdropFilter: 'blur(24px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
            border: '1px solid rgba(43, 69, 66, 0.08)',
          } : {
            background: 'rgba(247, 246, 232, 0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(43, 69, 66, 0.06)',
          }}
        >
          <div
            className={`
              max-w-[1240px] mx-auto flex items-center justify-between
              transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${scrolled ? 'h-[54px] px-7' : 'h-[68px] px-10'}
            `}
          >
            {/* Logo + Left Nav */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center shrink-0">
                <div className="flex flex-col items-end leading-none">
                  <span
                    className={`
                      font-display font-bold uppercase text-brand-primary
                      transition-[font-size] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                      ${scrolled ? 'text-lg' : 'text-[22px]'}
                    `}
                    style={{ fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif" }}
                  >
                    CULTR
                  </span>
                  <span
                    className={`
                      font-display font-medium tracking-[0.12em] uppercase text-brand-primary
                      transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                      text-[8px]
                      ${scrolled ? 'opacity-0 max-h-0 overflow-hidden' : 'opacity-100 max-h-4'}
                    `}
                  >
                    Health
                  </span>
                </div>
              </Link>

              <nav className="hidden lg:flex items-center gap-0.5 ml-4">
                <Link
                  href="/quiz"
                  className={`
                    inline-flex items-center justify-center font-body font-medium text-white
                    bg-brand-primary rounded-full whitespace-nowrap mr-2
                    shadow-[0_2px_8px_rgba(43,69,66,0.18)]
                    transition-all duration-250 ease-out
                    hover:bg-brand-primaryLight hover:shadow-[0_4px_20px_rgba(43,69,66,0.22)] hover:-translate-y-px
                    ${scrolled ? 'text-[12.5px] py-[7px] px-5' : 'text-[13.5px] py-[9px] px-6'}
                  `}
                >
                  Get Started
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center gap-1 font-body font-medium
                      rounded-lg whitespace-nowrap tracking-[0.01em]
                      transition-all duration-200 ease-out hover:bg-brand-primary/[0.07]
                      ${isActive(link.href) ? 'text-brand-primary bg-brand-primary/[0.08]' : 'text-brand-primary'}
                      ${scrolled ? 'text-[13px] py-1.5 px-3' : 'text-sm py-[7px] px-[15px]'}
                    `}
                  >
                    {link.label}
                    {link.hasDropdown && (
                      <ChevronDown className="w-[13px] h-[13px] opacity-45 transition-transform duration-250 group-hover:rotate-180 group-hover:opacity-80" />
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Nav + CTA */}
            <div className="hidden lg:flex items-center gap-1.5">
              {rightNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-1 font-body font-medium
                    rounded-lg whitespace-nowrap tracking-[0.01em]
                    transition-all duration-200 ease-out hover:bg-brand-primary/[0.07]
                    ${isActive(link.href) ? 'text-brand-primary bg-brand-primary/[0.08]' : 'text-brand-primary'}
                    ${scrolled ? 'text-[13px] py-1.5 px-3' : 'text-sm py-[7px] px-[15px]'}
                  `}
                >
                  {link.label}
                  {link.hasDropdown && (
                    <ChevronDown className="w-[13px] h-[13px] opacity-45 transition-transform duration-250" />
                  )}
                </Link>
              ))}
            </div>

            {/* Mobile Toggle — animated 3-bar hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex flex-col justify-center items-center w-[38px] h-[38px] rounded-lg gap-[5px] bg-transparent hover:bg-brand-primary/[0.06] transition-colors duration-200"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <span
                className={`block w-[18px] h-[1.8px] bg-brand-primary rounded-sm transition-transform duration-300 ease-out ${
                  mobileMenuOpen ? 'translate-y-[6.8px] rotate-45' : ''
                }`}
              />
              <span
                className={`block w-[18px] h-[1.8px] bg-brand-primary rounded-sm transition-opacity duration-300 ease-out ${
                  mobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block w-[18px] h-[1.8px] bg-brand-primary rounded-sm transition-transform duration-300 ease-out ${
                  mobileMenuOpen ? '-translate-y-[6.8px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`
          fixed top-[72px] left-0 right-0 bottom-0 z-40 bg-brand-cream overflow-y-auto
          lg:hidden transition-all duration-300 ease-out px-7 py-7
          ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2.5 pointer-events-none'}
        `}
      >
        {/* Main Nav Group */}
        <div className="mb-7">
          <div className="text-[11px] font-display font-semibold tracking-[0.08em] uppercase text-brand-primary/50 pb-2">
            Navigate
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-3.5 text-base font-body font-medium border-b border-brand-primary/[0.06] ${isActive(link.href) ? 'text-brand-primary bg-brand-primary/[0.06] pl-3 rounded-lg' : 'text-brand-primary'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Nav Group */}
        <div className="mb-7">
          <div className="text-[11px] font-display font-semibold tracking-[0.08em] uppercase text-brand-primary/50 pb-2">
            More
          </div>
          {rightNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-3.5 text-base font-body font-medium border-b border-brand-primary/[0.06] ${isActive(link.href) ? 'text-brand-primary bg-brand-primary/[0.06] pl-3 rounded-lg' : 'text-brand-primary'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile CTAs */}
        <div className="flex flex-col gap-2.5 mt-9">
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center w-full py-4 text-[15px] font-body font-medium text-brand-primary bg-transparent border border-brand-primary/[0.12] rounded-[14px] transition-colors duration-200 hover:bg-brand-primary/[0.07]"
          >
            Sign In
          </Link>
          <Link
            href="/quiz"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center w-full py-4 text-[15px] font-body font-medium text-white bg-brand-primary rounded-[14px] shadow-[0_2px_8px_rgba(43,69,66,0.18)] transition-all duration-250 hover:bg-brand-primaryLight hover:shadow-[0_4px_20px_rgba(43,69,66,0.22)]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </>
  );
}
