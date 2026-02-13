'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, Download } from 'lucide-react'
import { useState } from 'react'

/* ─── Copyable block used inside resource content ─── */
function CopyBlock({ label, children }: { label?: string; children: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative bg-stone-50 border border-stone-200 rounded-xl p-4 my-4">
      {label && <p className="text-xs font-bold text-cultr-forest tracking-wider uppercase mb-2">{label}</p>}
      <pre className="text-sm text-cultr-text whitespace-pre-wrap leading-relaxed font-body">{children}</pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-stone-200 hover:border-cultr-forest transition-colors"
        aria-label="Copy"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
      </button>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-display font-bold text-cultr-forest mt-8 mb-3">{children}</h2>
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-display font-bold text-cultr-text mt-6 mb-2">{children}</h3>
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-cultr-textMuted leading-relaxed mb-3">{children}</p>
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 my-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-cultr-textMuted">
          <span className="w-1.5 h-1.5 rounded-full bg-cultr-forest mt-1.5 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ColorSwatch({ name, hex, textColor = 'text-white' }: { name: string; hex: string; textColor?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex flex-col rounded-xl overflow-hidden border border-stone-200 hover:shadow-md transition-shadow"
    >
      <div className={`h-20 flex items-end p-3 ${textColor}`} style={{ backgroundColor: hex }}>
        <span className="text-xs font-bold">{copied ? 'Copied!' : hex}</span>
      </div>
      <div className="p-3 bg-white text-left">
        <p className="text-sm font-medium text-cultr-forest">{name}</p>
      </div>
    </button>
  )
}

function DownloadButton({ href, label, format }: { href: string; label: string; format: string }) {
  return (
    <a
      href={href}
      download
      className="flex items-center gap-3 p-3 bg-white border border-stone-200 rounded-xl hover:border-cultr-forest hover:shadow-sm transition-all group"
    >
      <div className="w-9 h-9 rounded-lg bg-cultr-mint flex items-center justify-center">
        <Download className="w-4 h-4 text-cultr-forest" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-cultr-forest">{label}</p>
        <p className="text-[11px] text-cultr-textMuted">{format}</p>
      </div>
    </a>
  )
}

