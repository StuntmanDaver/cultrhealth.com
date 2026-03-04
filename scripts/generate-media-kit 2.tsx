/**
 * CULTR Health — Investor Media Kit (1-Pager)
 *
 * Generate with: npx tsx scripts/generate-media-kit.tsx
 * Output: media-kit.pdf
 */

import React from 'react'
import path from 'path'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  renderToFile,
} from '@react-pdf/renderer'

// ── Fonts ──────────────────────────────────────────────────────────────
Font.register({
  family: 'Playfair Display',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf',
      fontWeight: 700,
    },
  ],
})

// ── Brand Colors ───────────────────────────────────────────────────────
const C = {
  forest:    '#2A4542',
  cream:     '#FDFBF7',
  creamDark: '#F5F0E8',
  white:     '#FFFFFF',
  sage:      '#B7E4C7',
  accent:    '#506C64',
  textMuted: '#6B7B77',
  divider:   '#D4DDD9',
}

// ── Image paths ────────────────────────────────────────────────────────
const IMG_DIR = path.join(process.cwd(), 'public/media-kit')
const IMG = {
  heroBanner: path.join(IMG_DIR, 'hero-banner.jpg'),
  heroOffice: path.join(IMG_DIR, 'hero-office.jpg'),
  heroWomen:  path.join(IMG_DIR, 'hero-women.jpg'),
  running:    path.join(IMG_DIR, 'lifestyle-running.jpg'),
  smiling:    path.join(IMG_DIR, 'lifestyle-smiling.jpg'),
}

// ── Helper Components ──────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 8,
        fontWeight: 700,
        color: C.forest,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 5,
      }}
    >
      {children}
    </Text>
  )
}

function Divider() {
  return (
    <View
      style={{
        borderBottomWidth: 0.5,
        borderBottomColor: C.divider,
        marginBottom: 6,
        marginTop: 7,
      }}
    />
  )
}

function TherapyPill({ name, price, featured }: { name: string; price: string; featured?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: featured ? C.forest : C.white,
        borderWidth: 0.5,
        borderColor: featured ? C.forest : C.divider,
        borderRadius: 3,
        paddingVertical: 3,
        paddingHorizontal: 6,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 3,
        marginBottom: 3,
      }}
    >
      <Text style={{ fontSize: 6, fontWeight: 600, color: featured ? C.cream : C.forest, marginRight: 3 }}>
        {name}
      </Text>
      <Text style={{ fontSize: 5.5, fontWeight: 700, color: featured ? C.sage : C.accent }}>
        {price}
      </Text>
    </View>
  )
}

function CheckItem({ children }: { children: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
      <Text style={{ fontSize: 6.5, color: C.sage, fontWeight: 700, marginRight: 3, marginTop: -0.5 }}>{'\u2713'}</Text>
      <Text style={{ fontSize: 6, color: C.forest, lineHeight: 1.3, flex: 1 }}>{children}</Text>
    </View>
  )
}

function BulletItem({ children }: { children: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
      <Text style={{ fontSize: 6.5, color: C.sage, fontWeight: 700, marginRight: 3, marginTop: -0.5 }}>{'\u2022'}</Text>
      <Text style={{ fontSize: 6, color: C.forest, lineHeight: 1.3, flex: 1 }}>{children}</Text>
    </View>
  )
}

