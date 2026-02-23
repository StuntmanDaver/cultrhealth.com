import {
  CopyBlock,
  SectionHeading,
  SubHeading,
  Paragraph,
  BulletList,
  DataTable,
  type ResourceEntry,
} from '../_components/helpers'

export const messagingPlaybook: Record<string, ResourceEntry> = {
  'compliance-safe-claims': {
    title: 'Outcomes-First Claims',
    category: 'Messaging Playbook',
    content: () => (
      <>
        <Paragraph>These 10 compliance-safe marketing claims are ready to copy into your content. Each follows the &quot;outcomes-first&quot; framework &mdash; leading with the result the audience wants while staying within FTC/FDA guardrails.</Paragraph>

        <SectionHeading>The 10 Core Claims</SectionHeading>
        <Paragraph>Each claim can be used across short-form, long-form, captions, and email. Always pair with your personal experience and an FTC disclosure.</Paragraph>

        <CopyBlock label="Claim 1 — The Data Advantage">{`"Your doctor tests 5 markers. CULTR tests 50+. That's the difference between 'you're fine' and actually knowing what's going on."

Why it works: Specific numbers, no medical claim, positions CULTR as more thorough.`}</CopyBlock>

        <CopyBlock label="Claim 2 — The Accessibility Play">{`"The same protocols used by executives and elite athletes — now from $199/mo with a licensed provider."

Why it works: Aspirational framing without guaranteeing outcomes.`}</CopyBlock>

        <CopyBlock label="Claim 3 — The Hormone Hook">{`"'Normal' lab ranges are based on the general population. Optimal is a completely different standard — and that's what CULTR optimizes for."

Why it works: Educational, challenges assumptions, no disease claim.`}</CopyBlock>

        <CopyBlock label="Claim 4 — The Personal Proof">{`"I got my labs done through CULTR and found [X] things my annual physical never caught. Individual results vary — but you can't fix what you don't measure."

Why it works: First-person, includes disclaimer, ends with a principle.`}</CopyBlock>

        <CopyBlock label="Claim 5 — The Time Save">{`"No 6-week wait for an appointment. No 15-minute rush job. CULTR matches you with a provider who actually has time to review your full picture."

Why it works: Addresses real frustration, doesn't bash specific doctors.`}</CopyBlock>

        <CopyBlock label="Claim 6 — The Simplicity Frame">{`"Take a quiz. Talk to a provider. Get a protocol built for YOUR body. That's it — no guesswork, no gatekeeping."

Why it works: Removes friction anxiety, simple 3-step pattern.`}</CopyBlock>

        <CopyBlock label="Claim 7 — The Peptide Demystifier">{`"Peptides aren't steroids. They're short amino acid chains that signal your body to do what it already knows how to do — just more efficiently."

Why it works: Addresses skepticism directly, educational tone.`}</CopyBlock>

        <CopyBlock label="Claim 8 — The Proactive Positioning">{`"Most healthcare is reactive — you wait until something breaks. CULTR is proactive — test, optimize, and stay ahead of problems."

Why it works: Reframes category, no specific disease prevention claim.`}</CopyBlock>

        <CopyBlock label="Claim 9 — The Cost Comparison">{`"A single specialist visit: $300-500. Concierge medicine: $5K-10K/year. CULTR: $199/mo with comprehensive labs, licensed providers, and personalized protocols."

Why it works: Tangible price anchoring, all numbers are verifiable.`}</CopyBlock>

        <CopyBlock label="Claim 10 — The Results Frame">{`"I used to think feeling tired all the time was just 'getting older.' Turns out my labs told a different story. Individual results vary — but data doesn't lie."

Why it works: Relatable experience, includes disclaimer, curiosity-driven.`}</CopyBlock>

        <SectionHeading>How to Use These Claims</SectionHeading>
        <BulletList items={[
          'Pick 2-3 claims that match your personal experience and audience',
          'Rotate claims across your content calendar — don\'t repeat the same one',
          'Always add your personal story after the claim for authenticity',
          'Pair every claim with an FTC disclosure (#ad or #partner)',
          'Customize bracketed sections with your actual numbers and experiences',
        ]} />
      </>
    ),
  },

  'messaging-matrix': {
    title: 'Messaging Matrix',
    category: 'Messaging Playbook',
    content: () => (
      <>
        <Paragraph>This matrix maps desired outcomes to audience types and proof mechanisms. Use it to tailor your messaging for different segments of your audience.</Paragraph>

        <SectionHeading>Outcome &rarr; Audience &rarr; Proof</SectionHeading>
        <Paragraph>Find the outcome your audience cares about, then use the matched audience angle and proof mechanism in your content.</Paragraph>

        <DataTable
          headers={['Outcome', 'Best Audience', 'Proof Mechanism']}
          rows={[
            ['Weight loss without crash diets', 'Weight Loss Seekers, Busy Professionals', 'Waist-to-height ratio trend, clothing size changes'],
            ['More energy throughout the day', 'High Achievers, Athletes, Parents', 'Sleep score improvements, caffeine reduction timeline'],
            ['Better recovery from training', 'Athletes, Fitness Enthusiasts', 'Training readiness scores, soreness reduction timeline'],
            ['Hormone optimization', 'Men 30+, Women post-birth control', 'Before/after lab panels (general categories only)'],
            ['Reduced inflammation', 'Chronic fatigue sufferers, Athletes', 'hs-CRP trends, joint comfort improvements'],
            ['Improved sleep quality', 'Everyone — universal pain point', 'Sleep regularity score, hours of deep sleep'],
            ['Mental clarity & focus', 'Students, Entrepreneurs, Creatives', 'Productivity metrics, brain fog frequency reduction'],
            ['Longevity & healthspan', 'Biohackers, Health-conscious 35+', 'Biological age score, biomarker optimization %'],
          ]}
        />

        <SectionHeading>How to Use the Matrix</SectionHeading>
        <BulletList items={[
          'Identify which outcome resonates most with YOUR specific audience',
          'Lead content with the outcome (not the product)',
          'Use the proof mechanism as your "evidence" — share your own data points',
          'Match the audience column to your content\'s target demographic',
          'Rotate through 2-3 outcomes per week to avoid message fatigue',
        ]} />

        <SectionHeading>Messaging by Funnel Stage</SectionHeading>
        <SubHeading>Top of Funnel (Awareness)</SubHeading>
        <Paragraph>Lead with outcomes and curiosity. Don&apos;t mention CULTR yet.</Paragraph>
        <CopyBlock>{`"What if the reason you're always tired has nothing to do with sleep?"
"I stopped guessing about my health and started testing. Here's what changed."`}</CopyBlock>

        <SubHeading>Middle of Funnel (Consideration)</SubHeading>
        <Paragraph>Introduce CULTR as the solution. Use proof mechanisms.</Paragraph>
        <CopyBlock>{`"I got 28–59 biomarkers tested through CULTR — here are the 3 things that surprised me."
"My provider built a protocol based on MY data, not a generic one-size-fits-all plan."`}</CopyBlock>

        <SubHeading>Bottom of Funnel (Conversion)</SubHeading>
        <Paragraph>Direct CTA with urgency and social proof.</Paragraph>
        <CopyBlock>{`"Take the 2-minute quiz to see which plan fits your goals: [LINK]"
"Use code [CODE] for [discount] — I've been using CULTR for [X] months and it's worth every dollar."`}</CopyBlock>
      </>
    ),
  },

  'audience-segments': {
    title: 'Audience Segments',
    category: 'Messaging Playbook',
    content: () => (
      <>
        <Paragraph>Understanding who you&apos;re talking to changes everything about your messaging. Here are 7 target audience profiles with their pain points, preferred channels, and best offers to promote.</Paragraph>

        <SectionHeading>Segment 1: The Athlete</SectionHeading>
        <BulletList items={[
          'Pain points: Recovery inconsistency, performance plateaus, injury prevention',
          'What they want: Data-driven training optimization, faster recovery, competitive edge',
          'Channels: Instagram Reels, YouTube, fitness podcasts',
          'Best offer: Catalyst+ tier (peptide stacking for recovery)',
          'Proof that converts: Training readiness scores, recovery timelines, soreness reduction',
        ]} />

        <SectionHeading>Segment 2: The Busy Professional</SectionHeading>
        <BulletList items={[
          'Pain points: Low energy, brain fog, no time for doctor visits, stress-related weight gain',
          'What they want: Efficient healthcare that fits their schedule, tangible energy improvements',
          'Channels: LinkedIn, Twitter/X, email newsletters, podcasts',
          'Best offer: Core tier (simple, effective, time-efficient)',
          'Proof that converts: Energy level changes, productivity metrics, "time saved" framing',
        ]} />

        <SectionHeading>Segment 3: The Weight Loss Seeker</SectionHeading>
        <BulletList items={[
          'Pain points: Failed diets, slow metabolism, "I\'ve tried everything" fatigue',
          'What they want: Something that actually works, provider-supervised protocols',
          'Channels: TikTok, Instagram, Facebook groups, YouTube',
          'Best offer: Core tier with GLP-1 protocols',
          'Proof that converts: Personal weight loss timeline, waist measurements, before/after feelings (NOT photos)',
        ]} />

        <SectionHeading>Segment 4: The Biohacker</SectionHeading>
        <BulletList items={[
          'Pain points: Information overload, wants clinical-grade access, tired of supplements that don\'t work',
          'What they want: Comprehensive labs, peptide protocols, data to optimize',
          'Channels: Twitter/X, YouTube long-form, Reddit, podcasts',
          'Best offer: Catalyst+ tier (full peptide access + protocol engine)',
          'Proof that converts: Biomarker trends, biological age scores, protocol details',
        ]} />

        <SectionHeading>Segment 5: The Wellness-Focused Woman</SectionHeading>
        <BulletList items={[
          'Pain points: Hormonal imbalances dismissed by doctors, fatigue, gut issues, anxiety',
          'What they want: A provider who listens, comprehensive hormone testing, holistic approach',
          'Channels: Instagram, TikTok, podcasts, Pinterest',
          'Best offer: Core or Catalyst+ tier depending on complexity',
          'Proof that converts: "My provider actually listened" story, hormone category improvements, energy changes',
        ]} />

        <SectionHeading>Segment 6: The Skeptic</SectionHeading>
        <BulletList items={[
          'Pain points: Distrust of health claims, burned by wellness industry before, thinks it\'s "too good to be true"',
          'What they want: Evidence, transparency, real credentials, honest answers',
          'Channels: YouTube long-form, Twitter/X, podcast appearances',
          'Best approach: Lead with skepticism ("I thought the same thing"), show credentials (licensed providers, pharmacies), share personal data journey',
          'Proof that converts: Lab result walkthrough, "I was skeptical too" narrative, provider credentials',
        ]} />

        <SectionHeading>Segment 7: The Focus Seeker</SectionHeading>
        <BulletList items={[
          'Pain points: Brain fog, afternoon energy crashes, inability to focus, cognitive decline concerns',
          'What they want: Mental clarity, sustained energy, cognitive optimization',
          'Channels: Twitter/X, LinkedIn, productivity-focused YouTube, podcasts',
          'Best offer: Core or Catalyst+ tier with metabolic and cognitive protocols',
          'Proof that converts: Focus/productivity improvements, caffeine reduction, sleep quality changes',
        ]} />

        <SectionHeading>Matching Your Audience to Content</SectionHeading>
        <CopyBlock label="Quick Reference">{`Athletes → Recovery content, peptide education, training data
Professionals → Time-saving angle, energy optimization, efficiency
Weight Loss → GLP-1 education, personal journey, myth-busting
Biohackers → Deep lab breakdowns, protocol details, data-first content
Wellness Women → Hormone education, provider relationship, holistic approach
Skeptics → Credential-first, evidence-heavy, "I was skeptical too" narrative
Focus Seekers → Cognitive optimization, energy data, productivity metrics`}</CopyBlock>
      </>
    ),
  },

  'objection-handling': {
    title: 'Objection Handling',
    category: 'Messaging Playbook',
    content: () => (
      <>
        <Paragraph>Every audience segment has specific objections that prevent them from taking action. Here&apos;s how to address each one in your content and DMs.</Paragraph>

        <SectionHeading>Universal Objections (All Segments)</SectionHeading>

        <SubHeading>&quot;It&apos;s too expensive&quot;</SubHeading>
        <CopyBlock label="Response Framework">{`Reframe: "I hear you — $199/mo sounds like a lot until you compare it to what you're already spending."

Context: "A single specialist visit is $300-500. Most people spend $200+/mo on supplements that aren't tested against their actual labs. Concierge medicine runs $5K-10K/year."

Close: "CULTR gives you comprehensive labs, a licensed provider, and personalized protocols for less than most gym memberships. Plus it's HSA/FSA eligible."`}</CopyBlock>

        <SubHeading>&quot;I already have a doctor&quot;</SubHeading>
        <CopyBlock label="Response Framework">{`Validate: "That's great — you should keep seeing your doctor."

Reframe: "CULTR doesn't replace your PCP. It complements them. Your doctor focuses on disease treatment; CULTR focuses on optimization. Think of it as adding a specialist to your team."

Proof: "My doctor tested 5 markers and said I was fine. CULTR tested 50+ and found [X]. Both are valuable — they just serve different purposes."`}</CopyBlock>

        <SubHeading>&quot;Is this legit / a scam?&quot;</SubHeading>
        <CopyBlock label="Response Framework">{`Credentials: "Licensed medical practice. Board-certified providers. All medications from licensed US pharmacies. HIPAA compliant."

Social proof: "5,000+ members. I've been using it for [X] months personally."

Transparency: "I'm a creator partner and I earn a commission — but I wouldn't put my name on something I don't use myself."`}</CopyBlock>

        <SectionHeading>Segment-Specific Objections</SectionHeading>

        <SubHeading>Athletes: &quot;I don&apos;t need medication, I&apos;m healthy&quot;</SubHeading>
        <CopyBlock>{`"Being healthy and being optimized are two different things. Most athletes are 'medically normal' but leaving performance on the table. Comprehensive labs show where you can improve recovery, hormone balance, and inflammation markers — even when you feel fine."`}</CopyBlock>

        <SubHeading>Weight Loss: &quot;I&apos;ve tried everything and nothing works&quot;</SubHeading>
        <CopyBlock>{`"That's exactly why labs matter. When you've tried every diet and workout plan and still struggle, it's usually not willpower — it's biology. GLP-1 protocols work WITH your hormones instead of against them. A CULTR provider evaluates your specific situation to build something that's actually matched to your body."`}</CopyBlock>

        <SubHeading>Skeptics: &quot;Peptides sound dangerous / unregulated&quot;</SubHeading>
        <CopyBlock>{`"I get the concern — there's a lot of misinformation out there. Here's what's different about CULTR: every peptide is prescribed by a licensed provider after reviewing your labs. They're compounded at licensed 503A/503B pharmacies — the same standard as any prescription medication. It's not DIY — it's supervised medicine."`}</CopyBlock>

        <SubHeading>Biohackers: &quot;I can get peptides cheaper elsewhere&quot;</SubHeading>
        <CopyBlock>{`"You can — but you're also skipping the labs, the provider evaluation, and the pharmacy verification. The peptide itself is one piece. The protocol (dosing, timing, stacking, monitoring) is where the value is. CULTR bundles everything: labs + provider + protocol + medications from verified pharmacies."`}</CopyBlock>

        <SubHeading>Professionals: &quot;I don&apos;t have time for this&quot;</SubHeading>
        <CopyBlock>{`"That's literally why telehealth exists. Quiz takes 2 minutes. Telehealth appointments from your phone. Labs at a Quest/Labcorp near you. Medications shipped to your door. The whole point is that you DON'T have to block 3 hours for a doctor visit."`}</CopyBlock>

        <SectionHeading>DM Response Templates</SectionHeading>
        <CopyBlock label="When someone expresses interest but hesitates">{`"Totally get the hesitation — I felt the same way before I started. The quiz takes 2 minutes and doesn't commit you to anything. It just shows which plan would fit your goals: [LINK]

Happy to answer any specific questions you have!"`}</CopyBlock>

        <CopyBlock label="When someone asks a clinical question you can't answer">{`"Great question! That's really something a provider should weigh in on — I can share my personal experience but I'm not qualified to give medical advice. The good news is CULTR matches you with a licensed provider who can answer that specific to your situation: [LINK]"`}</CopyBlock>
      </>
    ),
  },
}
