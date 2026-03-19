"use client"

import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react"
import { ArrowLeft, ArrowRight, X, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { useOutsideClick } from "@/hooks/use-outside-click"

// ─── Types ──────────────────────────────────────────────────

export type CarouselCard = {
  src: string
  title: string
  category: string
  content: React.ReactNode
  price?: string
  note?: string
}

// ─── Context ────────────────────────────────────────────────

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void
  currentIndex: number
}>({
  onCardClose: () => {},
  currentIndex: 0,
})

// ─── Carousel (stationary screen, swipe to change card) ────

interface CarouselProps {
  items: JSX.Element[]
  initialScroll?: number
}

export const Carousel = ({ items }: CarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardStep, setCardStep] = useState(272) // card width + gap
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwiping = useRef(false)

  const total = items.length

  // Measure actual card step on mount and resize
  useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth < 768
      // card width + gap: mobile 260+12=272, desktop 300+16=316
      setCardStep(isMobile ? 272 : 316)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(index, total - 1)))
    },
    [total]
  )

  const goLeft = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])
  const goRight = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])

  const handleCardClose = useCallback(
    (index: number) => {
      goTo(Math.min(index + 1, total - 1))
      setCurrentIndex(index)
    },
    [goTo, total]
  )

  // Touch handlers — only swipe horizontally, let vertical scroll pass through
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = false
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) {
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
      // If horizontal movement dominates, prevent vertical scroll
      if (dx > dy && dx > 10) {
        isSwiping.current = true
      }
    }
    if (isSwiping.current) {
      e.preventDefault()
    }
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX
      if (Math.abs(diff) > 50) {
        if (diff > 0) goRight()
        else goLeft()
      }
    },
    [goLeft, goRight]
  )

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className="relative w-full">
        {/* Stationary viewport — no scroll, cards move via transform */}
        <div
          className="overflow-hidden py-5 md:py-8 touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex gap-3 md:gap-4 transition-transform duration-400 ease-out pl-4 md:pl-6"
            style={{
              transform: `translateX(-${activeIndex * cardStep}px)`,
              transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {items.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.1 * index,
                    ease: "easeOut",
                  },
                }}
                key={"card" + index}
                className="shrink-0"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Indicators + Arrows */}
        <div className="flex items-center justify-between px-4 md:px-6">
          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === activeIndex
                    ? "h-2 w-6 bg-brand-primary"
                    : "h-2 w-2 bg-brand-secondary/15 hover:bg-brand-secondary/30"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
            <span className="text-[10px] text-brand-secondary/30 ml-2.5 font-medium tabular-nums">
              {activeIndex + 1}/{total}
            </span>
          </div>

          {/* Desktop arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/5 hover:bg-brand-primary/10 disabled:opacity-30 transition-all"
              onClick={goLeft}
              disabled={activeIndex === 0}
              aria-label="Previous"
            >
              <ArrowLeft className="h-4 w-4 text-brand-primary" />
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/5 hover:bg-brand-primary/10 disabled:opacity-30 transition-all"
              onClick={goRight}
              disabled={activeIndex === total - 1}
              aria-label="Next"
            >
              <ArrowRight className="h-4 w-4 text-brand-primary" />
            </button>
          </div>
        </div>
      </div>
    </CarouselContext.Provider>
  )
}

// ─── Card ───────────────────────────────────────────────────

export const Card = ({
  card,
  index,
  layout = false,
  onAdd,
  inCart,
  cartQty,
}: {
  card: CarouselCard
  index: number
  layout?: boolean
  onAdd?: () => void
  inCart?: boolean
  cartQty?: number
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { onCardClose } = useContext(CarouselContext)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose()
    }

    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  useOutsideClick(containerRef, () => handleClose())

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    onCardClose(index)
  }

  return (
    <>
      {/* ── Expanded Modal ── */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 h-screen overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 h-full w-full bg-black/60 backdrop-blur-lg"
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              ref={containerRef}
              layoutId={layout ? `card-${card.title}` : undefined}
              className="relative z-[60] mx-4 my-10 h-fit max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl md:mx-auto"
            >
              <button
                className="sticky top-0 z-10 ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 hover:bg-brand-primary/20 transition-colors"
                onClick={handleClose}
              >
                <X className="h-4 w-4 text-brand-primary" />
              </button>

              {/* Product image */}
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-brand-cream via-cream-dark to-brand-cream rounded-2xl flex items-center justify-center my-4">
                <img
                  src={card.src}
                  alt={card.title}
                  className="max-h-[200px] object-contain drop-shadow-lg"
                />
              </div>

              <motion.p
                layoutId={layout ? `category-${card.title}` : undefined}
                className="text-xs uppercase tracking-widest text-brand-secondary/50 font-semibold"
              >
                {card.category}
              </motion.p>
              <motion.h3
                layoutId={layout ? `title-${card.title}` : undefined}
                className="text-2xl font-display font-bold text-brand-primary mt-1"
              >
                {card.title}
              </motion.h3>
              {card.note && (
                <p className="text-sm text-brand-secondary/50 mt-1">
                  {card.note}
                </p>
              )}

              <div className="py-6">{card.content}</div>

              {/* Price + Add to Cart */}
              <div className="flex items-center justify-between pt-4 border-t border-brand-secondary/10">
                {card.price && (
                  <span className="text-3xl font-display font-bold text-brand-primary">
                    {card.price}
                  </span>
                )}
                {onAdd && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAdd()
                    }}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all",
                      inCart
                        ? "bg-sage/30 text-brand-primary"
                        : "bg-brand-primary text-white hover:bg-brand-primaryHover active:scale-95"
                    )}
                  >
                    {inCart ? (
                      <>
                        <Check className="w-4 h-4" /> Added ({cartQty})
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Add to Cart
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Card Face ── */}
      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        className={cn(
          "relative flex flex-col overflow-hidden rounded-3xl text-left",
          "h-[340px] w-[260px] md:h-[420px] md:w-[300px]",
          "bg-gradient-to-br from-brand-primary via-[#2d4d4a] to-[#1a332f]",
          "shadow-lg hover:shadow-xl transition-shadow duration-300",
          "group cursor-pointer"
        )}
      >
        {/* Ambient light effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.04] rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-sage/[0.06] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        {/* Top: Category + Title */}
        <div className="relative z-10 p-5 pb-0">
          <motion.span
            layoutId={
              layout ? `category-${card.category}-${index}` : undefined
            }
            className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold"
          >
            {card.category}
          </motion.span>
          <motion.h3
            layoutId={layout ? `title-${card.title}` : undefined}
            className="text-[17px] md:text-lg font-display font-bold text-white mt-1 leading-tight"
          >
            {card.title}
          </motion.h3>
          {card.note && (
            <span className="text-[10px] text-white/30 mt-0.5 block font-medium">
              {card.note}
            </span>
          )}
        </div>

        {/* Center: Product Image */}
        <div className="flex-1 relative z-10 flex items-center justify-center px-8 py-2">
          <img
            src={card.src}
            alt={card.title}
            className="max-h-[130px] md:max-h-[160px] object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.35)] group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Bottom: Price + Quick Add */}
        <div className="relative z-10 px-5 pb-5 flex items-end justify-between">
          {card.price ? (
            <span className="text-xl font-display font-bold text-white">
              {card.price}
            </span>
          ) : (
            <span className="text-xs text-white/40 font-medium">
              Consultation
            </span>
          )}
          {onAdd && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full text-xs font-bold transition-all duration-200",
                inCart
                  ? "bg-white/15 text-white backdrop-blur-sm px-3.5 py-2"
                  : "bg-white text-brand-primary px-4 py-2 hover:scale-105 active:scale-95 shadow-sm"
              )}
            >
              {inCart ? (
                <>
                  <Check className="w-3 h-3" /> {cartQty}
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" /> Add
                </>
              )}
            </button>
          )}
        </div>
      </motion.button>
    </>
  )
}

// ─── BlurImage ──────────────────────────────────────────────

export const BlurImage = ({
  src,
  alt,
  className,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [isLoading, setLoading] = useState(true)
  return (
    <img
      className={cn(
        "transition duration-300",
        isLoading ? "blur-sm scale-[1.02]" : "blur-0 scale-100",
        className
      )}
      onLoad={() => setLoading(false)}
      src={src}
      loading="lazy"
      decoding="async"
      alt={alt || "Image"}
      {...rest}
    />
  )
}
