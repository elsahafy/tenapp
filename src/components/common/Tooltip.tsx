import { useState } from 'react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

interface TooltipProps {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  icon?: boolean
  children?: React.ReactNode
}

export default function Tooltip({
  content,
  position = 'top',
  icon = true,
  children,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800',
  }

  return (
    <div className="relative inline-flex items-center">
      {children || (
        icon && (
          <InformationCircleIcon
            className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-help"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
          />
        )
      )}
      {isVisible && (
        <>
          <div
            className={`absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg shadow-sm tooltip ${positionClasses[position]}`}
            role="tooltip"
          >
            {content}
            <div
              className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${arrowClasses[position]}`}
            />
          </div>
        </>
      )}
    </div>
  )
}
