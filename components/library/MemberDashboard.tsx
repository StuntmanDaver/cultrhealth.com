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
} from 'lucide-react';
import type { PlanTier, LibraryAccess } from '@/lib/config/plans';

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
              Member <span className="italic">Dashboard</span>
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
    </div>
  );
}
