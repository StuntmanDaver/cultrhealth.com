import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionWrapperProps {
  children: ReactNode
  className?: string
  id?: string
}

export default function SectionWrapper({ children, className, id }: SectionWrapperProps) {
  return (
    <section id={id} className={cn('py-16 md:py-24 lg:py-32', className)}>
      <div className="section-wrapper">
        {children}
      </div>
    </section>
  )
}
