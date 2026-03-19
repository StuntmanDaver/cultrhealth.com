// Generate CULTR Health Business Card PDF with tracking QR code
// Usage: node scripts/generate-business-card.mjs
// Output: cultr_business_card.pdf
// Fonts: Playfair Display (headings), Inter (body)
// Logo: Actual CULTR SVG letterforms from public/cultr-logo-*.svg

import React from 'react'
import ReactPDF from '@react-pdf/renderer'
const { Document, Page, View, Text, Image, Font, StyleSheet, renderToFile } = ReactPDF
import sharp from 'sharp'
import QRCode from 'qrcode'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const h = React.createElement

// ── Register Brand Fonts ──
Font.register({
  family: 'Playfair Display',
  fonts: [
    { src: join(__dirname, 'fonts/PlayfairDisplay-Bold.ttf'), fontWeight: 700 },
    { src: join(__dirname, 'fonts/PlayfairDisplay-BoldItalic.ttf'), fontWeight: 700, fontStyle: 'italic' },
  ],
})
Font.register({
  family: 'Inter',
  src: join(__dirname, 'fonts/Inter-Regular.ttf'),
  fontWeight: 400,
})

// ── Brand Colors ──
const FOREST = '#2A4542'
const CREAM = '#FDFBF7'
const SAGE = '#B7E4C7'
const LOGO_CREAM = '#f7f6e8'

// ── Business Card: 3.5" × 2" at 72 DPI ──
const CARD_W = 3.5 * 72  // 252
const CARD_H = 2 * 72    // 144
const BLEED = 0.125 * 72 // 9
const PAGE_W = CARD_W + BLEED * 2  // 270
const PAGE_H = CARD_H + BLEED * 2  // 162

// QR code URL — tracked redirect
const QR_URL = 'https://staging.cultrhealth.com/go/instagram?source=business_card'

// ── Convert SVG string to PNG for pixel-perfect rendering ──
async function svgStringToPng(svgString, width) {
  const pngBuffer = await sharp(Buffer.from(svgString))
    .resize({ width })
    .png()
    .toBuffer()
  return `data:image/png;base64,${pngBuffer.toString('base64')}`
}

// ── Build logo SVG with HEALTH centered under R ──
// Read the paths from the cream SVG, but replace the text with one centered under R
import { readFileSync } from 'fs'

