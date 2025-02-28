import React from 'react'
import { Label } from './Label'

interface FormFieldProps {
  label?: string
  error?: string
  children: React.ReactNode
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {children}
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
