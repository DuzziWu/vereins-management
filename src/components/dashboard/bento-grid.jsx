import { cn } from '@/lib/utils'

/**
 * BentoGrid - Flexible dashboard grid layout
 * Uses CSS Grid with auto-fit for responsive behavior
 */
function BentoGrid({ className, children }) {
  return (
    <div
      className={cn(
        'grid gap-4 md:gap-6',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        'auto-rows-min',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * BentoItem - Individual grid item with configurable span
 */
function BentoItem({ className, colSpan = 1, rowSpan = 1, children }) {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'sm:col-span-2',
    3: 'sm:col-span-2 lg:col-span-3',
    4: 'sm:col-span-2 lg:col-span-3 xl:col-span-4',
  }

  const rowSpanClasses = {
    1: 'row-span-1',
    2: 'row-span-2',
    3: 'row-span-3',
  }

  return (
    <div
      className={cn(
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        className
      )}
    >
      {children}
    </div>
  )
}

export { BentoGrid, BentoItem }