function buildLogoSvg(fill, healthFill) {
  const svgSource = readFileSync(join(process.cwd(), 'public/cultr-logo-cream-health.svg'), 'utf-8')
  // Extract just the path elements
  const paths = [...svgSource.matchAll(/<path[^>]*d="([^"]+)"[^>]*\/>/g)].map(m => m[1])

  // HEALTH below CULTR — moderate size, natural spacing, under T-R area
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 52">
  ${paths.map(d => `<path d="${d}" fill="${fill}"/>`).join('\n  ')}
  <text x="113" y="49" font-size="10" font-weight="500" fill="${healthFill}" font-family="Helvetica, Arial, sans-serif">HEALTH</text>
</svg>`
}

const styles = StyleSheet.create({
  page: { width: PAGE_W, height: PAGE_H },

  // ── Front Side ──
  front: {
    width: PAGE_W, height: PAGE_H, backgroundColor: FOREST,
    justifyContent: 'center', alignItems: 'center', padding: BLEED,
  },
  frontContent: {
    width: CARD_W, height: CARD_H,
    justifyContent: 'center', alignItems: 'center',
  },
  accentLine: {
    width: CARD_W * 0.85, height: 1.5, backgroundColor: SAGE,
  },
  logoImage: {
    width: CARD_W * 0.75,
    // aspect ratio 160:52
    height: (CARD_W * 0.75) / (160 / 52),
  },
  divider: {
    width: CARD_W * 0.55, height: 1, backgroundColor: SAGE,
    marginTop: 8, marginBottom: 8,
  },
  sloganLine1: {
    fontFamily: 'Playfair Display', fontWeight: 700,
    fontSize: 13, color: CREAM, textAlign: 'center',
  },
  sloganLine2: { flexDirection: 'row', justifyContent: 'center', marginTop: 2 },
  rebrand: {
    fontFamily: 'Playfair Display', fontWeight: 700, fontStyle: 'italic',
    fontSize: 13, color: SAGE,
  },
  yourself: {
    fontFamily: 'Playfair Display', fontWeight: 700,
    fontSize: 13, color: CREAM,
  },
  urlText: {
    fontFamily: 'Inter', fontSize: 6, color: SAGE,
    textAlign: 'center', marginTop: 10, opacity: 0.8,
  },

  // ── Back Side ──
  backPage: {
    width: PAGE_W, height: PAGE_H, backgroundColor: CREAM,
  },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: BLEED + 6, backgroundColor: FOREST,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: BLEED + 6, backgroundColor: FOREST,
  },
  backContent: {
    flex: 1, flexDirection: 'row',
    paddingLeft: BLEED + 10, paddingRight: BLEED + 10,
    paddingTop: BLEED + 12, paddingBottom: BLEED + 12,
  },
  leftPanel: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  followText: {
    fontFamily: 'Inter', fontSize: 9, color: FOREST,
    opacity: 0.55, marginBottom: 3,
  },
  instagramText: {
    fontFamily: 'Playfair Display', fontWeight: 700,
    fontSize: 18, color: FOREST, marginBottom: 10,
  },
  handleText: {
    fontFamily: 'Playfair Display', fontWeight: 700,
    fontSize: 10, color: FOREST, marginTop: 10,
  },
  scanText: {
    fontFamily: 'Inter', fontSize: 7, color: FOREST,
    opacity: 0.45, marginTop: 8,
  },
  vertDivider: {
    width: 1, height: '60%', backgroundColor: FOREST,
    opacity: 0.15, alignSelf: 'center',
  },
  rightPanel: { flex: 1.1, justifyContent: 'center', alignItems: 'center' },
  qrContainer: {
    width: 100, height: 100, backgroundColor: '#FFFFFF',
    borderRadius: 8, padding: 6,
    justifyContent: 'center', alignItems: 'center',
  },
  qrImage: { width: 88, height: 88 },
})

async function generateCard() {
  // Build custom logo SVG with HEALTH centered under R, convert to high-res PNG
  const logoSvg = buildLogoSvg(LOGO_CREAM, SAGE)
  const creamLogoPng = await svgStringToPng(logoSvg, 800)

  const qrDataUrl = await QRCode.toDataURL(QR_URL, {
    width: 400, margin: 0,
    color: { dark: FOREST, light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  })

  const CardDocument = h(Document, null,
    // ── Page 1: Front ──
    h(Page, { size: [PAGE_W, PAGE_H], style: styles.page },
      h(View, { style: styles.front },
        h(View, { style: styles.frontContent },
          h(View, { style: { ...styles.accentLine, marginBottom: 14 } }),
          h(Image, { style: styles.logoImage, src: creamLogoPng }),
          h(View, { style: styles.divider }),
          h(Text, { style: styles.sloganLine1 }, 'Change the CULTR.'),
          h(View, { style: styles.sloganLine2 },
            h(Text, { style: styles.rebrand }, 'rebrand '),
            h(Text, { style: styles.yourself }, 'Yourself.'),
          ),
          h(Text, { style: styles.urlText }, 'cultrhealth.com'),
          h(View, { style: { ...styles.accentLine, marginTop: 14 } }),
        ),
      ),
    ),
    // ── Page 2: Back ──
    h(Page, { size: [PAGE_W, PAGE_H], style: styles.page },
      h(View, { style: styles.backPage },
        h(View, { style: styles.topBar }),
        h(View, { style: styles.bottomBar }),
        h(View, { style: styles.backContent },
          h(View, { style: styles.leftPanel },
            h(Text, { style: styles.followText }, 'Follow us on'),
            h(Text, { style: styles.instagramText }, 'Instagram'),
            h(Text, { style: styles.handleText }, '@cultrhealth'),
            h(Text, { style: styles.scanText }, 'Scan to follow'),
          ),
          h(View, { style: styles.vertDivider }),
          h(View, { style: styles.rightPanel },
            h(View, { style: styles.qrContainer },
              h(Image, { style: styles.qrImage, src: qrDataUrl }),
            ),
          ),
        ),
      ),
    ),
  )

  const outputPath = process.cwd() + '/cultr_business_card.pdf'
  await renderToFile(CardDocument, outputPath)
  console.log(`Business card generated: ${outputPath}`)
  console.log(`QR code URL: ${QR_URL}`)
}

generateCard().catch(err => {
  console.error('Failed to generate business card:', err)
  process.exit(1)
})