/* ─── Resource content map ─── */
const RESOURCES: Record<string, { title: string; category: string; content: () => React.ReactNode }> = {

  /* ━━━ CONTENT TEMPLATES ━━━ */
  'short-form-hooks': {
    title: 'Short-Form Hooks',
    category: 'Content Templates',
    content: () => (
      <>
        <Paragraph>Use these 15-second hook scripts for Instagram Reels, TikTok, and YouTube Shorts. Each hook is designed to stop the scroll and lead into your CULTR content. Customize with your personal experience.</Paragraph>

        <SectionHeading>Hook Formula</SectionHeading>
        <Paragraph>Every great short-form hook follows this pattern: Bold claim or question → Personal credibility → Call to action. Keep the first 2 seconds punchy — that&apos;s where you win or lose the viewer.</Paragraph>

        <SubHeading>Weight Loss / GLP-1 Hooks</SubHeading>
        <CopyBlock label="Hook 1 — The Revelation">{`I lost [X] pounds in [timeframe] and I didn't starve myself, do a crash diet, or spend 2 hours in the gym.

Here's what actually worked — and no, it's not what you think.

[Transition to talking about GLP-1 protocols through CULTR]`}</CopyBlock>

        <CopyBlock label="Hook 2 — The Myth Buster">{`"Just eat less and move more" — yeah, I tried that for [X] years.

Turns out my hormones were working against me the entire time.

Once I got my labs done through CULTR and started the right protocol, everything changed.`}</CopyBlock>

        <CopyBlock label="Hook 3 — The Question">{`What if the reason you can't lose weight has nothing to do with willpower?

I got 50+ biomarkers tested — here's what they found.

[Show/discuss results and how CULTR matched you to a protocol]`}</CopyBlock>

        <SubHeading>Peptide / Optimization Hooks</SubHeading>
        <CopyBlock label="Hook 4 — The Energy Hook">{`6 months ago I could barely get through the day without 4 cups of coffee.

Now I wake up at 5am with more energy than I had at 25.

The difference? I stopped guessing and started testing. Here's my protocol.`}</CopyBlock>

        <CopyBlock label="Hook 5 — The Skeptic Convert">{`I used to think peptides were just for bodybuilders and biohackers.

Then my provider walked me through the science and I realized — this is just medicine, personalized to your body.`}</CopyBlock>

        <CopyBlock label="Hook 6 — The Comparison">{`My doctor ran 5 blood markers and said "you're fine."

CULTR ran 50+ and found 3 things that explained why I felt like garbage every afternoon.

This is the difference between standard care and actual optimization.`}</CopyBlock>

        <SubHeading>General CULTR Hooks</SubHeading>
        <CopyBlock label="Hook 7 — The Simplicity Hook">{`What if getting access to the same protocols celebrities use cost less than your gym membership?

No waitlists. No $500 doctor visits. Just science, from $199/mo.`}</CopyBlock>

        <CopyBlock label="Hook 8 — The Social Proof">{`5,000+ people have already optimized their health through CULTR.

Here's why I joined them — and why I think you should too.`}</CopyBlock>

        <SectionHeading>Tips for Recording</SectionHeading>
        <BulletList items={[
          'Look directly at the camera for the first 2 seconds',
          'Use a pattern interrupt (snap, hand gesture, prop) at the very start',
          'Keep total video under 30 seconds for maximum completion rate',
          'Always include your tracking link in bio or caption',
          'Add your FTC disclosure (#ad or #partner) in the caption',
        ]} />
      </>
    ),
  },

  'long-form-scripts': {
    title: 'Long-Form Scripts',
    category: 'Content Templates',
    content: () => (
      <>
        <Paragraph>Use these talking points and outlines for YouTube videos, podcast episodes, or long-form content. Adapt to your style and personal experience.</Paragraph>

        <SectionHeading>Video Outline: &quot;Why I Switched to CULTR&quot; (8-12 min)</SectionHeading>
        <CopyBlock label="Script Outline">{`INTRO (0:00-1:00)
- Personal hook: Share your frustration with traditional healthcare
- "I'm going to show you exactly what happened when I got 50+ biomarkers tested"
- Quick mention: This video is sponsored by / in partnership with CULTR

SECTION 1: THE PROBLEM (1:00-3:00)
- Talk about the standard doctor visit experience
- How most doctors only test 5-10 markers
- The frustration of "your labs are normal" when you don't feel normal
- Mention wait times, limited appointment slots, generic advice

SECTION 2: WHAT CULTR DOES DIFFERENTLY (3:00-5:00)
- Explain the CULTR model: telehealth + comprehensive labs + personalized protocols
- 50+ biomarkers tested vs. standard 5-10
- Licensed providers who specialize in optimization
- Access to peptide protocols, GLP-1s, and hormone optimization
- Plans from $199/mo — less than most gym memberships

SECTION 3: MY EXPERIENCE (5:00-8:00)
- Walk through your signup process
- Show/describe your lab results (what surprised you)
- Discuss your protocol and how it was personalized
- Share tangible results: energy, body composition, sleep, mood

SECTION 4: WHO IT'S FOR (8:00-10:00)
- People tired of "you're fine" from their doctor
- Anyone wanting proactive, not reactive healthcare
- Men and women looking to optimize hormones, metabolism, energy
- NOT a replacement for emergency care or chronic disease management

CTA (10:00-end)
- "Take the 2-minute quiz to see which plan fits you"
- Mention your coupon code and link in description
- FTC disclosure`}</CopyBlock>

        <SectionHeading>Podcast Talking Points: &quot;The Science of Optimization&quot;</SectionHeading>
        <CopyBlock label="Talking Points">{`OPENER
- What does "health optimization" actually mean? It's not biohacking — it's using data to make better decisions about your body.

KEY POINTS TO COVER
1. Most people are "medically normal" but not optimally healthy
   - Reference ranges are based on the general population, not optimal health
   - Example: Testosterone "normal" is 300-1000 ng/dL but optimal is 500-800+

2. Why comprehensive lab testing matters
   - Standard panels miss inflammation, hormonal imbalances, nutrient deficiencies
   - CULTR tests 50+ biomarkers to find the root cause, not just treat symptoms

3. Peptides are not steroids
   - Explain what peptides actually are (short chains of amino acids)
   - They signal your body to do what it already knows how to do
   - All protocols are provider-supervised and from licensed pharmacies

4. The democratization of longevity medicine
   - This used to cost $5,000-$10,000/year through concierge doctors
   - CULTR makes it accessible from $199/mo
   - Telehealth removes geographic barriers

CLOSER
- Personal takeaway and recommendation
- Direct to quiz link for personalized plan matching`}</CopyBlock>

        <SectionHeading>Content Tips</SectionHeading>
        <BulletList items={[
          'Always lead with your personal experience — authenticity converts',
          'Include specific numbers when possible (biomarkers tested, cost savings, timeline)',
          'Address common objections proactively (cost, skepticism about peptides, telehealth quality)',
          'Pin your tracking link and coupon code in comments',
          'Include FTC disclosure in the first 30 seconds and in the description',
        ]} />
      </>
    ),
  },

  'email-templates': {
    title: 'Email Templates',
    category: 'Content Templates',
    content: () => (
      <>
        <Paragraph>Ready-to-customize email templates for your newsletter audience. Replace bracketed placeholders with your personal details.</Paragraph>

        <SectionHeading>Email 1: Introduction / Announcement</SectionHeading>
        <CopyBlock label="Subject: I found something that actually works">{`Hey [First Name],

I don't usually recommend health products in my newsletter — but this one is different enough that I had to tell you about it.

I recently started working with CULTR Health. They're a telehealth platform that does comprehensive lab testing (50+ biomarkers, not the basic 5 your doctor runs) and matches you with licensed providers who build personalized protocols.

I'm talking peptides, hormone optimization, GLP-1 protocols — the kind of stuff that used to cost $5K+ per year at concierge clinics. CULTR starts at $199/mo.

Here's what sold me: [INSERT YOUR PERSONAL EXPERIENCE — e.g., "I got my labs back and found out my testosterone was technically 'normal' but way below optimal. My provider built a protocol and within 8 weeks I had more energy than I've had in years."]

If you've ever felt like your doctor says "you're fine" but you know something's off — this is worth looking into.

👉 Take the 2-minute quiz to see which plan fits you: [YOUR LINK]

Use code [YOUR CODE] for [discount details].

[Your sign-off]

P.S. This is a paid partnership with CULTR Health. I only partner with companies I personally use and believe in.`}</CopyBlock>

        <SectionHeading>Email 2: Results / Follow-Up</SectionHeading>
        <CopyBlock label="Subject: My lab results are in (and I was surprised)">{`Hey [First Name],

Quick update on my CULTR Health journey — I got my comprehensive lab panel back.

50+ biomarkers tested. Here's what stood out:

- [Biomarker 1]: [Your finding and what it means]
- [Biomarker 2]: [Your finding and what it means]
- [Biomarker 3]: [Your finding and what it means]

My provider reviewed everything with me on a video call and built a personalized protocol. No generic advice — actual data-driven recommendations.

The thing that impressed me most: [INSERT SPECIFIC DETAIL — e.g., "they caught an inflammation marker my regular doctor never tested for, which explained my afternoon crashes."]

If you want to see what your own labs reveal: [YOUR LINK]

Code [YOUR CODE] gets you [discount].

[Your sign-off]

Disclosure: This is a paid partnership with CULTR Health.`}</CopyBlock>

        <SectionHeading>Email 3: FAQ / Objection Handling</SectionHeading>
        <CopyBlock label="Subject: Your questions about CULTR, answered">{`Hey [First Name],

Got a bunch of replies after my last email about CULTR Health, so let me answer the top questions:

"Is this legit?"
Yes — CULTR is a licensed medical practice with board-certified providers. All medications come from licensed US pharmacies. It's fully HIPAA compliant.

"How is this different from my regular doctor?"
Your doctor typically tests 5-10 basic markers. CULTR tests 50+ including hormones, inflammation, metabolic markers, and nutrients. Plus you get a provider who specializes in optimization, not just disease treatment.

"What about the cost?"
Plans start at $199/mo. Compare that to a single specialist visit ($300-500) or concierge medicine ($5,000-10,000/year). HSA/FSA eligible too.

"Do I need to stop seeing my regular doctor?"
No. CULTR complements your existing care. Think of it as adding an optimization specialist to your health team.

Ready to see what plan fits you? [YOUR LINK]

[Your sign-off]

Disclosure: Paid partnership with CULTR Health.`}</CopyBlock>
      </>
    ),
  },

  'caption-templates': {
    title: 'Caption Templates',
    category: 'Content Templates',
    content: () => (
      <>
        <Paragraph>Copy-and-paste social media captions for Instagram, Twitter/X, and Facebook. Customize the bracketed sections with your personal experience.</Paragraph>

        <SectionHeading>Instagram Captions</SectionHeading>
        <CopyBlock label="Caption 1 — Lab Results Post">{`Just got my comprehensive lab panel back from @cultrhealth and WOW. 🧪

50+ biomarkers tested. Turns out [your finding — e.g., "my vitamin D was in the tank and my cortisol was through the roof"].

This is why "you're fine" from your regular doctor isn't enough.

I'm working with a licensed provider to build a personalized protocol and I'll keep you updated on results.

Want to see what your labs reveal? Link in bio 👆

Use code [YOUR CODE] for [discount].

#ad #cultrhealth #healthoptimization #peptides #labwork #biohacking`}</CopyBlock>

        <CopyBlock label="Caption 2 — Progress Update">{`[X] weeks on my CULTR protocol and here's what's changed:

✅ [Result 1 — e.g., "Energy levels are up — no more 2pm crash"]
✅ [Result 2 — e.g., "Sleep quality improved dramatically"]
✅ [Result 3 — e.g., "Down 8 lbs without changing my diet"]

This isn't guesswork. It's data-driven protocols from licensed providers, personalized to MY body.

Plans start at $199/mo. Take the quiz to find yours → link in bio

#partner #cultrhealth #healthjourney #peptidetherapy #glp1`}</CopyBlock>

        <CopyBlock label="Caption 3 — Educational">{`Your doctor tests 5-10 blood markers.
CULTR tests 50+.

Here's what most panels miss:
→ Comprehensive hormone profile
→ Inflammation markers (hs-CRP)
→ Advanced thyroid panel
→ Nutrient deficiencies
→ Metabolic markers

This is the difference between "you're fine" and actually feeling your best.

Link in bio to take the quiz and find your plan.

#ad #cultrhealth #labwork #preventivehealth #longevity`}</CopyBlock>

        <SectionHeading>Twitter/X Posts</SectionHeading>
        <CopyBlock label="Tweet 1">{`My doctor: "Your labs are normal"
CULTR: "Here are 3 things we found that explain why you feel like garbage"

50+ biomarkers > the basic 5. Link in bio.

#ad @cultrhealth`}</CopyBlock>

        <CopyBlock label="Tweet 2">{`The same longevity protocols celebrities pay $10K/year for — now from $199/mo.

Licensed providers. Personalized peptide protocols. 50+ biomarker testing.

Not a supplement company. An actual medical practice. @cultrhealth

#partner`}</CopyBlock>

        <CopyBlock label="Tweet 3">{`Peptides are not steroids.

They're short amino acid chains that signal your body to do what it already knows how to do — just better.

Provider-supervised. Licensed pharmacy. Real science.

This is what CULTR does. [YOUR LINK] #ad`}</CopyBlock>

        <SectionHeading>Disclosure Reminder</SectionHeading>
        <Paragraph>Always include #ad, #partner, or #sponsored visibly in your caption — not buried in a wall of hashtags. See the FTC Disclosure Guide for full requirements.</Paragraph>
      </>
    ),
  },

  /* ━━━ BRAND KIT ━━━ */
  'logo-pack': {
    title: 'Logo Pack',
    category: 'Brand Kit',
    content: () => (
      <>
        <Paragraph>Download official CULTR logos for use in your content, thumbnails, and promotional materials. Always use approved logos — never recreate or modify them.</Paragraph>

        <SectionHeading>Available Formats</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-4 my-4">
          <div className="bg-cultr-forest p-8 rounded-xl flex items-center justify-center">
            <span className="font-display font-bold text-white text-3xl tracking-[0.08em]">CULTR</span>
          </div>
          <div className="bg-white border border-stone-200 p-8 rounded-xl flex items-center justify-center">
            <span className="font-display font-bold text-cultr-forest text-3xl tracking-[0.08em]">CULTR</span>
          </div>
        </div>

        <BulletList items={[
          'Primary wordmark — dark on light backgrounds',
          'Reversed wordmark — white on dark backgrounds',
          'Available in SVG, PNG (@1x, @2x, @3x)',
          'Minimum clear space: height of the "C" on all sides',
        ]} />

        <SectionHeading>Usage Rules</SectionHeading>
        <BulletList items={[
          'Do not alter, rotate, or distort the logo',
          'Do not change the logo colors outside of provided variants',
          'Do not add effects (shadows, gradients, outlines) to the logo',
          'Maintain minimum clear space around the logo',
          'Do not place the logo on busy or low-contrast backgrounds',
        ]} />

        <SectionHeading>Download</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-3 my-4">
          <DownloadButton href="/creators/brand-kit/cultr-logo-dark.svg" label="Logo — Dark (Forest)" format="SVG" />
          <DownloadButton href="/creators/brand-kit/cultr-logo-white.svg" label="Logo — White (Reversed)" format="SVG" />
        </div>
        <Paragraph>Need additional formats (PNG @2x/@3x) or custom variants? Contact creators@cultrhealth.com.</Paragraph>
      </>
    ),
  },

  'brand-colors': {
    title: 'Brand Colors',
    category: 'Brand Kit',
    content: () => (
      <>
        <Paragraph>CULTR&apos;s color palette is built around deep forest tones that convey trust, nature, and premium quality. Click any swatch to copy the hex code.</Paragraph>

        <SectionHeading>Primary Colors</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-4">
          <ColorSwatch name="Forest (Primary)" hex="#2A4542" />
          <ColorSwatch name="Forest Dark" hex="#1E3330" />
          <ColorSwatch name="Forest Light" hex="#3A5956" />
        </div>

        <SectionHeading>Accent Colors</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-4">
          <ColorSwatch name="Sage" hex="#B7E4C7" textColor="text-cultr-forest" />
          <ColorSwatch name="Mint" hex="#D8F3DC" textColor="text-cultr-forest" />
          <ColorSwatch name="Copper" hex="#C87941" />
        </div>

        <SectionHeading>Background Colors</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-4">
          <ColorSwatch name="Cream" hex="#FDFBF7" textColor="text-cultr-forest" />
          <ColorSwatch name="Off-White" hex="#F5F3EF" textColor="text-cultr-forest" />
          <ColorSwatch name="White" hex="#FFFFFF" textColor="text-cultr-forest" />
        </div>

        <SectionHeading>Usage Guidelines</SectionHeading>
        <BulletList items={[
          'Forest (#2A4542) is the primary brand color — use for headlines, CTAs, and primary elements',
          'Sage and Mint are supporting colors — use for backgrounds, badges, and secondary elements',
          'Copper is an accent — use sparingly for highlights and special callouts',
          'Cream/Off-White are background colors — maintain the warm, premium feel',
          'Always ensure sufficient contrast for text readability (WCAG AA minimum)',
        ]} />

        <SectionHeading>Download</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-3 my-4">
          <DownloadButton href="/creators/brand-kit/cultr-brand-colors.json" label="Brand Color Palette" format="JSON (for design tools)" />
        </div>
      </>
    ),
  },

  'photography': {
    title: 'Photography',
    category: 'Brand Kit',
    content: () => (
      <>
        <Paragraph>Guidelines for using CULTR-approved photography in your content. Use these images to maintain brand consistency across your promotions.</Paragraph>

        <SectionHeading>Photo Style Guidelines</SectionHeading>
        <Paragraph>CULTR photography is warm, natural, and lifestyle-focused. Images should feel aspirational but attainable — real people living their best lives, not overly polished fitness model shots.</Paragraph>

        <BulletList items={[
          'Natural lighting preferred — warm tones, golden hour aesthetic',
          'Subjects should look healthy, energetic, and approachable',
          'Avoid clinical or overly medical imagery',
          'Diverse representation in age, gender, ethnicity, and body type',
          'Settings: outdoors, gyms, kitchens, offices — everyday environments',
          'No before/after photos that make specific body composition claims',
        ]} />

        <SectionHeading>Approved Image Categories</SectionHeading>
        <SubHeading>Lifestyle Shots</SubHeading>
        <Paragraph>People exercising, cooking healthy meals, enjoying outdoor activities, working productively, spending time with family. These convey the outcomes of optimization.</Paragraph>

        <SubHeading>Product Shots</SubHeading>
        <Paragraph>Clean, minimal product photography on neutral backgrounds. Lab vials, supplement packaging, and the CULTR platform on devices.</Paragraph>

        <SubHeading>Abstract / Texture</SubHeading>
        <Paragraph>Nature textures (leaves, water, stone), lab equipment close-ups, and geometric patterns in brand colors for backgrounds and thumbnails.</Paragraph>

        <SectionHeading>Download Approved Photos</SectionHeading>
        <Paragraph>Contact your creator manager at creators@cultrhealth.com to receive access to the full approved photo library. Core product shots and lifestyle images are available for download below as they are added.</Paragraph>

        <SectionHeading>Do Not Use</SectionHeading>
        <BulletList items={[
          'Stock photos with watermarks or improper licensing',
          'Before/after body transformation photos',
          'Images of syringes, needles, or clinical procedures',
          'Photos implying specific medical outcomes or cures',
          'Competitor logos or branding in the frame',
        ]} />
      </>
    ),
  },

  'brand-guidelines': {
    title: 'Brand Guidelines',
    category: 'Brand Kit',
    content: () => (
      <>
        <Paragraph>CULTR&apos;s brand voice and visual identity guidelines. Follow these when creating content to maintain brand consistency.</Paragraph>

        <SectionHeading>Brand Voice</SectionHeading>
        <Paragraph>CULTR speaks with confidence, clarity, and authority — but never arrogance. We&apos;re the knowledgeable friend who tells it straight, not the doctor who talks down to you.</Paragraph>

        <SubHeading>Tone Attributes</SubHeading>
        <BulletList items={[
          'Direct — Say it plainly. No jargon, no fluff.',
          'Confident — We know our science. No hedging or over-qualifying.',
          'Empowering — The reader is in control. We provide the tools.',
          'Warm — Professional doesn\'t mean cold. We care about outcomes.',
          'Premium — We\'re not a discount brand. Quality over quantity.',
        ]} />

        <SubHeading>Voice Examples</SubHeading>
        <CopyBlock label="✅ DO">{`"Stop guessing. Start optimizing."
"Your doctor tests 5 markers. We test 50+."
"Lab-tested protocols. Licensed providers. Real results."
"Peptides that work. From $199/mo."`}</CopyBlock>

        <CopyBlock label="❌ DON'T">{`"We might be able to help you feel a bit better."
"Our revolutionary, groundbreaking, world-class solution..."
"GUARANTEED to transform your body in 30 days!!!"
"Doctors hate this one trick..."`}</CopyBlock>

        <SectionHeading>Writing Style</SectionHeading>
        <BulletList items={[
          'Use sentence case for headlines (capitalize first word only)',
          'Short sentences. Short paragraphs. White space is your friend.',
          'Numbers are more powerful than adjectives ("50+ biomarkers" > "comprehensive testing")',
          'Avoid exclamation marks in professional copy (one per piece maximum)',
          'CULTR is always written in all-caps. "CULTR Health" on first reference, "CULTR" thereafter.',
          'Never abbreviate to "CH" or "Cultr" (lowercase)',
        ]} />

        <SectionHeading>Typography</SectionHeading>
        <BulletList items={[
          'Display font: Playfair Display — used for headlines, brand name, and emphasis text',
          'Body font: Inter — used for all body copy, UI text, and descriptions',
          'Never use Comic Sans, Papyrus, or decorative fonts in CULTR-branded content',
        ]} />

        <SectionHeading>Visual Identity</SectionHeading>
        <BulletList items={[
          'Rounded corners (border-radius) on all cards, buttons, and containers',
          'Generous white space — never crowd elements together',
          'Subtle shadows over heavy borders',
          'Forest green (#2A4542) as the dominant color with sage/mint accents',
          'Photography should feel warm and natural (see Photography resource)',
        ]} />
      </>
    ),
  },

  /* ━━━ COMPLIANCE ━━━ */
  'ftc-disclosure-guide': {
    title: 'FTC Disclosure Guide',
    category: 'Compliance',
    content: () => (
      <>
        <Paragraph>As a CULTR creator, you are legally required to disclose your material connection (affiliate relationship) whenever you promote CULTR products. This guide ensures you stay compliant with FTC regulations.</Paragraph>

        <SectionHeading>The Rule</SectionHeading>
        <Paragraph>The FTC requires that any &quot;material connection&quot; between an endorser and a brand must be clearly and conspicuously disclosed. A material connection includes being paid, receiving free products, earning commissions, or having any financial relationship.</Paragraph>

        <SectionHeading>Disclosure Requirements by Platform</SectionHeading>

        <SubHeading>Instagram / TikTok / Reels</SubHeading>
        <BulletList items={[
          'Use #ad or #partner at the BEGINNING of your caption (not buried in hashtags)',
          'If using Stories, add a text overlay saying "Paid partnership" or "Ad"',
          'Use the platform\'s built-in paid partnership label when available',
          'Verbal disclosure in video: "This is sponsored by CULTR" or "I partner with CULTR"',
        ]} />

        <SubHeading>YouTube</SubHeading>
        <BulletList items={[
          'Check the "includes paid promotion" box in YouTube Studio',
          'Verbally disclose within the first 30 seconds of the video',
          'Include written disclosure in the video description',
          'Example: "This video is sponsored by CULTR Health. All opinions are my own."',
        ]} />

        <SubHeading>Podcasts</SubHeading>
        <BulletList items={[
          'Verbal disclosure at the start of the sponsored segment',
          'Example: "This episode is brought to you by CULTR Health"',
          'Include in show notes with your tracking link',
        ]} />

        <SubHeading>Email / Newsletter</SubHeading>
        <BulletList items={[
          'Include "Paid partnership" or "This is a sponsored recommendation" clearly',
          'Do not disguise the promotional nature of the email',
          'Place disclosure near the top, not only at the bottom',
        ]} />

        <SubHeading>Twitter/X</SubHeading>
        <BulletList items={[
          'Include #ad in the tweet text itself',
          'Do not rely on pinned tweets or profile bios for disclosure',
        ]} />

        <SectionHeading>Approved Disclosure Language</SectionHeading>
        <CopyBlock label="Use any of these">{`"#ad — I partner with CULTR Health and earn a commission on referrals."
"Paid partnership with @cultrhealth"
"This is sponsored by CULTR Health. I only partner with brands I personally use."
"Affiliate link — I may earn a commission at no extra cost to you."
"#partner @cultrhealth"`}</CopyBlock>

        <SectionHeading>Common Mistakes to Avoid</SectionHeading>
        <BulletList items={[
          'Burying #ad in a wall of 30 hashtags — it must be clearly visible',
          'Only disclosing in bio or "about" page — each individual post needs disclosure',
          'Using ambiguous language like "thanks to CULTR" without clarifying the financial relationship',
          'Failing to disclose when posting about CULTR even casually',
          'Assuming viewers know about the partnership — always be explicit',
        ]} />
      </>
    ),
  },

  'approved-claims': {
    title: 'Approved Claims',
    category: 'Compliance',
    content: () => (
      <>
        <Paragraph>This document outlines what you can and cannot say when promoting CULTR Health. Following these guidelines protects you, your audience, and CULTR from regulatory issues.</Paragraph>

        <SectionHeading>Approved Claims (You CAN Say)</SectionHeading>
        <CopyBlock label="About CULTR's Services">{`✅ "CULTR tests 50+ biomarkers"
✅ "Licensed, board-certified providers"
✅ "All medications from licensed US pharmacies"
✅ "HIPAA-compliant platform"
✅ "Plans starting at $199/mo"
✅ "HSA/FSA eligible"
✅ "Telehealth consultations available within 24-48 hours"
✅ "Personalized protocols based on your lab results"
✅ "Access to peptide protocols and GLP-1 medications"
✅ "Month-to-month, cancel anytime"`}</CopyBlock>

        <CopyBlock label="About Your Personal Experience">{`✅ "I personally experienced [specific result]"
✅ "My energy levels improved after starting my protocol"
✅ "I lost [X] pounds while working with CULTR"
✅ "My labs showed [specific finding] that my regular doctor missed"
✅ "I feel better than I have in years"
(Always frame as YOUR individual experience, not a guarantee)`}</CopyBlock>

        <SectionHeading>Prohibited Claims (You CANNOT Say)</SectionHeading>
        <CopyBlock label="Never Make These Claims">{`❌ "CULTR cures [any disease or condition]"
❌ "Guaranteed to lose weight / build muscle / fix hormones"
❌ "This will work for everyone"
❌ "Better than your doctor" or "replaces your doctor"
❌ "FDA approved" (CULTR is a medical practice, not an FDA-approved product)
❌ "No side effects"
❌ "100% safe"
❌ Any specific medical outcomes as guaranteed results
❌ Comparisons to specific competitors by name
❌ "Doctors don't want you to know this"
❌ Any claim that hasn't been approved in this document`}</CopyBlock>

        <SectionHeading>Gray Area — Ask First</SectionHeading>
        <Paragraph>If you want to make a claim not listed above, email creators@cultrhealth.com for approval BEFORE publishing. This includes any specific medical claims, pricing claims for future plans, or comparison claims.</Paragraph>

        <SectionHeading>When Discussing Your Results</SectionHeading>
        <BulletList items={[
          'Always use first-person language ("I experienced..." not "You will experience...")',
          'Include "individual results may vary" or "results are not guaranteed"',
          'Do not show or discuss specific prescription details (dosages, medication names) without provider approval',
          'You may share general biomarker categories (hormones, inflammation) without specific clinical values',
        ]} />
      </>
    ),
  },

  'health-claims-policy': {
    title: 'Health Claims Policy',
    category: 'Compliance',
    content: () => (
      <>
        <Paragraph>Health and wellness content is heavily regulated by the FTC, FDA, and state medical boards. As a CULTR creator, you must use FDA-compliant language when discussing health topics.</Paragraph>

        <SectionHeading>Key Principles</SectionHeading>
        <BulletList items={[
          'CULTR is a licensed medical practice — not a supplement company or wellness brand',
          'All treatments are prescribed by licensed providers based on clinical evaluation',
          'No treatment is "guaranteed" to produce specific results',
          'Individual results vary based on biology, compliance, and other factors',
          'CULTR does not diagnose, cure, prevent, or treat any disease through content alone',
        ]} />

        <SectionHeading>Structure / Function Claims vs. Disease Claims</SectionHeading>
        <SubHeading>Structure/Function Claims (Acceptable)</SubHeading>
        <Paragraph>These describe how a product or service affects the body&apos;s normal structure or function:</Paragraph>
        <CopyBlock label="Acceptable Examples">{`✅ "Supports healthy hormone levels"
✅ "May help maintain a healthy weight"
✅ "Promotes metabolic health"
✅ "Supports energy and vitality"
✅ "Helps optimize biomarker levels"`}</CopyBlock>

        <SubHeading>Disease Claims (NOT Acceptable)</SubHeading>
        <Paragraph>These claim to diagnose, cure, mitigate, treat, or prevent a disease:</Paragraph>
        <CopyBlock label="NOT Acceptable">{`❌ "Treats diabetes"
❌ "Cures hormonal imbalances"
❌ "Prevents heart disease"
❌ "Fixes thyroid problems"
❌ "Treats depression or anxiety"`}</CopyBlock>

        <SectionHeading>Required Disclaimers</SectionHeading>
        <Paragraph>When discussing health outcomes, always include one of these disclaimers in your content:</Paragraph>
        <CopyBlock label="Standard Disclaimer">{`"CULTR Health is a licensed medical practice. All treatments are prescribed by licensed providers after clinical evaluation. Individual results vary. This is not medical advice — consult your healthcare provider before making health decisions."`}</CopyBlock>

        <CopyBlock label="Short-Form Disclaimer (for social)">{`"Licensed providers. Individual results vary. Not medical advice."`}</CopyBlock>

        <SectionHeading>Testimonial Requirements</SectionHeading>
        <BulletList items={[
          'When sharing your personal results, always note they are YOUR individual experience',
          'Include "individual results may vary" or "your experience may differ"',
          'Do not present atypical results as typical outcomes',
          'Never promise or imply that others will achieve the same results',
        ]} />
      </>
    ),
  },

  'terms-of-service': {
    title: 'Terms of Service',
    category: 'Compliance',
    content: () => (
      <>
        <Paragraph>These terms govern your participation in the CULTR Creator Affiliate Program. By participating, you agree to the following terms.</Paragraph>

        <SectionHeading>1. Program Overview</SectionHeading>
        <Paragraph>The CULTR Creator Program is an affiliate marketing program that allows approved creators to earn commissions by referring customers to CULTR Health. Creators receive unique tracking links, coupon codes, and access to promotional resources.</Paragraph>

        <SectionHeading>2. Commission Structure</SectionHeading>
        <BulletList items={[
          'Base commission: 10% on all attributed orders',
          'Network override commissions: 2-8% based on recruiting tier (5, 10, 15, 20 recruits)',
          'Total payout per order is capped at 20% of net revenue across all parties',
          'Commissions are calculated on net revenue after refunds and chargebacks',
          'Cookie duration: 30 days from click',
        ]} />

        <SectionHeading>3. Payment Terms</SectionHeading>
        <BulletList items={[
          'Minimum payout threshold: $50',
          'Payment schedule: Monthly, on the 15th of each month for the previous month\'s earnings',
          'Payment methods: Stripe Connect, bank transfer (ACH), or PayPal',
          'You are responsible for all applicable taxes on your earnings',
          'CULTR will issue a 1099 for US-based creators earning over $600/year',
        ]} />

        <SectionHeading>4. Creator Obligations</SectionHeading>
        <BulletList items={[
          'Comply with all FTC disclosure requirements (see FTC Disclosure Guide)',
          'Only make approved claims about CULTR products and services (see Approved Claims)',
          'Follow FDA-compliant language guidelines (see Health Claims Policy)',
          'Not engage in spam, misleading advertising, or deceptive practices',
          'Not bid on CULTR branded keywords in paid search campaigns',
          'Not use CULTR trademarks in domain names or social media handles',
          'Maintain accurate and current profile information',
        ]} />

        <SectionHeading>5. Prohibited Activities</SectionHeading>
        <BulletList items={[
          'Self-referrals or using your own link for personal purchases',
          'Cookie stuffing, click fraud, or any form of traffic manipulation',
          'Purchasing paid ads that use CULTR brand terms',
          'Creating content that disparages competitors or makes false claims',
          'Sharing confidential program information, commission rates, or internal resources publicly',
          'Promoting CULTR in connection with illegal activities or substances',
        ]} />

        <SectionHeading>6. Termination</SectionHeading>
        <Paragraph>Either party may terminate the affiliate relationship at any time. CULTR reserves the right to immediately terminate creators who violate these terms, make prohibited claims, or engage in fraudulent activity. Upon termination, outstanding commissions above the minimum threshold will be paid within 30 days.</Paragraph>

        <SectionHeading>7. Intellectual Property</SectionHeading>
        <Paragraph>CULTR grants creators a limited, non-exclusive license to use CULTR trademarks, logos, and approved content solely for the purpose of promoting CULTR through the affiliate program. This license is revocable and terminates upon leaving the program.</Paragraph>

        <SectionHeading>8. Limitation of Liability</SectionHeading>
        <Paragraph>CULTR is not liable for any indirect, incidental, or consequential damages arising from participation in the creator program. CULTR&apos;s total liability is limited to unpaid commissions owed at the time of any claim.</Paragraph>

        <SectionHeading>9. Modifications</SectionHeading>
        <Paragraph>CULTR reserves the right to modify these terms, commission rates, and program structure with 30 days written notice. Continued participation after notice constitutes acceptance of modified terms.</Paragraph>

        <Paragraph>Last updated: February 2026. Questions? Contact creators@cultrhealth.com.</Paragraph>
      </>
    ),
  },

  /* ━━━ PRODUCT EDUCATION ━━━ */
  'glp-1-overview': {
    title: 'GLP-1 Overview',
    category: 'Product Education',
    content: () => (
      <>
        <Paragraph>This guide covers GLP-1 receptor agonist medications — what they are, how they work, who they&apos;re for, and how CULTR prescribes them. Use this to educate yourself and inform your content.</Paragraph>

        <SectionHeading>What Are GLP-1 Medications?</SectionHeading>
        <Paragraph>GLP-1 (glucagon-like peptide-1) receptor agonists are a class of medications that mimic a natural hormone your body produces after eating. They work by signaling your brain that you&apos;re full, slowing gastric emptying, and improving insulin sensitivity.</Paragraph>

        <SubHeading>Common GLP-1 Medications</SubHeading>
        <BulletList items={[
          'Semaglutide — the active ingredient in Ozempic and Wegovy',
          'Tirzepatide — the active ingredient in Mounjaro and Zepbound (dual GIP/GLP-1)',
          'CULTR prescribes compounded versions through licensed 503A/503B pharmacies',
        ]} />

        <SectionHeading>How They Work</SectionHeading>
        <BulletList items={[
          'Appetite regulation — Signals satiety (fullness) to the brain, reducing hunger and cravings',
          'Gastric emptying — Slows stomach emptying so you feel full longer after meals',
          'Insulin sensitivity — Improves how your body processes blood sugar',
          'Administered via weekly subcutaneous injection (small needle, typically in the abdomen)',
          'Dosage starts low and gradually increases over weeks to manage side effects',
        ]} />

        <SectionHeading>Who Is Eligible?</SectionHeading>
        <Paragraph>CULTR providers evaluate eligibility based on clinical criteria, not just BMI. General eligibility factors include:</Paragraph>
        <BulletList items={[
          'BMI of 27+ with a weight-related health condition, or BMI of 30+',
          'No contraindications (personal or family history of medullary thyroid carcinoma, MEN 2 syndrome)',
          'No active pancreatitis or severe gastrointestinal conditions',
          'Not currently pregnant or planning pregnancy',
          'Clinical evaluation by a licensed CULTR provider is required before prescribing',
        ]} />

        <SectionHeading>What to Expect</SectionHeading>
        <BulletList items={[
          'Weeks 1-4: Low starting dose. Mild appetite reduction. Some may experience nausea.',
          'Weeks 4-8: Dose titration. Appetite suppression becomes more noticeable. Early weight changes.',
          'Weeks 8-12: Therapeutic dose reached. Significant appetite changes. Weight loss becomes consistent.',
          'Ongoing: Provider monitors progress with follow-up labs and consults. Protocol adjustments as needed.',
        ]} />

        <SectionHeading>Common Side Effects</SectionHeading>
        <BulletList items={[
          'Nausea (most common, usually resolves within 2-4 weeks)',
          'Constipation or diarrhea',
          'Injection site reactions',
          'Headache',
          'Most side effects are mild and manageable with proper dose titration',
        ]} />

        <SectionHeading>Talking Points for Your Content</SectionHeading>
        <CopyBlock label="Key Messages">{`→ GLP-1s are FDA-recognized medications, not a "diet pill" or supplement
→ They work WITH your biology, not against it
→ Provider supervision is critical — this isn't a DIY approach
→ CULTR makes these protocols accessible from $199/mo
→ Always frame as "may help" or "can support" — never "guarantees" weight loss`}</CopyBlock>
      </>
    ),
  },

  'peptide-protocols': {
    title: 'Peptide Protocols',
    category: 'Product Education',
    content: () => (
      <>
        <Paragraph>This guide introduces peptide therapy — what peptides are, how CULTR uses them, and key protocols your audience should know about.</Paragraph>

        <SectionHeading>What Are Peptides?</SectionHeading>
        <Paragraph>Peptides are short chains of amino acids (typically 2-50 amino acids long) that act as signaling molecules in the body. They tell your cells to perform specific functions — like releasing growth hormone, reducing inflammation, or supporting tissue repair. They&apos;re not steroids, not hormones, and not supplements.</Paragraph>

        <SectionHeading>How CULTR Uses Peptides</SectionHeading>
        <BulletList items={[
          'All peptide protocols are prescribed by licensed providers after clinical evaluation',
          'Peptides are compounded at licensed US pharmacies (503A/503B compliant)',
          'Protocols are personalized based on your lab results, health goals, and medical history',
          'Your provider monitors progress and adjusts protocols based on follow-up labs',
        ]} />

        <SectionHeading>Common Peptide Categories</SectionHeading>

        <SubHeading>Growth Hormone Secretagogues</SubHeading>
        <Paragraph>These peptides stimulate your body&apos;s natural growth hormone production. Benefits may include improved body composition, better sleep quality, enhanced recovery, and skin health.</Paragraph>
        <BulletList items={[
          'CJC-1295 / Ipamorelin — Most commonly prescribed combination',
          'Sermorelin — Growth hormone releasing hormone analog',
          'Tesamorelin — Approved for reducing visceral fat',
        ]} />

        <SubHeading>Healing & Recovery</SubHeading>
        <Paragraph>These peptides support tissue repair, gut health, and injury recovery:</Paragraph>
        <BulletList items={[
          'BPC-157 — Body Protection Compound, supports gut and tissue healing',
          'TB-500 (Thymosin Beta-4) — Supports wound healing and reduces inflammation',
        ]} />

        <SubHeading>Metabolic & Weight Management</SubHeading>
        <Paragraph>Beyond GLP-1s, other peptides can support metabolic health:</Paragraph>
        <BulletList items={[
          'AOD-9604 — Fragment of growth hormone that may support fat metabolism',
          'MOTS-c — Mitochondrial peptide that may improve metabolic function',
        ]} />

        <SectionHeading>What Peptides Are NOT</SectionHeading>
        <BulletList items={[
          'Not anabolic steroids — they don\'t introduce exogenous hormones',
          'Not supplements — they require a prescription and provider oversight',
          'Not a magic bullet — they work best as part of a comprehensive health protocol',
          'Not unregulated — CULTR only uses peptides from licensed, compliant pharmacies',
        ]} />

        <SectionHeading>Talking Points for Your Content</SectionHeading>
        <CopyBlock label="Key Messages">{`→ Peptides are naturally occurring in the body — therapy uses them at therapeutic levels
→ Always provider-supervised, never self-prescribed
→ They signal your body to do what it already knows how to do — just better
→ Part of a comprehensive protocol that includes labs, nutrition, and monitoring
→ Not a shortcut — a science-backed tool used alongside healthy habits`}</CopyBlock>
      </>
    ),
  },

  'membership-tiers': {
    title: 'Membership Tiers',
    category: 'Product Education',
    content: () => (
      <>
        <Paragraph>Understand CULTR&apos;s membership tiers so you can guide your audience to the right plan. Here&apos;s what each tier includes and who it&apos;s best for.</Paragraph>

        <SectionHeading>CULTR Club (Free)</SectionHeading>
        <BulletList items={[
          'Price: Free — no credit card required',
          'Access to protocol library and peptide calculators',
          'Cycle guides and educational content',
          'Community access',
          'Best for: People exploring health optimization who want to learn before committing',
        ]} />

        <SectionHeading>CULTR Starter ($199/mo)</SectionHeading>
        <BulletList items={[
          'Quarterly telehealth consultations',
          'Comprehensive lab panel (50+ biomarkers)',
          'Basic messaging access with care team',
          'Standard protocol reviews',
          'Peptide Library access',
          'Best for: People starting their optimization journey who want professional guidance',
        ]} />

        <SectionHeading>CULTR Creator ($299/mo)</SectionHeading>
        <BulletList items={[
          'Monthly telehealth consultations',
          'Comprehensive lab panel (50+ biomarkers)',
          'Priority messaging with 24-hour response time',
          'Custom protocol reviews',
          'Full Peptide Library + Protocol Engine access',
          'Best for: Active optimizers who want more frequent touchpoints and customization',
        ]} />

        <SectionHeading>CULTR Cognition ($399/mo)</SectionHeading>
        <BulletList items={[
          'Bi-weekly telehealth consultations',
          'Comprehensive lab panel (50+ biomarkers)',
          'Priority messaging with 24-hour response time',
          'Advanced protocol reviews',
          'Priority scheduling',
          'Full Peptide Library + Protocol Engine access',
          'Best for: Serious optimizers managing multiple protocols or complex health goals',
        ]} />

        <SectionHeading>CULTR Confidante ($499/mo)</SectionHeading>
        <BulletList items={[
          'Weekly telehealth consultations',
          '24/7 messaging access with same-day response',
          'Comprehensive protocol management',
          'Priority scheduling and concierge support',
          'Full Peptide Library + Protocol Engine access',
          'Best for: High-performers who want maximum access and support',
        ]} />

        <SectionHeading>Helping Your Audience Choose</SectionHeading>
        <CopyBlock label="Recommendation Framework">{`→ "Just curious?" → CULTR Club (Free)
→ "Ready to get started" → Starter ($199/mo)
→ "Want regular check-ins" → Creator ($299/mo)
→ "Managing complex goals" → Cognition ($399/mo)
→ "Want maximum access" → Confidante ($499/mo)

The quiz at cultrhealth.com/quiz matches people to their ideal tier automatically.`}</CopyBlock>

        <SectionHeading>Key Selling Points Across All Tiers</SectionHeading>
        <BulletList items={[
          'All tiers include licensed providers and comprehensive lab testing',
          'All medications from licensed US pharmacies',
          'HIPAA-compliant platform',
          'HSA/FSA eligible',
          'Month-to-month, cancel anytime — no long-term contracts',
          'Plans can be upgraded or downgraded at any time',
        ]} />
      </>
    ),
  },

  'faq-cheat-sheet': {
    title: 'FAQ Cheat Sheet',
    category: 'Product Education',
    content: () => (
      <>
        <Paragraph>These are the most common questions your audience will ask about CULTR. Use these answers in your content, DM replies, and comment sections.</Paragraph>

        <SectionHeading>General Questions</SectionHeading>

        <SubHeading>&quot;What is CULTR Health?&quot;</SubHeading>
        <CopyBlock>{`CULTR is a telehealth platform that combines comprehensive lab testing (50+ biomarkers), licensed providers, and personalized protocols including peptides and GLP-1 medications. Plans start at $199/mo.`}</CopyBlock>

        <SubHeading>&quot;Is this legit / a scam?&quot;</SubHeading>
        <CopyBlock>{`CULTR is a licensed medical practice with board-certified providers. All medications come from licensed US pharmacies. The platform is HIPAA compliant. It's real healthcare, delivered through telehealth.`}</CopyBlock>

        <SubHeading>&quot;How is this different from my doctor?&quot;</SubHeading>
        <CopyBlock>{`Most doctors test 5-10 basic blood markers and focus on disease treatment. CULTR tests 50+ biomarkers and focuses on optimization — helping you go from "fine" to feeling your best. Plus, appointments are available within 24-48 hours, not 2-4 weeks.`}</CopyBlock>

        <SectionHeading>Cost & Coverage</SectionHeading>

        <SubHeading>&quot;How much does it cost?&quot;</SubHeading>
        <CopyBlock>{`Plans start at $199/mo for the Starter tier. Higher tiers ($299-$499/mo) include more frequent consultations and advanced features. There's also a free Club tier for access to educational resources. All plans are month-to-month with no long-term contracts.`}</CopyBlock>

        <SubHeading>&quot;Does insurance cover this?&quot;</SubHeading>
        <CopyBlock>{`CULTR doesn't bill insurance directly, but memberships are HSA/FSA eligible. Many members use their health savings accounts to cover the cost. Lab draw fees through Quest/Labcorp may also be submitted to insurance separately.`}</CopyBlock>

        <SubHeading>&quot;Is it worth the price?&quot;</SubHeading>
        <CopyBlock>{`Consider this: a single specialist visit costs $300-500. A concierge doctor runs $5,000-10,000/year. CULTR gives you comprehensive labs, licensed providers, and personalized protocols from $199/mo — less than most gym memberships.`}</CopyBlock>

        <SectionHeading>Treatment Questions</SectionHeading>

        <SubHeading>&quot;Do you prescribe Ozempic/semaglutide?&quot;</SubHeading>
        <CopyBlock>{`CULTR providers can prescribe compounded semaglutide and tirzepatide when clinically appropriate. These are the same active ingredients as Ozempic/Wegovy and Mounjaro/Zepbound, compounded at licensed US pharmacies. Eligibility is determined by your provider based on your labs and health evaluation.`}</CopyBlock>

        <SubHeading>&quot;Are peptides safe?&quot;</SubHeading>
        <CopyBlock>{`Peptides prescribed through CULTR are provider-supervised and sourced from licensed pharmacies. Your provider evaluates your labs and health history before prescribing any protocol. Like any medication, there can be side effects — which is why provider oversight is important.`}</CopyBlock>

        <SubHeading>&quot;What states are you available in?&quot;</SubHeading>
        <CopyBlock>{`CULTR operates in most US states. Availability is verified during signup based on your location. Telehealth regulations vary by state, and CULTR ensures full compliance. If your state isn't covered yet, you can join the waitlist.`}</CopyBlock>

        <SectionHeading>Your Affiliate Questions</SectionHeading>

        <SubHeading>&quot;Do you get paid for this?&quot;</SubHeading>
        <CopyBlock>{`Yes, I'm a CULTR creator and earn a commission on referrals. I only partner with brands I personally use and believe in. [Always be transparent — this builds trust and is legally required.]`}</CopyBlock>

        <SubHeading>&quot;Can I get a discount?&quot;</SubHeading>
        <CopyBlock>{`Yes! Use my code [YOUR CODE] for [discount details]. Link is in my bio / description.`}</CopyBlock>

        <SectionHeading>Quick-Reply Templates for DMs</SectionHeading>
        <CopyBlock label="For people asking about getting started">{`Hey! Thanks for reaching out. The easiest way to get started is to take the 2-minute quiz — it'll match you to the right plan based on your goals: [YOUR LINK]

If you use code [YOUR CODE] you'll get [discount]. Let me know if you have any questions!`}</CopyBlock>

        <CopyBlock label="For people asking about specific treatments">{`Great question! I can share my personal experience, but for specific medical questions the best move is to talk to a CULTR provider — they'll review your labs and health history to recommend the right protocol for you.

You can get started here: [YOUR LINK]`}</CopyBlock>
      </>
    ),
  },
}

/* ─── Page component ─── */
export default function ResourceDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const resource = RESOURCES[slug]

  if (!resource) {
    return (
      <div className="max-w-3xl">
        <Link
          href="/creators/portal/resources"
          className="inline-flex items-center gap-1.5 text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Resources
        </Link>
        <h1 className="text-2xl font-display font-bold text-cultr-forest mb-4">Resource not found</h1>
        <p className="text-sm text-cultr-textMuted">This resource doesn&apos;t exist or has been moved.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/creators/portal/resources"
        className="inline-flex items-center gap-1.5 text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Resources
      </Link>

      <div className="mb-2">
        <span className="text-xs font-display font-bold text-cultr-sage tracking-wider uppercase">{resource.category}</span>
      </div>
      <h1 className="text-2xl font-display font-bold text-cultr-forest mb-6">{resource.title}</h1>

      <div className="prose-cultr">
        {resource.content()}
      </div>
    </div>
  )
}
