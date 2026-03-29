'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Copy, Check, Loader2, AlertCircle, Clock } from 'lucide-react';

export interface CryptoPaymentData {
  paymentId: string;
  address: string;
  amountBtc: number;
  amountUsd: number;
  expiresAt: string;
  qrCodeDataUrl: string;
}

interface CryptoPaymentWidgetProps extends CryptoPaymentData {
  onSuccess: () => void;
  onError: (error: string) => void;
}

type PaymentStatus = 'waiting' | 'confirming' | 'confirmed' | 'sending' | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired';

const STATUS_LABELS: Record<PaymentStatus, string> = {
  waiting: 'Waiting for payment',
  confirming: 'Confirming transaction',
  confirmed: 'Payment confirmed',
  sending: 'Processing',
  partially_paid: 'Partially paid',
  finished: 'Payment complete',
  failed: 'Payment failed',
  refunded: 'Refunded',
  expired: 'Payment expired',
};

export function CryptoPaymentWidget({
  paymentId,
  address,
  amountBtc,
  amountUsd,
  expiresAt,
  qrCodeDataUrl,
  onSuccess,
  onError,
}: CryptoPaymentWidgetProps) {
  const [status, setStatus] = useState<PaymentStatus>('waiting');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const handleComplete = useCallback((s: PaymentStatus) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    if (s === 'finished' || s === 'confirmed') {
      onSuccess();
    } else {
      onError(STATUS_LABELS[s] || 'Payment was not completed');
    }
  }, [onSuccess, onError]);

  // Poll payment status every 30s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/checkout/nowpayments/status/${paymentId}`);
        if (!res.ok) return;
        const data = await res.json();
        const s = data.status as PaymentStatus;
        setStatus(s);
        if (s === 'finished' || s === 'confirmed') handleComplete(s);
        if (s === 'failed' || s === 'expired') handleComplete(s);
      } catch {
        // Silently retry on next poll
      }
    };

    poll(); // initial check
    intervalRef.current = setInterval(poll, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paymentId, handleComplete]);

  // Countdown timer
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        if (!completedRef.current) handleComplete('expired');
        return;
      }
      const mins = Math.floor(diff / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    update();
    timerRef.current = setInterval(update, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [expiresAt, handleComplete]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  const isTerminal = status === 'finished' || status === 'confirmed' || status === 'failed' || status === 'expired';
  const isConfirming = status === 'confirming' || status === 'sending';

  return (
    <div className="rounded-2xl border border-cultr-sage bg-white p-6 space-y-5">
      {/* Status banner */}
      <div className={`flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 ${
        status === 'waiting' ? 'bg-amber-50 text-amber-700' :
        isConfirming ? 'bg-blue-50 text-blue-700' :
        status === 'finished' || status === 'confirmed' ? 'bg-green-50 text-green-700' :
        'bg-red-50 text-red-700'
      }`}>
        {status === 'waiting' && <Clock className="w-4 h-4" />}
        {isConfirming && <Loader2 className="w-4 h-4 animate-spin" />}
        {(status === 'finished' || status === 'confirmed') && <Check className="w-4 h-4" />}
        {(status === 'failed' || status === 'expired') && <AlertCircle className="w-4 h-4" />}
        <span>{STATUS_LABELS[status]}</span>
        {!isTerminal && <span className="ml-auto tabular-nums">{timeLeft}</span>}
      </div>

      {/* QR code */}
      {!isTerminal && (
        <>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeDataUrl}
              alt="Bitcoin payment QR code"
              width={200}
              height={200}
              className="rounded-lg border border-gray-200"
            />
          </div>

          {/* Amount */}
          <div className="text-center space-y-1">
            <p className="text-lg font-bold text-cultr-forest tabular-nums">
              {amountBtc} BTC
            </p>
            <p className="text-sm text-cultr-textMuted">
              ~${amountUsd.toFixed(2)} USD
            </p>
          </div>

          {/* Address + copy */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 px-3 py-2.5">
              <code className="flex-1 text-xs text-gray-700 break-all select-all leading-relaxed">
                {address}
              </code>
              <button
                type="button"
                onClick={copyAddress}
                className="shrink-0 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-cultr-textMuted text-center">
            Send exactly the BTC amount shown above to this address. Payment will be detected automatically.
          </p>
        </>
      )}
    </div>
  );
}
