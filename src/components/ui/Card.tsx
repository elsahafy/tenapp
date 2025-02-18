import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-lg transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-[var(--background-primary)] border border-[var(--border-primary)] shadow-sm hover:shadow-md',
        secondary: 'bg-[var(--background-secondary)] border border-[var(--border-secondary)]',
        outline: 'border border-[var(--border-primary)] bg-transparent',
        ghost: 'border-none bg-transparent',
      },
      padding: {
        default: 'p-6',
        large: 'p-8',
        small: 'p-4',
        none: '',
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
)

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  loading?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, loading, children, ...props }, ref) => {
    if (loading) {
      return (
        <div
          ref={ref}
          className={cn(cardVariants({ variant, padding, className }))}
          {...props}
        >
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-[var(--gray-200)] rounded-full w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-[var(--gray-200)] rounded-full"></div>
              <div className="h-4 bg-[var(--gray-200)] rounded-full w-5/6"></div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold text-[var(--text-primary)]',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-[var(--text-secondary)]', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4 border-t border-[var(--border-primary)]', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
