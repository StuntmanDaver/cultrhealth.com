// Invoice PDF Template using @react-pdf/renderer

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { InvoiceData } from './invoice-types'

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
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
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'right',
    marginTop: 5,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoBlock: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoRow: {
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 9,
    color: '#666666',
  },
  infoValue: {
    fontSize: 10,
    color: '#1a1a1a',
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#cccccc',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#1a1a1a',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  tableCol1: { width: '45%' },
  tableCol2: { width: '15%', textAlign: 'center' },
  tableCol3: { width: '20%', textAlign: 'right' },
  tableCol4: { width: '20%', textAlign: 'right' },
  totalsSection: {
    marginTop: 10,
    marginLeft: 'auto',
    width: '50%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  totalsLabel: {
    fontSize: 10,
    color: '#666666',
  },
  totalsValue: {
    fontSize: 10,
    color: '#1a1a1a',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 2,
    borderTopColor: '#1a1a1a',
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  paymentInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  paymentText: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 3,
  },
  paidBadge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  notesSection: {
    marginTop: 20,
  },
  notesText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.5,
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
  thankYou: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
})

interface InvoiceDocumentProps {
  data: InvoiceData
}

export function InvoiceDocument({ data }: InvoiceDocumentProps) {
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

  const getPaymentMethodDisplay = (method: string, provider: string) => {
    const providerNames: Record<string, string> = {
      stripe: 'Credit Card (Stripe)',
      healthie: 'Credit Card (Healthie)',
      authorize_net: 'Credit Card (Authorize.net)',
      klarna: 'Klarna - Pay in 4',
      affirm: 'Affirm Financing',
    }
    return providerNames[provider] || method
  }

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>CULTR</Text>
            <Text style={styles.tagline}>PERSONALIZED LONGEVITY MEDICINE</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{data.invoiceNumber}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          {/* Bill To */}
          <View style={styles.infoBlock}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            {data.customerName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>{data.customerName}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{data.customerEmail}</Text>
            </View>
            {data.billingAddress && (
              <>
                {data.billingAddress.line1 && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoValue}>{data.billingAddress.line1}</Text>
                  </View>
                )}
                {(data.billingAddress.city || data.billingAddress.state || data.billingAddress.zip) && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoValue}>
                      {[data.billingAddress.city, data.billingAddress.state, data.billingAddress.zip]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Invoice Details */}
          <View style={styles.infoBlock}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice Date:</Text>
              <Text style={styles.infoValue}>{formatDate(data.issueDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order Number:</Text>
              <Text style={styles.infoValue}>{data.orderNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment Method:</Text>
              <Text style={styles.infoValue}>
                {getPaymentMethodDisplay(data.paymentMethod, data.paymentProvider)}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableCol1]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.tableCol2]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.tableCol3]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.tableCol4]}>Amount</Text>
          </View>

          {/* Table Rows */}
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableCol1}>
                <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>{item.name}</Text>
                <Text style={{ fontSize: 8, color: '#666666' }}>SKU: {item.sku}</Text>
              </View>
              <Text style={styles.tableCol2}>{item.quantity}</Text>
              <Text style={styles.tableCol3}>{formatCurrency(item.unitPrice, data.currency)}</Text>
              <Text style={styles.tableCol4}>{formatCurrency(item.totalPrice, data.currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatCurrency(data.subtotal, data.currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tax</Text>
            <Text style={styles.totalsValue}>{formatCurrency(data.tax, data.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.total, data.currency)}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Payment Information</Text>
          <Text style={styles.paymentText}>
            Payment processed via {getPaymentMethodDisplay(data.paymentMethod, data.paymentProvider)}
          </Text>
          <Text style={styles.paymentText}>
            Transaction completed on {formatDate(data.issueDate)}
          </Text>
          <Text style={styles.paidBadge}>PAID</Text>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Thank You */}
        <Text style={styles.thankYou}>Thank you for your order!</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>CULTR Health | support@cultrhealth.com | cultrhealth.com</Text>
          <Text style={{ marginTop: 3 }}>
            Questions about your order? Contact us at support@cultrhealth.com
          </Text>
        </View>
      </Page>
    </Document>
  )
}
