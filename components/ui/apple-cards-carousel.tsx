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
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll
      checkScrollability()
    }
  }, [initialScroll])

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -280, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 280, behavior: "smooth" })
    }
  }

  return (
    <div className="relative w-full">
      <div
        className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-3 scrollbar-hide"
        ref={carouselRef}
        onScroll={checkScrollability}
      >
        <div className="flex flex-row justify-start gap-3 pl-4 pr-8">
          {items.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.5,
                  delay: 0.08 * index,
                  ease: "easeOut",
                },
              }}
              key={"card" + index}
              className="rounded-2xl"
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
    <div className="rounded-2xl bg-white border border-brand-secondary/10 shadow-sm w-[260px] overflow-hidden shrink-0 flex flex-col">
      {/* Image */}
      <div className="h-[200px] w-full bg-gradient-to-b from-brand-cream to-brand-creamDark flex items-center justify-center p-5 overflow-hidden">
        <img
          src={card.src}
          alt={card.title}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1">
        <p className="text-[9px] uppercase tracking-widest text-brand-secondary/40 font-semibold">
          {card.category}
        </p>
        <h3 className="text-sm font-display font-bold text-brand-primary mt-0.5 leading-tight">
          {card.title}
        </h3>
        {card.note && (
          <p className="text-[10px] text-brand-secondary/40 mt-0.5">{card.note}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-brand-secondary/8">
          {card.price && (
            <span className="text-base font-display font-bold text-brand-primary">{card.price}</span>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
                inCart
                  ? "bg-brand-primary text-white"
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
