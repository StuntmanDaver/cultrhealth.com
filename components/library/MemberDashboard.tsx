'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  RefreshCw,
  ChevronRight,
  DollarSign,
  Download,
  Receipt,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Pill,
  ShoppingCart,
  FileText,
  Scale,
  Flame,
  HelpCircle,
  Dumbbell,
  Brain,
  ArrowRight,
} from 'lucide-react';
import type { PlanTier, LibraryAccess } from '@/lib/config/plans';
import { TierGate } from '@/components/library/TierGate';
import { brandify } from '@/lib/utils';

interface MemberDashboardProps {
  tier: PlanTier | null;
  libraryAccess: LibraryAccess;
  patientId?: string;
  email: string;
}

interface Order {
  orderId: string;
  status: string;
  medication: string;
  createdAt: string;
  tracking?: string;
  shippedAt?: string;
}

interface LmnRecord {
  lmnNumber: string;
  orderNumber: string;
  issueDate: string;
  eligibleTotal: number;
  currency: string;
  itemCount: number;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  processing: { icon: RefreshCw, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  shipped: { icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  completed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  cancelled: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
};

export function MemberDashboard({
  tier,
  libraryAccess,
  patientId,
  email,
}: MemberDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [lmnRecords, setLmnRecords] = useState<LmnRecord[]>([]);
  const [lmnLoading, setLmnLoading] = useState(true);
  const [showLmnModal, setShowLmnModal] = useState(false);

  // Fetch orders from Asher Med API
  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/member/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    }
    fetchOrders();
  }, []);

  // Fetch LMN records for HSA/FSA documents
  useEffect(() => {
    async function fetchLmnRecords() {
      try {
        const response = await fetch('/api/lmn/list');
        if (response.ok) {
          const data = await response.json();
          setLmnRecords(data.lmns || []);
        }
      } catch (error) {
        console.error('Failed to fetch LMN records:', error);
      } finally {
        setLmnLoading(false);
      }
    }
    fetchLmnRecords();
  }, []);

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status.toLowerCase()] || STATUS_CONFIG.pending;
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions Header */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold">
              Member Dashboard
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Track your orders and manage your protocols
            </p>
          </div>
          {tier && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
              <span className="text-sm text-white/80 capitalize">{tier} Member</span>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link
            href="/intake"
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white text-stone-900 hover:bg-stone-100 transition-all"
          >
            <Plus className="w-6 h-6 text-stone-700" />
            <span className="text-xs font-medium text-center leading-tight">
              Start New Order
            </span>
          </Link>

          <Link
            href="/renewal"
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/20 text-white hover:bg-white/30 transition-all"
          >
            <RefreshCw className="w-6 h-6 text-white/80" />
            <span className="text-xs font-medium text-center leading-tight">
              Renewal
            </span>
          </Link>

          <button
            onClick={() => setShowLmnModal(true)}
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all relative"
          >
            <DollarSign className="w-6 h-6 text-white/80" />
            <span className="text-xs font-medium text-center leading-tight">
              HSA/FSA Docs
            </span>
            {lmnRecords.length > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {lmnRecords.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* LMN Viewer Modal */}
      {showLmnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowLmnModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-display font-bold text-stone-900">
                  Letters of Medical Necessity
                </h3>
              </div>
              <button onClick={() => setShowLmnModal(false)} className="text-stone-400 hover:text-stone-600 text-xl leading-none">&times;</button>
            </div>

            {lmnLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-stone-500 mt-2">Loading documents...</p>
              </div>
            ) : lmnRecords.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {lmnRecords.map((record) => (
                  <div
                    key={record.lmnNumber}
                    className="bg-stone-50 rounded-xl p-4 border border-stone-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-stone-900 text-sm">
                        {record.lmnNumber}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Order {record.orderNumber} &middot;{' '}
                        {new Date(record.issueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <a
                      href={`/api/lmn/${record.lmnNumber}`}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      View
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-600 font-medium">No Documents Yet</p>
                <p className="text-sm text-stone-500 mt-1">
                  When you purchase eligible products, your LMN will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-bold text-stone-900">
            Your Orders
          </h3>
          <Link
            href="/intake"
            className="text-sm text-stone-500 hover:text-stone-700 font-medium flex items-center gap-1"
          >
            New Order <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-stone-100 rounded w-40 mb-2" />
                    <div className="h-3 bg-stone-100 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const config = getStatusConfig(order.status);
              const StatusIcon = config.icon;
              return (
                <div
                  key={order.orderId}
                  className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-stone-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Pill className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-stone-900 truncate">
                          {order.medication}
                        </p>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span className="capitalize">{order.status}</span>
                        </span>
                      </div>
                      <p className="text-sm text-stone-500 mt-1">
                        Order {order.orderId} &middot;{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {order.tracking && (
                        <p className="text-sm text-stone-500 mt-1">
                          Tracking: <span className="font-medium text-stone-700">{order.tracking}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 font-medium">No Orders Yet</p>
            <p className="text-sm text-stone-500 mt-1 mb-4">
              Start your first order to begin your protocol.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Start New Order
            </Link>
          </div>
        )}
      </div>

      {/* Members Shop, Protocol Tools & Provider Resources */}
      <div className="space-y-12 mt-12">
        {/* Members Shop */}
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 mb-4">Members Shop</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <TierGate
              requiredTier="core"
              currentTier={tier}
              upgradeMessage="Upgrade to Core to access the product shop."
            >
              <Link
                href="/library/shop"
                className="group flex items-center gap-4 px-6 py-5 bg-stone-900 text-white rounded-2xl hover:bg-stone-800 transition-all"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Product Shop</p>
                  <p className="text-white/70 text-sm">Browse 130+ peptides and request quotes</p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            </TierGate>
            <div className="flex items-center gap-4 px-6 py-5 grad-white border border-stone-200 rounded-2xl">
              <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-stone-600" />
              </div>
              <div className="flex-1">
                <p className="text-stone-900 font-medium">Quote History</p>
                <p className="text-stone-500 text-sm">View past quote requests</p>
                <span className="text-xs text-stone-400 italic">Coming soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Protocol Tools */}
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 mb-4">Protocol Tools</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <TierGate
              requiredTier="club"
              currentTier={tier}
              upgradeMessage={brandify("Join CULTR Club to unlock dosing calculators.")}
            >
              <Link
                href="/library/dosing-calculator"
                className="group flex items-center gap-4 px-6 py-5 grad-white border border-stone-200 rounded-2xl hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Scale className="w-6 h-6 text-purple-700" />
                </div>
                <div className="flex-1">
                  <p className="text-stone-900 font-medium">Dosing Calculators</p>
                  <p className="text-stone-500 text-sm">Peptide reconstitution & syringe dosing</p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all" />
              </Link>
            </TierGate>
            <TierGate
              requiredTier="club"
              currentTier={tier}
              upgradeMessage={brandify("Join CULTR Club to unlock the calorie calculator.")}
            >
              <Link
                href="/library/calorie-calculator"
                className="group flex items-center gap-4 px-6 py-5 grad-white border border-stone-200 rounded-2xl hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Flame className="w-6 h-6 text-orange-700" />
                </div>
                <div className="flex-1">
                  <p className="text-stone-900 font-medium">Calorie & Macro Calculator</p>
                  <p className="text-stone-500 text-sm">BMR, TDEE & macro planning</p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all" />
              </Link>
            </TierGate>
            <Link
              href="/library/peptide-faq"
              className="group flex items-center gap-4 px-6 py-5 grad-white border border-stone-200 rounded-2xl hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all"
            >
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                <HelpCircle className="w-6 h-6 text-teal-700" />
              </div>
              <div className="flex-1">
                <p className="text-stone-900 font-medium">Peptide FAQ</p>
                <p className="text-stone-500 text-sm">50+ questions on dosing, safety, stacking & more</p>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all" />
            </Link>
            <TierGate
              requiredTier="club"
              currentTier={tier}
              upgradeMessage={brandify("Join CULTR Club to unlock stacking guides.")}
            >
              <Link
                href="/library/stack-guides"
                className="group flex items-center gap-4 px-6 py-5 grad-white border border-stone-200 rounded-2xl hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Dumbbell className="w-6 h-6 text-orange-700" />
                </div>
                <div className="flex-1">
                  <p className="text-stone-900 font-medium">Stacking Guides</p>
                  <p className="text-stone-500 text-sm">Protocol combinations and sequencing</p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all" />
              </Link>
            </TierGate>
          </div>
        </div>

        {/* Provider Resources */}
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 mb-4">Provider Resources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <TierGate
              requiredTier="concierge"
              currentTier={tier}
              upgradeMessage="Upgrade to Curated to unlock provider note templates."
            >
              <div className="flex items-center gap-4 px-6 py-5 grad-white border border-stone-200 rounded-2xl">
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-stone-600" />
                </div>
                <div className="flex-1">
                  <p className="text-stone-900 font-medium">Provider Note Templates</p>
                  <p className="text-stone-500 text-sm">High-touch documentation workflows</p>
                </div>
              </div>
            </TierGate>
            <TierGate
              requiredTier="concierge"
              currentTier={tier}
              upgradeMessage="Upgrade to Curated to unlock custom protocol requests."
            >
              <div className="flex items-center gap-4 px-6 py-5 grad-white border border-stone-200 rounded-2xl">
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-stone-600" />
                </div>
                <div className="flex-1">
                  <p className="text-stone-900 font-medium">Custom Protocol Requests</p>
                  <p className="text-stone-500 text-sm">White-glove protocol design with your provider</p>
                </div>
              </div>
            </TierGate>
          </div>
        </div>
      </div>
    </div>
  );
}
