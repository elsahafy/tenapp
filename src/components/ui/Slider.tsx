import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'

export interface SliderProps {
  value: number | number[]
  onValueChange?: (value: number[]) => void
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

export function Slider({
  value,
  onValueChange,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className = '',
}: SliderProps) {
  const values = Array.isArray(value) ? value : [value]
  
  const handleValueChange = (newValues: number[]) => {
    if (onValueChange) onValueChange(newValues)
    if (onChange && newValues.length > 0) onChange(newValues[0])
  }

  return (
    <SliderPrimitive.Root
      className={`relative flex w-full touch-none select-none items-center ${className}`}
      value={values}
      onValueChange={handleValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow rounded-full bg-gray-200 dark:bg-gray-700">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-blue-500" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-blue-500 bg-white ring-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
}
