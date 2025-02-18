import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const selectVariants = cva(
  `
    flex h-10 w-full items-center justify-between rounded-lg border
    bg-[var(--background-primary)] px-3 py-2 text-sm
    ring-offset-[var(--background-primary)]
    placeholder:text-[var(--text-tertiary)]
    focus:outline-none focus:ring-2
    focus:ring-[var(--primary-500)]
    focus:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-50
    transition-colors duration-200
  `,
  {
    variants: {
      variant: {
        default: 'border-[var(--border-primary)]',
        error: 'border-[var(--error-500)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {
  icon?: React.ReactNode
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, children, icon, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            selectVariants({ variant }),
            icon && 'pl-10',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
