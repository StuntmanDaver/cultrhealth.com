import {
  SectionHeading,
  SubHeading,
  Paragraph,
  BulletList,
  ColorSwatch,
  DownloadButton,
  CopyBlock,
  type ResourceEntry,
} from '../_components/helpers'

export const brandKit: Record<string, ResourceEntry> = {
  'logo-pack': {
    title: 'Logo Pack',
    category: 'Brand Kit',
    content: () => (
      <>
        <Paragraph>Download official CULTR logos for use in your content, thumbnails, and promotional materials. Always use approved logos &mdash; never recreate or modify them.</Paragraph>

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
          'Primary wordmark \u2014 dark on light backgrounds',
          'Reversed wordmark \u2014 white on dark backgrounds',
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
          <DownloadButton href="/creators/brand-kit/cultr-logo-dark.svg" label="Logo \u2014 Dark (Forest)" format="SVG" />
          <DownloadButton href="/creators/brand-kit/cultr-logo-white.svg" label="Logo \u2014 White (Reversed)" format="SVG" />
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
          'Forest (#2A4542) is the primary brand color \u2014 use for headlines, CTAs, and primary elements',
          'Sage and Mint are supporting colors \u2014 use for backgrounds, badges, and secondary elements',
          'Copper is an accent \u2014 use sparingly for highlights and special callouts',
          'Cream/Off-White are background colors \u2014 maintain the warm, premium feel',
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
        <Paragraph>CULTR photography is warm, natural, and lifestyle-focused. Images should feel aspirational but attainable &mdash; real people living their best lives, not overly polished fitness model shots.</Paragraph>

        <BulletList items={[
          'Natural lighting preferred \u2014 warm tones, golden hour aesthetic',
          'Subjects should look healthy, energetic, and approachable',
          'Avoid clinical or overly medical imagery',
          'Diverse representation in age, gender, ethnicity, and body type',
          'Settings: outdoors, gyms, kitchens, offices \u2014 everyday environments',
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
        <Paragraph>CULTR speaks with confidence, clarity, and authority &mdash; but never arrogance. We&apos;re the knowledgeable friend who tells it straight, not the doctor who talks down to you.</Paragraph>

        <SubHeading>Tone Attributes</SubHeading>
        <BulletList items={[
          'Direct \u2014 Say it plainly. No jargon, no fluff.',
          'Confident \u2014 We know our science. No hedging or over-qualifying.',
          'Empowering \u2014 The reader is in control. We provide the tools.',
          'Warm \u2014 Professional doesn\'t mean cold. We care about outcomes.',
          'Premium \u2014 We\'re not a discount brand. Quality over quantity.',
        ]} />

        <SubHeading>Voice Examples</SubHeading>
        <CopyBlock label="\u2705 DO">{`"Stop guessing. Start optimizing."
"Your doctor tests 5 markers. We test 50+."
"Lab-tested protocols. Licensed providers. Real results."
"Peptides that work. From $199/mo."`}</CopyBlock>

        <CopyBlock label="\u274C DON'T">{`"We might be able to help you feel a bit better."
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
          'Display font: Playfair Display \u2014 used for headlines, brand name, and emphasis text',
          'Body font: Inter \u2014 used for all body copy, UI text, and descriptions',
          'Never use Comic Sans, Papyrus, or decorative fonts in CULTR-branded content',
        ]} />

        <SectionHeading>Visual Identity</SectionHeading>
        <BulletList items={[
          'Rounded corners (border-radius) on all cards, buttons, and containers',
          'Generous white space \u2014 never crowd elements together',
          'Subtle shadows over heavy borders',
          'Forest green (#2A4542) as the dominant color with sage/mint accents',
          'Photography should feel warm and natural (see Photography resource)',
        ]} />
      </>
    ),
  },
}
