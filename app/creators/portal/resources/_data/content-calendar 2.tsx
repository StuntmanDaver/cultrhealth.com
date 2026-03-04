import {
  CopyBlock,
  SectionHeading,
  SubHeading,
  Paragraph,
  BulletList,
  DataTable,
  type ResourceEntry,
} from '../_components/helpers'

export const contentCalendar: Record<string, ResourceEntry> = {
  '30-day-calendar': {
    title: '30-Day Content Calendar',
    category: 'Content Calendar',
    content: () => (
      <>
        <Paragraph>A complete 30-day content calendar with daily short-form prompts. Each day includes the topic, pillar reference, and suggested format. Customize with your personal experience and audience.</Paragraph>

        <SectionHeading>Week 1: Foundation &amp; Awareness</SectionHeading>
        <DataTable
          headers={['Day', 'Topic', 'Pillar', 'Format']}
          rows={[
            ['1', 'Why I got 28–59 biomarkers tested', 'Longevity', 'Reel / TikTok'],
            ['2', 'Your doctor tests 5 markers. CULTR tests 50+.', 'Longevity', 'Carousel'],
            ['3', '"Normal" vs. "Optimal" — what the difference means', 'Longevity', 'Reel / TikTok'],
            ['4', 'My top 3 lab findings (personal story)', 'Metabolic', 'Story series'],
            ['5', 'What GLP-1 medications actually are (myth-bust)', 'Metabolic', 'Reel / TikTok'],
            ['6', 'The $199/mo that changed my health approach', 'General', 'Caption post'],
            ['7', 'Weekly recap + Q&A prompt', 'All', 'Story Q&A'],
          ]}
        />

        <SectionHeading>Week 2: Deep Dive &amp; Education</SectionHeading>
        <DataTable
          headers={['Day', 'Topic', 'Pillar', 'Format']}
          rows={[
            ['8', 'Peptides are NOT steroids — here\'s the truth', 'Recovery', 'Reel / TikTok'],
            ['9', 'What my CULTR provider told me on the first call', 'General', 'Story series'],
            ['10', '3 signs your weight loss plateau is hormonal', 'Metabolic', 'Carousel'],
            ['11', 'How BPC-157 works (simple explanation)', 'Recovery', 'Reel / TikTok'],
            ['12', 'My energy before vs. after optimization', 'Longevity', 'Before/after (feelings, not photos)'],
            ['13', 'The supplement I stopped taking after getting labs', 'Longevity', 'Caption post'],
            ['14', 'Weekly recap + audience poll', 'All', 'Story poll'],
          ]}
        />

        <SectionHeading>Week 3: Social Proof &amp; Objection Handling</SectionHeading>
        <DataTable
          headers={['Day', 'Topic', 'Pillar', 'Format']}
          rows={[
            ['15', '"Is CULTR legit?" — here\'s the answer', 'General', 'Reel / TikTok'],
            ['16', 'FAQ: cost, insurance, HSA/FSA', 'General', 'Carousel'],
            ['17', 'My [X]-week progress update', 'Metabolic / Recovery', 'Reel / TikTok'],
            ['18', 'Why I chose CULTR over [generic alternative]', 'General', 'Caption post'],
            ['19', 'Brain fog isn\'t normal — it\'s a signal', 'Cognitive', 'Reel / TikTok'],
            ['20', 'Your mouth bacteria affect your heart (oral microbiome)', 'Oral Health', 'Carousel'],
            ['21', 'Weekly recap + DM prompt', 'All', 'Story CTA'],
          ]}
        />

        <SectionHeading>Week 4: Conversion &amp; Momentum</SectionHeading>
        <DataTable
          headers={['Day', 'Topic', 'Pillar', 'Format']}
          rows={[
            ['22', 'How to get started with CULTR (step by step)', 'General', 'Reel / TikTok'],
            ['23', 'What happens after you take the quiz', 'General', 'Story series'],
            ['24', 'The biological age test that changed my perspective', 'Longevity', 'Reel / TikTok'],
            ['25', 'Recovery optimization beyond rest days', 'Recovery', 'Carousel'],
            ['26', 'Discount code reminder + personal recommendation', 'General', 'Caption post'],
            ['27', 'The one metric I wish I\'d tested sooner', 'Longevity', 'Reel / TikTok'],
            ['28', 'Monthly recap: what I learned, what changed', 'All', 'Long-form caption'],
            ['29', 'Audience results / DM highlights (anonymized)', 'Social Proof', 'Story series'],
            ['30', '"Take the quiz" CTA with personal testimonial', 'General', 'Reel / TikTok'],
          ]}
        />

        <SectionHeading>Posting Best Practices</SectionHeading>
        <BulletList items={[
          'Post short-form content 5-6 days per week (rest day = Q&A or recap)',
          'Best times: 7-9am, 12-1pm, or 6-8pm in your audience\'s timezone',
          'Batch create: film 3-4 videos in one session, schedule throughout the week',
          'Always include FTC disclosure (#ad or #partner) on sponsored content',
          'Rotate between Reels/TikTok, carousels, Stories, and caption posts',
          'Pin your top-performing CULTR post to your profile',
        ]} />
      </>
    ),
  },

  'weekly-longform-plan': {
    title: 'Weekly Long-Form Plan',
    category: 'Content Calendar',
    content: () => (
      <>
        <Paragraph>Publish 1-2 long-form pieces per week alongside your short-form content. These build authority, improve SEO, and give your audience a deeper understanding of health optimization.</Paragraph>

        <SectionHeading>8-Week Long-Form Schedule</SectionHeading>

        <DataTable
          headers={['Week', 'Topic', 'Format', 'Pillar']}
          rows={[
            ['1', 'Why I Switched to CULTR (My Full Story)', 'YouTube / Blog', 'General'],
            ['2', 'GLP-1 Medications Explained: What You Need to Know', 'YouTube / Podcast', 'Metabolic'],
            ['3', 'My Lab Results Walkthrough (28–59 Biomarkers)', 'YouTube', 'Longevity'],
            ['4', 'Peptides 101: What They Are and How They Work', 'YouTube / Blog', 'Recovery'],
            ['5', 'The Difference Between "Normal" and "Optimal" Health', 'Podcast / Blog', 'Longevity'],
            ['6', 'My [X]-Month Progress Report with CULTR', 'YouTube', 'General'],
            ['7', 'Oral Microbiome: The Test Nobody Talks About', 'YouTube / Blog', 'Oral Health'],
            ['8', 'Q&A: Your Top Questions About CULTR, Answered', 'YouTube / Podcast', 'General'],
          ]}
        />

        <SectionHeading>Long-Form Content Structure</SectionHeading>
        <Paragraph>Every long-form piece should follow this structure for maximum impact and conversion:</Paragraph>

        <SubHeading>YouTube Videos (8-15 min)</SubHeading>
        <BulletList items={[
          'Hook (0:00-0:30): Bold statement or question that stops scrolling',
          'FTC Disclosure (0:30): "This video is sponsored by / in partnership with CULTR"',
          'Problem (1:00-3:00): Establish the pain point your audience relates to',
          'Solution (3:00-7:00): Introduce CULTR and explain how it addresses the problem',
          'Your Experience (7:00-10:00): Personal results, lab walkthrough, protocol details',
          'CTA (10:00-end): Quiz link, coupon code, subscribe prompt',
        ]} />

        <SubHeading>Blog Posts (1,500-2,500 words)</SubHeading>
        <BulletList items={[
          'SEO-optimized title targeting search terms your audience uses',
          'Personal hook in the introduction — why this topic matters to YOU',
          'Educational body with subheadings, bullet points, and data',
          'Personal experience section with specific details',
          'CTA with tracking link and coupon code',
          'FTC disclosure at the top of the post',
        ]} />

        <SubHeading>Podcast Episodes (20-40 min)</SubHeading>
        <BulletList items={[
          'Sponsor mention in the intro and at the 15-minute mark',
          'Conversational tone — share opinions and experiences, not just facts',
          'Include the quiz link and coupon code in show notes',
          'Consider bringing on a CULTR-related guest (provider, fellow member)',
        ]} />

        <SectionHeading>Cross-Promotion Strategy</SectionHeading>
        <BulletList items={[
          'Turn each long-form piece into 3-5 short-form clips for the week',
          'Pull key quotes for tweet threads and LinkedIn posts',
          'Create a carousel summarizing the main points for Instagram',
          'Email your list when a new long-form piece drops',
          'Reference your long-form content in DM conversations',
        ]} />
      </>
    ),
  },

  'repurposing-workflow': {
    title: 'Repurposing Workflow',
    category: 'Content Calendar',
    content: () => (
      <>
        <Paragraph>One piece of content can become five. This workflow shows you how to maximize every video, blog post, or podcast episode by repurposing it across platforms.</Paragraph>

        <SectionHeading>The 1 &rarr; 5+ Workflow</SectionHeading>
        <Paragraph>Start with ONE anchor piece (a YouTube video, blog post, or podcast episode), then extract these derivative pieces:</Paragraph>

        <SubHeading>From a YouTube Video (10 min)</SubHeading>
        <BulletList items={[
          '1. YouTube Short (30-60 sec) — best hook or most shareable moment',
          '2. Instagram Reel / TikTok — same clip, reformatted for vertical',
          '3. Carousel post — 5-7 slides summarizing the key points',
          '4. Tweet thread — 5-8 tweets covering the main argument',
          '5. Email to your list — "New video: [title]" with a 3-sentence summary',
          '6. LinkedIn post — professional angle on the same topic',
          '7. Story series — behind-the-scenes of making the video + key takeaway',
        ]} />

        <SubHeading>From a Blog Post (2,000 words)</SubHeading>
        <BulletList items={[
          '1. Reel / TikTok — read the most compelling paragraph to camera',
          '2. Carousel — pull the 5 main points with visual design',
          '3. Tweet thread — condense each section into a tweet',
          '4. Email — send the introduction + "read the full post" link',
          '5. Pinterest pin — create a graphic with the headline and key stat',
        ]} />

        <SubHeading>From a Podcast Episode (30 min)</SubHeading>
        <BulletList items={[
          '1. Audiogram clips (3-4) — best 30-60 second moments with waveform visual',
          '2. Video clips (if recorded) — vertical clips for Reels/TikTok',
          '3. Blog post — transcribe and edit into a written article',
          '4. Quote graphics — pull the best one-liners for Instagram/Twitter',
          '5. Newsletter recap — "This week on the podcast: [topic]"',
        ]} />

        <SectionHeading>Step-by-Step Process</SectionHeading>
        <CopyBlock label="Weekly Repurposing Flow">{`MONDAY: Create or publish your anchor piece (video/blog/podcast)
TUESDAY: Extract 2-3 short-form clips, schedule for the week
WEDNESDAY: Create carousel or tweet thread from the anchor
THURSDAY: Email your list about the anchor piece
FRIDAY: Share behind-the-scenes or bonus content in Stories
WEEKEND: Schedule the remaining derivative pieces for next week

Total time: 2-3 hours of repurposing per anchor piece
Result: 5-7+ pieces of content from 1 creation session`}</CopyBlock>

        <SectionHeading>Repurposing Tools</SectionHeading>
        <BulletList items={[
          'Clip extraction: CapCut, Descript, Opus Clip (auto-generates short clips from long videos)',
          'Carousel design: Canva, Figma, or Instagram\'s built-in carousel editor',
          'Scheduling: Later, Buffer, or Hootsuite for multi-platform scheduling',
          'Transcription: Descript, Otter.ai, or YouTube\'s auto-captions',
          'Audio clips: Headliner for audiogram-style clips with waveforms',
        ]} />

        <SectionHeading>Key Principles</SectionHeading>
        <BulletList items={[
          'Optimize for the PLATFORM, not just the content — vertical for Reels/TikTok, square for feed posts',
          'Don\'t just re-share the same thing — adapt the format and angle for each platform',
          'The hook matters more than the body — spend extra time on the first 2 seconds of every clip',
          'Always include your CULTR CTA and FTC disclosure on repurposed pieces',
          'Track which derivative formats get the most engagement — double down on what works',
          'Batch your repurposing — dedicate one session per week to creating all derivative content',
        ]} />
      </>
    ),
  },
}
