"use client"

import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { ArrowLeft, ArrowRight, X, Plus, Check, ChevronRight } from "lucide-react"
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
  description?: string
  badge?: React.ReactNode
}

// ─── Context ────────────────────────────────────────────────

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void
  currentIndex: number
}>({
  onCardClose: () => {},
  currentIndex: 0,
})

// ─── Carousel (routes to mobile or desktop) ─────────────────

interface CarouselProps {
  items: JSX.Element[]
  initialScroll?: number
}

export const Carousel = ({ items }: CarouselProps) => {
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return isMobile
    ? <MobileCarousel items={items} />
    : <DesktopCarousel items={items} />
}

// ─── Mobile: Stationary swipe carousel ──────────────────────

function MobileCarousel({ items }: { items: JSX.Element[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasNudged, setHasNudged] = useState(false)
  const [nudgeOffset, setNudgeOffset] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwiping = useRef(false)

  const total = items.length
  const cardStep = 272 // 260px card + 12px gap

  // Swipe hint nudge
  useEffect(() => {
    if (total > 1 && !hasNudged) {
      const timer = setTimeout(() => {
        setNudgeOffset(-50)
        setTimeout(() => {
          setNudgeOffset(0)
          setHasNudged(true)
        }, 500)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [total, hasNudged])

  const goTo = useCallback(
    (i: number) => setActiveIndex(Math.max(0, Math.min(i, total - 1))),
    [total]
  )
  const goLeft = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])
  const goRight = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])

  // Don't auto-advance on modal close — keep user on same card
  const handleCardClose = useCallback(
    (index: number) => {
      setCurrentIndex(index)
    },
    []
  )

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 1) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = false
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 1) { e.preventDefault(); return }
    if (!isSwiping.current) {
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
      // Higher threshold (20px) to avoid misclassifying taps as swipes
      if (dx > dy && dx > 20) isSwiping.current = true
    }
    if (isSwiping.current) e.preventDefault()
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.changedTouches.length === 0) return
      // Only navigate on intentional swipes — don't block taps
      if (!isSwiping.current) return
      const diff = touchStartX.current - e.changedTouches[0].clientX
      if (Math.abs(diff) > 40) {
        if (diff > 0) goRight()
        else goLeft()
      }
    },
    [goLeft, goRight]
  )

  const translateX = -(activeIndex * cardStep) + nudgeOffset

  return (
    <CarouselContext.Provider value={{ onCardClose: handleCardClose, currentIndex }}>
      <div className="relative w-full">
        <div
          className="overflow-hidden py-5 touch-pan-y select-none"
          style={{ overscrollBehavior: "none" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex gap-3 pl-4"
            style={{
              transform: `translateX(${translateX}px)`,
              transition: "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            {items.map((item, index) => {
              const distance = Math.abs(index - activeIndex)
              const isActive = index === activeIndex
              return (
                <motion.div
                  key={"card" + index}
                  className="shrink-0"
                  initial={{ opacity: 0, y: 30, scale: 0.92 }}
                  animate={{
                    opacity: isActive ? 1 : Math.max(0.4, 1 - distance * 0.3),
                    y: 0,
                    scale: isActive ? 1 : Math.max(0.88, 1 - distance * 0.06),
                  }}
                  transition={{
                    opacity: { duration: 0.4 },
                    scale: { type: "spring", stiffness: 300, damping: 30 },
                    y: { duration: 0.5, delay: 0.08 * index, ease: "easeOut" },
                  }}
                >
                  {item}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Dots + swipe hint */}
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === activeIndex
                    ? "h-2 w-6 bg-brand-primary"
                    : "h-2 w-2 bg-brand-secondary/15"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
            <span className="text-[10px] text-brand-secondary/30 ml-2.5 font-medium tabular-nums">
              {activeIndex + 1}/{total}
            </span>
          </div>
          <motion.span
            className="text-[10px] text-brand-secondary/40 font-medium flex items-center gap-0.5"
            initial={{ opacity: 1 }}
            animate={{ opacity: hasNudged ? 0 : 1 }}
            transition={{ duration: 0.5 }}
          >
            swipe <ChevronRight className="w-3 h-3" />
          </motion.span>
        </div>
      </div>
    </CarouselContext.Provider>
  )
}

// ─── Desktop: Horizontal scroll (Aceternity style) ──────────

function DesktopCarousel({ items }: { items: JSX.Element[] }) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    checkScrollability()
  }, [])

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scrollLeftFn = () => {
    carouselRef.current?.scrollBy({ left: -320, behavior: "smooth" })
  }

  const scrollRightFn = () => {
    carouselRef.current?.scrollBy({ left: 320, behavior: "smooth" })
  }

  // Keep scroll position when modal closes — don't jump
  const handleCardClose = useCallback(
    (index: number) => {
      setCurrentIndex(index)
    },
    []
  )

  return (
    <CarouselContext.Provider value={{ onCardClose: handleCardClose, currentIndex }}>
      <div className="relative w-full">
        {/* Scrollable track */}
        <div
          className={cn(
            "flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-8",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          )}
          ref={carouselRef}
          onScroll={checkScrollability}
        >
          <div className="flex flex-row justify-start gap-4 pl-6">
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
                className="last:pr-[33%]"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Arrow controls */}
        <div className="flex justify-end gap-2 px-6">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/5 hover:bg-brand-primary/10 disabled:opacity-30 transition-all"
            onClick={scrollLeftFn}
            disabled={!canScrollLeft}
            aria-label="Previous"
          >
            <ArrowLeft className="h-5 w-5 text-brand-primary" />
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/5 hover:bg-brand-primary/10 disabled:opacity-30 transition-all"
            onClick={scrollRightFn}
            disabled={!canScrollRight}
            aria-label="Next"
          >
            <ArrowRight className="h-5 w-5 text-brand-primary" />
          </button>
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
  compact = false,
}: {
  card: CarouselCard
  index: number
  layout?: boolean
  onAdd?: () => void
  inCart?: boolean
  cartQty?: number
  compact?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const { onCardClose } = useContext(CarouselContext)

  // Detect touch device to disable whileHover (prevents iOS sticky hover)
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    onCardClose(index)
  }, [onCardClose, index])

  // Only register keydown + manage overflow when modal is open
  useEffect(() => {
    if (!open) return

    document.body.style.overflow = "hidden"

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", onKeyDown)

    // Focus close button for keyboard accessibility
    requestAnimationFrame(() => closeButtonRef.current?.focus())

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open, handleClose])

  // Only listen for outside clicks when modal is open (deferred to avoid race condition)
  useOutsideClick(containerRef, handleClose, open)

  const handleOpen = () => setOpen(true)

  return (
    <>
      {/* ── Expanded Product Detail Modal (portaled to body to escape transform containment) ── */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-50 h-screen overflow-auto" role="dialog" aria-modal="true" aria-label={card.title}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 h-full w-full bg-black/60 backdrop-blur-lg"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                ref={containerRef}
                className="relative z-[60] mx-3 mt-16 mb-6 h-fit max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden md:mx-auto md:mt-20"
              >
                {/* Close button — floats over image */}
                <button
                  ref={closeButtonRef}
                  className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  onClick={handleClose}
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-brand-primary" />
                </button>

                {/* Product image — compact, centered on gradient */}
                {card.src && (
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                    className="w-full bg-gradient-to-br from-brand-cream via-cream-dark/80 to-brand-cream px-6 pt-10 pb-6 flex items-center justify-center"
                  >
                    <div className="relative w-full h-[140px] md:h-[180px] drop-shadow-lg">
                      <Image
                        src={card.src}
                        alt={card.title}
                        fill
                        sizes="(max-width: 768px) 300px, 400px"
                        className="object-contain"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Text content — padded for readability */}
                <div className="px-6 pt-5 pb-6 md:px-8 md:pt-6 md:pb-8">
                  {/* Category */}
                  <p className="text-[11px] uppercase tracking-widest text-brand-secondary/50 font-semibold">
                    {card.category}
                  </p>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-display font-bold text-brand-primary mt-1.5">
                    {card.title}
                  </h3>

                  {/* Dosage / Note pill */}
                  {card.note && (
                    <p className="inline-block text-xs text-brand-secondary/60 bg-brand-cream rounded-full px-3 py-1 mt-2 font-medium">
                      {card.note}
                    </p>
                  )}

                  {/* Description — larger text for readability */}
                  <div className="mt-4 border-t border-brand-secondary/8 pt-4">
                    {card.content}
                  </div>

                  {/* Price + Add to Cart — sticky bottom feel */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-brand-secondary/10">
                    <div>
                      {card.price ? (
                        <span className="text-2xl md:text-3xl font-display font-bold text-brand-primary">
                          {card.price}
                        </span>
                      ) : (
                        <span className="text-sm text-brand-secondary/50 font-medium">Consultation pricing</span>
                      )}
                    </div>
                    {onAdd && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAdd() }}
                        className={cn(
                          "flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all",
                          inCart
                            ? "bg-sage/30 text-brand-primary"
                            : "bg-brand-primary text-white hover:bg-brand-primaryHover active:scale-95"
                        )}
                      >
                        {inCart ? (
                          <><Check className="w-4 h-4" /> Added ({cartQty})</>
                        ) : (
                          <><Plus className="w-4 h-4" /> Add to Cart</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Card Face ── */}
      <motion.div
        role="button"
        tabIndex={0}
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen() } }}
        whileHover={isTouch ? undefined : { scale: 1.03 }}
        aria-label={`View details for ${card.title}`}
        whileTap={isTouch ? undefined : { scale: 0.97 }}
        className={cn(
          "relative flex flex-col overflow-hidden rounded-3xl text-left",
          compact
            ? "h-[300px] w-[180px] md:h-[400px] md:w-[260px]"
            : "h-[380px] w-[260px] md:h-[480px] md:w-[320px]",
          "bg-gradient-to-br from-brand-primary via-[#2d4d4a] to-[#1a332f]",
          "shadow-lg transition-shadow duration-300",
          "group cursor-pointer"
        )}
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-3xl ring-1 ring-white/[0.08] group-hover:ring-white/[0.15] transition-all duration-500 pointer-events-none" />


        {/* Top: Category + Title */}
        <div className={cn("relative z-10 pb-0", compact ? "p-3.5" : "p-5")}>
          <motion.span
            layoutId={layout ? `category-${card.category}-${index}` : undefined}
            className={cn("uppercase tracking-[0.18em] text-white/40 font-semibold", compact ? "text-[9px]" : "text-[10px]")}
          >
            {card.category}
          </motion.span>
          <motion.h3
            layoutId={layout ? `title-${card.title}` : undefined}
            className={cn("font-display font-bold text-white mt-1 leading-tight", compact ? "text-[14px] md:text-base" : "text-[17px] md:text-lg")}
          >
            {card.title}
          </motion.h3>
          {card.note && (
            <span className={cn("text-white/30 mt-0.5 block font-medium", compact ? "text-[9px]" : "text-[10px]")}>
              {card.note}
            </span>
          )}
          <span className={cn("inline-block text-white/50 font-semibold mt-1", compact ? "text-[8px]" : "text-[9px]")}>
            Compounded in the USA
          </span>
          {card.badge && (
            <div className="mt-1.5">{card.badge}</div>
          )}
        </div>

        {/* Center: Floating Product Image */}
        <div className={cn("flex-1 relative z-10 flex items-center justify-center", compact ? "px-4 py-1" : "px-6 py-2")}>
          {card.src && (
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.4,
              }}
              className={cn(
                "relative w-full drop-shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
                compact ? "h-[100px] md:h-[160px]" : "h-[170px] md:h-[220px]"
              )}
            >
              <Image
                src={card.src}
                alt={card.title}
                fill
                sizes={compact ? "(max-width: 768px) 140px, 200px" : "(max-width: 768px) 200px, 260px"}
                className="object-contain"
                priority={index === 0}
              />
            </motion.div>
          )}
        </div>

        {/* Hover Description Overlay (desktop only) */}
        {card.description && (
          <div className={cn(
            "absolute inset-x-0 top-0 z-20 rounded-t-3xl bg-brand-primary/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:flex flex-col justify-center px-6 py-5",
            compact ? "bottom-[50px]" : "bottom-[60px]"
          )}>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold mb-1">
              {card.category}
            </p>
            <h4 className={cn("font-display font-bold text-white mb-2 leading-tight", compact ? "text-base" : "text-lg")}>
              {card.title}
            </h4>
            <p className={cn("text-white/80 leading-relaxed", compact ? "text-[12px] line-clamp-4" : "text-[13px] line-clamp-5")}>
              {card.description}
            </p>
            <span className="mt-3 text-[11px] text-white/40 font-medium">
              Click to view details
            </span>
          </div>
        )}

        {/* Bottom: Price + Quick Add */}
        <div className={cn("relative z-10 flex items-end justify-between", compact ? "px-3.5 pb-3.5" : "px-5 pb-5")}>
          {card.price ? (
            <span className={cn("font-display font-bold text-white", compact ? "text-lg" : "text-xl")}>{card.price}</span>
          ) : (
            <span className="text-xs text-white/40 font-medium">Consultation</span>
          )}
          {onAdd && (
            <button
              onClick={(e) => { e.stopPropagation(); onAdd() }}
              className={cn(
                "flex items-center gap-1.5 rounded-full text-xs font-bold transition-all duration-200",
                inCart
                  ? "bg-white/15 text-white backdrop-blur-sm px-3.5 py-2"
                  : "bg-white text-brand-primary px-4 py-2 hover:scale-105 active:scale-95 shadow-sm"
              )}
            >
              {inCart ? (
                <><Check className="w-3 h-3" /> {cartQty}</>
              ) : (
                <><Plus className="w-3 h-3" /> Add</>
              )}
            </button>
          )}
        </div>
      </motion.div>
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
