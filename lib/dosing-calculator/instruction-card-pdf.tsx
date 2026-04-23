// CULTR Dosing Calculator — printable patient instruction card (PDF template).
// Uses @react-pdf/renderer, modelled after lib/invoice/invoice-template.tsx.

import React from 'react'
import {
  Document,
  Image,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import { join } from 'path'

export interface InstructionPdfInput {
  therapyLabel?: string | null
  therapyCompound?: string | null
  vialMg: number
  waterMl: number
  dose: number
  doseUnit: 'mcg' | 'mg'
  drawMl: number
  drawUnitsU100: number
  concentrationMgPerMl: number
  syringeMl?: number | null
  warnings?: string[]
  totalMg?: number | null
  totalVials?: number | null
  daysPerVial?: number | null
  generatedAt?: Date
}

const FOREST = '#2A4542'
const FOREST_SOFT = '#3A5956'
const MINT = '#D8F3DC'
const CREAM = '#FDFBF7'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: CREAM,
    color: FOREST,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: FOREST,
    paddingBottom: 18,
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 'auto' as unknown as number,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: FOREST,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 9,
    color: FOREST_SOFT,
    textAlign: 'right',
    marginTop: 4,
  },
  therapyBox: {
    backgroundColor: MINT,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  therapyLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: FOREST,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  therapyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: FOREST,
    marginTop: 3,
  },
  therapyCompound: {
    fontSize: 10,
    color: FOREST_SOFT,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: FOREST,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: FOREST,
    color: CREAM,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    paddingTop: 6,
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: FOREST,
    marginBottom: 3,
  },
  stepBody: {
    fontSize: 11,
    color: FOREST_SOFT,
    lineHeight: 1.4,
  },
  stepStrong: {
    color: FOREST,
    fontWeight: 'bold',
  },
  factsTable: {
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c9d7d4',
    borderRadius: 4,
  },
  factsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e6edea',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  factsRowLast: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  factsLabel: {
    flex: 1,
    fontSize: 10,
    color: FOREST_SOFT,
  },
  factsValue: {
    fontSize: 10,
    color: FOREST,
    fontWeight: 'bold',
  },
  planSection: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c9d7d4',
    borderRadius: 4,
    padding: 14,
  },
  warningBox: {
    marginTop: 12,
    backgroundColor: '#fef3c7',
    borderLeftWidth: 3,
    borderLeftColor: '#b45309',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 2,
  },
  warningTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  warningText: {
    fontSize: 10,
    color: '#78350f',
    lineHeight: 1.4,
    marginBottom: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7c7a',
    borderTopWidth: 1,
    borderTopColor: '#e6edea',
    paddingTop: 10,
  },
  disclaimer: {
    marginTop: 24,
    fontSize: 9,
    color: '#6b7c7a',
    lineHeight: 1.5,
  },
})

