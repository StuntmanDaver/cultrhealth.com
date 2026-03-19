"use client"

import React, { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

interface CarouselProps {
  items: React.ReactNode[]
}

export function Carousel({ items }: CarouselProps) {
  const [active, setActive] = useState(0)
  const startX = useRef(0)
  const total = items.length

  const go = useCallback((i: number) => setActive(Math.max(0, Math.min(i, total - 1))), [total])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = startX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) go(diff > 0 ? active + 1 : active - 1)
  }, [active, go])

  return (
    <div>
      <div
        className="overflow-hidden touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {items.map((item, index) => (
            <div key={index} className="w-full shrink-0 px-1">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Dots + swipe hint */}
      <div className="flex items-center justify-center gap-1 mt-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={cn(
              "h-1 rounded-full transition-all",
              i === active ? "w-4 bg-brand-primary" : "w-1 bg-brand-secondary/15"
            )}
          />
        ))}
        <span className="text-[9px] text-brand-secondary/30 ml-2">{active + 1}/{total} — swipe</span>
      </div>
    </div>
  )
}

interface CardProps {
  card: {
    src: string
    title: string
    category: string
    price?: string
    note?: string
  }
  index: number
  onAdd?: () => void
  inCart?: boolean
  cartQty?: number
}

export function Card({ card, index, onAdd, inCart, cartQty }: CardProps) {
  return (
    <div className="rounded-xl bg-white border border-brand-secondary/10 shadow-sm overflow-hidden flex flex-row items-center gap-3 p-2.5">
      {/* Image */}
      <div className="w-20 h-20 shrink-0 rounded-lg bg-brand-cream flex items-center justify-center p-1.5">
        <img
          src={card.src}
          alt={card.title}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-display font-bold text-brand-primary leading-tight truncate">
          {card.title}
        </h3>
        {card.note && (
          <p className="text-[9px] text-brand-secondary/35 mt-0.5 truncate">{card.note}</p>
        )}
        <div className="flex items-center justify-between mt-1.5">
          {card.price && (
            <span className="text-sm font-display font-bold text-brand-primary">{card.price}</span>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-semibold transition-colors",
                inCart
                  ? "bg-sage/40 text-brand-primary"
                  : "bg-brand-primary text-white hover:bg-brand-primaryHover"
              )}
            >
              {inCart ? `Added (${cartQty})` : "Add"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