// ── Media Kit Document ─────────────────────────────────────────────────
function MediaKitDocument() {
  return (
    <Document title="CULTR Health — Investor Media Kit" author="CULTR Health" subject="Brand Overview & Platform Summary">
      <Page
        size="LETTER"
        style={{
          backgroundColor: C.cream,
          paddingHorizontal: 32,
          paddingTop: 22,
          paddingBottom: 18,
          fontFamily: 'Helvetica',
          fontSize: 7,
          color: C.forest,
        }}
      >
        {/* ═══ HEADER ═══ */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 10,
            paddingBottom: 8,
            borderBottomWidth: 1.5,
            borderBottomColor: C.forest,
          }}
        >
          {/* Logo — "Health" right-justified under "CULTR" matching staging navbar */}
          <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
            <Text
              style={{
                fontFamily: 'Playfair Display',
                fontSize: 28,
                fontWeight: 700,
                color: C.forest,
                letterSpacing: 2,
              }}
            >
              CULTR
            </Text>
            <Text
              style={{
                fontSize: 8,
                fontWeight: 500,
                color: C.forest,
                letterSpacing: 0.96,
                textTransform: 'uppercase',
                marginTop: -1,
              }}
            >
              Health
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', paddingTop: 4 }}>
            <Text
              style={{
                fontSize: 6,
                fontWeight: 600,
                color: C.accent,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              Investor Media Kit
            </Text>
            <Text style={{ fontSize: 7.5, fontWeight: 700, color: C.forest }}>cultrhealth.com</Text>
            <Text style={{ fontSize: 5.5, color: C.textMuted, marginTop: 1 }}>@cultrhealth</Text>
          </View>
        </View>

        {/* ═══ HERO BANNER IMAGE ═══ */}
        <View style={{ marginBottom: 10, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
          <Image
            src={IMG.heroBanner}
            style={{ width: '100%', height: 190, objectFit: 'contain' }}
          />
          {/* Overlay with tagline */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingVertical: 9,
              paddingHorizontal: 16,
              backgroundColor: 'rgba(42, 69, 66, 0.78)',
            }}
          >
            <Text
              style={{
                fontFamily: 'Playfair Display',
                fontSize: 13,
                fontWeight: 700,
                color: C.white,
                textAlign: 'center',
                letterSpacing: 0.5,
              }}
            >
              Change the CULTR, Rebrand Yourself.
            </Text>
            <Text
              style={{ fontSize: 7, color: C.sage, textAlign: 'center', marginTop: 3, lineHeight: 1.3 }}
            >
              HIPAA-compliant telehealth for physician-supervised GLP-1 therapies, wellness peptides
              &amp; longevity optimization — across 48 states.
            </Text>
          </View>
        </View>

        {/* ═══ KEY METRICS ═══ */}
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {[
            { value: '2,500+', label: 'Members' },
            { value: '48', label: 'States' },
            { value: '4.9', label: 'Avg Rating' },
            { value: '15K+', label: 'Labs Processed' },
            { value: '<24h', label: 'Provider Response' },
          ].map((m, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: C.white,
                borderRadius: 4,
                paddingVertical: 5,
                paddingHorizontal: 4,
                alignItems: 'center',
                borderWidth: 0.5,
                borderColor: C.divider,
                marginLeft: i > 0 ? 4 : 0,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: 700, color: C.forest, marginBottom: 1 }}>{m.value}</Text>
              <Text
                style={{ fontSize: 5, fontWeight: 500, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}
              >
                {m.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ═══ THREE-COLUMN BODY ═══ */}
        <View style={{ flexDirection: 'row' }}>
          {/* ─── LEFT COLUMN (38%) ─── */}
          <View style={{ width: '38%', marginRight: 10 }}>
            <SectionTitle>Core Therapies</SectionTitle>

            <Text style={{ fontSize: 6, fontWeight: 600, color: C.accent, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 }}>
              Cut — Weight Loss
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <TherapyPill name="R3TA — Triple Agonist" price="$340" featured />
              <TherapyPill name="Semaglutide" price="$225" />
              <TherapyPill name="Tirzepatide" price="$290" />
            </View>

            <Text style={{ fontSize: 6, fontWeight: 600, color: C.accent, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3, marginTop: 4 }}>
              Enhancement — Peptides
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {[
                { name: 'GHK-CU', price: '$145' },
                { name: 'TESA/IPA', price: '$175' },
                { name: 'CJC1295/IPA', price: '$170' },
                { name: 'NAD+', price: '$175' },
                { name: 'Semax/Selank', price: '$115' },
                { name: 'BPC157/TB500', price: '$150' },
                { name: 'Melanotan 2', price: '$110' },
              ].map((t, i) => (
                <TherapyPill key={i} name={t.name} price={t.price} />
              ))}
            </View>

            {/* Membership Tiers */}
            <Divider />
            <SectionTitle>Membership Tiers</SectionTitle>
            <View style={{ marginBottom: 5 }}>
              {[
                { name: 'Club', price: 'Free', best: 'Education & discovery', featured: false },
                { name: 'Core', price: '$199/mo', best: 'Single therapy focus', featured: false },
                { name: 'Catalyst+', price: '$499/mo', best: 'Multi-therapy stacking', featured: true },
                { name: 'Curated', price: '$1,099/mo', best: 'White-glove care', featured: false },
              ].map((tier, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: tier.featured ? C.forest : C.white,
                    borderWidth: 0.5,
                    borderColor: tier.featured ? C.forest : C.divider,
                    borderRadius: 3,
                    paddingVertical: 3.5,
                    paddingHorizontal: 6,
                    marginBottom: 2,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 6.5, fontWeight: 700, color: tier.featured ? C.white : C.forest, marginRight: 4 }}>
                      {tier.name}
                    </Text>
                    <Text style={{ fontSize: 5.5, color: tier.featured ? C.sage : C.textMuted }}>{tier.best}</Text>
                  </View>
                  <Text style={{ fontSize: 7.5, fontWeight: 700, color: tier.featured ? C.sage : C.forest }}>{tier.price}</Text>
                </View>
              ))}
            </View>

            {/* Lifestyle images — 2-up grid */}
            <View style={{ flexDirection: 'row', marginTop: 4, marginBottom: 5 }}>
              <View style={{ flex: 1, marginRight: 3 }}>
                <Image src={IMG.heroWomen} style={{ width: '100%', height: 56, objectFit: 'cover', borderRadius: 4 }} />
              </View>
              <View style={{ flex: 1, marginLeft: 3 }}>
                <Image src={IMG.running} style={{ width: '100%', height: 56, objectFit: 'cover', objectPosition: '50% 25%', borderRadius: 4 }} />
              </View>
            </View>

            {/* Medical Team */}
            <SectionTitle>Medical Team</SectionTitle>
            {[
              { name: 'Dr. Ali Saberi, MD', creds: 'Medical Director — Board-certified Internal Medicine', years: '20+ yrs' },
              { name: 'Belinda Ruiz, FNP', creds: 'Family Nurse Practitioner — Functional Medicine', years: '8+ yrs' },
            ].map((p, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: C.white,
                  borderRadius: 3,
                  paddingVertical: 4,
                  paddingHorizontal: 6,
                  borderWidth: 0.5,
                  borderColor: C.divider,
                  marginBottom: 2,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 6.5, fontWeight: 700, color: C.forest }}>{p.name}</Text>
                  <Text style={{ fontSize: 5, color: C.textMuted }}>{p.creds}</Text>
                </View>
                <Text style={{ fontSize: 5.5, fontWeight: 600, color: C.accent }}>{p.years}</Text>
              </View>
            ))}
          </View>

          {/* ─── MIDDLE COLUMN (32%) ─── */}
          <View style={{ width: '32%', marginRight: 10 }}>
            <SectionTitle>Platform Capabilities</SectionTitle>
            <View style={{ marginBottom: 5 }}>
              {[
                'HIPAA-compliant telehealth with board-certified providers',
                'AI-powered protocol engine for personalized treatment plans',
                'Comprehensive lab panel (50+ biomarkers) with at-home kits',
                'Full peptide & longevity protocol library with dosing calculators',
                'Multi-step medical intake with secure ID verification & e-consent',
                'Integrated pharmacy fulfillment via licensed partner',
                'Member dashboard with order tracking & progress',
                'Subscription billing via Stripe + BNPL (Affirm, Klarna)',
                'HSA/FSA eligible across all paid tiers',
                'Interactive recommendation quiz for therapy matching',
                'Science blog with 12+ peer-reviewed articles',
                'Calorie calculator & daily tracking tools',
              ].map((f, i) => (
                <CheckItem key={i}>{f}</CheckItem>
              ))}
            </View>

            {/* How It Works */}
            <Divider />
            <SectionTitle>How It Works</SectionTitle>
            <View style={{ marginBottom: 5 }}>
              {[
                { num: '01', label: 'Choose Plan', desc: 'Select a membership tier' },
                { num: '02', label: 'Complete Intake', desc: 'HIPAA-secure health questionnaire' },
                { num: '03', label: 'Meet Provider', desc: 'Telehealth consult within 24-48h' },
                { num: '04', label: 'Get Protocol', desc: 'Personalized treatment plan' },
                { num: '05', label: 'Delivered', desc: 'Therapies shipped to your door' },
              ].map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2.5 }}>
                  <View
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: 7.5,
                      backgroundColor: C.forest,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 5,
                    }}
                  >
                    <Text style={{ fontSize: 5.5, fontWeight: 700, color: C.white }}>{step.num}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 6.5, fontWeight: 700, color: C.forest }}>{step.label}</Text>
                    <Text style={{ fontSize: 5.5, color: C.textMuted }}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Office lifestyle image */}
            <Image src={IMG.heroOffice} style={{ width: '100%', height: 52, objectFit: 'cover', borderRadius: 4, marginBottom: 5 }} />

            {/* Trust & Compliance */}
            <SectionTitle>Trust &amp; Compliance</SectionTitle>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 }}>
              {['HIPAA Compliant', 'Licensed Providers', 'Licensed Pharmacy', 'HSA/FSA Eligible'].map((b, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 7, marginBottom: 2.5 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.sage, marginRight: 3 }} />
                  <Text style={{ fontSize: 6, fontWeight: 500, color: C.forest }}>{b}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ─── RIGHT COLUMN (30%) ─── */}
          <View style={{ width: '30%' }}>
            <SectionTitle>Creator Program</SectionTitle>
            <View
              style={{
                backgroundColor: C.white,
                borderRadius: 4,
                padding: 6,
                borderWidth: 0.5,
                borderColor: C.divider,
                marginBottom: 5,
              }}
            >
              <Text style={{ fontSize: 7, fontWeight: 700, color: C.forest, marginBottom: 3 }}>Built-in Growth Engine</Text>
              {[
                { label: 'Commission', value: '10% direct per sale' },
                { label: 'Overrides', value: '2-8% on network' },
                { label: 'Tiers', value: 'Starter to Platinum' },
                { label: 'Attribution', value: '30-day cookie' },
                { label: 'Payouts', value: 'Net-30, $50 min' },
                { label: 'Tools', value: 'Links, codes, brand kit' },
                { label: 'FTC', value: 'Built-in disclosures' },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 1.5 }}>
                  <Text style={{ fontSize: 5.5, color: C.textMuted, width: 55 }}>{item.label}</Text>
                  <Text style={{ fontSize: 5.5, fontWeight: 600, color: C.forest, flex: 1 }}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Brand Identity */}
            <Divider />
            <SectionTitle>Brand Identity</SectionTitle>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              {[
                { color: C.forest, hex: '#2A4542', label: 'Primary' },
                { color: C.cream, hex: '#FDFBF7', label: 'Cream', border: true },
                { color: C.accent, hex: '#506C64', label: 'Accent' },
                { color: C.sage, hex: '#B7E4C7', label: 'Sage' },
              ].map((sw, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', marginLeft: i > 0 ? 3 : 0 }}>
                  <View
                    style={{
                      width: '100%',
                      height: 13,
                      borderRadius: 2,
                      marginBottom: 1,
                      backgroundColor: sw.color,
                      ...(sw.border ? { borderWidth: 0.5, borderColor: C.divider } : {}),
                    }}
                  />
                  <Text style={{ fontSize: 4.5, fontWeight: 600, color: C.forest }}>{sw.hex}</Text>
                  <Text style={{ fontSize: 4, color: C.textMuted }}>{sw.label}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={{ fontSize: 4.5, color: C.textMuted, marginBottom: 1 }}>Display</Text>
                <Text style={{ fontFamily: 'Playfair Display', fontSize: 8, fontWeight: 700, color: C.forest }}>Playfair</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 4.5, color: C.textMuted, marginBottom: 1 }}>Body</Text>
                <Text style={{ fontFamily: 'Helvetica', fontSize: 8, fontWeight: 700, color: C.forest }}>Inter</Text>
              </View>
            </View>

            {/* Tech Stack */}
            <Divider />
            <SectionTitle>Technology</SectionTitle>
            <View style={{ marginBottom: 5 }}>
              {[
                'Next.js 14 + TypeScript + Tailwind CSS',
                'Neon PostgreSQL via Vercel Postgres',
                'Stripe + Affirm/Klarna BNPL',
                'AI SDK v6 for protocol generation',
                'Vercel staging/production hosting',
                'Resend email + Cloudflare bot protection',
              ].map((f, i) => (
                <BulletItem key={i}>{f}</BulletItem>
              ))}
            </View>

          </View>
        </View>

        {/* ═══ FOOTER ═══ */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: C.forest,
            paddingTop: 6,
            marginTop: 'auto',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            {/* Footer logo — right-justified "Health" matching header */}
            <View style={{ flexDirection: 'column', alignItems: 'flex-end', marginRight: 10 }}>
              <Text style={{ fontFamily: 'Playfair Display', fontSize: 10, fontWeight: 700, color: C.forest, letterSpacing: 1 }}>CULTR</Text>
              <Text style={{ fontSize: 5.5, fontWeight: 500, color: C.forest, letterSpacing: 0.66, textTransform: 'uppercase', marginTop: -1 }}>Health</Text>
            </View>
            <Text style={{ fontSize: 5.5, color: C.textMuted }}>Change the CULTR, rebrand yourself.</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 6, color: C.forest, fontWeight: 500, marginBottom: 1 }}>cultrhealth.com | support@cultrhealth.com</Text>
            <Text style={{ fontSize: 5, color: C.textMuted }}>@cultrhealth — Instagram / TikTok / YouTube / X</Text>
          </View>
        </View>
        <Text style={{ fontSize: 4.5, color: C.textMuted, textAlign: 'center', marginTop: 4 }}>
          Confidential — For investor review only. CULTR Health {new Date().getFullYear()}. All rights reserved.
        </Text>
      </Page>
    </Document>
  )
}

// ── Generate PDF ───────────────────────────────────────────────────────
async function main() {
  const outputPath = path.join(process.cwd(), 'media-kit.pdf')
  console.log('Generating CULTR Health Investor Media Kit...')
  await renderToFile(<MediaKitDocument />, outputPath)
  console.log(`Done! Saved to: ${outputPath}`)
}

main().catch((err) => {
  console.error('Failed to generate PDF:', err)
  process.exit(1)
})
