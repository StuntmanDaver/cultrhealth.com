'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, MousePointerClick, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'

interface Notification {
  id: string
  type: 'click' | 'order' | 'commission' | 'tier_up'
  title: string
  message: string
  time: string
  read: boolean
}

const ICONS: Record<string, React.ElementType> = {
  click: MousePointerClick,
  order: ShoppingCart,
  commission: DollarSign,
  tier_up: TrendingUp,
}

const ICON_COLORS: Record<string, string> = {
  click: 'bg-stone-100 text-stone-600',
  order: 'bg-cultr-mint/30 text-cultr-forest',
  commission: 'bg-amber-50 text-amber-600',
  tier_up: 'bg-cultr-mint/30 text-cultr-forest',
}

function generateNotifications(
  thisMonthClicks: number,
  thisMonthOrders: number,
  thisMonthCommission: number,
): Notification[] {
  const notifications: Notification[] = []
  const now = new Date()

  if (thisMonthClicks > 0) {
    notifications.push({
      id: 'click-recent',
      type: 'click',
      title: 'New clicks detected',
      message: `You've received ${thisMonthClicks} click${thisMonthClicks > 1 ? 's' : ''} this month from your tracking links.`,
      time: formatTimeAgo(new Date(now.getTime() - 1000 * 60 * 30)),
      read: false,
    })
  }

  if (thisMonthOrders > 0) {
    notifications.push({
      id: 'order-recent',
      type: 'order',
      title: 'New order attributed',
      message: `${thisMonthOrders} order${thisMonthOrders > 1 ? 's' : ''} attributed to you this month. Nice work!`,
      time: formatTimeAgo(new Date(now.getTime() - 1000 * 60 * 60 * 2)),
      read: false,
    })
  }

  if (thisMonthCommission > 0) {
    notifications.push({
      id: 'commission-recent',
      type: 'commission',
      title: 'Commission earned',
      message: `$${thisMonthCommission.toFixed(2)} in commission earned this month. Keep it up!`,
      time: formatTimeAgo(new Date(now.getTime() - 1000 * 60 * 60 * 4)),
      read: false,
    })
  }

  // Add some older "read" notifications for context
  if (notifications.length > 0) {
    notifications.push({
      id: 'welcome',
      type: 'tier_up',
      title: 'Welcome to the Creator Program',
      message: 'Your account is active. Start sharing your tracking links to earn commissions.',
      time: 'Last week',
      read: true,
    })
  }

  return notifications
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHr = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  return `${diffDay}d ago`
}

export function NotificationBell({
  thisMonthClicks,
  thisMonthOrders,
  thisMonthCommission,
}: {
  thisMonthClicks: number
  thisMonthOrders: number
  thisMonthCommission: number
}) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNotifications(generateNotifications(thisMonthClicks, thisMonthOrders, thisMonthCommission))
  }, [thisMonthClicks, thisMonthOrders, thisMonthCommission])

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const unreadCount = notifications.filter((n) => !n.read && !dismissed.has(n.id)).length

  const markAllRead = () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id)
    setDismissed((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-stone-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-cultr-textMuted" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cultr-forest text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <h4 className="text-sm font-display font-bold text-cultr-forest">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-cultr-forest font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                <p className="text-xs text-cultr-textMuted">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = ICONS[n.type]
                const iconColor = ICON_COLORS[n.type]
                const isRead = n.read || dismissed.has(n.id)
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 p-3 ${isRead ? 'opacity-60' : 'bg-cultr-mint/20'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-cultr-forest">{n.title}</p>
                      <p className="text-[11px] text-cultr-textMuted leading-relaxed mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-stone-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
