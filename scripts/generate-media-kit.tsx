/**
 * CULTR Health — Investor Media Kit (1-Pager)
 *
 * Generate with: npx tsx scripts/generate-media-kit.tsx
 * Output: media-kit.pdf
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  renderToFile,
} from '@react-pdf/renderer'

import { Font } from '@react-pdf/renderer'

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
  forest:      '#2A4542',
  forestLight: '#3A5956',
  forestDark:  '#1F3533',
  cream:       '#FDFBF7',
  creamDark:   '#F5F0E8',
  white:       '#FFFFFF',
  sage:        '#B7E4C7',
  mint:        '#D8F3DC',
  accent:      '#506C64',
  textMuted:   '#6B7B77',
  divider:     '#D4DDD9',
}

// ── Media Kit Document ─────────────────────────────────────────────────
function MediaKitDocument() {
  return (
    <Document
      title="CULTR Health — Investor Media Kit"
      author="CULTR Health"
      subject="Brand Overview & Platform Summary"
    >
      <Page
        size="LETTER"
        style={{
          backgroundColor: C.cream,
          paddingHorizontal: 36,
          paddingTop: 30,
          paddingBottom: 24,
          fontFamily: 'Helvetica',
          fontSize: 7.5,
          color: C.forest,
        }}
      >
        {/* ═══ HEADER ═══ */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottomWidth: 1.5,
            borderBottomColor: C.forest,
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: 'Playfair Display',
                fontSize: 32,
                fontWeight: 700,
                color: C.forest,
                letterSpacing: 3,
              }}
            >
              CULTR
            </Text>
            <Text
              style={{
                fontSize: 7,
                fontWeight: 500,
                color: C.accent,
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginTop: -2,
              }}
            >
              Health
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', paddingTop: 4 }}>
            <Text
              style={{
                fontSize: 6.5,
                fontWeight: 600,
                color: C.accent,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 3,
              }}
            >
              Investor Media Kit
            </Text>
            <Text style={{ fontSize: 8, fontWeight: 600, color: C.forest }}>
              cultrhealth.com
            </Text>
          </View>
        </View>

        {/* ═══ TAGLINE BAR ═══ */}
        <View
          style={{
            backgroundColor: C.forest,
            paddingVertical: 10,
            paddingHorizontal: 16,
            marginBottom: 14,
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              fontFamily: 'Playfair Display',
              fontSize: 13,
              fontWeight: 700,
              color: C.cream,
              textAlign: 'center',
              letterSpacing: 0.5,
            }}
          >
            Change the CULTR, Rebrand Yourself.
          </Text>
          <Text
            style={{
              fontSize: 7.5,
              fontWeight: 400,
              color: C.sage,
              textAlign: 'center',
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            HIPAA-compliant telehealth platform for physician-supervised GLP-1
            therapies, wellness peptides, and longevity optimization —
            delivering personalized protocols directly to your door across 48
            states.
          </Text>
        </View>

        {/* ═══ KEY METRICS ═══ */}
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
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
                paddingVertical: 7,
                paddingHorizontal: 6,
                alignItems: 'center',
                borderWidth: 0.5,
                borderColor: C.divider,
                marginLeft: i > 0 ? 5 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.forest,
                  marginBottom: 1,
                }}
              >
                {m.value}
              </Text>
              <Text
                style={{
                  fontSize: 5.5,
                  fontWeight: 500,
                  color: C.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  textAlign: 'center',
                }}
              >
                {m.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ═══ TWO-COLUMN BODY ═══ */}
        <View style={{ flexDirection: 'row' }}>
          {/* ─── LEFT COLUMN (58%) ─── */}
          <View style={{ width: '57%', marginRight: 14 }}>
            {/* Core Therapies */}
            <SectionTitle>Core Therapy Offerings</SectionTitle>

            {/* Weight Loss */}
            <Text style={sectionLabel}>
              Cut — Weight Loss (GLP-1 &amp; Dual-Agonist)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <TherapyPill name="R3TA — GLP1/GIP/GCG" price="$340" featured />
              <TherapyPill name="Semaglutide — GLP1" price="$225" />
              <TherapyPill name="Tirzepatide — GLP1/GIP" price="$290" />
            </View>

            {/* Enhancement */}
            <Text style={{ ...sectionLabel, marginTop: 6 }}>
              Enhancement — Peptides &amp; Regenerative
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
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {[
                { name: 'Club', price: 'Free', best: 'Education & discovery', featured: false },
                { name: 'Core', price: '$199', interval: '/mo', best: 'Single therapy focus', featured: false },
                { name: 'Catalyst+', price: '$499', interval: '/mo', best: 'Multi-therapy stacking', featured: true },
                { name: 'Curated', price: '$1,099', interval: '/mo', best: 'White-glove care', featured: false },
              ].map((tier, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: tier.featured ? C.forest : C.white,
                    borderWidth: 0.5,
                    borderColor: tier.featured ? C.forest : C.divider,
                    borderRadius: 4,
                    paddingVertical: 6,
                    paddingHorizontal: 7,
                    marginLeft: i > 0 ? 5 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 7,
                      fontWeight: 700,
                      color: tier.featured ? C.cream : C.forest,
                      marginBottom: 1,
                    }}
                  >
                    {tier.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: tier.featured ? C.white : C.forest,
                      marginBottom: 1,
                    }}
                  >
                    {tier.price}
                    {tier.interval && (
                      <Text
                        style={{
                          fontSize: 6,
                          color: tier.featured ? C.sage : C.textMuted,
                        }}
                      >
                        {tier.interval}
                      </Text>
                    )}
                  </Text>
                  <Text
                    style={{
                      fontSize: 5.5,
                      color: tier.featured ? C.sage : C.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {tier.best}
                  </Text>
                </View>
              ))}
            </View>

            {/* How It Works */}
            <Divider />
            <SectionTitle>How It Works</SectionTitle>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {[
                { num: '01', label: 'Choose Plan', desc: 'Select a membership tier' },
                { num: '02', label: 'Intake', desc: 'Complete health questionnaire' },
                { num: '03', label: 'Provider', desc: 'Meet your physician' },
                { num: '04', label: 'Protocol', desc: 'Receive personalized treatment' },
                { num: '05', label: 'Delivered', desc: 'Therapies shipped to door' },
              ].map((step, i) => (
                <React.Fragment key={i}>
                  <View
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 5,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.forest,
                        marginBottom: 2,
                      }}
                    >
                      {step.num}
                    </Text>
                    <Text
                      style={{
                        fontSize: 6,
                        fontWeight: 600,
                        color: C.forest,
                        textAlign: 'center',
                      }}
                    >
                      {step.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 5.5,
                        color: C.textMuted,
                        textAlign: 'center',
                        marginTop: 1,
                        lineHeight: 1.3,
                      }}
                    >
                      {step.desc}
                    </Text>
                  </View>
                  {i < 4 && (
                    <Text
                      style={{
                        fontSize: 10,
                        color: C.divider,
                        paddingTop: 4,
                      }}
                    >
                      {'\u2192'}
                    </Text>
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Medical Team */}
            <Divider />
            <SectionTitle>Medical Team</SectionTitle>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {[
                {
                  name: 'Dr. Ali Saberi, MD',
                  creds: 'Medical Director — Board-certified Internal Medicine',
                  years: '20+ years experience',
                },
                {
                  name: 'Belinda Ruiz, FNP',
                  creds: 'Family Nurse Practitioner — Functional Medicine',
                  years: '8+ years experience',
                },
              ].map((p, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: C.white,
                    borderRadius: 4,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    borderWidth: 0.5,
                    borderColor: C.divider,
                    marginLeft: i > 0 ? 8 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 7,
                      fontWeight: 700,
                      color: C.forest,
                      marginBottom: 1,
                    }}
                  >
                    {p.name}
                  </Text>
                  <Text style={{ fontSize: 5.5, color: C.textMuted }}>
                    {p.creds}
                  </Text>
                  <Text
                    style={{
                      fontSize: 5.5,
                      fontWeight: 600,
                      color: C.accent,
                      marginTop: 2,
                    }}
                  >
                    {p.years}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ─── RIGHT COLUMN (42%) ─── */}
          <View style={{ width: '43%' }}>
            {/* Platform Features */}
            <SectionTitle>Platform Capabilities</SectionTitle>
            <View style={{ marginBottom: 8 }}>
              {[
                'HIPAA-compliant telehealth consultations with board-certified providers',
                'AI-powered protocol engine for personalized treatment plans',
                'Comprehensive lab panel (50+ biomarkers) with at-home test kits',
                'Full peptide & longevity protocol library with dosing calculators',
                'Multi-step medical intake with secure ID verification & e-consent',
                'Integrated pharmacy fulfillment via licensed partner (Asher Med)',
                'Member dashboard with order tracking & health progress',
                'Subscription billing via Stripe with BNPL options (Affirm, Klarna)',
                'HSA/FSA eligible across all paid membership tiers',
                'Calorie calculator & daily tracking tools',
                'Science blog with 12+ peer-reviewed content articles',
                'Interactive recommendation quiz for therapy matching',
              ].map((f, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 2.5,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 7,
                      color: C.sage,
                      fontWeight: 700,
                      marginRight: 4,
                      marginTop: -0.5,
                    }}
                  >
                    {'\u2713'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 6.5,
                      color: C.forest,
                      lineHeight: 1.3,
                      flex: 1,
                    }}
                  >
                    {f}
                  </Text>
                </View>
              ))}
            </View>

            {/* Creator Affiliate Program */}
            <Divider />
            <SectionTitle>Creator Affiliate Program</SectionTitle>
            <View
              style={{
                backgroundColor: C.white,
                borderRadius: 4,
                padding: 8,
                borderWidth: 0.5,
                borderColor: C.divider,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 7.5,
                  fontWeight: 700,
                  color: C.forest,
                  marginBottom: 3,
                }}
              >
                Built-in Growth Engine
              </Text>
              {[
                { label: 'Commission Rate', value: '10% direct on every sale' },
                { label: 'Override Commissions', value: '2-8% on network recruits' },
                { label: 'Tier System', value: 'Starter > Bronze > Silver > Gold > Platinum' },
                { label: 'Attribution', value: '30-day cookie window' },
                { label: 'Payouts', value: 'Net-30, $50 min (Stripe / PayPal / Bank)' },
                { label: 'Tools', value: 'Custom links, coupon codes, brand kit, campaigns' },
                { label: 'Compliance', value: 'Built-in FTC disclosure templates' },
              ].map((item, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    marginBottom: 1.5,
                  }}
                >
                  <Text style={{ fontSize: 6, color: C.textMuted, width: 90 }}>
                    {item.label}
                  </Text>
                  <Text
                    style={{ fontSize: 6, fontWeight: 600, color: C.forest }}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Trust & Compliance */}
            <Divider />
            <SectionTitle>Trust &amp; Compliance</SectionTitle>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginBottom: 8,
              }}
            >
              {[
                'HIPAA Compliant',
                'Licensed Providers',
                'Licensed Pharmacy',
                'HSA/FSA Eligible',
              ].map((b, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: 8,
                    marginBottom: 3,
                  }}
                >
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: C.sage,
                      marginRight: 3,
                    }}
                  />
                  <Text
                    style={{ fontSize: 6, fontWeight: 500, color: C.forest }}
                  >
                    {b}
                  </Text>
                </View>
              ))}
            </View>

            {/* Brand Design System */}
            <Divider />
            <SectionTitle>Brand Design System</SectionTitle>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {[
                { color: C.forest, hex: '#2A4542', label: 'Primary', border: false },
                { color: C.cream, hex: '#FDFBF7', label: 'Background', border: true },
                { color: C.white, hex: '#FFFFFF', label: 'White', border: true },
                { color: C.accent, hex: '#506C64', label: 'Accent', border: false },
                { color: C.sage, hex: '#B7E4C7', label: 'Sage', border: false },
              ].map((sw, i) => (
                <View
                  key={i}
                  style={{ flex: 1, alignItems: 'center', marginLeft: i > 0 ? 4 : 0 }}
                >
                  <View
                    style={{
                      width: '100%',
                      height: 16,
                      borderRadius: 3,
                      marginBottom: 2,
                      backgroundColor: sw.color,
                      ...(sw.border
                        ? { borderWidth: 0.5, borderColor: C.divider }
                        : {}),
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 5.5,
                      fontWeight: 600,
                      color: C.forest,
                    }}
                  >
                    {sw.hex}
                  </Text>
                  <Text style={{ fontSize: 5, color: C.textMuted }}>
                    {sw.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Typography */}
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text
                  style={{
                    fontSize: 5.5,
                    color: C.textMuted,
                    marginBottom: 2,
                  }}
                >
                  Display / Headers
                </Text>
                <Text
                  style={{
                    fontFamily: 'Playfair Display',
                    fontSize: 9,
                    fontWeight: 700,
                    color: C.forest,
                  }}
                >
                  Playfair Display
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 5.5,
                    color: C.textMuted,
                    marginBottom: 2,
                  }}
                >
                  Body / UI
                </Text>
                <Text
                  style={{
                    fontFamily: 'Helvetica',
                    fontSize: 9,
                    fontWeight: 700,
                    color: C.forest,
                  }}
                >
                  Inter (Sans-Serif)
                </Text>
              </View>
            </View>

            {/* Tech Stack */}
            <Divider />
            <SectionTitle>Technology Stack</SectionTitle>
            <View style={{ marginBottom: 8 }}>
              {[
                'Next.js 14 (App Router) + TypeScript + Tailwind CSS',
                'Neon PostgreSQL via Vercel Postgres SDK',
                'Stripe subscriptions + Affirm/Klarna BNPL',
                'AI SDK v6 (OpenAI) for protocol generation',
                'Vercel hosting with staging/production environments',
                'Resend transactional email + Cloudflare bot protection',
              ].map((f, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 2.5,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 7,
                      color: C.sage,
                      fontWeight: 700,
                      marginRight: 4,
                      marginTop: -0.5,
                    }}
                  >
                    {'\u2022'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 6.5,
                      color: C.forest,
                      lineHeight: 1.3,
                      flex: 1,
                    }}
                  >
                    {f}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ═══ FOOTER ═══ */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: C.forest,
            paddingTop: 8,
            marginTop: 'auto',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: 'Playfair Display',
                fontSize: 10,
                fontWeight: 700,
                color: C.forest,
                letterSpacing: 2,
              }}
            >
              CULTR
            </Text>
            <Text style={{ fontSize: 6, color: C.textMuted, marginTop: 1 }}>
              Change the CULTR, rebrand yourself.
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text
              style={{
                fontSize: 6.5,
                color: C.forest,
                fontWeight: 500,
                marginBottom: 1,
              }}
            >
              cultrhealth.com
            </Text>
            <Text
              style={{
                fontSize: 6.5,
                color: C.forest,
                fontWeight: 500,
                marginBottom: 1,
              }}
            >
              support@cultrhealth.com
            </Text>
            <Text
              style={{ fontSize: 5.5, color: C.textMuted, marginTop: 1 }}
            >
              @cultrhealth — Instagram / TikTok / YouTube / X
            </Text>
          </View>
        </View>
        <Text
          style={{
            fontSize: 5,
            color: C.textMuted,
            textAlign: 'center',
            marginTop: 6,
          }}
        >
          Confidential — For investor review only. CULTR Health{' '}
          {new Date().getFullYear()}. All rights reserved.
        </Text>
      </Page>
    </Document>
  )
}

