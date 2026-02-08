'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Menu, X, ChevronDown } from 'lucide-react';

const navLinks = [
  { href: '/quiz', label: 'Take the Quiz' },
  { href: '/products', label: 'Products', hasDropdown: true },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/science', label: 'Science' },
];

const rightNavLinks = [
  { href: '/library', label: 'Resources', hasDropdown: true },
  { href: '/login', label: 'Community' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-brand-cream/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/">
              <span className="text-3xl font-display font-semibold text-brand-primary tracking-tight">
                CULTR
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-1 text-sm font-body text-brand-primary hover:text-brand-primaryLight transition-colors relative"
                >
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-brand-primary transition-all duration-300 ease-out group-hover:w-full" />
                  </span>
                  {link.hasDropdown && <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {rightNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-1 text-sm font-body text-brand-primary hover:text-brand-primaryLight transition-colors relative"
              >
                <span className="relative">
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-brand-primary transition-all duration-300 ease-out group-hover:w-full" />
                </span>
                {link.hasDropdown && <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />}
              </Link>
            ))}
            <Link href="/quiz">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-brand-primary hover:text-brand-primaryLight transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className={`block transition-transform duration-300 ${mobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`
          fixed inset-0 z-40 bg-brand-primary/20 backdrop-blur-sm md:hidden
          transition-opacity duration-300
          ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={`
          fixed top-0 right-0 z-50 h-full w-80 bg-brand-cream md:hidden
          transform transition-transform duration-300 ease-out
          ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-brand-primary/60 hover:text-brand-primary transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Nav Links */}
        <nav className="flex flex-col px-6">
          {[...navLinks, ...rightNavLinks].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-4 text-base font-body text-brand-primary hover:text-brand-primaryLight border-b border-brand-primary/10 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-8">
            <Link href="/quiz" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full">Get Started</Button>
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