export function InstructionCardDocument({ data }: { data: InstructionPdfInput }) {
  const dose = data.doseUnit === 'mcg' ? `${Math.round(data.dose)} mcg` : `${data.dose.toFixed(3)} mg`
  const drawVolume = data.drawMl.toFixed(3)
  const drawUnits = data.drawUnitsU100.toFixed(1)
  const generatedAt = (data.generatedAt ?? new Date()).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image style={styles.logo} src={join(process.cwd(), 'public/cultr-health-logo.png')} />
          <View>
            <Text style={styles.title}>DOSING INSTRUCTIONS</Text>
            <Text style={styles.subtitle}>Peptide reconstitution reference</Text>
          </View>
        </View>

        {/* Therapy */}
        {(data.therapyLabel || data.therapyCompound) && (
          <View style={styles.therapyBox}>
            <Text style={styles.therapyLabel}>Therapy</Text>
            {data.therapyLabel && <Text style={styles.therapyName}>{data.therapyLabel}</Text>}
            {data.therapyCompound && <Text style={styles.therapyCompound}>{data.therapyCompound}</Text>}
          </View>
        )}

        {/* Steps */}
        <Text style={styles.sectionTitle}>Instructions</Text>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>Reconstitute the vial</Text>
            <Text style={styles.stepBody}>
              Mix <Text style={styles.stepStrong}>{data.vialMg} mg</Text> of peptide with{' '}
              <Text style={styles.stepStrong}>{data.waterMl} mL</Text> bacteriostatic water. This
              gives a concentration of{' '}
              <Text style={styles.stepStrong}>{data.concentrationMgPerMl.toFixed(2)} mg/mL</Text>.
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>2</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>Measure your dose</Text>
            <Text style={styles.stepBody}>
              For a <Text style={styles.stepStrong}>{dose}</Text> dose, draw to{' '}
              <Text style={styles.stepStrong}>{drawUnits} units</Text> (
              <Text style={styles.stepStrong}>{drawVolume} mL</Text>)
              {data.syringeMl ? ` on a ${data.syringeMl} mL U-100 insulin syringe` : ''}.
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>3</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>Administer</Text>
            <Text style={styles.stepBody}>
              Follow your CULTR Health provider&apos;s instructions for injection site, frequency,
              and timing. Rotate sites as directed.
            </Text>
          </View>
        </View>

        {/* Facts table */}
        <Text style={styles.sectionTitle}>Reference</Text>
        <View style={styles.factsTable}>
          <View style={styles.factsRow}>
            <Text style={styles.factsLabel}>Vial amount</Text>
            <Text style={styles.factsValue}>{data.vialMg} mg</Text>
          </View>
          <View style={styles.factsRow}>
            <Text style={styles.factsLabel}>Bacteriostatic water</Text>
            <Text style={styles.factsValue}>{data.waterMl} mL</Text>
          </View>
          <View style={styles.factsRow}>
            <Text style={styles.factsLabel}>Concentration</Text>
            <Text style={styles.factsValue}>{data.concentrationMgPerMl.toFixed(2)} mg/mL</Text>
          </View>
          <View style={styles.factsRow}>
            <Text style={styles.factsLabel}>Per-injection dose</Text>
            <Text style={styles.factsValue}>{dose}</Text>
          </View>
          <View style={styles.factsRow}>
            <Text style={styles.factsLabel}>Volume to draw</Text>
            <Text style={styles.factsValue}>{drawVolume} mL ({drawUnits} units)</Text>
          </View>
          <View style={styles.factsRowLast}>
            <Text style={styles.factsLabel}>Syringe</Text>
            <Text style={styles.factsValue}>{data.syringeMl ? `${data.syringeMl} mL` : 'Not specified'}</Text>
          </View>
        </View>

        {/* Therapy plan (optional) */}
        {data.totalMg != null && data.totalVials != null && (
          <>
            <Text style={styles.sectionTitle}>Full cycle plan</Text>
            <View style={styles.planSection}>
              <View style={styles.factsRow}>
                <Text style={styles.factsLabel}>Total peptide for cycle</Text>
                <Text style={styles.factsValue}>{data.totalMg.toFixed(1)} mg</Text>
              </View>
              <View style={styles.factsRow}>
                <Text style={styles.factsLabel}>Total vials</Text>
                <Text style={styles.factsValue}>{data.totalVials}</Text>
              </View>
              {data.daysPerVial != null && (
                <View style={styles.factsRowLast}>
                  <Text style={styles.factsLabel}>Days per vial</Text>
                  <Text style={styles.factsValue}>{data.daysPerVial} days</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Warnings */}
        {data.warnings && data.warnings.length > 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Review before use</Text>
            {data.warnings.map((warning, idx) => (
              <Text key={idx} style={styles.warningText}>
                • {warning}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.disclaimer}>
          This reference was generated on {generatedAt}. The CULTR Health dosing calculator is an
          informational tool — always verify values and follow the instructions from your CULTR
          Health provider before administering any therapy.
        </Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>CULTR Health | support@cultrhealth.com | cultrhealth.com</Text>
          <Text style={{ marginTop: 3 }}>Change the CULTR, rebrand yourself.</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function renderInstructionPdfBuffer(data: InstructionPdfInput): Promise<Buffer> {
  const buffer = await renderToBuffer(<InstructionCardDocument data={data} />)
  return Buffer.from(buffer)
}
