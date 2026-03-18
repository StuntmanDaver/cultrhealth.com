// Generate CULTR Health Business Card PDF with tracking QR code
// Usage: node scripts/generate-business-card.mjs
// Output: cultr_business_card.pdf

import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet, renderToFile } from '@react-pdf/renderer'
import QRCode from 'qrcode'

// ── Brand Colors ──
const FOREST = '#2A4542'
const CREAM = '#FDFBF7'
const SAGE = '#B7E4C7'

// ── Business Card: 3.5" × 2" at 72 DPI ──
const CARD_W = 3.5 * 72  // 252
const CARD_H = 2 * 72    // 144
const BLEED = 0.125 * 72 // 9
const PAGE_W = CARD_W + BLEED * 2  // 270
const PAGE_H = CARD_H + BLEED * 2  // 162

// QR code URL — tracked redirect
const QR_URL = 'https://staging.cultrhealth.com/go/instagram?source=business_card'

const styles = StyleSheet.create({
  page: {
    width: PAGE_W,
    height: PAGE_H,
  },
  // ── Front Side ──
  front: {
    width: PAGE_W,
    height: PAGE_H,
    backgroundColor: FOREST,
    justifyContent: 'center',
    alignItems: 'center',
    padding: BLEED,
  },
  frontContent: {
    width: CARD_W,
    height: CARD_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topLine: {
    width: CARD_W * 0.85,
    height: 1.5,
    backgroundColor: SAGE,
    marginBottom: 18,
  },
  cultrText: {
    fontFamily: 'Times-Bold',
    fontSize: 30,
    color: CREAM,
    letterSpacing: 10,
    textAlign: 'center',
  },
  healthText: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: SAGE,
    letterSpacing: 6,
    textAlign: 'center',
    marginTop: 3,
  },
  divider: {
    width: CARD_W * 0.55,
    height: 1,
    backgroundColor: SAGE,
    marginTop: 10,
    marginBottom: 10,
  },
  sloganLine1: {
    fontFamily: 'Times-Bold',
    fontSize: 13,
    color: CREAM,
    textAlign: 'center',
  },
  sloganLine2: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
  },
  rebrand: {
    fontFamily: 'Times-Italic',
    fontSize: 13,
    color: SAGE,
  },
  yourself: {
    fontFamily: 'Times-Bold',
    fontSize: 13,
    color: CREAM,
  },
  urlText: {
    fontFamily: 'Helvetica',
    fontSize: 6,
    color: SAGE,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.8,
  },
  bottomLine: {
    width: CARD_W * 0.85,
    height: 1.5,
    backgroundColor: SAGE,
    marginTop: 18,
  },

  // ── Back Side ──
  back: {
    width: PAGE_W,
    height: PAGE_H,
    backgroundColor: CREAM,
    padding: BLEED,
  },
  backContent: {
    width: CARD_W,
    height: CARD_H,
    flexDirection: 'row',
  },
  // Top/bottom forest bars
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BLEED + 6,
    backgroundColor: FOREST,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BLEED + 6,
    backgroundColor: FOREST,
  },
  leftPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  followText: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: FOREST,
    opacity: 0.6,
    marginBottom: 3,
  },
  instagramText: {
    fontFamily: 'Times-Bold',
    fontSize: 18,
    color: FOREST,
    marginBottom: 10,
  },
  handleText: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
    color: FOREST,
    marginTop: 10,
  },
  scanText: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: FOREST,
    opacity: 0.5,
    marginTop: 8,
  },
  // Vertical divider
  vertDivider: {
    width: 1,
    height: CARD_H * 0.6,
    backgroundColor: FOREST,
    opacity: 0.15,
    alignSelf: 'center',
  },
  rightPanel: {
    flex: 1.1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrImage: {
    width: 88,
    height: 88,
  },
})

async function generateCard() {
  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(QR_URL, {
    width: 400,
    margin: 0,
    color: {
      dark: FOREST,
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  })

  const CardDocument = React.createElement(
    Document,
    null,
    // ── Page 1: Front ──
    React.createElement(
      Page,
      { size: [PAGE_W, PAGE_H], style: styles.page },
      React.createElement(
        View,
        { style: styles.front },
        React.createElement(
          View,
          { style: styles.frontContent },
          React.createElement(View, { style: styles.topLine }),
          React.createElement(Text, { style: styles.cultrText }, 'C U L T R'),
          React.createElement(Text, { style: styles.healthText }, 'H E A L T H'),
          React.createElement(View, { style: styles.divider }),
          React.createElement(Text, { style: styles.sloganLine1 }, 'Change the CULTR.'),
          React.createElement(
            View,
            { style: styles.sloganLine2 },
            React.createElement(Text, { style: styles.rebrand }, 'rebrand '),
            React.createElement(Text, { style: styles.yourself }, 'Yourself.'),
          ),
          React.createElement(Text, { style: styles.urlText }, 'cultrhealth.com'),
          React.createElement(View, { style: styles.bottomLine }),
        ),
      ),
    ),
    // ── Page 2: Back ──
    React.createElement(
      Page,
      { size: [PAGE_W, PAGE_H], style: styles.page },
      React.createElement(View, { style: styles.topBar }),
      React.createElement(View, { style: styles.bottomBar }),
      React.createElement(
        View,
        { style: styles.backContent },
        React.createElement(
          View,
          { style: styles.leftPanel },
          React.createElement(Text, { style: styles.followText }, 'Follow us on'),
          React.createElement(Text, { style: styles.instagramText }, 'Instagram'),
          React.createElement(Text, { style: styles.handleText }, '@cultrhealth'),
          React.createElement(Text, { style: styles.scanText }, 'Scan to follow'),
        ),
        React.createElement(View, { style: styles.vertDivider }),
        React.createElement(
          View,
          { style: styles.rightPanel },
          React.createElement(
            View,
            { style: styles.qrContainer },
            React.createElement(Image, { style: styles.qrImage, src: qrDataUrl }),
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
