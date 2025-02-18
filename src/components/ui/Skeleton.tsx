import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--gray-100)] dark:bg-[var(--gray-800)]',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
