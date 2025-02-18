import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  `
    inline-flex items-center justify-center rounded-lg text-sm font-medium
    transition-colors duration-200 
    focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-[var(--primary-500)] 
    focus-visible:ring-offset-2
    focus-visible:ring-offset-[var(--background-primary)]
    disabled:pointer-events-none disabled:opacity-50
  `,
  {
    variants: {
      variant: {
        default: `
          bg-[var(--primary-600)] text-white 
          hover:bg-[var(--primary-700)] 
          active:bg-[var(--primary-800)]
        `,
        secondary: `
          bg-[var(--background-secondary)] text-[var(--text-primary)]
          hover:bg-[var(--background-tertiary)]
          active:bg-[var(--gray-200)]
        `,
        outline: `
          border border-[var(--border-primary)] bg-transparent
          text-[var(--text-primary)]
          hover:bg-[var(--background-secondary)]
          active:bg-[var(--background-tertiary)]
        `,
        ghost: `
          text-[var(--text-primary)]
          hover:bg-[var(--background-secondary)]
          active:bg-[var(--background-tertiary)]
        `,
        destructive: `
          bg-[var(--error-600)] text-white
          hover:bg-[var(--error-700)]
          active:bg-[var(--error-800)]
        `,
        success: `
          bg-[var(--success-600)] text-white
          hover:bg-[var(--success-700)]
          active:bg-[var(--success-800)]
        `,
        link: `
          text-[var(--primary-600)] underline-offset-4
          hover:underline
        `,
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
      },
      loading: {
        true: 'relative text-transparent transition-none hover:text-transparent',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={props.disabled || loading}
        {...props}
      >
        {children}
        {loading && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            role="status"
          >
            <svg
              className="h-4 w-4 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
