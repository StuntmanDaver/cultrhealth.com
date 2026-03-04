import {
  CopyBlock,
  SectionHeading,
  SubHeading,
  Paragraph,
  BulletList,
  type ResourceEntry,
} from '../_components/helpers'

export const salesFunnel: Record<string, ResourceEntry> = {
  'lead-magnets': {
    title: 'Lead Magnet Ideas',
    category: 'Sales Funnel',
    content: () => (
      <>
        <Paragraph>Lead magnets capture audience interest and move them from passive followers to active prospects. Use these ideas to grow your email list and warm up leads before pitching CULTR.</Paragraph>

        <SectionHeading>1. Metabolic Reset Score Quiz</SectionHeading>
        <Paragraph>A short quiz that estimates someone&apos;s metabolic readiness and recommends a starting point.</Paragraph>
        <BulletList items={[
          'Format: 5-7 question quiz hosted on your landing page or social bio link',
          'Questions cover: energy levels, weight history, sleep quality, diet patterns, exercise frequency',
          'Output: A "Metabolic Readiness Score" (1-10) with a personalized recommendation',
          'CTA at the end: "Want to know your REAL metabolic markers? CULTR tests 28–59 biomarkers → [LINK]"',
          'Best for: Weight Loss Seekers, Busy Professionals',
        ]} />

        <CopyBlock label="Example Quiz Hook">{`"How metabolically healthy are you REALLY? Take this 2-minute quiz to find out — then see how your score compares to 50+ actual biomarkers."

[Quiz ends with recommendation to get real labs through CULTR]`}</CopyBlock>

        <SectionHeading>2. Recovery Hygiene Checklist</SectionHeading>
        <Paragraph>A downloadable PDF checklist covering the fundamentals of recovery optimization.</Paragraph>
        <BulletList items={[
          'Format: PDF checklist (1-2 pages)',
          'Sections: Sleep hygiene (8 items), nutrition timing (6 items), training recovery (6 items), inflammation management (4 items)',
          'Natural lead-in: "Doing all these and still not recovering? Your labs might explain why."',
          'CTA: "Get your inflammation markers tested through CULTR → [LINK]"',
          'Best for: Athletes, Fitness Enthusiasts',
        ]} />

        <SectionHeading>3. Biological Age Baseline Planner</SectionHeading>
        <Paragraph>A guide that helps people understand biological age and what they can do to improve it.</Paragraph>
        <BulletList items={[
          'Format: PDF guide (3-4 pages)',
          'Contents: What biological age is, the biomarkers that determine it, lifestyle factors that accelerate aging, 30-day action plan',
          'Natural lead-in: "Want to know your ACTUAL biological age? CULTR can test it."',
          'CTA: "Get your comprehensive biomarker panel and biological age assessment → [LINK]"',
          'Best for: Biohackers, Health-conscious 35+, Longevity-curious',
        ]} />

        <SectionHeading>4. Finals Week Stability Protocol</SectionHeading>
        <Paragraph>A targeted guide for students or high-performers facing high-stress periods.</Paragraph>
        <BulletList items={[
          'Format: PDF or carousel post (5-7 slides)',
          'Contents: Sleep optimization for stress periods, nutrition for sustained focus, caffeine timing strategy, movement breaks, stress management techniques',
          'Natural lead-in: "If stress tanks your performance every semester, your cortisol might be the issue."',
          'CTA: "CULTR tests cortisol, thyroid, and 48 other markers that affect your performance → [LINK]"',
          'Best for: Students, Focus Seekers, High Achievers',
        ]} />

        <SectionHeading>5. Supplement Stack Scorecard</SectionHeading>
        <Paragraph>A self-assessment tool that helps people evaluate whether their current supplements are data-backed.</Paragraph>
        <BulletList items={[
          'Format: Interactive scorecard (PDF or web form)',
          'Contents: List the top 20 common supplements, rate each on evidence quality, highlight which ones require lab testing to verify need',
          'Key insight: "Most people take 5+ supplements but have never tested whether they need them"',
          'CTA: "Stop guessing. CULTR\'s Stack Audit matches your supplements to your actual labs → [LINK]"',
          'Best for: Biohackers, Supplement users, Wellness-focused audiences',
        ]} />

        <SectionHeading>Implementation Tips</SectionHeading>
        <BulletList items={[
          'Gate the download behind an email opt-in to build your list',
          'Follow up with your nurture sequence (see Nurture Sequence resource)',
          'Mention the lead magnet in your bio link, pinned posts, and email signature',
          'Create 2-3 short-form videos promoting each lead magnet',
          'Always include your CULTR tracking link in the PDF itself',
        ]} />
      </>
    ),
  },

  'landing-page-blueprint': {
    title: 'Landing Page Blueprint',
    category: 'Sales Funnel',
    content: () => (
      <>
        <Paragraph>If you&apos;re building a landing page to promote CULTR (for ads, link-in-bio, or email), follow this section-by-section blueprint for maximum conversions.</Paragraph>

        <SectionHeading>Section 1: Hero</SectionHeading>
        <CopyBlock label="Template">{`HEADLINE: [Outcome-focused statement]
Examples:
- "Stop guessing about your health. Start testing."
- "The protocols elite athletes use — now from $199/mo."
- "28–59 biomarkers. Licensed providers. Personalized protocols."

SUBHEADLINE: [Supporting context]
- "CULTR Health combines comprehensive lab testing with provider-supervised protocols to optimize your health — not just treat disease."

CTA BUTTON: "Take the Quiz" or "See Your Plan" → [YOUR LINK]

TRUST BADGES: "Licensed Providers" | "28–59 Biomarkers" | "HIPAA Compliant" | "HSA/FSA Eligible"`}</CopyBlock>

        <SectionHeading>Section 2: Problem Statement</SectionHeading>
        <CopyBlock label="Template">{`HEADING: "Sound familiar?"

PAIN POINTS (pick 3-4 that match your audience):
- "Your doctor says you're fine — but you don't FEEL fine."
- "You've tried every diet and nothing sticks."
- "You're spending $300/mo on supplements you've never tested against your labs."
- "Recovery takes longer than it used to."
- "Brain fog and afternoon crashes are your new normal."
- "You're 'medically normal' but nowhere near optimal."`}</CopyBlock>

        <SectionHeading>Section 3: Solution Overview</SectionHeading>
        <CopyBlock label="Template">{`HEADING: "Here's what CULTR does differently"

3-STEP PROCESS:
1. Take the Quiz — "2 minutes to match you with the right plan."
2. Talk to a Provider — "A licensed provider reviews your labs and builds YOUR protocol."
3. Get Optimized — "Personalized protocols delivered to your door. Quarterly retesting to track progress."

KEY DIFFERENTIATORS:
- 28–59 biomarkers (vs. the 5-10 your doctor tests)
- Licensed, board-certified providers
- Peptides, GLP-1s, and hormone optimization
- From $199/mo (less than most gym memberships)`}</CopyBlock>

        <SectionHeading>Section 4: Social Proof</SectionHeading>
        <CopyBlock label="Template">{`HEADING: "Real results from real members"

YOUR TESTIMONIAL: Share your personal experience with specific details.

STATS (use actual CULTR stats when available):
- "5,000+ members optimizing their health"
- "28–59 biomarkers tested per panel"
- "Licensed providers in [X] states"

TRUST ELEMENTS:
- Your personal photo/video using the platform
- Screenshot of the CULTR app or quiz (if permitted)
- Your FTC disclosure clearly visible`}</CopyBlock>

        <SectionHeading>Section 5: Pricing Anchor</SectionHeading>
        <CopyBlock label="Template">{`HEADING: "Less than a gym membership"

COMPARISON:
- Single specialist visit: $300-500
- Concierge medicine: $5,000-10,000/year
- CULTR: From $199/mo (comprehensive labs + provider + protocols included)

ADDITIONAL: "HSA/FSA eligible. Month-to-month. Cancel anytime."

YOUR CODE: "Use code [YOUR CODE] for [discount details]"

CTA BUTTON: "Get Started" → [YOUR LINK]`}</CopyBlock>

        <SectionHeading>Section 6: FAQ</SectionHeading>
        <Paragraph>Include 4-5 questions from your FAQ Cheat Sheet (see Product Education resources). Focus on objections that prevent conversion: cost, legitimacy, side effects, time commitment.</Paragraph>

        <SectionHeading>Section 7: Final CTA</SectionHeading>
        <CopyBlock label="Template">{`HEADING: "Your health has a story. 28–59 biomarkers will tell it."
SUBHEADING: "Take the 2-minute quiz to find your plan."
CTA BUTTON: "Start Now" → [YOUR LINK]
DISCLOSURE: "Paid partnership with CULTR Health. [YOUR CODE] for [discount]."`}</CopyBlock>
      </>
    ),
  },

  'nurture-sequence': {
    title: '14-Day Nurture Sequence',
    category: 'Sales Funnel',
    content: () => (
      <>
        <Paragraph>This 14-day email/SMS nurture sequence warms leads from first touch to conversion. Use it after someone downloads a lead magnet or opts into your list.</Paragraph>

        <SectionHeading>Sequence Overview</SectionHeading>
        <BulletList items={[
          'Days 1-3: Education & Trust Building',
          'Days 4-7: Problem Awareness & Agitation',
          'Days 8-11: Solution Introduction & Social Proof',
          'Days 12-14: Conversion & Urgency',
        ]} />

        <SectionHeading>Days 1-3: Education & Trust</SectionHeading>

        <SubHeading>Day 1 — Welcome + Value Delivery</SubHeading>
        <CopyBlock label="Subject: Here's your [lead magnet name]">{`Hey [Name],

Thanks for grabbing [lead magnet name] — here's your download link: [LINK]

Quick intro: I'm [Your Name]. I've been on a health optimization journey for [timeframe] and I partner with CULTR Health because it's the first platform that actually matched my protocols to my LAB DATA — not just my symptoms.

Over the next couple weeks, I'll share what I've learned about [topic area]. No fluff, just what actually works.

Talk soon,
[Your Name]

P.S. Hit reply and tell me — what's your #1 health goal right now?`}</CopyBlock>

        <SubHeading>Day 2 — Educational Value</SubHeading>
        <CopyBlock label="Subject: The difference between 'normal' and 'optimal'">{`[Share a specific insight about lab ranges, metabolic health, or biomarkers. Keep it educational — no selling yet. End with a teaser for tomorrow's email.]`}</CopyBlock>

        <SubHeading>Day 3 — Personal Story</SubHeading>
        <CopyBlock label="Subject: What my labs revealed (I was shocked)">{`[Share your personal lab result story. What did you find? What surprised you? How did it change your approach? Still educational — building credibility.]`}</CopyBlock>

        <SectionHeading>Days 4-7: Problem Awareness</SectionHeading>

        <SubHeading>Day 4 — The Standard Care Gap</SubHeading>
        <CopyBlock label="Subject: Why 'your labs are normal' isn't good enough">{`[Explain the problem with standard lab testing — only 5-10 markers, population-based ranges, reactive vs. proactive care. Agitate the pain point without being alarmist.]`}</CopyBlock>

        <SubHeading>Day 5 — Cost of Inaction</SubHeading>
        <CopyBlock label="Subject: What happens when you ignore the data">{`[Discuss the downstream effects of not testing: missed imbalances, wasted money on supplements, years of suboptimal health. Frame as opportunity cost, not fear.]`}</CopyBlock>

        <SubHeading>Day 6 — Common Misconceptions</SubHeading>
        <CopyBlock label="Subject: 3 things I got wrong about [topic]">{`[Share myth-busts relevant to your audience. Use the myth-busts from your Content Pillars resources.]`}</CopyBlock>

        <SubHeading>Day 7 — Bridge to Solution</SubHeading>
        <CopyBlock label="Subject: So what actually works?">{`[Transition from problem awareness to solution. Preview CULTR without heavy selling. "I started looking for something different..."]`}</CopyBlock>

        <SectionHeading>Days 8-11: Solution & Social Proof</SectionHeading>

        <SubHeading>Day 8 — CULTR Introduction</SubHeading>
        <CopyBlock label="Subject: This is what changed everything for me">{`[Formally introduce CULTR. Explain what it is, how it works (quiz → provider → protocol), and why you chose it. Include your first CTA link.]`}</CopyBlock>

        <SubHeading>Day 9 — Feature Deep-Dive</SubHeading>
        <CopyBlock label="Subject: 28–59 biomarkers. Here's what they test.">{`[Walk through what comprehensive testing actually includes. Make it tangible and impressive without being overwhelming.]`}</CopyBlock>

        <SubHeading>Day 10 — Objection Handling</SubHeading>
        <CopyBlock label="Subject: Your top questions, answered">{`[Use the FAQ Cheat Sheet content. Address: cost, legitimacy, side effects, how it differs from a regular doctor.]`}</CopyBlock>

        <SubHeading>Day 11 — Social Proof</SubHeading>
        <CopyBlock label="Subject: It's not just me">{`[Share member stories, your own results, or community data points. "5,000+ members" is powerful. Always include individual results disclaimer.]`}</CopyBlock>

        <SectionHeading>Days 12-14: Conversion</SectionHeading>

        <SubHeading>Day 12 — The Offer</SubHeading>
        <CopyBlock label="Subject: Ready? Here's how to get started (+ a discount)">{`[Clear CTA: Take the quiz. Use code [YOUR CODE] for [discount]. Explain what happens after they sign up. Remove friction.]`}</CopyBlock>

        <SubHeading>Day 13 — Urgency (Soft)</SubHeading>
        <CopyBlock label="Subject: Every month you wait is a month of data you're missing">{`[Frame urgency around opportunity cost, not fake scarcity. "You can't optimize what you don't measure." Reiterate the offer.]`}</CopyBlock>

        <SubHeading>Day 14 — Final Push</SubHeading>
        <CopyBlock label="Subject: Last chance for [discount]">{`[Final email with clear CTA. Summarize the value: "28–59 biomarkers + licensed provider + personalized protocol from $199/mo." Discount code expires soon. FTC disclosure.]`}</CopyBlock>

        <SectionHeading>Tips for the Sequence</SectionHeading>
        <BulletList items={[
          'Send at the same time each day for consistency (8-10am works well)',
          'Keep emails under 300 words — people skim on mobile',
          'Every email should have exactly ONE call to action',
          'Include FTC disclosure in every email that mentions CULTR',
          'Track open rates and click-through rates to optimize subject lines',
        ]} />
      </>
    ),
  },

  'dm-conversion-scripts': {
    title: 'DM & Booking Scripts',
    category: 'Sales Funnel',
    content: () => (
      <>
        <Paragraph>Casual, persuasive, human-sounding outreach templates for Instagram DMs. Use these to reach out to potential creator partners or warm leads. Personalize before sending — generic messages get ignored.</Paragraph>

        <SectionHeading>How to Use These Templates</SectionHeading>
        <BulletList items={[
          'Personalize the first line with one specific reference to a recent post, story, or topic',
          'Fill in placeholders like [Name] and [fitness/wellness/etc.] before sending',
          'Keep the CTA low-friction: "Want me to send details?" or "Open to me sending a quick overview?"',
          'Avoid overpromising language like "we can supply anything you need"',
        ]} />

        <SectionHeading>Version 1 — Best Balance (Casual + Persuasive)</SectionHeading>
        <CopyBlock>{`Hey [Name] — been following your content for a bit, really like how you talk about [fitness/longevity/health/etc.].

I co-run a new telehealth longevity clinic, and we're looking to partner with a few creators we actually align with.

Would you be open to trying one of our programs/products in exchange for a few honest posts/stories if it's a fit?

Everything is U.S. compounded and prescription-based where applicable, so it's all legit and handled properly.

We're also building an ambassador program with up to 20% commission on referrals if you end up liking it.

If you're interested, I can send a quick overview and keep it simple.`}</CopyBlock>

        <SectionHeading>Version 2 — More Direct (Slightly Stronger Close)</SectionHeading>
        <CopyBlock>{`Hey [Name], love your content.

I'm one of the owners of a new telehealth longevity clinic and wanted to reach out because I think your audience is a strong fit.

We're looking for a few creators to test our products/programs and share honest feedback/content in exchange for product support (and potentially a paid ambassador setup after).

We also offer up to 20% commission on referrals through our ambassador program.

Everything is U.S. compounded and prescription-based where applicable.

Open to me sending details?`}</CopyBlock>

        <SectionHeading>Version 3 — Super Casual / Conversational</SectionHeading>
        <CopyBlock>{`Hey [Name] — quick one.

Really like your content and the way you talk to your audience.

I help run a new telehealth longevity clinic, and we're looking to work with a few creators. If you're open, we'd love to send you something to try and see if there's a fit for a few posts/stories.

We're also putting together an ambassador program (up to 20% referral commission) if it makes sense after that.

All U.S. compounded, prescription-based where applicable.

Want me to send more info?`}</CopyBlock>

        <SectionHeading>Female Creator Version (Warm, Respectful, Brand-Aligned)</SectionHeading>
        <CopyBlock>{`Hey [Name] — I've been following your content and really like your vibe. The way you talk about [wellness/fitness/lifestyle] feels super genuine.

I co-run a new telehealth longevity clinic, and we're looking to partner with a small group of creators we actually align with.

Would you be open to trying one of our programs/products in exchange for a few honest stories/posts if it feels like a fit?

Everything is U.S. compounded and prescription-based where applicable, so it's all handled properly.

We're also building an ambassador program with up to 20% commission on referrals if you end up loving it.

Happy to send a quick overview if you're interested.`}</CopyBlock>

        <SectionHeading>High-Ticket Influencer Version (Concise, Professional, Premium)</SectionHeading>
        <CopyBlock>{`Hey [Name] — reaching out because I think there could be a strong fit here.

I'm one of the owners of a new telehealth longevity clinic, and we're selectively partnering with creators whose audience aligns with performance, health, and longevity.

We'd love to explore a collaboration — starting with product/program access and a simple content partnership, with room to expand into a longer-term ambassador relationship if there's alignment.

Everything is U.S. compounded and prescription-based where applicable.

If you're open to it, I can send a short overview and see if it makes sense to talk.`}</CopyBlock>

        <SectionHeading>Micro-Creator / Campus Ambassador Version (Friendly, Opportunity-Forward)</SectionHeading>
        <CopyBlock>{`Hey [Name] — love your content. You've got a real voice, and that stands out.

I help run a new telehealth longevity clinic, and we're building an early ambassador group with creators who have strong trust with their audience (not just huge followings).

We can send product/program support to try, and if it's a fit, we're offering up to 20% commission on referrals through our ambassador program.

Everything is U.S. compounded and prescription-based where applicable.

If you're interested, I can send details — no pressure at all.`}</CopyBlock>

        <SectionHeading>Follow-Up DM (No Response After 3–5 Days)</SectionHeading>
        <CopyBlock label="Soft nudge">{`Hey [Name] — just wanted to bump this in case it got buried.

Totally understand if now isn't the right time, but if you're open to hearing more, I can send a quick overview of what we're building and how the partnership works.

Either way, appreciate your time.`}</CopyBlock>

        <SectionHeading>Pro Tip</SectionHeading>
        <Paragraph>Create a few personalized opening lines by niche (fitness coach, athlete, student creator, wellness creator) and reuse the same core message. The opener is what gets the reply — the rest closes it.</Paragraph>
      </>
    ),
  },
}
