import {
  CopyBlock,
  SectionHeading,
  SubHeading,
  Paragraph,
  BulletList,
  DataTable,
  type ResourceEntry,
} from '../_components/helpers'

export const offerPrograms: Record<string, ResourceEntry> = {
  'core-programs': {
    title: 'Core Programs',
    category: 'Offer Programs',
    content: () => (
      <>
        <Paragraph>CULTR offers three core programs that address the most common health optimization goals. Understanding these helps you match the right offer to the right audience segment.</Paragraph>

        <SectionHeading>1. Metabolic Reset (12 Weeks)</SectionHeading>
        <Paragraph>The flagship weight management program combining GLP-1 protocols with comprehensive metabolic optimization.</Paragraph>

        <SubHeading>Who It&apos;s For</SubHeading>
        <BulletList items={[
          'People who have tried diets and exercise without lasting results',
          'Anyone with a BMI of 27+ (with weight-related condition) or 30+',
          'Those experiencing metabolic slowdown, insulin resistance, or hormonal weight gain',
          'Busy professionals who need an efficient, provider-supervised approach',
        ]} />

        <SubHeading>What&apos;s Included</SubHeading>
        <BulletList items={[
          'Comprehensive metabolic lab panel (28–59 biomarkers)',
          'Provider evaluation and GLP-1 eligibility assessment',
          'Personalized GLP-1 protocol with dose titration schedule',
          'Bi-weekly check-ins for the first 4 weeks, monthly thereafter',
          'Nutrition framework (not a diet — a sustainable eating protocol)',
          'Progress tracking: weight, waist-to-height ratio, metabolic markers',
        ]} />

        <SubHeading>Timeline & Milestones</SubHeading>
        <BulletList items={[
          'Weeks 1-2: Labs, provider consult, protocol initiation at starting dose',
          'Weeks 3-4: First dose adjustment, appetite changes begin',
          'Weeks 5-8: Therapeutic dose reached, consistent changes in appetite and energy',
          'Weeks 9-12: Progress labs, protocol refinement, sustainable habit integration',
        ]} />

        <SubHeading>Talking Points</SubHeading>
        <CopyBlock>{`→ "It's not another diet — it's a medical protocol supervised by a real provider."
→ "12 weeks of data-driven optimization, not 12 weeks of willpower."
→ "Your protocol is built from YOUR labs, not a generic plan."
→ "Results vary by individual — but the approach is the same: test, treat, track."`}</CopyBlock>

        <SectionHeading>2. Recovery & Resilience (8-10 Weeks)</SectionHeading>
        <Paragraph>A peptide-forward program focused on tissue repair, inflammation reduction, and recovery optimization.</Paragraph>

        <SubHeading>Who It&apos;s For</SubHeading>
        <BulletList items={[
          'Athletes dealing with recovery inconsistency or nagging injuries',
          'Active adults with chronic inflammation or joint discomfort',
          'Post-surgical patients looking to support healing (with provider approval)',
          'Anyone whose recovery is limiting their training or daily function',
        ]} />

        <SubHeading>What&apos;s Included</SubHeading>
        <BulletList items={[
          'Inflammation and recovery-focused lab panel',
          'Provider evaluation for peptide protocol eligibility',
          'Personalized peptide protocol (BPC-157, TB-500, or combination)',
          'Recovery tracking: training readiness, inflammation markers, pain scores',
          'Lifestyle optimization recommendations (sleep, nutrition, movement)',
        ]} />

        <SubHeading>Talking Points</SubHeading>
        <CopyBlock>{`→ "Your body knows how to heal — peptides just help it do it faster."
→ "Provider-supervised, pharmacy-grade protocols — not random supplements."
→ "I went from [pain point] to [improvement] in [timeframe]. Individual results vary."
→ "Recovery is the limiting factor for most athletes — this addresses it directly."`}</CopyBlock>

        <SectionHeading>3. Longevity Lab Loop (10-12 Weeks)</SectionHeading>
        <Paragraph>A data-driven healthspan optimization program built around comprehensive testing, tracking, and iterative protocol refinement.</Paragraph>

        <SubHeading>Who It&apos;s For</SubHeading>
        <BulletList items={[
          'Health-conscious adults who want to optimize, not just treat',
          'Biohackers who want clinical-grade testing and provider guidance',
          'Anyone interested in biological age, longevity markers, and prevention',
          'People who want a measurement-based approach to health decisions',
        ]} />

        <SubHeading>What&apos;s Included</SubHeading>
        <BulletList items={[
          'Comprehensive longevity panel (28–59 biomarkers including hs-CRP, homocysteine, insulin, full hormone profile)',
          'Biological age baseline assessment',
          'Personalized optimization protocol (may include peptides, hormone support, metabolic interventions)',
          'Quarterly retesting to measure progress objectively',
          'Provider-guided protocol adjustments based on data trends',
        ]} />

        <SubHeading>Talking Points</SubHeading>
        <CopyBlock>{`→ "You can't optimize what you don't measure."
→ "Quarterly retesting means your protocol evolves with your body — not a set-and-forget plan."
→ "This is what $10K/year concierge medicine looks like — at a fraction of the cost."
→ "My biological age went from [X] to [Y]. Individual results vary — but the data is fascinating."`}</CopyBlock>
      </>
    ),
  },

  'program-add-ons': {
    title: 'Program Add-Ons',
    category: 'Offer Programs',
    content: () => (
      <>
        <Paragraph>These add-on services complement the core programs and give you additional talking points and conversion angles. They&apos;re designed to increase engagement and order value.</Paragraph>

        <SectionHeading>1. Oral Microbiome Tracking</SectionHeading>
        <Paragraph>A unique differentiation point &mdash; most health platforms don&apos;t touch oral health, but research increasingly links oral microbiome to systemic health.</Paragraph>

        <SubHeading>What It Is</SubHeading>
        <BulletList items={[
          'At-home oral microbiome test kit',
          'Analysis of bacterial composition linked to inflammation, cardiovascular risk, and immune function',
          'Provider review of results with actionable recommendations',
          'Follow-up testing to track changes over time',
        ]} />

        <SubHeading>Why It&apos;s a Great Upsell</SubHeading>
        <BulletList items={[
          'Novel — most people have never heard of oral microbiome testing',
          'Research-backed connection to heart health, diabetes risk, and systemic inflammation',
          'Easy content angle: "Did you know your mouth bacteria affect your heart?"',
          'Low barrier to entry — it\'s a simple at-home test',
        ]} />

        <SubHeading>Content Angles</SubHeading>
        <CopyBlock>{`→ "Your oral health affects way more than your teeth. Science is catching up."
→ "I had no idea my mouth bacteria were connected to inflammation markers in my blood."
→ "This is the test nobody talks about — but everyone should take."`}</CopyBlock>

        <SectionHeading>2. Biological Age Challenge</SectionHeading>
        <Paragraph>A 90-day challenge format that gamifies health optimization around a single compelling metric: your biological age.</Paragraph>

        <SubHeading>What It Is</SubHeading>
        <BulletList items={[
          'Baseline biological age assessment using comprehensive biomarker panel',
          '90-day optimized protocol (nutrition, sleep, movement, targeted interventions)',
          'Retest at day 90 to measure biological age change',
          'Provider-guided adjustments throughout the challenge',
        ]} />

        <SubHeading>Why It&apos;s a Great Content Hook</SubHeading>
        <BulletList items={[
          'Single, compelling metric everyone understands ("I\'m 35 but my body is 28")',
          'Built-in content series: before/during/after across 90 days',
          'Shareability factor — people love showing their bio age score',
          'Creates urgency — "What if you\'re aging faster than you think?"',
        ]} />

        <SubHeading>Content Angles</SubHeading>
        <CopyBlock>{`→ "I'm [chronological age] but my biological age is [bio age]. Want to know yours?"
→ "90 days. Data-driven protocols. Let's see how much younger my body can get."
→ "The biological age test that made me rethink everything about how I take care of myself."`}</CopyBlock>

        <SectionHeading>3. Stack Audit</SectionHeading>
        <Paragraph>A provider review of the supplements, peptides, or protocols someone is already taking &mdash; with recommendations for optimization.</Paragraph>

        <SubHeading>What It Is</SubHeading>
        <BulletList items={[
          'Submit your current supplement and protocol stack for provider review',
          'Lab-verified analysis: are your supplements actually moving your biomarkers?',
          'Identification of redundancies, interactions, and gaps',
          'Optimized stack recommendation based on your actual lab data',
        ]} />

        <SubHeading>Why It&apos;s a Great Entry Point</SubHeading>
        <BulletList items={[
          'Addresses the #1 biohacker/wellness frustration: "Am I wasting money on supplements?"',
          'Low commitment angle — "Just get your current stack reviewed"',
          'Often reveals that people are overspending on supplements they don\'t need',
          'Natural lead into a full CULTR membership after seeing the data',
        ]} />

        <SubHeading>Content Angles</SubHeading>
        <CopyBlock>{`→ "I was spending $300/mo on supplements. My labs showed only 2 of them were actually doing anything."
→ "A CULTR provider reviewed my stack and cut it in half — while improving my results."
→ "Stop guessing which supplements work. Get your stack audited against your actual labs."`}</CopyBlock>
      </>
    ),
  },

  'offer-matching-guide': {
    title: 'Offer Matching Guide',
    category: 'Offer Programs',
    content: () => (
      <>
        <Paragraph>Use this guide to match the right CULTR offer to each audience segment. The key to high conversion is recommending the program that solves their specific pain point.</Paragraph>

        <SectionHeading>Quick Match Matrix</SectionHeading>
        <DataTable
          headers={['Audience Segment', 'Primary Offer', 'Add-On Upsell', 'Entry Point']}
          rows={[
            ['Athletes', 'Recovery & Resilience', 'Stack Audit', 'Catalyst+ tier'],
            ['Busy Professionals', 'Metabolic Reset', 'Bio Age Challenge', 'Core tier'],
            ['Weight Loss Seekers', 'Metabolic Reset', 'Oral Microbiome', 'Core tier (GLP-1)'],
            ['Biohackers', 'Longevity Lab Loop', 'Stack Audit', 'Catalyst+ tier'],
            ['Wellness Women', 'Metabolic Reset', 'Bio Age Challenge', 'Core tier'],
            ['Skeptics', 'Longevity Lab Loop', 'Stack Audit', 'Club (free) → Core'],
            ['Focus Seekers', 'Longevity Lab Loop', 'Stack Audit', 'Core tier'],
          ]}
        />

        <SectionHeading>Matching Principles</SectionHeading>
        <BulletList items={[
          'Lead with the OUTCOME, not the program name',
          'Skeptics should start with the free Club tier to build trust, then upgrade',
          'Athletes and biohackers are ready for Catalyst+ — don\'t undersell them',
          'Weight Loss Seekers want to hear "GLP-1" specifically — it\'s what they\'re searching for',
          'Professionals respond to efficiency and ROI framing, not deep science',
          'Wellness Women respond to "a provider who actually listens" positioning',
        ]} />

        <SectionHeading>Offer Positioning Scripts</SectionHeading>

        <SubHeading>For Weight Loss Audiences</SubHeading>
        <CopyBlock>{`"If you've tried every diet and nothing sticks, the issue might be biological, not behavioral. CULTR's Metabolic Reset starts with comprehensive labs to find out what's actually going on — then builds a GLP-1 protocol matched to YOUR body. Not a generic plan. Not a diet. A medical protocol. [LINK]"`}</CopyBlock>

        <SubHeading>For Performance Audiences</SubHeading>
        <CopyBlock>{`"Recovery is the bottleneck for most athletes. CULTR's Recovery & Resilience program uses peptide protocols (BPC-157, TB-500) supervised by licensed providers to support tissue repair and reduce inflammation. It's not a supplement — it's provider-supervised medicine. [LINK]"`}</CopyBlock>

        <SubHeading>For Data-Driven Audiences</SubHeading>
        <CopyBlock>{`"You track your macros, your steps, your sleep — but when's the last time you tracked your actual biomarkers? CULTR's Longevity Lab Loop tests 50+ markers and retests quarterly so you can see what's actually improving. Data, not guesswork. [LINK]"`}</CopyBlock>

        <SubHeading>For Budget-Conscious Audiences</SubHeading>
        <CopyBlock>{`"Start with the free CULTR Club — access the protocol library, calculators, and educational content at no cost. When you're ready for labs and a provider, Core starts at $199/mo (less than most people spend on random supplements). [LINK]"`}</CopyBlock>

        <SectionHeading>Conversion Tips</SectionHeading>
        <BulletList items={[
          'Always end with a specific CTA (quiz link, not just "check it out")',
          'Include your coupon code — discounts remove the last objection',
          'Mention "month-to-month, cancel anytime" to reduce commitment anxiety',
          'Use "HSA/FSA eligible" as a closing argument for cost-conscious prospects',
        ]} />
      </>
    ),
  },
}
