import {
  CopyBlock,
  SectionHeading,
  SubHeading,
  Paragraph,
  BulletList,
  type ResourceEntry,
} from '../_components/helpers'

export const productEducation: Record<string, ResourceEntry> = {
  'glp-1-overview': {
    title: 'GLP-1 Overview',
    category: 'Product Education',
    content: () => (
      <>
        <Paragraph>This guide covers GLP-1 receptor agonist medications &mdash; what they are, how they work, who they&apos;re for, and how CULTR prescribes them. Use this to educate yourself and inform your content.</Paragraph>

        <SectionHeading>What Are GLP-1 Medications?</SectionHeading>
        <Paragraph>GLP-1 (glucagon-like peptide-1) receptor agonists are a class of medications that mimic a natural hormone your body produces after eating. They work by signaling your brain that you&apos;re full, slowing gastric emptying, and improving insulin sensitivity.</Paragraph>

        <SubHeading>Common GLP-1 Medications</SubHeading>
        <BulletList items={[
          'Semaglutide \u2014 the active ingredient in Ozempic and Wegovy',
          'Tirzepatide \u2014 the active ingredient in Mounjaro and Zepbound (dual GIP/GLP-1)',
          'CULTR prescribes compounded versions through licensed 503A/503B pharmacies',
        ]} />

        <SectionHeading>How They Work</SectionHeading>
        <BulletList items={[
          'Appetite regulation \u2014 Signals satiety (fullness) to the brain, reducing hunger and cravings',
          'Gastric emptying \u2014 Slows stomach emptying so you feel full longer after meals',
          'Insulin sensitivity \u2014 Improves how your body processes blood sugar',
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
        <CopyBlock label="Key Messages">{`\u2192 GLP-1s are FDA-recognized medications, not a "diet pill" or supplement
\u2192 They work WITH your biology, not against it
\u2192 Provider supervision is critical \u2014 this isn't a DIY approach
\u2192 CULTR makes these protocols accessible from $199/mo
\u2192 Always frame as "may help" or "can support" \u2014 never "guarantees" weight loss`}</CopyBlock>
      </>
    ),
  },

  'peptide-protocols': {
    title: 'Peptide Protocols',
    category: 'Product Education',
    content: () => (
      <>
        <Paragraph>This guide introduces peptide therapy &mdash; what peptides are, how CULTR uses them, and key protocols your audience should know about.</Paragraph>

        <SectionHeading>What Are Peptides?</SectionHeading>
        <Paragraph>Peptides are short chains of amino acids (typically 2-50 amino acids long) that act as signaling molecules in the body. They tell your cells to perform specific functions &mdash; like releasing growth hormone, reducing inflammation, or supporting tissue repair. They&apos;re not steroids, not hormones, and not supplements.</Paragraph>

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
          'CJC-1295 / Ipamorelin \u2014 Most commonly prescribed combination',
          'Sermorelin \u2014 Growth hormone releasing hormone analog',
          'Tesamorelin \u2014 Approved for reducing visceral fat',
        ]} />

        <SubHeading>Healing & Recovery</SubHeading>
        <Paragraph>These peptides support tissue repair, gut health, and injury recovery:</Paragraph>
        <BulletList items={[
          'BPC-157 \u2014 Body Protection Compound, supports gut and tissue healing',
          'TB-500 (Thymosin Beta-4) \u2014 Supports wound healing and reduces inflammation',
        ]} />

        <SubHeading>Metabolic & Weight Management</SubHeading>
        <Paragraph>Beyond GLP-1s, other peptides can support metabolic health:</Paragraph>
        <BulletList items={[
          'AOD-9604 \u2014 Fragment of growth hormone that may support fat metabolism',
          'MOTS-c \u2014 Mitochondrial peptide that may improve metabolic function',
        ]} />

        <SectionHeading>What Peptides Are NOT</SectionHeading>
        <BulletList items={[
          'Not anabolic steroids \u2014 they don\'t introduce exogenous hormones',
          'Not supplements \u2014 they require a prescription and provider oversight',
          'Not a magic bullet \u2014 they work best as part of a comprehensive health protocol',
          'Not unregulated \u2014 CULTR only uses peptides from licensed, compliant pharmacies',
        ]} />

        <SectionHeading>Talking Points for Your Content</SectionHeading>
        <CopyBlock label="Key Messages">{`\u2192 Peptides are naturally occurring in the body \u2014 therapy uses them at therapeutic levels
\u2192 Always provider-supervised, never self-prescribed
\u2192 They signal your body to do what it already knows how to do \u2014 just better
\u2192 Part of a comprehensive protocol that includes labs, nutrition, and monitoring
\u2192 Not a shortcut \u2014 a science-backed tool used alongside healthy habits`}</CopyBlock>
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
          'Price: Free \u2014 no credit card required',
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
        <CopyBlock label="Recommendation Framework">{`\u2192 "Just curious?" \u2192 CULTR Club (Free)
\u2192 "Ready to get started" \u2192 Starter ($199/mo)
\u2192 "Want regular check-ins" \u2192 Creator ($299/mo)
\u2192 "Managing complex goals" \u2192 Cognition ($399/mo)
\u2192 "Want maximum access" \u2192 Confidante ($499/mo)

The quiz at cultrhealth.com/quiz matches people to their ideal tier automatically.`}</CopyBlock>

        <SectionHeading>Key Selling Points Across All Tiers</SectionHeading>
        <BulletList items={[
          'All tiers include licensed providers and comprehensive lab testing',
          'All medications from licensed US pharmacies',
          'HIPAA-compliant platform',
          'HSA/FSA eligible',
          'Month-to-month, cancel anytime \u2014 no long-term contracts',
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
        <CopyBlock>{`Most doctors test 5-10 basic blood markers and focus on disease treatment. CULTR tests 50+ biomarkers and focuses on optimization \u2014 helping you go from "fine" to feeling your best. Plus, appointments are available within 24-48 hours, not 2-4 weeks.`}</CopyBlock>

        <SectionHeading>Cost & Coverage</SectionHeading>

        <SubHeading>&quot;How much does it cost?&quot;</SubHeading>
        <CopyBlock>{`Plans start at $199/mo for the Starter tier. Higher tiers ($299-$499/mo) include more frequent consultations and advanced features. There's also a free Club tier for access to educational resources. All plans are month-to-month with no long-term contracts.`}</CopyBlock>

        <SubHeading>&quot;Does insurance cover this?&quot;</SubHeading>
        <CopyBlock>{`CULTR doesn't bill insurance directly, but memberships are HSA/FSA eligible. Many members use their health savings accounts to cover the cost. Lab draw fees through Quest/Labcorp may also be submitted to insurance separately.`}</CopyBlock>

        <SubHeading>&quot;Is it worth the price?&quot;</SubHeading>
        <CopyBlock>{`Consider this: a single specialist visit costs $300-500. A concierge doctor runs $5,000-10,000/year. CULTR gives you comprehensive labs, licensed providers, and personalized protocols from $199/mo \u2014 less than most gym memberships.`}</CopyBlock>

        <SectionHeading>Treatment Questions</SectionHeading>

        <SubHeading>&quot;Do you prescribe Ozempic/semaglutide?&quot;</SubHeading>
        <CopyBlock>{`CULTR providers can prescribe compounded semaglutide and tirzepatide when clinically appropriate. These are the same active ingredients as Ozempic/Wegovy and Mounjaro/Zepbound, compounded at licensed US pharmacies. Eligibility is determined by your provider based on your labs and health evaluation.`}</CopyBlock>

        <SubHeading>&quot;Are peptides safe?&quot;</SubHeading>
        <CopyBlock>{`Peptides prescribed through CULTR are provider-supervised and sourced from licensed pharmacies. Your provider evaluates your labs and health history before prescribing any protocol. Like any medication, there can be side effects \u2014 which is why provider oversight is important.`}</CopyBlock>

        <SubHeading>&quot;What states are you available in?&quot;</SubHeading>
        <CopyBlock>{`CULTR operates in most US states. Availability is verified during signup based on your location. Telehealth regulations vary by state, and CULTR ensures full compliance. If your state isn't covered yet, you can join the waitlist.`}</CopyBlock>

        <SectionHeading>Your Affiliate Questions</SectionHeading>

        <SubHeading>&quot;Do you get paid for this?&quot;</SubHeading>
        <CopyBlock>{`Yes, I'm a CULTR creator and earn a commission on referrals. I only partner with brands I personally use and believe in. [Always be transparent \u2014 this builds trust and is legally required.]`}</CopyBlock>

        <SubHeading>&quot;Can I get a discount?&quot;</SubHeading>
        <CopyBlock>{`Yes! Use my code [YOUR CODE] for [discount details]. Link is in my bio / description.`}</CopyBlock>

        <SectionHeading>Quick-Reply Templates for DMs</SectionHeading>
        <CopyBlock label="For people asking about getting started">{`Hey! Thanks for reaching out. The easiest way to get started is to take the 2-minute quiz \u2014 it'll match you to the right plan based on your goals: [YOUR LINK]

If you use code [YOUR CODE] you'll get [discount]. Let me know if you have any questions!`}</CopyBlock>

        <CopyBlock label="For people asking about specific treatments">{`Great question! I can share my personal experience, but for specific medical questions the best move is to talk to a CULTR provider \u2014 they'll review your labs and health history to recommend the right protocol for you.

You can get started here: [YOUR LINK]`}</CopyBlock>
      </>
    ),
  },
}
