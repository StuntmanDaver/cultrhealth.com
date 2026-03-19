"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CarouselProps {
  items: React.ReactNode[]
  initialScroll?: number
}

export function Carousel({ items, initialScroll = 0 }: CarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll
    }
  }, [initialScroll])

  return (
    <div className="relative w-full">
      <div
        className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-2 scrollbar-hide"
        ref={carouselRef}
      >
        <div className="flex flex-row justify-start gap-2.5 pl-4 pr-6">
          {items.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: {
                  duration: 0.4,
                  delay: 0.06 * index,
                  ease: "easeOut",
                },
              }}
              key={"card" + index}
            >
              {item}
            </motion.div>
          ))}
        </div>
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
    <div className="rounded-xl bg-white border border-brand-secondary/10 shadow-sm w-[280px] overflow-hidden shrink-0 flex flex-row h-[110px]">
      {/* Image — left side */}
      <div className="w-[100px] shrink-0 bg-gradient-to-b from-brand-cream to-brand-creamDark flex items-center justify-center p-2.5">
        <img
          src={card.src}
          alt={card.title}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>

      {/* Content — right side */}
      <div className="p-2.5 flex flex-col flex-1 min-w-0 justify-between">
        <div>
          <p className="text-[8px] uppercase tracking-widest text-brand-secondary/35 font-semibold">
            {card.category}
          </p>
          <h3 className="text-xs font-display font-bold text-brand-primary leading-tight mt-0.5 truncate">
            {card.title}
          </h3>
          {card.note && (
            <p className="text-[9px] text-brand-secondary/35 mt-0.5 truncate">{card.note}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          {card.price && (
            <span className="text-sm font-display font-bold text-brand-primary">{card.price}</span>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-semibold transition-colors",
                inCart
                  ? "bg-brand-primary text-white"
                  : "bg-brand-primary text-white hover:bg-brand-primaryHover"
              )}
            >
              {inCart ? `${cartQty}x` : "Add"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
