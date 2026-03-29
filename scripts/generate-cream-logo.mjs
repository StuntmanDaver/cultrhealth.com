/**
 * One-time script to generate cream and white variants of the official CULTR Health logo.
 *
 * Usage: node scripts/generate-cream-logo.mjs
 *
 * Outputs:
 *   public/images/email-logo-cream.png       — cream (#F7F6E8) for email dark backgrounds
 *   public/creators/brand-kit/cultr-logo-white.png — white for creator brand kit
 *   public/creators/brand-kit/cultr-logo-dark.png  — copy of official logo for creator downloads
 */
import sharp from 'sharp'
import { copyFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const SOURCE = join(ROOT, 'public/cultr-health-logo.png')

async function recolor(outputPath, r, g, b) {
  const { data, info } = await sharp(SOURCE).raw().ensureAlpha().toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(outputPath)

  console.log(`  ✓ ${outputPath}`)
}

// Ensure directories exist
mkdirSync(join(ROOT, 'public/images'), { recursive: true })
mkdirSync(join(ROOT, 'public/creators/brand-kit'), { recursive: true })

// Cream variant for email dark backgrounds
await recolor(join(ROOT, 'public/images/email-logo-cream.png'), 247, 246, 232)

// White variant for creator brand kit
await recolor(join(ROOT, 'public/creators/brand-kit/cultr-logo-white.png'), 255, 255, 255)

// Copy official logo to brand kit
copyFileSync(SOURCE, join(ROOT, 'public/creators/brand-kit/cultr-logo-dark.png'))
console.log(`  ✓ public/creators/brand-kit/cultr-logo-dark.png (copy of official)`)

console.log('\nDone! All logo variants generated.')
