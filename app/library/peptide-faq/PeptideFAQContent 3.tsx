'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PlanTier } from '@/lib/config/plans'
import {
  ArrowLeft,
  ChevronDown,
  Syringe,
  Droplets,
  FlaskConical,
  Pill,
  Target,
  Layers,
  ShieldAlert,
  Search,
  Award,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Clock,
  Info,
  Quote,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface FAQItem {
  question: string
  answer: React.ReactNode
}

interface FAQSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  items: FAQItem[]
}

// ─── Reusable sub-components ────────────────────────────────────────────────

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4 rounded-lg border border-cultr-sage">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-cultr-mint/60">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold text-cultr-forest whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-cultr-offwhite/50'}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-cultr-text whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CommunityQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-3 pl-4 border-l-2 border-cultr-sage text-sm text-cultr-textMuted italic">
      <Quote className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 opacity-40" />
      {children}
    </blockquote>
  )
}

function Callout({ type = 'info', title, children }: { type?: 'info' | 'warning' | 'tip'; title?: string; children: React.ReactNode }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    tip: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  }
  const icons = {
    info: <Info className="w-4 h-4 mt-0.5 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />,
    tip: <BookOpen className="w-4 h-4 mt-0.5 shrink-0" />,
  }
  return (
    <div className={`my-4 p-3.5 rounded-lg border text-sm ${styles[type]}`}>
      <div className="flex items-start gap-2.5">
        {icons[type]}
        <div>
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  )
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h4 className="font-display font-semibold text-cultr-forest mt-4 mb-2">{children}</h4>
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="my-2 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-cultr-text leading-relaxed">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cultr-forest/40 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  )
}

// ─── FAQ Accordion Item ─────────────────────────────────────────────────────

function FAQAccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-cultr-sage/40 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-4 px-1 text-left group"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-cultr-text group-hover:text-cultr-forest transition-colors text-[15px] leading-snug">
          {item.question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-cultr-textMuted shrink-0 mt-0.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[5000px] opacity-100 pb-5 px-1' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="text-sm text-cultr-text leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  )
}

// ─── FAQ Data ───────────────────────────────────────────────────────────────

