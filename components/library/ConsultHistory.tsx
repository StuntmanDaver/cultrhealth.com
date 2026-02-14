'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  CalendarCheck,
  Stethoscope,
  MessageSquare,
} from 'lucide-react';

interface ConsultItem {
  id: string;
  type: string;
  date: string;
  description: string;
  status: string;
  reason?: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Pending' },
  confirmed: { icon: CalendarCheck, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Confirmed' },
  completed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Completed' },
  cancelled: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Cancelled' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

export function ConsultHistory() {
  const [history, setHistory] = useState<ConsultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/member/consult-history');
        if (response.ok) {
          const data = await response.json();
          setHistory(data.history || []);
        }
      } catch (error) {
        console.error('Failed to fetch consult history:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div>
      <h3 className="text-lg font-display font-bold text-stone-900 mb-4">
        Consultation History
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-stone-100 rounded w-48 mb-2" />
                  <div className="h-3 bg-stone-100 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-3">
          {history.map((item) => {
            const config = getStatusConfig(item.status);
            const StatusIcon = config.icon;
            const TypeIcon = item.type === 'request' ? MessageSquare : Stethoscope;

            return (
              <div
                key={item.id}
                className="bg-white border border-stone-200 rounded-xl p-4 flex items-start gap-4"
              >
                <div className={`w-10 h-10 ${item.type === 'request' ? 'bg-indigo-50' : 'bg-teal-50'} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <TypeIcon className={`w-5 h-5 ${item.type === 'request' ? 'text-indigo-600' : 'text-teal-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {item.description}
                    </p>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.bgColor} ${config.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {item.type === 'request' && (
                      <span className="ml-2 text-stone-400">Consult Request</span>
                    )}
                    {item.type === 'order-review' && (
                      <span className="ml-2 text-stone-400">Provider Review</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-center">
          <CalendarCheck className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-600 font-medium text-sm">No Consultation History</p>
          <p className="text-xs text-stone-500 mt-1">
            Schedule your first consult above to get started.
          </p>
        </div>
      )}
    </div>
  );
}
