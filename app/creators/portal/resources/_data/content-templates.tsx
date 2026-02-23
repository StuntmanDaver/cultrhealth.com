import {
  CopyBlock,
  SectionHeading,
  SubHeading,
  Paragraph,
  BulletList,
  type ResourceEntry,
} from '../_components/helpers'

export const contentTemplates: Record<string, ResourceEntry> = {
  'short-form-hooks': {
    title: 'Short-Form Hooks',
    category: 'Content Templates',
    content: () => (
      <>
        <Paragraph>Use these 15-second hook scripts for Instagram Reels, TikTok, and YouTube Shorts. Each hook is designed to stop the scroll and lead into your CULTR content. Customize with your personal experience.</Paragraph>

        <SectionHeading>Hook Formula</SectionHeading>
        <Paragraph>Every great short-form hook follows this pattern: Bold claim or question &rarr; Personal credibility &rarr; Call to action. Keep the first 2 seconds punchy &mdash; that&apos;s where you win or lose the viewer.</Paragraph>

        <SubHeading>Weight Loss / GLP-1 Hooks</SubHeading>
        <CopyBlock label="Hook 1 — The Revelation">{`I lost [X] pounds in [timeframe] and I didn't starve myself, do a crash diet, or spend 2 hours in the gym.

Here's what actually worked — and no, it's not what you think.

[Transition to talking about GLP-1 protocols through CULTR]`}</CopyBlock>

        <CopyBlock label="Hook 2 — The Myth Buster">{`"Just eat less and move more" — yeah, I tried that for [X] years.

Turns out my hormones were working against me the entire time.

Once I got my labs done through CULTR and started the right protocol, everything changed.`}</CopyBlock>

        <CopyBlock label="Hook 3 — The Question">{`What if the reason you can't lose weight has nothing to do with willpower?

I got 28–59 biomarkers tested — here's what they found.

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
- "I'm going to show you exactly what happened when I got 28–59 biomarkers tested"
- Quick mention: This video is sponsored by / in partnership with CULTR

SECTION 1: THE PROBLEM (1:00-3:00)
- Talk about the standard doctor visit experience
- How most doctors only test 5-10 markers
- The frustration of "your labs are normal" when you don't feel normal
- Mention wait times, limited appointment slots, generic advice

SECTION 2: WHAT CULTR DOES DIFFERENTLY (3:00-5:00)
- Explain the CULTR model: telehealth + comprehensive labs + personalized protocols
- 28–59 biomarkers tested vs. standard 5-10
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
   - CULTR tests 28–59 biomarkers to find the root cause, not just treat symptoms

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

I recently started working with CULTR Health. They're a telehealth platform that does comprehensive lab testing (28–59 biomarkers, not the basic 5 your doctor runs) and matches you with licensed providers who build personalized protocols.

I'm talking peptides, hormone optimization, GLP-1 protocols — the kind of stuff that used to cost $5K+ per year at concierge clinics. CULTR starts at $199/mo.

Here's what sold me: [INSERT YOUR PERSONAL EXPERIENCE — e.g., "I got my labs back and found out my testosterone was technically 'normal' but way below optimal. My provider built a protocol and within 8 weeks I had more energy than I've had in years."]

If you've ever felt like your doctor says "you're fine" but you know something's off — this is worth looking into.

\u{1F449} Take the 2-minute quiz to see which plan fits you: [YOUR LINK]

Use code [YOUR CODE] for [discount details].

[Your sign-off]

P.S. This is a paid partnership with CULTR Health. I only partner with companies I personally use and believe in.`}</CopyBlock>

        <SectionHeading>Email 2: Results / Follow-Up</SectionHeading>
        <CopyBlock label="Subject: My lab results are in (and I was surprised)">{`Hey [First Name],

Quick update on my CULTR Health journey — I got my comprehensive lab panel back.

28–59 biomarkers tested. Here's what stood out:

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
        <CopyBlock label="Caption 1 — Lab Results Post">{`Just got my comprehensive lab panel back from @cultrhealth and WOW. \u{1F9EA}

28–59 biomarkers tested. Turns out [your finding — e.g., "my vitamin D was in the tank and my cortisol was through the roof"].

This is why "you're fine" from your regular doctor isn't enough.

I'm working with a licensed provider to build a personalized protocol and I'll keep you updated on results.

Want to see what your labs reveal? Link in bio \u{1F446}

Use code [YOUR CODE] for [discount].

#ad #cultrhealth #healthoptimization #peptides #labwork #biohacking`}</CopyBlock>

        <CopyBlock label="Caption 2 — Progress Update">{`[X] weeks on my CULTR protocol and here's what's changed:

\u2705 [Result 1 — e.g., "Energy levels are up — no more 2pm crash"]
\u2705 [Result 2 — e.g., "Sleep quality improved dramatically"]
\u2705 [Result 3 — e.g., "Down 8 lbs without changing my diet"]

This isn't guesswork. It's data-driven protocols from licensed providers, personalized to MY body.

Plans start at $199/mo. Take the quiz to find yours \u2192 link in bio

#partner #cultrhealth #healthjourney #peptidetherapy #glp1`}</CopyBlock>

        <CopyBlock label="Caption 3 — Educational">{`Your doctor tests 5-10 blood markers.
CULTR tests 50+.

Here's what most panels miss:
\u2192 Comprehensive hormone profile
\u2192 Inflammation markers (hs-CRP)
\u2192 Advanced thyroid panel
\u2192 Nutrient deficiencies
\u2192 Metabolic markers

This is the difference between "you're fine" and actually feeling your best.

Link in bio to take the quiz and find your plan.

#ad #cultrhealth #labwork #preventivehealth #longevity`}</CopyBlock>

        <SectionHeading>Twitter/X Posts</SectionHeading>
        <CopyBlock label="Tweet 1">{`My doctor: "Your labs are normal"
CULTR: "Here are 3 things we found that explain why you feel like garbage"

28–59 biomarkers > the basic 5. Link in bio.

#ad @cultrhealth`}</CopyBlock>

        <CopyBlock label="Tweet 2">{`The same longevity protocols celebrities pay $10K/year for — now from $199/mo.

Licensed providers. Personalized peptide protocols. 28–59 biomarker testing (SiPho Health).

Not a supplement company. An actual medical practice. @cultrhealth

#partner`}</CopyBlock>

        <CopyBlock label="Tweet 3">{`Peptides are not steroids.

They're short amino acid chains that signal your body to do what it already knows how to do — just better.

Provider-supervised. Licensed pharmacy. Real science.

This is what CULTR does. [YOUR LINK] #ad`}</CopyBlock>

        <SectionHeading>Disclosure Reminder</SectionHeading>
        <Paragraph>Always include #ad, #partner, or #sponsored visibly in your caption &mdash; not buried in a wall of hashtags. See the FTC Disclosure Guide for full requirements.</Paragraph>
      </>
    ),
  },
}