const FAQ_SECTIONS: FAQSection[] = [
  // ── Section 1: Getting Started ──────────────────────────────────────────
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Peptide basics, common compounds, and how to begin',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    items: [
      {
        question: 'What are peptides?',
        answer: (
          <>
            <p>Peptides are short chains of amino acids (typically 2-50) that act as signaling molecules in the body. Unlike proteins, which are longer chains, peptides are small enough to be absorbed and can trigger specific cellular responses.</p>
            <Heading>Peptides play roles in:</Heading>
            <BulletList items={[
              'Tissue repair and regeneration',
              'Immune function',
              'Inflammation regulation',
              'Cellular communication',
            ]} />
          </>
        ),
      },
      {
        question: 'What is BPC-157?',
        answer: (
          <>
            <p><strong>BPC-157 (Body Protection Compound-157)</strong> is a synthetic peptide consisting of 15 amino acids derived from a protein found naturally in human gastric juice. It is the most discussed peptide in the research community due to its reported healing properties.</p>
            <Heading>Key Characteristics</Heading>
            <BulletList items={[
              'Promotes angiogenesis (new blood vessel formation)',
              'Supports tissue repair in muscles, tendons, ligaments, and gut lining',
              'Has anti-inflammatory properties',
              'Shows neuroprotective effects in studies',
              'Half-life: approximately 4-6 hours (subcutaneous)',
            ]} />
            <Heading>Common Uses Reported</Heading>
            <BulletList items={[
              'Soft tissue injuries (tendons, ligaments, muscles)',
              'Gut health issues (leaky gut, ulcers, IBS)',
              'Post-surgical recovery',
              'General inflammation reduction',
            ]} />
          </>
        ),
      },
      {
        question: 'What is TB-500?',
        answer: (
          <>
            <p><strong>TB-500 (Thymosin Beta-4 fragment)</strong> is a synthetic version of a naturally occurring peptide that promotes healing and reduces inflammation. It has a longer half-life than BPC-157 and works systemically throughout the body.</p>
            <Table
              headers={['Feature', 'BPC-157', 'TB-500']}
              rows={[
                ['Half-life', '4-6 hours', '3-4 days'],
                ['Dosing frequency', '1-2x daily', '2-3x weekly'],
                ['Origin', 'Gastric protein', 'Thymus gland'],
                ['Injection site', 'Often near injury', 'Anywhere (systemic)'],
                ['Best for', 'Localized healing', 'Systemic repair'],
              ]}
            />
          </>
        ),
      },
      {
        question: 'What is the "Wolverine Stack"?',
        answer: (
          <>
            <p>The <strong>Wolverine Stack</strong> is a popular combination of BPC-157 and TB-500, named for the comic book character&apos;s regenerative abilities.</p>
            <Heading>Common Uses</Heading>
            <BulletList items={[
              'Accelerated injury recovery',
              'Post-surgical healing',
              'General tissue repair',
              'Chronic pain management',
            ]} />
            <Callout type="tip" title="Community Consensus">
              Many experienced users prefer purchasing BPC-157 and TB-500 separately rather than pre-blended. This allows better control of individual dosing and proper schedules (daily for BPC-157, 2-3x weekly for TB-500).
            </Callout>
          </>
        ),
      },
      {
        question: 'What are GLOW and KLOW stacks?',
        answer: (
          <>
            <Heading>GLOW Stack</Heading>
            <BulletList items={['BPC-157', 'TB-500', 'GHK-Cu (copper peptide)']} />
            <Heading>KLOW Stack</Heading>
            <BulletList items={['BPC-157', 'TB-500', 'GHK-Cu', 'KPV (anti-inflammatory peptide)']} />
            <Callout type="info">
              KLOW adds KPV for enhanced anti-inflammatory effects. The GHK-Cu component may cause stinging at the injection site. Some debate exists about whether copper affects the efficacy of other peptides in the blend.
            </Callout>
          </>
        ),
      },
      {
        question: 'Should I use blends or individual peptides?',
        answer: (
          <>
            <Heading>Arguments for Individual Peptides</Heading>
            <BulletList items={[
              'Better control over dosing (TB-500 needs less frequent dosing than BPC-157)',
              'Ability to adjust each peptide independently',
              'Easier to identify which peptide is working or causing issues',
              'Can optimize timing for each peptide\'s half-life',
            ]} />
            <Heading>Arguments for Blends</Heading>
            <BulletList items={[
              'Convenience (fewer injections)',
              'Cost-effective for some products',
              'Simpler protocol to follow',
              'Good for beginners who want simplicity',
            ]} />
            <Callout type="tip">
              Most experienced users prefer individual peptides for serious injury recovery, while blends work well for general maintenance and convenience.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── Section 2: Administration ───────────────────────────────────────────
  {
    id: 'administration',
    title: 'Administration & Injection',
    description: 'Injection sites, needle selection, and technique',
    icon: <Syringe className="w-5 h-5" />,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    items: [
      {
        question: 'Where should I inject? (Site-specific vs. belly fat)',
        answer: (
          <>
            <Heading>Option 1: Subcutaneous in Belly Fat</Heading>
            <BulletList items={[
              'Inject into pinched fat around the abdomen (2+ inches from belly button)',
              'Peptide enters bloodstream and works systemically',
              'Easier and less intimidating for beginners',
              'Lower risk of hitting nerves or blood vessels',
            ]} />
            <Heading>Option 2: Near the Injury Site</Heading>
            <BulletList items={[
              'Inject as close to the injured area as safely possible',
              'Theory: Higher local concentration speeds healing',
              'More challenging for areas with little fat',
            ]} />
            <Callout type="tip" title="Practical Guidance">
              <strong>BPC-157:</strong> Many prefer site-specific injection due to its shorter half-life.<br />
              <strong>TB-500:</strong> Works systemically, so location matters less.<br />
              <strong>If in doubt:</strong> Belly fat is safe and effective for most people.
            </Callout>
          </>
        ),
      },
      {
        question: 'SubQ vs Intramuscular — which is better?',
        answer: (
          <>
            <Heading>Subcutaneous (SubQ)</Heading>
            <BulletList items={[
              'Most common method for peptides',
              'Lower risk of complications',
              '4-6 hour half-life for BPC-157',
              'Use 27-31 gauge insulin needles',
              'Pinch skin, insert at 45° angle',
            ]} />
            <Heading>Intramuscular (IM)</Heading>
            <BulletList items={[
              '6-8 hour half-life for BPC-157',
              'May be useful for deep muscle injuries',
              'Higher risk of infection, nerve damage, sterile inflammation',
              'Not generally recommended by the community',
            ]} />
            <Callout type="info">
              SubQ is preferred for most peptide applications. IM carries more risk without proven additional benefit.
            </Callout>
          </>
        ),
      },
      {
        question: 'What needle size should I use?',
        answer: (
          <>
            <BulletList items={[
              'Gauge: 27-31 (higher number = thinner needle)',
              'Length: 5/16 inch (8mm) or 1/2 inch (12.7mm)',
              'Type: Insulin syringes (U-100)',
            ]} />
            <Callout type="tip">
              Most popular choice: <strong>30 or 31 gauge, 5/16 inch insulin syringes</strong>. Virtually painless, easy to find at pharmacies, and perfect for subcutaneous injection.
            </Callout>
          </>
        ),
      },
      {
        question: 'Can I inject multiple peptides in the same syringe?',
        answer: (
          <>
            <p><strong>Generally yes</strong>, with considerations:</p>
            <Heading>Safe to Combine</Heading>
            <BulletList items={[
              'BPC-157 and TB-500',
              'Most peptides reconstituted with BAC water',
            ]} />
            <Heading>Technique</Heading>
            <BulletList items={[
              'Draw first peptide into syringe',
              'Draw second peptide into same syringe',
              'Do NOT pre-mix in the same vial (only combine at time of injection)',
              'If starting out, keep separate to identify any reactions',
            ]} />
            <Callout type="warning">
              Some debate about copper peptides (GHK-Cu) affecting other peptides due to pH differences. Consider injecting GHK-Cu separately.
            </Callout>
          </>
        ),
      },
      {
        question: 'Best injection sites by body area',
        answer: (
          <Table
            headers={['Body Area', 'Best Injection Location']}
            rows={[
              ['Shoulder', 'Upper arm fat, near deltoid'],
              ['Elbow', 'Upper forearm or inner arm'],
              ['Knee', 'Side of knee where you can pinch skin, or inner thigh'],
              ['Back / Spine', 'Love handles, lower back fat'],
              ['Foot / Ankle', 'Lower calf (closest fat to foot)'],
              ['Gut issues', 'Belly fat (standard location)'],
              ['General healing', 'Belly fat, thigh, love handles'],
            ]}
          />
        ),
      },
      {
        question: 'Does it hurt? Why does GHK-Cu sting?',
        answer: (
          <>
            <p>Most peptides cause minimal to no pain with proper technique and thin needles. <strong>GHK-Cu (copper peptide)</strong> is known for stinging due to its copper content and pH differences.</p>
            <Heading>How to Reduce GHK-Cu Stinging</Heading>
            <BulletList items={[
              'Dilute more: Use 5ml+ BAC water per vial',
              'Further dilute at injection: Draw extra BAC water into the syringe',
              'Inject slowly (30+ seconds)',
              'Choose less sensitive sites: Love handles or upper buttocks',
              'Massage gently after injection to disperse',
              'Numb the area with ice beforehand',
            ]} />
          </>
        ),
      },
    ],
  },

  // ── Section 3: Dosing & Protocols ───────────────────────────────────────
  {
    id: 'dosing',
    title: 'Dosing & Protocols',
    description: 'Standard doses, cycling, loading phases, and protocol length',
    icon: <Target className="w-5 h-5" />,
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    items: [
      {
        question: 'What is the correct dose for BPC-157?',
        answer: (
          <>
            <p><strong>Standard dosing range:</strong> 250mcg - 1000mcg per day</p>
            <Table
              headers={['Protocol', 'Dose', 'Total Daily']}
              rows={[
                ['Conservative', '250mcg once daily', '250mcg'],
                ['Standard', '250mcg twice daily', '500mcg'],
                ['Moderate', '500mcg twice daily', '1000mcg'],
                ['Aggressive (acute)', '500mcg-1mg twice daily', '1-2mg'],
              ]}
            />
            <Callout type="tip">
              <strong>For beginners:</strong> Start with 250mcg once daily for the first week, then increase to twice daily based on tolerance.
            </Callout>
          </>
        ),
      },
      {
        question: 'What is the correct dose for TB-500?',
        answer: (
          <>
            <Heading>Loading Phase (Weeks 1-4)</Heading>
            <p>2.5mg - 5mg, twice weekly (e.g., Monday and Thursday)</p>
            <Heading>Maintenance Phase (Week 5+)</Heading>
            <p>2.5mg - 5mg, once weekly</p>
            <Callout type="warning" title="Important">
              TB-500 has a longer half-life (3-4 days), so daily dosing is unnecessary and may cause lethargy. Pre-blended stacks that dose TB-500 daily are considered wasteful by many experienced users.
            </Callout>
          </>
        ),
      },
      {
        question: 'How long should a cycle last?',
        answer: (
          <>
            <Table
              headers={['Injury Severity', 'Cycle Length', 'Notes']}
              rows={[
                ['Minor strain/pain', '2-4 weeks', 'May see results quickly'],
                ['Moderate injury', '4-8 weeks', 'Standard protocol'],
                ['Severe tear/surgery', '8-12 weeks', 'Extended healing needed'],
                ['Chronic condition', 'Ongoing', 'May require maintenance'],
              ]}
            />
            <Heading>When to Stop</Heading>
            <BulletList items={[
              'When pain/symptoms resolve',
              'When functional improvement plateaus',
              'Take a break equal to cycle length (e.g., 8 weeks on, 8 weeks off)',
            ]} />
          </>
        ),
      },
      {
        question: 'Should I take peptides daily or cycle them?',
        answer: (
          <>
            <Heading>BPC-157</Heading>
            <BulletList items={[
              'Can be taken daily due to short half-life',
              'Most protocols use continuous daily dosing during treatment',
            ]} />
            <Heading>TB-500</Heading>
            <BulletList items={[
              'Should NOT be taken daily',
              '2-3 times per week is optimal',
              'Builds up over time in the system',
            ]} />
            <Heading>Cycling Recommendations</Heading>
            <BulletList items={[
              'Standard cycle: 4-8 weeks on, 4 weeks off',
              'Extended cycle: Up to 12 weeks for severe injuries',
              'Maintenance: Some users stay on low doses indefinitely',
            ]} />
          </>
        ),
      },
      {
        question: 'What is the difference between loading and maintenance doses?',
        answer: (
          <>
            <Heading>Loading Phase</Heading>
            <BulletList items={[
              'Higher doses at the beginning to establish therapeutic levels quickly',
              'Typically 1-4 weeks',
              'Example: TB-500 at 5mg twice weekly',
            ]} />
            <Heading>Maintenance Phase</Heading>
            <BulletList items={[
              'Lower doses to sustain benefits',
              'Can continue longer term',
              'Example: TB-500 at 2.5-5mg once weekly',
            ]} />
            <Callout type="info">
              BPC-157 typically does not require loading due to its mechanism of action, though some start higher and taper down.
            </Callout>
          </>
        ),
      },
      {
        question: 'Can I microdose peptides?',
        answer: (
          <>
            <p>Yes. Some users report success with 100-250mcg of BPC-157 daily — lower than standard but potentially effective for maintenance, general wellness, and extending vial life.</p>
            <CommunityQuote>
              &ldquo;I do 0.25mg EOD for general body healing and inflammation and it works very well. So many people are using super physiological doses that are unnecessary.&rdquo;
            </CommunityQuote>
          </>
        ),
      },
    ],
  },

  // ── Section 4: Reconstitution & Storage ─────────────────────────────────
  {
    id: 'reconstitution',
    title: 'Reconstitution & Storage',
    description: 'BAC water, mixing, dose calculation, and shelf life',
    icon: <Droplets className="w-5 h-5" />,
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    items: [
      {
        question: 'What is bacteriostatic (BAC) water?',
        answer: (
          <>
            <p><strong>Bacteriostatic water</strong> is sterile water containing 0.9% benzyl alcohol, which prevents bacterial growth. It is the standard diluent for reconstituting peptides.</p>
            <BulletList items={[
              'Inhibits bacteria for extended shelf life',
              'Allows multiple draws from the same vial',
              'Safe for injection',
            ]} />
            <Callout type="tip">
              Recommended brands: <strong>Hospira (Pfizer)</strong> and <strong>Lambda</strong> — these are pharmaceutical grade.
            </Callout>
          </>
        ),
      },
      {
        question: 'How much BAC water should I add?',
        answer: (
          <>
            <p>The amount of BAC water determines your concentration:</p>
            <Heading>For a 5mg Vial of BPC-157</Heading>
            <Table
              headers={['BAC Water', 'Concentration', '500mcg Dose =']}
              rows={[
                ['1ml', '5mg/ml', '10 units (0.1ml)'],
                ['2ml', '2.5mg/ml', '20 units (0.2ml)'],
                ['2.5ml', '2mg/ml', '25 units (0.25ml)'],
              ]}
            />
            <Heading>For a 10mg Vial of BPC-157</Heading>
            <Table
              headers={['BAC Water', 'Concentration', '500mcg Dose =']}
              rows={[
                ['1ml', '10mg/ml', '5 units (0.05ml)'],
                ['2ml', '5mg/ml', '10 units (0.1ml)'],
              ]}
            />
            <Callout type="info">
              For GHK-Cu, use MORE water (3-5ml) to reduce stinging. Online peptide calculators can help with exact dosing.
            </Callout>
          </>
        ),
      },
      {
        question: 'How do I properly reconstitute peptides?',
        answer: (
          <>
            <Heading>Step by Step</Heading>
            <ol className="my-2 space-y-2.5 text-sm text-cultr-text">
              {[
                { title: 'Gather supplies', desc: 'Peptide vial, BAC water, alcohol swabs, insulin syringe' },
                { title: 'Prepare', desc: 'Let vials reach room temperature. Wipe tops with alcohol swabs and let dry completely.' },
                { title: 'Draw BAC water', desc: 'Draw desired amount (commonly 1-2ml) into syringe.' },
                { title: 'Add to peptide vial', desc: 'Insert needle and trickle water down the side of the vial. Do NOT spray directly onto powder.' },
                { title: 'Mix gently', desc: 'Do NOT shake — gently roll or swirl. Let sit if needed. Solution should be clear (discard if cloudy).' },
                { title: 'Store', desc: 'Refrigerate immediately. Keep away from light. Use within 4-6 weeks.' },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full grad-dark text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <strong>{step.title}:</strong> {step.desc}
                  </div>
                </li>
              ))}
            </ol>
          </>
        ),
      },
      {
        question: 'How long does reconstituted peptide last?',
        answer: (
          <>
            <Table
              headers={['Storage', 'Duration', 'Notes']}
              rows={[
                ['Refrigerated (2-8°C)', '4-6 weeks', 'Standard recommendation'],
                ['Room temperature', 'Hours only', 'Not recommended'],
                ['Frozen', 'Do NOT freeze', 'Can damage peptide structure'],
              ]}
            />
            <Heading>Signs of Degradation</Heading>
            <BulletList items={[
              'Cloudiness or floating particles',
              'Discoloration',
              'Unusual smell',
            ]} />
            <Callout type="warning">If in doubt, discard it.</Callout>
          </>
        ),
      },
      {
        question: 'Should I refrigerate or freeze peptides?',
        answer: (
          <>
            <Heading>Unreconstituted (Powder Form)</Heading>
            <BulletList items={[
              'Room temperature: Safe for shipping / short term',
              'Refrigerated: Extends shelf life',
              'Freezer: Best for long-term storage (years) — powder only',
            ]} />
            <Heading>Reconstituted (Mixed with BAC Water)</Heading>
            <BulletList items={[
              'Refrigerate immediately — mandatory',
              'Do NOT freeze reconstituted peptides',
              'Keep away from light',
              'Use within 4-6 weeks',
            ]} />
            <CommunityQuote>
              &ldquo;Lyophilized powders don&apos;t need to &apos;thaw&apos; because there is no moisture. If your vial needs to thaw, the seal has failed — discard it.&rdquo;
            </CommunityQuote>
          </>
        ),
      },
      {
        question: 'How do I calculate my dose after reconstitution?',
        answer: (
          <>
            <div className="my-3 p-4 grad-light rounded-lg font-mono text-sm text-cultr-forest">
              Dose (units) = (Desired mcg &divide; Total mg in vial) &times; Total ml BAC water &times; 100
            </div>
            <Heading>Example</Heading>
            <p className="text-sm">10mg vial + 2ml BAC water, want 500mcg dose:<br />
              (0.5mg &divide; 10mg) &times; 2ml &times; 100 = <strong>10 units</strong></p>
            <Callout type="tip">
              Use an online peptide calculator. Input your vial size (mg), BAC water added (ml), and desired dose (mcg) to get the number of units to draw.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── Section 5: Oral vs Injectable ───────────────────────────────────────
  {
    id: 'oral-vs-injectable',
    title: 'Oral vs Injectable',
    description: 'Bioavailability, when oral works, and the Arginate form',
    icon: <Pill className="w-5 h-5" />,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    items: [
      {
        question: 'Do oral peptides work?',
        answer: (
          <>
            <Heading>Arguments Against Oral Peptides</Heading>
            <BulletList items={[
              'Stomach acid breaks down peptide chains',
              'Estimated 70-80% loss of potency',
              'Must take 4x the injectable dose for similar effect',
              'More expensive per effective dose',
            ]} />
            <Heading>Arguments For Oral Peptides (BPC-157 specifically)</Heading>
            <BulletList items={[
              'BPC-157 is derived from gastric juice protein',
              'May work directly in the gut before breakdown',
              'Effective for GI-specific issues',
              'Easier for needle-phobic individuals',
            ]} />
          </>
        ),
      },
      {
        question: 'Is oral BPC-157 effective for gut issues?',
        answer: (
          <>
            <p><strong>Yes — this is the one exception where oral may be preferred.</strong> BPC-157 originates from gastric protein and acts locally on GI lining before systemic absorption.</p>
            <Heading>Reported Success For</Heading>
            <BulletList items={['Leaky gut', 'Ulcers', 'IBS/IBD', 'Acid reflux', 'Antibiotic-induced gut damage', 'Crohn\'s disease', 'Colitis']} />
            <p className="text-sm mt-2"><strong>Dosing for gut health:</strong> 500mcg - 1000mcg daily, orally</p>
            <CommunityQuote>
              &ldquo;I took BPC-157 500mcg/day orally for 3 weeks. My gut was totally screwed up from prior antibiotics and three weeks of BPC took all the discomfort and symptoms away.&rdquo;
            </CommunityQuote>
          </>
        ),
      },
      {
        question: 'What is the bioavailability difference?',
        answer: (
          <Table
            headers={['Route', 'Est. Bioavailability', 'Notes']}
            rows={[
              ['Injectable (SubQ)', '~100%', 'Gold standard'],
              ['Injectable (IM)', '~100%', 'Similar to SubQ'],
              ['Oral', '~10-25%', 'Significant degradation'],
              ['Nasal', 'Variable', 'Limited data'],
              ['Topical', 'Low', 'Best with DMSO carrier'],
            ]}
          />
        ),
      },
      {
        question: 'What is BPC-157 Arginate form?',
        answer: (
          <>
            <p><strong>BPC-157 Arginate (BPC-157-Arg)</strong> is a stable salt form that includes the amino acid arginine. It is more stable at room temperature, better survives stomach acid, and has improved oral bioavailability.</p>
            <Heading>When to Choose Arginate</Heading>
            <BulletList items={['Oral/capsule administration', 'When stability is a concern', 'For gut-specific healing']} />
            <Callout type="info">
              For injection, standard BPC-157 (acetate salt) is preferred and more common.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── Section 6: Conditions & Use Cases ───────────────────────────────────
  {
    id: 'conditions',
    title: 'Conditions & Use Cases',
    description: 'Protocols for specific injuries and health conditions',
    icon: <FlaskConical className="w-5 h-5" />,
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    items: [
      {
        question: 'Shoulder injuries (rotator cuff, tears)',
        answer: (
          <>
            <Table
              headers={['Peptide', 'Dose', 'Frequency', 'Duration']}
              rows={[
                ['BPC-157', '500mcg', 'Twice daily', '6-12 weeks'],
                ['TB-500', '2.5-5mg', 'Twice weekly', '6-12 weeks'],
              ]}
            />
            <p className="text-sm"><strong>Injection site:</strong> Upper arm fat near deltoid, or belly fat</p>
            <CommunityQuote>
              &ldquo;Had a torn rotator been nursing it for 3 months. Just one week on BPC and TB I had full mobility back. Within three weeks my shoulder was fully healed.&rdquo;
            </CommunityQuote>
            <Callout type="warning">
              Full tears (detached tendons) typically require surgery. Peptides excel at partial tears and inflammation. Continue PT exercises during your peptide protocol.
            </Callout>
          </>
        ),
      },
      {
        question: 'Knee injuries (meniscus, ACL)',
        answer: (
          <>
            <Table
              headers={['Peptide', 'Dose', 'Frequency', 'Duration']}
              rows={[
                ['BPC-157', '500mcg', 'Twice daily', '8-12 weeks'],
                ['TB-500', '2.5-5mg', 'Twice weekly', '8-12 weeks'],
                ['GHK-Cu (optional)', '1-2mg', 'Daily', 'For cartilage support'],
              ]}
            />
            <p className="text-sm"><strong>Injection site:</strong> Side of knee (pinch skin), inner thigh, or belly</p>
            <CommunityQuote>
              &ldquo;I have a torn ACL and medial meniscus. Could not do squats. Started BPC/TB on the inner knee sub-Q and I can now do squats and dance again.&rdquo;
            </CommunityQuote>
          </>
        ),
      },
      {
        question: 'Back pain and spinal issues',
        answer: (
          <>
            <p>Commonly discussed for disc bulges/herniations, sciatica, degenerative disc disease, and post-fusion pain.</p>
            <Table
              headers={['Peptide', 'Dose', 'Frequency']}
              rows={[
                ['BPC-157', '500mcg', 'Twice daily'],
                ['TB-500', '2.5-5mg', 'Twice weekly'],
                ['KPV', '500mcg', 'Daily (for inflammation)'],
              ]}
            />
            <p className="text-sm"><strong>Duration:</strong> 8-12+ weeks &middot; <strong>Injection site:</strong> Love handles, lower back fat, or belly</p>
            <Callout type="info" title="Realistic Expectations">
              Cannot reverse structural damage. May significantly reduce inflammation and pain. Often helps with associated muscle tension. Combine with PT and proper movement.
            </Callout>
          </>
        ),
      },
      {
        question: 'Gut health (leaky gut, IBS, ulcers)',
        answer: (
          <>
            <p>BPC-157 originated from gastric juice — this is a primary use case.</p>
            <Table
              headers={['Peptide', 'Dose', 'Route', 'Duration']}
              rows={[
                ['BPC-157', '500-1000mcg daily', 'Oral preferred', '4-8 weeks'],
                ['KPV (optional)', '500mcg daily', 'Injectable', 'For inflammation'],
              ]}
            />
            <Heading>Reported Benefits</Heading>
            <BulletList items={['Reduced bloating', 'Healed ulcers', 'Improved digestion', 'Reduced acid reflux', 'Recovery from antibiotic damage']} />
            <CommunityQuote>
              &ldquo;I was living on Tums! Stomach burning all the time — bloating. Only been on KLOW for 2 months and all those issues are gone.&rdquo;
            </CommunityQuote>
          </>
        ),
      },
      {
        question: 'Post-surgery recovery',
        answer: (
          <>
            <Heading>Pre-Surgery (if time allows)</Heading>
            <BulletList items={['Some start peptides 1-2 weeks before', 'May improve healing capacity', 'Discuss with surgeon']} />
            <Heading>Post-Surgery</Heading>
            <BulletList items={['Many start within days after surgery', 'Standard BPC-157/TB-500 dosing throughout recovery']} />
            <CommunityQuote>
              &ldquo;Grade 2 separation, doc said 3 months to full weight bearing. I started high dose blasting BPC-157/TB-500 — back to full weight bearing after about 5 weeks.&rdquo;
            </CommunityQuote>
          </>
        ),
      },
      {
        question: 'Inflammation and autoimmune conditions',
        answer: (
          <>
            <Heading>Generally Safe for Autoimmune</Heading>
            <BulletList items={['BPC-157 (may help as histamine modulator)', 'KPV (excellent for autoimmune inflammation)', 'Thymosin Alpha 1 (immune modulation)']} />
            <Callout type="warning" title="Caution with TB-500">
              TB-500 can increase immune activity and inflammation, which may worsen autoimmune flares. Start with BPC-157 alone, monitor closely, and add TB-500 cautiously if needed.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── Section 7: Stacking & Combinations ──────────────────────────────────
  {
    id: 'stacking',
    title: 'Stacking & Combinations',
    description: 'Synergistic peptide combinations and protocols',
    icon: <Layers className="w-5 h-5" />,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    items: [
      {
        question: 'Can I combine BPC-157 and TB-500?',
        answer: (
          <>
            <p><strong>Yes — this is the most popular combination.</strong> They have synergistic healing effects, different mechanisms of action, and different half-lives allowing comprehensive coverage.</p>
            <Heading>How to Combine</Heading>
            <BulletList items={[
              'BPC-157: 250-500mcg, 1-2x daily',
              'TB-500: 2.5-5mg, 2-3x weekly',
              'Can inject in same syringe at time of injection',
              'Do NOT pre-mix in same vial',
            ]} />
          </>
        ),
      },
      {
        question: 'What peptides work synergistically?',
        answer: (
          <Table
            headers={['Stack', 'Components', 'Best For']}
            rows={[
              ['Wolverine', 'BPC-157 + TB-500', 'General healing'],
              ['GLOW', 'BPC-157 + TB-500 + GHK-Cu', 'Healing + anti-aging'],
              ['KLOW', 'BPC-157 + TB-500 + GHK-Cu + KPV', 'Healing + inflammation'],
              ['Gut Stack', 'BPC-157 + KPV', 'GI issues'],
              ['Recovery', 'BPC-157 + TB-500 + NAD+', 'Energy + healing'],
              ['Anti-aging', 'GHK-Cu + Epitalon + NAD+', 'Longevity'],
            ]}
          />
        ),
      },
      {
        question: 'What about adding GHK-Cu?',
        answer: (
          <>
            <p><strong>GHK-Cu (Copper Peptide)</strong> adds collagen production, wound healing, anti-aging effects, skin improvement, and hair support.</p>
            <Heading>Protocol</Heading>
            <BulletList items={[
              'GHK-Cu: 1-2mg daily',
              'Inject separately from BPC-157/TB-500, or at different times',
              'Many prefer GHK-Cu in morning, other peptides at night',
            ]} />
            <Callout type="info">
              Some debate exists about pH interference with BPC-157 when mixed. For maximum efficacy, keep copper peptides separate.
            </Callout>
          </>
        ),
      },
      {
        question: 'What is KPV and when should I use it?',
        answer: (
          <>
            <p><strong>KPV</strong> is a powerful anti-inflammatory peptide derived from alpha-MSH.</p>
            <Heading>Best Uses</Heading>
            <BulletList items={[
              'Autoimmune conditions',
              'Gut inflammation (IBD, colitis)',
              'Skin conditions (eczema, psoriasis)',
              'General systemic inflammation',
              'When BPC-157 alone isn\'t sufficient',
            ]} />
            <p className="text-sm mt-2"><strong>Dosing:</strong> 200-500mcg daily. Some ramp up: 200mcg week 1, 300mcg week 2, 400mcg ongoing.</p>
          </>
        ),
      },
      {
        question: 'Does copper interfere with other peptides?',
        answer: (
          <>
            <Heading>Concerns</Heading>
            <BulletList items={[
              'GHK-Cu has different pH requirements',
              'May reduce efficacy of BPC-157 and TB-500 when mixed',
              'Pre-blended stacks may have reduced potency',
            ]} />
            <Heading>Counter-Arguments</Heading>
            <BulletList items={[
              'Many report excellent results with blended stacks',
              'If mixed only at time of injection (not stored together), effects are minimal',
            ]} />
            <Callout type="tip">
              For maximum efficacy, inject GHK-Cu separately, 30+ minutes apart from other peptides.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── Section 8: Safety & Side Effects ────────────────────────────────────
  {
    id: 'safety',
    title: 'Safety & Side Effects',
    description: 'Risks, cancer concerns, autoimmune considerations, and bloodwork',
    icon: <ShieldAlert className="w-5 h-5" />,
    color: 'bg-red-50 text-red-700 border-red-200',
    items: [
      {
        question: 'Is BPC-157 safe?',
        answer: (
          <>
            <p>Based on available research and community reports, BPC-157 is <strong>generally considered safe</strong> — no serious adverse events in published studies, wide dosing range without reported toxicity, and used by thousands with minimal issues.</p>
            <Heading>Common Side Effects (Mild)</Heading>
            <BulletList items={[
              'Injection site reactions',
              'Mild nausea (usually temporary)',
              'Fatigue (may be healing response)',
              'Headache (rare)',
            ]} />
            <Callout type="warning">
              Long-term human studies are lacking. Individual responses vary. Quality of product matters significantly. Not FDA approved for human use.
            </Callout>
          </>
        ),
      },
      {
        question: 'Can peptides cause cancer or feed tumors?',
        answer: (
          <>
            <p>This is the <strong>#1 safety concern</strong> in the community.</p>
            <Heading>What We Know</Heading>
            <BulletList items={[
              'BPC-157 does NOT cause cancer',
              'No evidence it creates new cancer',
              'Theoretical concern is about EXISTING cancers — BPC-157 promotes angiogenesis, which tumors also use to grow',
              'May accelerate growth of existing tumors (unproven but theoretically possible)',
            ]} />
            <Heading>Recommendations</Heading>
            <BulletList items={[
              'Get baseline bloodwork and health screening before starting',
              'Consider cancer screening (colonoscopy, skin checks, etc.)',
              'If family history of cancer, consult with physician',
              'Cycle off periodically rather than continuous use',
              'If diagnosed with cancer, avoid angiogenic peptides',
            ]} />
          </>
        ),
      },
      {
        question: 'What are common side effects?',
        answer: (
          <>
            <Table
              headers={['Side Effect', 'Frequency', 'Notes']}
              rows={[
                ['Injection site reaction', 'Common', 'Redness, welts — usually subsides'],
                ['Mild nausea', 'Occasional', 'Often temporary'],
                ['Fatigue / drowsiness', 'Occasional', 'May indicate healing response'],
                ['Headache', 'Rare', 'Usually mild'],
                ['Increased hunger', 'Occasional', ''],
                ['Vivid dreams', 'Occasional', ''],
                ['Temporary increased pain', 'Occasional', '"Healing response"'],
              ]}
            />
            <Heading>Peptide-Specific</Heading>
            <BulletList items={[
              'TB-500: Lethargy (dose-dependent) — reduce dose if experienced',
              'GHK-Cu: Stinging/burning at injection site, flushing (temporary)',
            ]} />
          </>
        ),
      },
      {
        question: 'Should I avoid peptides if I have autoimmune disease?',
        answer: (
          <>
            <Heading>Generally Safe</Heading>
            <BulletList items={['BPC-157 (may help as histamine modulator)', 'KPV (excellent for autoimmune inflammation)', 'Thymosin Alpha 1 (immune modulation)']} />
            <Heading>Use With Caution</Heading>
            <BulletList items={['TB-500 (may stimulate immune activity, could worsen flares)', 'GHK-Cu (limited data)']} />
            <Callout type="tip" title="Protocol for Autoimmune">
              Start with BPC-157 alone. Monitor for flare activity. Add KPV if inflammation persists. Introduce TB-500 cautiously. Work with a knowledgeable practitioner.
            </Callout>
          </>
        ),
      },
      {
        question: 'Can peptides cause mood changes or anhedonia?',
        answer: (
          <>
            <p>A small percentage of users report mood changes. Some claim BPC-157 affects dopamine pathways, with effects described as lasting weeks to months after stopping.</p>
            <Callout type="info">
              Most users report no mood effects. If mood changes occur, discontinue immediately. Pre-existing mental health conditions and product quality may be factors.
            </Callout>
          </>
        ),
      },
      {
        question: 'Should I get bloodwork before and after?',
        answer: (
          <>
            <p><strong>Recommended but not mandatory.</strong></p>
            <Heading>Before Starting</Heading>
            <BulletList items={[
              'Complete blood count (CBC)',
              'Comprehensive metabolic panel',
              'Inflammatory markers (CRP, ESR)',
              'Thyroid function (if relevant)',
              'Cancer screening appropriate for age',
              'Hormone panel (if relevant)',
            ]} />
            <Callout type="tip">
              Bloodwork establishes a baseline, identifies pre-existing conditions, and allows monitoring for unexpected changes. Tracking inflammatory markers can also help quantify improvement.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── Section 9: Sourcing & Quality ───────────────────────────────────────
  {
    id: 'sourcing',
    title: 'Sourcing & Quality',
    description: 'Product verification, COAs, and compounding pharmacies',
    icon: <Award className="w-5 h-5" />,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    items: [
      {
        question: 'What should I look for in a quality product?',
        answer: (
          <>
            <Heading>Quality Indicators</Heading>
            <BulletList items={[
              'Third-party testing with Certificate of Analysis (COA)',
              'Purity level 98%+ (lower = more contaminants)',
              'Proper sealed vials with lyophilized powder, protected from light',
              'Transparent labeling: clear mg per vial, batch numbers, expiration dates',
              'Reputable company with community feedback and responsive support',
            ]} />
          </>
        ),
      },
      {
        question: 'What is a COA (Certificate of Analysis)?',
        answer: (
          <>
            <p>A COA documents peptide identity, purity percentage (HPLC testing), absence of contaminants, batch number, testing date, and the laboratory that performed testing.</p>
            <Heading>Red Flags</Heading>
            <BulletList items={[
              'No COA available',
              'COA from unknown lab',
              'COA doesn\'t match batch number',
              'Purity below 95%',
              'Generic COA not specific to batch',
            ]} />
          </>
        ),
      },
      {
        question: 'Are compounding pharmacies better?',
        answer: (
          <>
            <Heading>Advantages</Heading>
            <BulletList items={[
              'Regulated (503A/503B with FDA oversight)',
              'Standardized processes and batch traceability',
              'Generally higher quality and accuracy',
              'Prescription means medical oversight',
            ]} />
            <Heading>Disadvantages</Heading>
            <BulletList items={[
              'Higher cost (often 3-10x research peptides)',
              'Requires prescription/telehealth visit',
              'May have limited peptide selection',
            ]} />
          </>
        ),
      },
      {
        question: 'How do I know if my peptide is real?',
        answer: (
          <>
            <Heading>Signs of Legitimate Product</Heading>
            <BulletList items={[
              'Lyophilized (freeze-dried) white powder appearing as "cake" or "puck"',
              'Dissolves clearly in BAC water — no cloudiness',
              'Expected effects within normal timeframe',
            ]} />
            <Heading>Red Flags</Heading>
            <BulletList items={[
              'Pre-mixed liquid (should be powder)',
              'Unusual color or doesn\'t dissolve properly',
              'Cloudy solution after reconstitution',
              'No effect after adequate trial (6+ weeks)',
              'Price too good to be true',
            ]} />
          </>
        ),
      },
    ],
  },

  // ── Section 10: Results & Expectations ──────────────────────────────────
  {
    id: 'results',
    title: 'Results & Expectations',
    description: 'Timelines, durability of results, and troubleshooting',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    items: [
      {
        question: 'How long until I see results?',
        answer: (
          <Table
            headers={['Condition', 'First Noticeable Results', 'Significant Improvement']}
            rows={[
              ['Acute injury', 'Days to 1-2 weeks', '2-4 weeks'],
              ['Chronic injury', '2-4 weeks', '4-8 weeks'],
              ['Gut issues', '1-3 weeks', '4-6 weeks'],
              ['Post-surgery', '1-2 weeks', 'Ongoing through recovery'],
              ['General inflammation', '1-2 weeks', '3-4 weeks'],
            ]}
          />
        ),
      },
      {
        question: 'Will my injury fully heal or just pain relief?',
        answer: (
          <>
            <Heading>Can Potentially Fully Heal</Heading>
            <BulletList items={['Partial tendon/ligament tears', 'Muscle strains', 'Soft tissue inflammation', 'Minor meniscus tears', 'Gut lining damage and ulcers']} />
            <Heading>Will NOT Heal (but may help symptoms)</Heading>
            <BulletList items={['Complete tendon detachment (requires surgery)', 'Bone-on-bone arthritis', 'Structural damage requiring surgical repair', 'Full ACL tears (usually need surgery)']} />
            <CommunityQuote>
              &ldquo;BPC-157 and TB-500 is not a pain killer. It&apos;s a healing peptide.&rdquo;
            </CommunityQuote>
          </>
        ),
      },
      {
        question: 'Do benefits last after stopping?',
        answer: (
          <>
            <Heading>For Healed Injuries: Generally Yes</Heading>
            <CommunityQuote>
              &ldquo;No, your body is healed. As long as you take care of yourself it will be fine. You don&apos;t have to take it to maintain a healed injury.&rdquo;
            </CommunityQuote>
            <Heading>For Chronic Conditions: Benefits May Fade</Heading>
            <BulletList items={[
              'Acute injuries: Heal then stop — benefits typically last',
              'Chronic conditions: May need maintenance dosing',
              'Age-related issues: Periodic cycles may be beneficial',
            ]} />
          </>
        ),
      },
      {
        question: 'What if it\'s not working?',
        answer: (
          <>
            <Heading>Troubleshooting Checklist</Heading>
            <ol className="my-2 space-y-2 text-sm text-cultr-text">
              {[
                'Verify product quality — source from reputable vendor, check COA',
                'Check dosing — recalculate reconstitution math, consider increasing if tolerated',
                'Assess duration — minimum 4-6 weeks for most conditions, some take 3+ months',
                'Evaluate injection technique — proper SubQ? Consider site-specific injection',
                'Consider combinations — add TB-500, KPV, or GHK-Cu',
                'Address confounding factors — re-injury? Nutrition and sleep adequate?',
                'Manage expectations — some conditions won\'t respond; structural damage may need surgery',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cultr-forest/10 text-cultr-forest text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <Callout type="info">
              If no results after 6 weeks of proper dosing with verified product, consider consulting a practitioner or trying a different approach.
            </Callout>
          </>
        ),
      },
    ],
  },
]

// ─── Quick Reference Data ───────────────────────────────────────────────────

const DOSING_REF = [
  ['BPC-157', '250-500mcg', '1-2x daily', '4-6 hours'],
  ['TB-500', '2.5-5mg', '2-3x weekly', '3-4 days'],
  ['GHK-Cu', '1-2mg', '1x daily', '4-6 hours'],
  ['KPV', '200-500mcg', '1x daily', 'Variable'],
]

const RECON_REF = [
  ['5mg', '1ml', '5mg/ml', '10 units'],
  ['5mg', '2ml', '2.5mg/ml', '20 units'],
  ['10mg', '1ml', '10mg/ml', '5 units'],
  ['10mg', '2ml', '5mg/ml', '10 units'],
]

const STORAGE_REF = [
  ['Powder (sealed)', 'Room temp', 'Months'],
  ['Powder (sealed)', 'Refrigerator', '1-2 years'],
  ['Powder (sealed)', 'Freezer', '2+ years'],
  ['Reconstituted', 'Refrigerator', '4-6 weeks'],
  ['Reconstituted', 'Freezer', 'Do NOT freeze'],
]

const GLOSSARY = [
  ['BAC Water', 'Bacteriostatic water — sterile water with 0.9% benzyl alcohol'],
  ['SubQ', 'Subcutaneous — injection into fat layer under skin'],
  ['IM', 'Intramuscular — injection into muscle'],
  ['mcg', 'Microgram (1000mcg = 1mg)'],
  ['Lyophilized', 'Freeze-dried powder form'],
  ['Reconstitute', 'Mix powder with liquid for injection'],
  ['Angiogenesis', 'Formation of new blood vessels'],
  ['Half-life', 'Time for half the substance to be eliminated'],
  ['Loading dose', 'Higher initial dose to establish levels'],
  ['Maintenance dose', 'Lower ongoing dose after loading'],
  ['Cycling', 'Taking breaks between periods of use'],
  ['Stack', 'Combination of multiple peptides'],
  ['COA', 'Certificate of Analysis'],
]

// ─── Main Component ─────────────────────────────────────────────────────────

export function PeptideFAQContent({ tier }: { tier: PlanTier | null }) {
  const [openItems, setOpenItems] = useState<Record<string, number | null>>({})
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleItem = (sectionId: string, index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [sectionId]: prev[sectionId] === index ? null : index,
    }))
  }

  // Filter sections based on search
  const filteredSections = searchQuery.trim()
    ? FAQ_SECTIONS.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(section => section.items.length > 0)
    : activeSection
      ? FAQ_SECTIONS.filter(s => s.id === activeSection)
      : FAQ_SECTIONS

  const totalQuestions = FAQ_SECTIONS.reduce((sum, s) => sum + s.items.length, 0)

  return (
    <div className="min-h-screen grad-light">
      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <section className="grad-dark text-white py-12 md:py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/library"
            className="inline-flex items-center text-white/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
            Peptide FAQ
          </h1>
          <p className="text-white/70 max-w-2xl text-lg">
            Comprehensive guide covering {totalQuestions} questions across {FAQ_SECTIONS.length} categories.
            Based on analysis of 5,774+ community discussions.
          </p>

          {/* Search */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setActiveSection(null) }}
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
            />
          </div>
        </div>
      </section>

      {/* ── Section Nav (pills) ──────────────────────────────────────── */}
      <div className="sticky top-20 z-30 bg-white border-b border-cultr-sage/40 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => { setActiveSection(null); setSearchQuery('') }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                !activeSection && !searchQuery
                  ? 'bg-cultr-forest text-white'
                  : 'bg-cultr-offwhite text-cultr-textMuted hover:bg-cultr-sage/30'
              }`}
            >
              All Topics
            </button>
            {FAQ_SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => { setActiveSection(section.id); setSearchQuery('') }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  activeSection === section.id
                    ? 'bg-cultr-forest text-white'
                    : 'bg-cultr-offwhite text-cultr-textMuted hover:bg-cultr-sage/30'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Disclaimer ───────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold mb-1">Educational & Research Purposes Only</p>
              <p className="text-amber-700 leading-relaxed text-xs">
                This content is compiled from community discussions and anecdotal reports, not clinical medical advice. Peptides discussed are sold as research chemicals and are not FDA-approved for human use. Always consult with a qualified healthcare provider before beginning any peptide protocol.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ Sections ─────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {searchQuery && filteredSections.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-cultr-textMuted/30 mx-auto mb-4" />
            <p className="text-cultr-textMuted">No questions matching &ldquo;{searchQuery}&rdquo;</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-sm text-cultr-forest hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {filteredSections.map(section => (
          <section key={section.id} id={section.id}>
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${section.color}`}>
                {section.icon}
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-cultr-forest">{section.title}</h2>
                <p className="text-xs text-cultr-textMuted">{section.description}</p>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white rounded-xl border border-cultr-sage/40 px-5 divide-y divide-cultr-sage/20">
              {section.items.map((item, index) => (
                <FAQAccordionItem
                  key={index}
                  item={item}
                  isOpen={openItems[section.id] === index}
                  onToggle={() => toggleItem(section.id, index)}
                />
              ))}
            </div>
          </section>
        ))}

        {/* ── Quick Reference Cards ────────────────────────────────────── */}
        {!searchQuery && !activeSection && (
          <>
            <div className="pt-4" id="quick-reference">
              <h2 className="text-2xl font-display font-bold text-cultr-forest mb-6">Quick Reference</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Dosing */}
                <div className="bg-white rounded-xl border border-cultr-sage/40 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-cultr-forest" />
                    <h3 className="font-display font-semibold text-cultr-forest">Dosing</h3>
                  </div>
                  <Table
                    headers={['Peptide', 'Dose', 'Frequency', 'Half-Life']}
                    rows={DOSING_REF}
                  />
                </div>

                {/* Reconstitution */}
                <div className="bg-white rounded-xl border border-cultr-sage/40 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="w-4 h-4 text-cultr-forest" />
                    <h3 className="font-display font-semibold text-cultr-forest">Reconstitution (500mcg dose)</h3>
                  </div>
                  <Table
                    headers={['Vial', 'BAC Water', 'Conc.', '500mcg =']}
                    rows={RECON_REF}
                  />
                </div>

                {/* Storage */}
                <div className="bg-white rounded-xl border border-cultr-sage/40 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-cultr-forest" />
                    <h3 className="font-display font-semibold text-cultr-forest">Storage</h3>
                  </div>
                  <Table
                    headers={['Form', 'Location', 'Duration']}
                    rows={STORAGE_REF}
                  />
                </div>

                {/* Glossary */}
                <div className="bg-white rounded-xl border border-cultr-sage/40 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-cultr-forest" />
                    <h3 className="font-display font-semibold text-cultr-forest">Glossary</h3>
                  </div>
                  <dl className="space-y-2 text-sm">
                    {GLOSSARY.map(([term, def]) => (
                      <div key={term} className="flex items-start gap-2">
                        <dt className="font-semibold text-cultr-forest whitespace-nowrap min-w-[100px]">{term}</dt>
                        <dd className="text-cultr-textMuted">{def}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>

            {/* Footer disclaimer */}
            <div className="text-center text-xs text-cultr-textMuted pt-4 pb-8">
              <p>Last updated: February 2026</p>
              <p className="mt-1">This FAQ is compiled from community discussions and is for educational purposes only.<br />Always consult with healthcare providers for medical decisions.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
