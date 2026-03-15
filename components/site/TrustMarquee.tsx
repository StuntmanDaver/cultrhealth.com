"use client";
import React from "react";
import Image from "next/image";
import { Marquee } from "@/components/ui/Marquee";

const TRUST_LOGOS = [
  { src: "/images/trust-logos/clia-certified.svg", alt: "CLIA Certified", width: 130, height: 40 },
  { src: "/images/trust-logos/cap-accredited.svg", alt: "CAP Accredited", width: 140, height: 40 },
  { src: "/images/trust-logos/legitscript-certified.svg", alt: "LegitScript Certified", width: 160, height: 44 },
  { src: "/images/trust-logos/trustpilot.svg", alt: "Trustpilot", width: 140, height: 36 },
  { src: "/images/trust-logos/prenuvo.svg", alt: "Prenuvo", width: 130, height: 32 },
  { src: "/images/trust-logos/path.svg", alt: "Path", width: 120, height: 36 },
  { src: "/images/trust-logos/spio-health.svg", alt: "Spio Health", width: 160, height: 24 },
];

export default function TrustMarquee() {
  return (
    <section className="relative py-8 md:py-10 bg-brand-primary overflow-hidden">
      {/* Subtle top/bottom borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" />

      {/* Optional label */}
      <p className="text-center text-xs uppercase tracking-[0.2em] text-white/40 mb-6 font-body">
        Trusted by leading health platforms
      </p>

      <Marquee
        duration={30}
        pauseOnHover
        direction="left"
        fade
        fadeAmount={8}
      >
        {TRUST_LOGOS.map((logo) => (
          <div
            key={logo.alt}
            className="flex items-center justify-center mx-6 md:mx-12 opacity-70 hover:opacity-100 transition-opacity duration-300"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              className="h-8 md:h-10 w-auto object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </Marquee>
    </section>
  );
}
