'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { TextShimmer } from '@/components/ui/TextShimmer'
import { LINKS } from '@/lib/config/links'
import { getStatusDisplay, isActiveStatus } from '@/lib/portal-orders'
import type { PortalOrder } from '@/lib/portal-orders'
import {
  LogOut,
  ClipboardList,
  FileText,
  CreditCard,
  HelpCircle,
  X,
  Check,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

export default function DashboardClient() {
  const router = useRouter()
  const [orders, setOrders] = useState<PortalOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [detailOrder, setDetailOrder] = useState<PortalOrder | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Renewal prompt state
  const [supplyData, setSupplyData] = useState<{ daysRemaining: number; isLow: boolean } | null>(null)
  const [renewalEligible, setRenewalEligible] = useState(false)
  const [patientFirstName, setPatientFirstName] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/portal/orders')
      if (res.status === 401) return // auth guard handles redirect
      if (!res.ok) throw new Error('Failed to load orders')
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders)
      } else {
        throw new Error(data.error || 'Failed to load orders')
      }
    } catch {
      setError('Unable to load your orders right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/portal/orders')
        if (cancelled) return
        if (res.status === 401) return
        if (!res.ok) throw new Error('Failed to load orders')
        const data = await res.json()
        if (cancelled) return
        if (data.success) {
          setOrders(data.orders)
        } else {
          throw new Error(data.error || 'Failed to load orders')
        }
      } catch {
        if (!cancelled) setError('Unable to load your orders right now.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Fetch renewal/supply data for prompt
  useEffect(() => {
    let cancelled = false
    fetch('/api/portal/prefill')
      .then(async (res) => {
        if (cancelled || !res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data.success && data.prefill) {
          setSupplyData(data.prefill.supply)
          setRenewalEligible(data.prefill.renewalEligible)
          const firstName = data.prefill.renewal?.firstName || data.prefill.intake?.firstName
          if (firstName) setPatientFirstName(firstName)
        }
      })
      .catch(() => {
        // Fail silently -- renewal prompt is a nice-to-have
      })
    return () => { cancelled = true }
  }, [])

  // Slide-over: fetch detail when selectedOrderId changes
  useEffect(() => {
    if (!selectedOrderId) {
      setDetailOrder(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    fetch(`/api/portal/orders/${selectedOrderId}`)
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        if (cancelled) return
        if (data.success) {
          setDetailOrder(data.order)
          // Update the order in the list with fresh data
          setOrders((prev) =>
            prev.map((o) => (o.id === data.order.id ? data.order : o))
          )
        }
      })
      .catch(() => {
        if (!cancelled) setDetailOrder(null)
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedOrderId])

  // Lock body scroll when slide-over is open
  useEffect(() => {
    if (selectedOrderId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [selectedOrderId])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/portal/logout', { method: 'POST' })
    } catch {
      // Best-effort
    }
    router.replace('/portal/login')
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  // Hero card: most recent active order, or fallback to first
  const heroOrder = orders.find((o) => isActiveStatus(o.status)) || orders[0] || null
  const listOrders = heroOrder
    ? orders.filter((o) => o.id !== heroOrder.id)
    : []

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          {patientFirstName ? (
            <TextShimmer duration={3} spread={3}>
              {`Welcome back, ${patientFirstName}`}
            </TextShimmer>
          ) : (
            <span className="text-brand-primary">Your Dashboard</span>
          )}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          isLoading={isLoggingOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div>
          {/* Hero skeleton */}
          <div className="rounded-2xl border border-brand-primary/10 p-6 animate-pulse mb-4">
            <div className="h-6 bg-brand-primary/10 rounded w-1/2 mb-4" />
            <div className="h-4 bg-brand-primary/10 rounded w-1/3 mb-3" />
            <div className="h-4 bg-brand-primary/10 rounded w-2/3 mb-3" />
            <div className="h-4 bg-brand-primary/10 rounded w-1/4" />
          </div>
          {/* List skeletons */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl p-4 animate-pulse mb-3"
            >
              <div className="h-4 bg-brand-primary/10 rounded w-1/2 mb-2" />
              <div className="h-3 bg-brand-primary/10 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 mb-6">
          <p className="text-red-800 text-sm mb-2">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchOrders}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && orders.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-brand-primary/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl text-brand-primary mb-2">
            Welcome to CULTR Health!
          </h2>
          <p className="text-brand-primary/60 mb-6">
            Start your journey by completing your medical intake.
          </p>
          <Link href="/portal/intake">
            <Button variant="primary" size="lg">
              Start Intake
            </Button>
          </Link>
        </div>
      )}

      {/* Hero Card */}
      {!isLoading && !error && heroOrder && (
        <div
          className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow mb-4"
          onClick={() => setSelectedOrderId(heroOrder.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setSelectedOrderId(heroOrder.id)}
        >
          <h2 className="text-xl font-display font-semibold text-brand-primary mb-2">
            {heroOrder.medicationName}
          </h2>
          {(() => {
            const display = getStatusDisplay(heroOrder.status)
            return (
              <>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${display.bgClass} ${display.textClass}`}
                >
                  {display.label}
                </span>
                <p className="text-brand-primary/60 text-sm mt-2">
                  {display.explanation}
                </p>
              </>
            )
          })()}
          <div className="flex flex-col gap-1 mt-3 text-sm text-brand-primary/50">
            <span>Ordered {formatDate(heroOrder.createdAt)}</span>
            <span>Updated {formatDate(heroOrder.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-sm">
            {heroOrder.doctorId ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-700">Provider assigned</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-amber-600">Awaiting provider</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Renewal Prompt */}
      {!isLoading && renewalEligible && supplyData?.isLow && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">
                {supplyData.daysRemaining <= 0
                  ? 'Your medication supply may have run out'
                  : `${supplyData.daysRemaining} day${supplyData.daysRemaining === 1 ? '' : 's'} of medication remaining`}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Start your renewal now to avoid a gap in treatment.
              </p>
              <Link
                href="/portal/renewal"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-600 text-white rounded-full text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Start Renewal
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Order List */}
      {!isLoading && !error && listOrders.length > 0 && (
        <div className="space-y-3 mb-6">
          {listOrders.map((order) => {
            const display = getStatusDisplay(order.status)
            return (
              <div
                key={order.id}
                className="rounded-xl bg-white p-4 border border-brand-primary/5 cursor-pointer hover:bg-brand-primary/[0.02] transition-colors"
                onClick={() => setSelectedOrderId(order.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' && setSelectedOrderId(order.id)
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-brand-primary">
                    {order.medicationName}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${display.bgClass} ${display.textClass}`}
                  >
                    {display.label}
                  </span>
                </div>
                <span className="text-xs text-brand-primary/40 mt-1 block">
                  {formatDate(order.createdAt)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Links -- always visible */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-brand-primary/50 uppercase tracking-wide mb-3">
          Quick Links
        </h3>
        <div className="space-y-3">
          <Link
            href="/portal/intake"
            className="flex items-center gap-3 rounded-xl bg-white p-4 border border-brand-primary/5 hover:bg-brand-primary/[0.02] transition-colors"
          >
            <FileText className="w-5 h-5 text-brand-primary/40" />
            <div>
              <span className="font-medium text-brand-primary block">
                Start Intake
              </span>
              <span className="text-xs text-brand-primary/40">
                Complete your medical questionnaire
              </span>
            </div>
          </Link>
          <Link
            href="/portal/renewal"
            className="flex items-center gap-3 rounded-xl bg-white p-4 border border-brand-primary/5 hover:bg-brand-primary/[0.02] transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-brand-primary/40" />
            <div>
              <span className="font-medium text-brand-primary block">
                Renew Prescription
              </span>
              <span className="text-xs text-brand-primary/40">
                Renew with your info pre-filled
              </span>
            </div>
          </Link>
          <a
            href={LINKS.stripeCustomerPortal}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-white p-4 border border-brand-primary/5 hover:bg-brand-primary/[0.02] transition-colors"
          >
            <CreditCard className="w-5 h-5 text-brand-primary/40" />
            <div>
              <span className="font-medium text-brand-primary block">
                Manage Subscription
              </span>
              <span className="text-xs text-brand-primary/40">
                Update billing and payment method
              </span>
            </div>
          </a>
          <a
            href={`mailto:${LINKS.supportEmail}`}
            className="flex items-center gap-3 rounded-xl bg-white p-4 border border-brand-primary/5 hover:bg-brand-primary/[0.02] transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-brand-primary/40" />
            <div>
              <span className="font-medium text-brand-primary block">
                Contact Support
              </span>
              <span className="text-xs text-brand-primary/40">
                Get help from our care team
              </span>
            </div>
          </a>
        </div>
      </div>

      {/* Slide-over Panel */}
      {selectedOrderId && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedOrderId(null)}
          />
          {/* Panel */}
          <div
            className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
              selectedOrderId ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-brand-primary/10">
              <h3 className="font-display text-lg font-semibold text-brand-primary">
                Order Details
              </h3>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="p-1 rounded-full hover:bg-brand-primary/5 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-brand-primary/50" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto h-[calc(100%-57px)]">
              {detailLoading && (
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-brand-primary/10 rounded w-2/3" />
                  <div className="h-4 bg-brand-primary/10 rounded w-1/2" />
                  <div className="h-4 bg-brand-primary/10 rounded w-3/4" />
                  <div className="h-4 bg-brand-primary/10 rounded w-1/3" />
                </div>
              )}
              {!detailLoading && detailOrder && (() => {
                const display = getStatusDisplay(detailOrder.status)
                return (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-xl font-display font-semibold text-brand-primary">
                        {detailOrder.medicationName}
                      </h4>
                      <span className="text-xs text-brand-primary/40">
                        Order #{detailOrder.id}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${display.bgClass} ${display.textClass}`}
                      >
                        {display.label}
                      </span>
                      <p className="text-brand-primary/60 text-sm mt-1">
                        {display.explanation}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-brand-primary/50">Ordered</span>
                        <span className="text-brand-primary">
                          {formatDate(detailOrder.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-primary/50">
                          Last Updated
                        </span>
                        <span className="text-brand-primary">
                          {formatDate(detailOrder.updatedAt)}
                        </span>
                      </div>
                      {detailOrder.orderType && (
                        <div className="flex justify-between">
                          <span className="text-brand-primary/50">
                            Order Type
                          </span>
                          <span className="text-brand-primary capitalize">
                            {detailOrder.orderType.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-brand-primary/50">Provider</span>
                        <span className="text-brand-primary">
                          {detailOrder.doctorId ? (
                            <span className="flex items-center gap-1 text-green-700">
                              <Check className="w-3.5 h-3.5" /> Assigned
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Clock className="w-3.5 h-3.5" /> Awaiting
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    {detailOrder.partnerNote && (
                      <div className="rounded-lg bg-brand-primary/[0.03] p-3">
                        <span className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide block mb-1">
                          Notes
                        </span>
                        <p className="text-sm text-brand-primary/70">
                          {detailOrder.partnerNote}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
