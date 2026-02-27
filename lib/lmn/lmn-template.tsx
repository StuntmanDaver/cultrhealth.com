// LMN PDF Template using @react-pdf/renderer

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { LmnData } from './lmn-types'

// Register Playfair Display for the CULTR logo
Font.register({
  family: 'Playfair Display',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.ttf',
      fontWeight: 700,
    },
  ],
})

// Create styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    letterSpacing: 0,
    color: '#1a1a1a',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 9,
    color: '#666666',
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 120,
    color: '#666666',
  },
  value: {
    flex: 1,
    color: '#1a1a1a',
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#cccccc',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#1a1a1a',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  tableCol1: { width: '40%' },
  tableCol2: { width: '15%', textAlign: 'center' },
  tableCol3: { width: '15%', textAlign: 'right' },
  tableCol4: { width: '15%', textAlign: 'right' },
  tableCol5: { width: '15%', textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 2,
    borderTopColor: '#1a1a1a',
    marginTop: 5,
  },
  totalLabel: {
    width: '70%',
    textAlign: 'right',
    fontWeight: 'bold',
    paddingRight: 10,
  },
  totalValue: {
    width: '30%',
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 12,
  },
  attestation: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  attestationText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: '#333333',
    textAlign: 'justify',
  },
  signature: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
  },
  signatureBlock: {
    marginTop: 15,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    width: 250,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666666',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10,
  },
  disclaimer: {
    marginTop: 20,
    fontSize: 8,
    color: '#888888',
    lineHeight: 1.4,
  },
})

interface LmnDocumentProps {
  data: LmnData
}

export function LmnDocument({ data }: LmnDocumentProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>CULTR</Text>
          <Text style={styles.tagline}>PERSONALIZED LONGEVITY MEDICINE</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Letter of Medical Necessity</Text>

        {/* Document Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>LMN Reference:</Text>
            <Text style={styles.value}>{data.lmnNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date Issued:</Text>
            <Text style={styles.value}>{formatDate(data.issueDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Order Number:</Text>
            <Text style={styles.value}>{data.orderNumber}</Text>
          </View>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          {data.customerName && (
            <View style={styles.row}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{data.customerName}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.customerEmail}</Text>
          </View>
        </View>

        {/* Medical Necessity Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Necessity Statement</Text>
          <Text style={{ fontSize: 10, lineHeight: 1.5, color: '#333333' }}>
            Based on the telehealth consultation conducted through CULTR Health&apos;s platform, 
            the following peptide therapeutics have been determined to be medically necessary 
            for the treatment and optimization of the patient&apos;s health conditions under 
            the supervision of a licensed healthcare provider.
          </Text>
        </View>

        {/* Products Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescribed Products</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.tableCol1]}>Product</Text>
              <Text style={[styles.tableHeaderText, styles.tableCol2]}>SKU</Text>
              <Text style={[styles.tableHeaderText, styles.tableCol3]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.tableCol4]}>Unit Price</Text>
              <Text style={[styles.tableHeaderText, styles.tableCol5]}>Total</Text>
            </View>

            {/* Table Rows */}
            {data.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCol1}>{item.name}</Text>
                <Text style={[styles.tableCol2, { fontSize: 8 }]}>{item.sku}</Text>
                <Text style={styles.tableCol3}>{item.quantity}</Text>
                <Text style={styles.tableCol4}>{formatCurrency(item.unitPrice, data.currency)}</Text>
                <Text style={styles.tableCol5}>{formatCurrency(item.totalPrice, data.currency)}</Text>
              </View>
            ))}

            {/* Total Row */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Eligible Amount:</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.eligibleTotal, data.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Attestation */}
        <View style={styles.attestation}>
          <Text style={styles.sectionTitle}>Attestation</Text>
          <Text style={styles.attestationText}>{data.attestationText}</Text>
        </View>

        {/* Digital Signature */}
        <View style={styles.signature}>
          <Text style={styles.sectionTitle}>Provider Attestation</Text>
          <View style={styles.signatureBlock}>
            <Text style={{ marginBottom: 10, fontStyle: 'italic' }}>
              Digitally attested and issued by:
            </Text>
            <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>{data.providerReference}</Text>
            <Text style={{ fontSize: 9, color: '#666666' }}>
              Issue Date: {formatDate(data.issueDate)}
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text>
            This letter is issued for HSA/FSA reimbursement purposes only. The products listed 
            were prescribed as part of a licensed healthcare provider&apos;s treatment protocol. 
            Patients should retain this document for their tax records. CULTR Health maintains 
            compliance with HIPAA regulations and all applicable healthcare laws.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>CULTR Health | support@cultrhealth.com | cultrhealth.com</Text>
          <Text style={{ marginTop: 3 }}>
            This document is confidential and intended solely for the named patient.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
