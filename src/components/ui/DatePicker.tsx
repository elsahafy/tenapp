import { forwardRef } from 'react'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface Props {
  selected?: Date | null
  onChange: (date: Date | null) => void
  className?: string
  placeholderText?: string
}

export const DatePicker = forwardRef<ReactDatePicker, Props>(
  ({ selected, onChange, className = '', placeholderText, ...props }, ref) => {
    return (
      <ReactDatePicker
        ref={ref}
        selected={selected}
        onChange={onChange}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        dateFormat="yyyy-MM-dd"
        isClearable
        placeholderText={placeholderText}
        {...props}
      />
    )
  }
)

DatePicker.displayName = 'DatePicker'