// ── Helper Components ──────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 9,
        fontWeight: 700,
        color: C.forest,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 6,
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
        borderBottomWidth: 0.75,
        borderBottomColor: C.divider,
        marginBottom: 8,
        marginTop: 12,
      }}
    />
  )
}

const sectionLabel = {
  fontSize: 7,
  fontWeight: 600 as const,
  color: C.accent,
  letterSpacing: 1,
  textTransform: 'uppercase' as const,
  marginBottom: 4,
}

function TherapyPill({
  name,
  price,
  featured,
}: {
  name: string
  price: string
  featured?: boolean
}) {
  return (
    <View
      style={{
        backgroundColor: featured ? C.forest : C.white,
        borderWidth: 0.5,
        borderColor: featured ? C.forest : C.divider,
        borderRadius: 3,
        paddingVertical: 3.5,
        paddingHorizontal: 7,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 4,
        marginBottom: 4,
      }}
    >
      <Text
        style={{
          fontSize: 6.5,
          fontWeight: 600,
          color: featured ? C.cream : C.forest,
          marginRight: 4,
        }}
      >
        {name}
      </Text>
      <Text
        style={{
          fontSize: 6,
          fontWeight: 700,
          color: featured ? C.sage : C.accent,
        }}
      >
        {price}
      </Text>
    </View>
  )
}

// ── Generate PDF ───────────────────────────────────────────────────────
async function main() {
  const outputPath = `${process.cwd()}/media-kit.pdf`
  console.log('Generating CULTR Health Investor Media Kit...')
  await renderToFile(<MediaKitDocument />, outputPath)
  console.log(`Done! Saved to: ${outputPath}`)
}

main().catch((err) => {
  console.error('Failed to generate PDF:', err)
  process.exit(1)
})
