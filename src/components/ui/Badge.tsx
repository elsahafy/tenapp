import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full text-xs font-medium ring-1 ring-inset transition-colors duration-200',
  {
    variants: {
      variant: {
        default: `
          bg-[var(--primary-50)] text-[var(--primary-600)]
          ring-[var(--primary-600)]/10
        `,
        secondary: `
          bg-[var(--gray-100)] text-[var(--gray-600)]
          ring-[var(--gray-600)]/10
        `,
        outline: `
          text-[var(--text-primary)]
          ring-[var(--border-primary)]
        `,
        success: `
          bg-[var(--success-50)] text-[var(--success-600)]
          ring-[var(--success-600)]/10
        `,
        warning: `
          bg-[var(--warning-50)] text-[var(--warning-600)]
          ring-[var(--warning-600)]/10
        `,
        error: `
          bg-[var(--error-50)] text-[var(--error-600)]
          ring-[var(--error-600)]/10
        `,
      },
      size: {
        default: 'px-2.5 py-0.5',
        sm: 'px-2 py-0.5 text-[0.6875rem]',
        lg: 'px-3 py-1',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, className }))} {...props} />
  )
}

export { Badge, badgeVariants }
