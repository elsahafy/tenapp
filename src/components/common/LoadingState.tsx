interface LoadingStateProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  type?: 'spinner' | 'skeleton'
  className?: string
}

export default function LoadingState({
  message = 'Loading...',
  size = 'medium',
  type = 'spinner',
  className = '',
}: LoadingStateProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  }

  if (type === 'skeleton') {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded ${className}`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">{message}</span>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
    >
      <div
        className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${sizeClasses[size]}`}
      />
      {message && (
        <span className="mt-2 text-sm text-gray-500">{message}</span>
      )}
      <span className="sr-only">Loading</span>
    </div>
  )
}
