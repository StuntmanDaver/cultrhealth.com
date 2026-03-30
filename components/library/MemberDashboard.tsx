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
  id: number;
  orderNumber: string;
  status: string;
  medicationName: string;
  createdAt: string;
  updatedAt?: string;
  tracking?: string;
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
  approved: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  waitingRoom: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  prescribed: { icon: Pill, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  processing: { icon: RefreshCw, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  shipped: { icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  completed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  denied: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
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
      <div className="bg-gradient-to-br from-brand-primary to-forest-dark rounded-3xl p-8 text-white">
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
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-brand-cream text-brand-primary hover:bg-cream-dark transition-all"
          >
            <Plus className="w-6 h-6 text-brand-primary" />
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

          <Link
            href="/members/shop"
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <ShoppingCart className="w-6 h-6 text-white/80" />
            <span className="text-xs font-medium text-center leading-tight">
              Shop Products
            </span>
          </Link>
        </div>
      </div>

      {/* Orders Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-bold text-brand-primary">
            Your Orders
          </h3>
          <Link
            href="/intake"
            className="text-sm text-brand-primary/50 hover:text-brand-primary font-medium flex items-center gap-1"
          >
            New Order <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-cream-dark border border-brand-primary/10 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary/5 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-brand-primary/5 rounded w-40 mb-2" />
                    <div className="h-3 bg-brand-primary/5 rounded w-24" />
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
                  key={order.orderNumber}
                  className="bg-cream-dark border border-brand-primary/10 rounded-2xl p-5 hover:border-brand-primary/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Pill className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-brand-primary truncate">
                          {order.medicationName}
                        </p>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span className="capitalize">{order.status}</span>
                        </span>
                      </div>
                      <p className="text-sm text-brand-primary/50 mt-1">
                        Order {order.orderNumber} &middot;{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {order.tracking && (
                        <p className="text-sm text-brand-primary/50 mt-1">
                          Tracking: <span className="font-medium text-brand-primary/70">{order.tracking}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-cream-dark border border-brand-primary/10 rounded-2xl p-8 text-center">
            <Package className="w-12 h-12 text-brand-primary/20 mx-auto mb-3" />
            <p className="text-brand-primary font-medium">No Orders Yet</p>
            <p className="text-sm text-brand-primary/50 mt-1 mb-4">
              Start your first order to begin your protocol.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 px-5 py-2 bg-brand-primary text-white rounded-full font-medium hover:bg-forest-light transition-colors text-sm"
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
          <h2 className="text-xl font-display font-bold text-brand-primary mb-4">Members Shop</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <TierGate
              requiredTier="core"
              currentTier={tier}
              upgradeMessage="Upgrade to Core to access the product shop."
            >
              <Link
                href="/members/shop"
                className="group flex items-center gap-4 px-6 py-5 bg-brand-primary text-white rounded-2xl hover:bg-forest-light transition-all"
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
            <div className="flex items-center gap-4 px-6 py-5 bg-cream-dark border border-brand-primary/10 rounded-2xl">
              <div className="w-12 h-12 bg-brand-primary/5 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-brand-primary/40" />
              </div>
              <div className="flex-1">
                <p className="text-brand-primary font-medium">Quote History</p>
                <p className="text-brand-primary/50 text-sm">View past quote requests</p>
                <span className="text-xs text-brand-primary/30 italic">Coming soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Provider Resources */}
        <div>
          <h2 className="text-xl font-display font-bold text-brand-primary mb-4">Provider Resources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <TierGate
              requiredTier="concierge"
              currentTier={tier}
              upgradeMessage="Upgrade to Concierge to unlock provider note templates."
            >
              <div className="flex items-center gap-4 px-6 py-5 bg-cream-dark border border-brand-primary/10 rounded-2xl">
                <div className="w-12 h-12 bg-brand-primary/5 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-brand-primary/40" />
                </div>
                <div className="flex-1">
                  <p className="text-brand-primary font-medium">Provider Note Templates</p>
                  <p className="text-brand-primary/50 text-sm">High-touch documentation workflows</p>
                </div>
              </div>
            </TierGate>
            <TierGate
              requiredTier="concierge"
              currentTier={tier}
              upgradeMessage="Upgrade to Concierge to unlock custom protocol requests."
            >
              <div className="flex items-center gap-4 px-6 py-5 bg-cream-dark border border-brand-primary/10 rounded-2xl">
                <div className="w-12 h-12 bg-brand-primary/5 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-brand-primary/40" />
                </div>
                <div className="flex-1">
                  <p className="text-brand-primary font-medium">Custom Protocol Requests</p>
                  <p className="text-brand-primary/50 text-sm">White-glove protocol design with your provider</p>
                </div>
              </div>
            </TierGate>
          </div>
        </div>
      </div>
    </div>
  );
}
