import {
  CopyBlock,
  SectionHeading,
  SubHeading,
  Paragraph,
  BulletList,
  type ResourceEntry,
} from '../_components/helpers'

export const contentStrategy: Record<string, ResourceEntry> = {
  'pillar-metabolic-weight': {
    title: 'Metabolic & Weight Loss',
    category: 'Content Pillars',
    content: () => (
      <>
        <Paragraph>This pillar covers weight management, GLP-1 protocols, metabolic health, and body composition. It&apos;s the highest-demand topic for most audiences &mdash; use it as your primary content driver.</Paragraph>

        <SectionHeading>10 Evergreen Topics</SectionHeading>
        <BulletList items={[
          'How GLP-1 medications actually work (mechanism, not marketing)',
          'Why calorie counting alone fails — the hormonal component',
          'The difference between "normal" and "optimal" metabolic markers',
          'What 28–59 biomarkers reveal that a standard panel misses',
          'The dose titration process: what to expect month by month',
          'Why muscle preservation matters during weight loss',
          'Insulin resistance explained in plain language',
          'How stress hormones (cortisol) sabotage weight loss',
          'The connection between sleep quality and metabolic rate',
          'When to consider a GLP-1 protocol vs. lifestyle changes alone',
        ]} />

        <SectionHeading>10 Hooks (Labeled by Framework)</SectionHeading>
        <CopyBlock label="Proof-First Hooks">{`1. "I lost [X] lbs in [timeframe] without a crash diet. Here's my lab data."
2. "My metabolic panel showed 3 things my doctor never tested for."`}</CopyBlock>

        <CopyBlock label="Mistake-Correction Hooks">{`3. "Stop counting calories if your hormones are working against you."
4. "The #1 mistake people make when starting a GLP-1 protocol."`}</CopyBlock>

        <CopyBlock label="Metaphor Hooks">{`5. "Your metabolism is a thermostat, not a calculator — here's why that matters."
6. "Trying to lose weight without checking your labs is like driving without a dashboard."`}</CopyBlock>

        <CopyBlock label="Actionable First-Step Hooks">{`7. "Before you try another diet, do this ONE thing first."
8. "3 signs your weight loss plateau is hormonal, not behavioral."`}</CopyBlock>

        <CopyBlock label="Curiosity/Contrarian Hooks">{`9. "What if the reason you can't lose weight is the exact opposite of what you think?"
10. "Why your 'healthy' diet might be raising your insulin — and stalling your progress."`}</CopyBlock>

        <SectionHeading>5 Myth-Busts</SectionHeading>
        <CopyBlock>{`MYTH: "GLP-1s are just for obese people."
TRUTH: Providers evaluate eligibility based on metabolic markers, not just BMI. Many people with BMI 27+ and metabolic dysfunction benefit from GLP-1 protocols.

MYTH: "You'll gain all the weight back when you stop."
TRUTH: Protocols include lifestyle integration and gradual dose management. The goal is sustainable metabolic health, not lifelong medication dependency.

MYTH: "GLP-1s are dangerous / have terrible side effects."
TRUTH: Side effects (mainly nausea) are typically mild and manageable with proper dose titration. Provider supervision is key — which is why DIY approaches are risky.

MYTH: "Calories in, calories out is all that matters."
TRUTH: Hormones, insulin sensitivity, cortisol levels, thyroid function, and sleep quality all affect how your body processes and stores energy. CICO is one variable, not the whole picture.

MYTH: "Compounded medications are lower quality."
TRUTH: CULTR uses licensed 503A/503B pharmacies held to the same FDA standards as any pharmacy. Compounding allows personalized dosing — it's precision medicine.`}</CopyBlock>

        <SectionHeading>5 Proof-First Story Structures</SectionHeading>
        <CopyBlock label="Story Template">{`1. THE BEFORE: "I was [specific pain point] for [timeframe]. I tried [what didn't work]."
2. THE TURNING POINT: "Then I got my labs done through CULTR and discovered [specific finding]."
3. THE PROTOCOL: "My provider built a [general protocol type] based on my data."
4. THE RESULT: "Within [timeframe], I noticed [specific change]. Individual results vary."
5. THE CTA: "If this sounds like you, take the quiz: [LINK]"`}</CopyBlock>

        <SectionHeading>CTA Variants for This Pillar</SectionHeading>
        <CopyBlock>{`→ "Take the 2-minute quiz to see if a GLP-1 protocol is right for you: [LINK]"
→ "Use code [CODE] for [discount] on your first month: [LINK]"
→ "Stop guessing. Start testing. Link in bio."
→ "Your metabolism has a story — 28–59 biomarkers will tell it: [LINK]"`}</CopyBlock>
      </>
    ),
  },

  'pillar-recovery-peptides': {
    title: 'Recovery & Peptides',
    category: 'Content Pillars',
    content: () => (
      <>
        <Paragraph>This pillar covers peptide therapy, injury recovery, inflammation management, and physical performance optimization. It&apos;s your go-to for athletic and active audiences.</Paragraph>

        <SectionHeading>10 Evergreen Topics</SectionHeading>
        <BulletList items={[
          'What peptides actually are (and what they\'re not)',
          'BPC-157 explained: gut health and tissue repair',
          'TB-500 and wound healing: the science in plain language',
          'Growth hormone secretagogues: CJC-1295, Ipamorelin, Sermorelin',
          'The difference between peptides and anabolic steroids',
          'How CULTR ensures peptide quality (503A/503B pharmacies)',
          'Recovery optimization beyond just "rest days"',
          'Inflammation markers: what hs-CRP tells you about your body',
          'Peptide stacking: how providers combine protocols for better outcomes',
          'Why provider supervision matters for peptide protocols',
        ]} />

        <SectionHeading>10 Hooks (Labeled by Framework)</SectionHeading>
        <CopyBlock label="Proof-First Hooks">{`1. "My recovery time went from [X days] to [Y days] after starting my peptide protocol."
2. "Here's what my inflammation markers looked like before and after 8 weeks."`}</CopyBlock>

        <CopyBlock label="Mistake-Correction Hooks">{`3. "Stop buying peptides from random websites. Here's why source matters."
4. "The biggest mistake people make with BPC-157 (and how to avoid it)."`}</CopyBlock>

        <CopyBlock label="Metaphor Hooks">{`5. "Peptides are like text messages for your cells — telling them to repair, recover, and rebuild."
6. "Taking peptides without labs is like taking a road trip without GPS."`}</CopyBlock>

        <CopyBlock label="Actionable First-Step Hooks">{`7. "If your recovery is inconsistent, check these 3 biomarkers first."
8. "One thing every athlete should know about inflammation and performance."`}</CopyBlock>

        <CopyBlock label="Curiosity/Contrarian Hooks">{`9. "Peptides aren't just for bodybuilders — here's who's actually using them."
10. "What if your slow recovery isn't about training volume — it's about your biology?"`}</CopyBlock>

        <SectionHeading>5 Myth-Busts</SectionHeading>
        <CopyBlock>{`MYTH: "Peptides are steroids."
TRUTH: Peptides are short amino acid chains that signal natural processes. They don't introduce exogenous hormones. Completely different mechanism.

MYTH: "You can buy good peptides online without a prescription."
TRUTH: Unregulated peptide sources have no quality control. CULTR uses licensed 503A/503B pharmacies with third-party testing. Provider supervision ensures proper dosing.

MYTH: "Peptides work overnight."
TRUTH: Most peptide protocols show initial effects in 2-4 weeks with full benefits at 8-12 weeks. They're supporting natural healing processes, not magic.

MYTH: "Only injured people need peptides."
TRUTH: Peptides support recovery, sleep quality, body composition, and immune function. Athletes use them proactively, not just reactively.

MYTH: "All peptide protocols are the same."
TRUTH: Your provider selects specific peptides, dosages, and timing based on YOUR labs and goals. A recovery protocol looks completely different from a body composition protocol.`}</CopyBlock>

        <SectionHeading>5 Proof-First Story Structures</SectionHeading>
        <CopyBlock label="Story Template">{`1. THE PAIN: "I was dealing with [recovery issue/injury/inflammation] for [timeframe]."
2. THE DISCOVERY: "I learned about peptide protocols through CULTR and got my labs done."
3. THE PROTOCOL: "My provider prescribed [general peptide category] based on my inflammation markers."
4. THE CHANGE: "By week [X], I noticed [specific improvement]. Individual results vary."
5. THE CTA: "If recovery is your bottleneck, talk to a CULTR provider: [LINK]"`}</CopyBlock>

        <SectionHeading>CTA Variants for This Pillar</SectionHeading>
        <CopyBlock>{`→ "Your body knows how to heal — peptides help it do it faster. Learn more: [LINK]"
→ "Provider-supervised peptide protocols from $199/mo. Take the quiz: [LINK]"
→ "Stop guessing about recovery. Start measuring: [LINK]"
→ "Use code [CODE] for [discount] on your first month: [LINK]"`}</CopyBlock>
      </>
    ),
  },

  'pillar-longevity-biomarkers': {
    title: 'Longevity & Biomarkers',
    category: 'Content Pillars',
    content: () => (
      <>
        <Paragraph>This pillar combines healthspan optimization with data-driven health tracking. It covers biological age, comprehensive testing, longevity science, and the &quot;measure &rarr; optimize &rarr; retest&quot; loop.</Paragraph>

        <SectionHeading>10 Evergreen Topics</SectionHeading>
        <BulletList items={[
          'What biological age is and why it matters more than chronological age',
          'The 28–59 biomarkers CULTR tests (and what each category reveals)',
          'Why "normal" lab ranges aren\'t the same as "optimal"',
          'hs-CRP and inflammation: the silent killer marker',
          'Hormones 101: testosterone, estrogen, thyroid, cortisol',
          'NAD+ and mitochondrial health: the longevity connection',
          'How quarterly retesting reveals trends your annual physical misses',
          'The cost of reactive vs. proactive healthcare',
          'Vitamin D, B12, and the nutrients most people are deficient in',
          'How sleep, stress, and nutrition show up in your bloodwork',
        ]} />

        <SectionHeading>10 Hooks (Labeled by Framework)</SectionHeading>
        <CopyBlock label="Proof-First Hooks">{`1. "My biological age was 8 years older than my real age. Here's what I changed."
2. "28–59 biomarkers tested. Here are the 3 that surprised me most."`}</CopyBlock>

        <CopyBlock label="Mistake-Correction Hooks">{`3. "Your annual physical tests 5-10 markers. That's not enough — here's why."
4. "The biggest misconception about 'normal' lab results."`}</CopyBlock>

        <CopyBlock label="Metaphor Hooks">{`5. "Getting annual labs is like checking your car's oil once a year and hoping for the best."
6. "Your bloodwork is a dashboard for your body — most people never look at it."`}</CopyBlock>

        <CopyBlock label="Actionable First-Step Hooks">{`7. "Want to know your real biological age? Here's how to find out."
8. "Before you buy another supplement, test these 5 biomarkers first."`}</CopyBlock>

        <CopyBlock label="Curiosity/Contrarian Hooks">{`9. "What if you're aging 2x faster than you should be — and don't know it?"
10. "The health metric that predicts your future better than any other."`}</CopyBlock>

        <SectionHeading>5 Myth-Busts</SectionHeading>
        <CopyBlock>{`MYTH: "If I feel fine, my labs are probably fine."
TRUTH: Many metabolic and hormonal imbalances are asymptomatic until they're severe. Comprehensive testing catches issues years before symptoms appear.

MYTH: "Biological age testing is pseudoscience."
TRUTH: Biological age is calculated from validated biomarker panels. It's an aggregate measure of metabolic, hormonal, and inflammatory health — used by longevity researchers worldwide.

MYTH: "I only need labs once a year."
TRUTH: Annual labs give you a single snapshot. Quarterly testing reveals trends — are your markers improving, declining, or stable? Trends tell the story.

MYTH: "Longevity medicine is only for wealthy people."
TRUTH: CULTR starts at $199/mo with comprehensive labs included. Compare that to the $5K-10K/year traditional longevity clinics charge.

MYTH: "Supplements can replace lab testing."
TRUTH: Without labs, you're guessing which supplements you need. Most people are taking things they don't need while missing actual deficiencies.`}</CopyBlock>

        <SectionHeading>CTA Variants for This Pillar</SectionHeading>
        <CopyBlock>{`→ "You can't optimize what you don't measure. Get your 28–59 biomarker panel (SiPho Health): [LINK]"
→ "What does your biological age say about you? Find out: [LINK]"
→ "Use code [CODE] for [discount] on your first comprehensive panel: [LINK]"
→ "Annual physicals aren't enough. Start quarterly testing with CULTR: [LINK]"`}</CopyBlock>
      </>
    ),
  },

  'pillar-microbiome-cognitive': {
    title: 'Oral Health & Cognitive',
    category: 'Content Pillars',
    content: () => (
      <>
        <Paragraph>This pillar covers two emerging content angles: the oral microbiome&apos;s connection to systemic health, and cognitive performance optimization. These are high-novelty topics that differentiate you from typical health content.</Paragraph>

        <SectionHeading>Oral Microbiome Topics</SectionHeading>

        <SubHeading>5 Evergreen Topics</SubHeading>
        <BulletList items={[
          'The oral-systemic health connection: how mouth bacteria affect your whole body',
          'Oral microbiome and cardiovascular risk: what the research shows',
          'How oral health impacts inflammation markers (and vice versa)',
          'Why your dentist and your doctor should be talking to each other',
          'At-home oral microbiome testing: what it measures and what it means',
        ]} />

        <SubHeading>5 Hooks</SubHeading>
        <CopyBlock>{`1. [Proof-First] "My oral microbiome test revealed bacteria linked to heart inflammation. I had no idea."
2. [Mistake-Correction] "You're brushing your teeth but ignoring the bacteria that affect your HEART."
3. [Metaphor] "Your mouth is the gateway to your bloodstream. What's getting through?"
4. [Actionable] "One test that connects your oral health to your heart, gut, and immune system."
5. [Curiosity] "The health test nobody talks about — but cardiologists are starting to pay attention to."`}</CopyBlock>

        <SubHeading>3 Myth-Busts</SubHeading>
        <CopyBlock>{`MYTH: "Oral health is just about cavities and gum disease."
TRUTH: Oral bacteria enter your bloodstream and have been linked to cardiovascular disease, diabetes risk, and systemic inflammation.

MYTH: "If my dentist says I'm fine, my oral microbiome is fine."
TRUTH: Standard dental exams don't test your microbiome composition. A healthy-looking mouth can harbor problematic bacterial profiles.

MYTH: "Mouthwash fixes everything."
TRUTH: Most mouthwashes kill ALL bacteria — including the beneficial ones. Targeted approaches based on your specific microbiome are more effective.`}</CopyBlock>

        <SectionHeading>Cognitive Performance Topics</SectionHeading>

        <SubHeading>5 Evergreen Topics</SubHeading>
        <BulletList items={[
          'Brain fog explained: hormonal, metabolic, and inflammatory causes',
          'The connection between blood sugar stability and mental clarity',
          'How sleep quality directly impacts cognitive performance (and what labs show)',
          'Nutrient deficiencies that affect focus: B12, D3, magnesium, iron',
          'Stress hormones and cognitive decline: the cortisol-focus connection',
        ]} />

        <SubHeading>5 Hooks</SubHeading>
        <CopyBlock>{`1. [Proof-First] "I cut my caffeine intake in half and my focus IMPROVED. Here's what my labs revealed."
2. [Mistake-Correction] "Brain fog isn't normal — it's a signal. Stop ignoring it."
3. [Metaphor] "Your brain runs on biochemistry, not willpower. Are you fueling it right?"
4. [Actionable] "3 biomarkers to check if you can't focus past 2pm."
5. [Curiosity] "What if your focus problems have nothing to do with your habits — and everything to do with your blood?"`}</CopyBlock>

        <SubHeading>2 Myth-Busts</SubHeading>
        <CopyBlock>{`MYTH: "Brain fog is just part of aging / being busy."
TRUTH: Persistent brain fog often has identifiable biochemical causes — hormonal imbalances, inflammation, nutrient deficiencies, or blood sugar dysregulation. Labs can pinpoint the root cause.

MYTH: "More caffeine = better focus."
TRUTH: Caffeine masks underlying issues. When your biomarkers are optimized, many people find they need less caffeine while maintaining better, more consistent focus.`}</CopyBlock>

        <SectionHeading>CTA Variants for These Pillars</SectionHeading>
        <CopyBlock>{`→ "Your mouth bacteria could be affecting your heart. Get tested: [LINK]"
→ "Brain fog isn't normal. Find out what's causing it with 28–59 biomarker testing (SiPho Health): [LINK]"
→ "The test nobody talks about — oral microbiome analysis through CULTR: [LINK]"
→ "Use code [CODE] to get your comprehensive panel including cognitive and inflammation markers: [LINK]"`}</CopyBlock>
      </>
    ),
  },
}
