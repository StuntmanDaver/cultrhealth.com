import {
  CopyBlock,
  SectionHeading,
  SubHeading,
  Paragraph,
  BulletList,
  StatusBadge,
  type ResourceEntry,
} from '../_components/helpers'

export const compliance: Record<string, ResourceEntry> = {
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
        <CopyBlock label="Use any of these">{`"#ad \u2014 I partner with CULTR Health and earn a commission on referrals."
"Paid partnership with @cultrhealth"
"This is sponsored by CULTR Health. I only partner with brands I personally use."
"Affiliate link \u2014 I may earn a commission at no extra cost to you."
"#partner @cultrhealth"`}</CopyBlock>

        <SectionHeading>Common Mistakes to Avoid</SectionHeading>
        <BulletList items={[
          'Burying #ad in a wall of 30 hashtags \u2014 it must be clearly visible',
          'Only disclosing in bio or "about" page \u2014 each individual post needs disclosure',
          'Using ambiguous language like "thanks to CULTR" without clarifying the financial relationship',
          'Failing to disclose when posting about CULTR even casually',
          'Assuming viewers know about the partnership \u2014 always be explicit',
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
        <CopyBlock label="About CULTR's Services">{`\u2705 "CULTR tests 28–59 biomarkers"
\u2705 "Licensed, board-certified providers"
\u2705 "All medications from licensed US pharmacies"
\u2705 "HIPAA-compliant platform"
\u2705 "Plans starting at $199/mo"
\u2705 "HSA/FSA eligible"
\u2705 "Telehealth consultations available within 24-48 hours"
\u2705 "Personalized protocols based on your lab results"
\u2705 "Access to peptide protocols and GLP-1 medications"
\u2705 "Month-to-month, cancel anytime"`}</CopyBlock>

        <CopyBlock label="About Your Personal Experience">{`\u2705 "I personally experienced [specific result]"
\u2705 "My energy levels improved after starting my protocol"
\u2705 "I lost [X] pounds while working with CULTR"
\u2705 "My labs showed [specific finding] that my regular doctor missed"
\u2705 "I feel better than I have in years"
(Always frame as YOUR individual experience, not a guarantee)`}</CopyBlock>

        <SectionHeading>Prohibited Claims (You CANNOT Say)</SectionHeading>
        <CopyBlock label="Never Make These Claims">{`\u274C "CULTR cures [any disease or condition]"
\u274C "Guaranteed to lose weight / build muscle / fix hormones"
\u274C "This will work for everyone"
\u274C "Better than your doctor" or "replaces your doctor"
\u274C "FDA approved" (CULTR is a medical practice, not an FDA-approved product)
\u274C "No side effects"
\u274C "100% safe"
\u274C Any specific medical outcomes as guaranteed results
\u274C Comparisons to specific competitors by name
\u274C "Doctors don't want you to know this"
\u274C Any claim that hasn't been approved in this document`}</CopyBlock>

        {/* ─── GTM Enhancement: Language Traffic Light System ─── */}
        <SectionHeading>Language Traffic Light System</SectionHeading>
        <Paragraph>Use this quick-reference system to check your claims before posting. Green means go, yellow means reword, red means stop.</Paragraph>

        <SubHeading>Green Light &mdash; Safe to Use</SubHeading>
        <StatusBadge status="green">&quot;I noticed more energy within the first month of my protocol.&quot;</StatusBadge>
        <StatusBadge status="green">&quot;CULTR matched me with a provider who actually listened.&quot;</StatusBadge>
        <StatusBadge status="green">&quot;My labs revealed things my annual physical never caught.&quot;</StatusBadge>
        <StatusBadge status="green">&quot;I feel like myself again &mdash; individual results may vary.&quot;</StatusBadge>
        <StatusBadge status="green">&quot;Plans start at $199/mo with licensed providers.&quot;</StatusBadge>

        <SubHeading>Yellow Light &mdash; Reword Before Using</SubHeading>
        <StatusBadge status="yellow">&quot;This will change your life&quot; &rarr; &quot;This changed MY life &mdash; individual results vary.&quot;</StatusBadge>
        <StatusBadge status="yellow">&quot;Peptides fix everything&quot; &rarr; &quot;Peptides may support recovery and metabolic health.&quot;</StatusBadge>
        <StatusBadge status="yellow">&quot;You&apos;ll lose weight fast&quot; &rarr; &quot;I saw results within [timeframe] on my protocol.&quot;</StatusBadge>
        <StatusBadge status="yellow">&quot;Better than Ozempic&quot; &rarr; &quot;CULTR offers personalized protocols including GLP-1 options.&quot;</StatusBadge>

        <SubHeading>Red Light &mdash; Never Use</SubHeading>
        <StatusBadge status="red">&quot;CULTR cures diabetes / anxiety / depression.&quot;</StatusBadge>
        <StatusBadge status="red">&quot;Guaranteed to lose 30 lbs in 30 days.&quot;</StatusBadge>
        <StatusBadge status="red">&quot;No side effects whatsoever.&quot;</StatusBadge>
        <StatusBadge status="red">&quot;Doctors are hiding this from you.&quot;</StatusBadge>
        <StatusBadge status="red">&quot;FDA approved weight loss solution.&quot;</StatusBadge>

        <SectionHeading>Banned Phrases &mdash; Automatic Rejection</SectionHeading>
        <Paragraph>Content containing any of these phrases will be flagged and must be removed immediately:</Paragraph>
        <BulletList items={[
          '"Miracle cure" or "miracle weight loss"',
          '"FDA approved" (when referring to CULTR as a whole)',
          '"Guaranteed results" or "guaranteed weight loss"',
          '"No prescription needed" (prescriptions ARE required)',
          '"Doctors don\'t want you to know"',
          '"Secret" or "hack" when describing medical treatments',
          '"100% safe" or "zero risk"',
          '"Works for everyone" or "universal solution"',
          'Any specific weight loss number presented as typical',
        ]} />

        <SectionHeading>Gray Area &mdash; Ask First</SectionHeading>
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
          'CULTR is a licensed medical practice \u2014 not a supplement company or wellness brand',
          'All treatments are prescribed by licensed providers based on clinical evaluation',
          'No treatment is "guaranteed" to produce specific results',
          'Individual results vary based on biology, compliance, and other factors',
          'CULTR does not diagnose, cure, prevent, or treat any disease through content alone',
        ]} />

        <SectionHeading>Structure / Function Claims vs. Disease Claims</SectionHeading>
        <SubHeading>Structure/Function Claims (Acceptable)</SubHeading>
        <Paragraph>These describe how a product or service affects the body&apos;s normal structure or function:</Paragraph>
        <CopyBlock label="Acceptable Examples">{`\u2705 "Supports healthy hormone levels"
\u2705 "May help maintain a healthy weight"
\u2705 "Promotes metabolic health"
\u2705 "Supports energy and vitality"
\u2705 "Helps optimize biomarker levels"`}</CopyBlock>

        <SubHeading>Disease Claims (NOT Acceptable)</SubHeading>
        <Paragraph>These claim to diagnose, cure, mitigate, treat, or prevent a disease:</Paragraph>
        <CopyBlock label="NOT Acceptable">{`\u274C "Treats diabetes"
\u274C "Cures hormonal imbalances"
\u274C "Prevents heart disease"
\u274C "Fixes thyroid problems"
\u274C "Treats depression or anxiety"`}</CopyBlock>

        {/* ─── GTM Enhancement: Discussing Trending Compounds Safely ─── */}
        <SectionHeading>Discussing Trending Compounds Safely</SectionHeading>
        <Paragraph>When a peptide or compound is trending on social media (e.g., &quot;What is BPC-157?&quot; or &quot;Is semaglutide safe?&quot;), use this 4-step template to discuss it compliantly:</Paragraph>

        <SubHeading>Step 1: Acknowledge Interest</SubHeading>
        <CopyBlock label="Template">{`"A lot of people are asking about [compound]. Here's what you should know..."`}</CopyBlock>

        <SubHeading>Step 2: Explain What It Is (Structure/Function Only)</SubHeading>
        <CopyBlock label="Template">{`"[Compound] is a [peptide/medication/amino acid chain] that [structure/function description]. Research suggests it may support [general health function]."`}</CopyBlock>

        <SubHeading>Step 3: Redirect to Provider Supervision</SubHeading>
        <CopyBlock label="Template">{`"The most important thing: don't self-prescribe. A licensed provider needs to evaluate your labs, health history, and goals before recommending any protocol. That's what CULTR does \u2014 match you with a provider who builds a plan specific to YOUR body."`}</CopyBlock>

        <SubHeading>Step 4: CTA Without Medical Claims</SubHeading>
        <CopyBlock label="Template">{`"If you're curious whether [compound] might be part of your protocol, take the quiz to get matched with a CULTR provider: [YOUR LINK]"

Never say: "[Compound] will fix your [condition]"
Always say: "Talk to a provider about whether [compound] might support your goals"`}</CopyBlock>

        <SectionHeading>Required Disclaimers</SectionHeading>
        <Paragraph>When discussing health outcomes, always include one of these disclaimers in your content:</Paragraph>
        <CopyBlock label="Standard Disclaimer">{`"CULTR Health is a licensed medical practice. All treatments are prescribed by licensed providers after clinical evaluation. Individual results vary. This is not medical advice \u2014 consult your healthcare provider before making health decisions."`}</CopyBlock>

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
}
