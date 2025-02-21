import { formatCurrency } from '@/lib/utils/formatters'
import { useCurrency } from '@/lib/hooks/useCurrency'
import type { ComponentType, SVGProps } from 'react'

interface SummaryCardProps {
  title: string
  value: string | number
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  loading?: boolean
  trend?: number
}

export function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  loading = false,
  trend
}: SummaryCardProps) {
  const { currency } = useCurrency()

  // Format value if it's a number and not already formatted
  const formattedValue = typeof value === 'number' ? formatCurrency(value, currency) : value

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600" id={`${title.toLowerCase()}-label`}>{title}</p>
          {loading ? (
            <div 
              className="h-8 w-32 bg-gray-200 animate-pulse rounded mt-1"
              role="progressbar"
              aria-labelledby={`${title.toLowerCase()}-label`}
            ></div>
          ) : (
            <p 
              className="mt-1 text-2xl font-semibold text-gray-900"
              aria-labelledby={`${title.toLowerCase()}-label`}
            >
              {formattedValue}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <div 
          className="h-8 w-8 bg-primary-50 rounded-lg flex items-center justify-center"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
      </div>
      {trend !== undefined && (
        <div 
          className={`mt-4 flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
          role="status"
          aria-label={`${Math.abs(trend)}% ${trend >= 0 ? 'increase' : 'decrease'} from last month`}
        >
          <Icon 
            className={`h-3 w-3 mr-1 ${trend >= 0 ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  )
}
