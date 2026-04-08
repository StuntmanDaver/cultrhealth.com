'use client';

import { useState, useEffect } from 'react';
import {
  Receipt,
  ExternalLink,
  CreditCard,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  invoiceUrl?: string;
  receiptUrl?: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  paid: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Paid' },
  pending: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Pending' },
  failed: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Failed' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch('/api/member/transactions');
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions || []);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-display font-bold text-stone-900 mb-4">Transactions</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-stone-100 rounded w-48 mb-2" />
                  <div className="h-3 bg-stone-100 rounded w-24" />
                </div>
                <div className="h-5 bg-stone-100 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const config = getStatusConfig(tx.status);
            const StatusIcon = config.icon;
            const TypeIcon = tx.type === 'subscription' ? CreditCard : Package;

            return (
              <div
                key={tx.id}
                className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-stone-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TypeIcon className="w-5 h-5 text-stone-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-stone-900 truncate">{tx.description}</p>
                    <span className="text-xs text-stone-400 capitalize whitespace-nowrap">
                      {tx.type === 'subscription' ? 'Subscription' : 'Product'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {new Date(tx.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-medium text-stone-900">
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {config.label}
                  </span>
                  {(tx.invoiceUrl || tx.receiptUrl) && (
                    <a
                      href={tx.invoiceUrl || tx.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-400 hover:text-stone-600 transition-colors"
                      title="View Invoice"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-center">
          <Receipt className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-600 font-medium text-sm">No Transactions Yet</p>
          <p className="text-xs text-stone-500 mt-1">
            Your payment history will appear here once you have an active subscription.
          </p>
        </div>
      )}
    </div>
  );
}
