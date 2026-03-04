'use client'

import { cn } from '@/lib/utils'

type AuraVariant = 'purple' | 'green' | 'orange' | 'yellow' | 'multi'
type AuraAnimation = 'none' | 'pulse' | 'float' | 'float-delayed'

interface AuraProps {
  variant?: AuraVariant
  size?: 'sm' | 'md' | 'lg' | 'xl'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  className?: string
  animate?: boolean | AuraAnimation
  floatDelay?: 0 | 1 | 2 | 3
}

const variantClasses: Record<AuraVariant, string> = {
  purple: 'bg-gradient-to-br from-purple-500 to-purple-200',
  green: 'bg-gradient-to-br from-emerald-500 to-emerald-200',
  orange: 'bg-gradient-to-br from-orange-500 to-orange-200',
  yellow: 'bg-gradient-to-br from-yellow-400 to-orange-200',
  multi: 'bg-gradient-to-br from-purple-400 via-yellow-300 to-orange-400',
}

const sizeClasses: Record<string, string> = {
  sm: 'w-32 h-32',
  md: 'w-48 h-48',
  lg: 'w-72 h-72',
  xl: 'w-96 h-96',
}

const positionClasses: Record<string, string> = {
  'top-left': '-top-16 -left-16',
  'top-right': '-top-16 -right-16',
  'bottom-left': '-bottom-16 -left-16',
  'bottom-right': '-bottom-16 -right-16',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
}

const animationClasses: Record<AuraAnimation, string> = {
  'none': '',
  'pulse': 'animate-pulse-slow',
  'float': 'animate-float',
  'float-delayed': 'animate-float-delayed',
}

const floatDelayClasses: Record<number, string> = {
  0: 'float-delay-0',
  1: 'float-delay-1',
  2: 'float-delay-2',
  3: 'float-delay-3',
}

export function Aura({
  variant = 'purple',
  size = 'lg',
  position = 'top-right',
  className,
  animate = false,
  floatDelay = 0,
}: AuraProps) {
  // Handle legacy boolean animate prop
  const getAnimationClass = () => {
    if (animate === true) return 'animate-float'
    if (animate === false || animate === 'none') return ''
    return animationClasses[animate]
  }

  return (
    <div
      className={cn(
        'absolute rounded-full blur-3xl opacity-50 pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        positionClasses[position],
        getAnimationClass(),
        animate && floatDelayClasses[floatDelay],
        className
      )}
      aria-hidden="true"
    />
  )
}

export function AuraBackground({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Aura variant="purple" size="xl" position="top-left" animate="float" floatDelay={0} />
      <Aura variant="yellow" size="lg" position="top-right" animate="float-delayed" floatDelay={1} />
      <Aura variant="orange" size="md" position="bottom-right" animate="float" floatDelay={2} />
      <Aura variant="green" size="sm" position="bottom-left" animate="float-delayed" floatDelay={3} />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default Aura
