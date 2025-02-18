'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { baseTheme, type Theme } from './theme'

type ThemeContextType = {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const lightThemeValues = {
  '--primary-50': '#f0f9ff',
  '--primary-100': '#e0f2fe',
  '--primary-200': '#bae6fd',
  '--primary-300': '#7dd3fc',
  '--primary-400': '#38bdf8',
  '--primary-500': '#0ea5e9',
  '--primary-600': '#0284c7',
  '--primary-700': '#0369a1',
  '--primary-800': '#075985',
  '--primary-900': '#0c4a6e',

  '--secondary-50': '#f8fafc',
  '--secondary-100': '#f1f5f9',
  '--secondary-200': '#e2e8f0',
  '--secondary-300': '#cbd5e1',
  '--secondary-400': '#94a3b8',
  '--secondary-500': '#64748b',
  '--secondary-600': '#475569',
  '--secondary-700': '#334155',
  '--secondary-800': '#1e293b',
  '--secondary-900': '#0f172a',

  '--success-50': '#f0fdf4',
  '--success-100': '#dcfce7',
  '--success-500': '#22c55e',
  '--success-600': '#16a34a',

  '--warning-50': '#fffbeb',
  '--warning-100': '#fef3c7',
  '--warning-500': '#f59e0b',
  '--warning-600': '#d97706',

  '--error-50': '#fef2f2',
  '--error-100': '#fee2e2',
  '--error-500': '#ef4444',
  '--error-600': '#dc2626',

  '--gray-50': '#f9fafb',
  '--gray-100': '#f3f4f6',
  '--gray-200': '#e5e7eb',
  '--gray-300': '#d1d5db',
  '--gray-400': '#9ca3af',
  '--gray-500': '#6b7280',
  '--gray-600': '#4b5563',
  '--gray-700': '#374151',
  '--gray-800': '#1f2937',
  '--gray-900': '#111827',

  '--background-primary': '#ffffff',
  '--background-secondary': '#f9fafb',
  '--background-tertiary': '#f3f4f6',

  '--text-primary': '#111827',
  '--text-secondary': '#4b5563',
  '--text-tertiary': '#6b7280',

  '--border-primary': '#e5e7eb',
  '--border-secondary': '#f3f4f6',

  '--shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  '--shadow-default': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  '--shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',

  '--text-xs': '0.75rem',
  '--text-sm': '0.875rem',
  '--text-base': '1rem',
  '--text-lg': '1.125rem',
  '--text-xl': '1.25rem',
  '--text-2xl': '1.5rem',
  '--text-3xl': '1.875rem',
  '--text-4xl': '2.25rem',
  '--text-5xl': '3rem',
} as const

const darkThemeValues = {
  '--primary-50': '#082f49',
  '--primary-100': '#0c4a6e',
  '--primary-200': '#075985',
  '--primary-300': '#0369a1',
  '--primary-400': '#0284c7',
  '--primary-500': '#0ea5e9',
  '--primary-600': '#38bdf8',
  '--primary-700': '#7dd3fc',
  '--primary-800': '#bae6fd',
  '--primary-900': '#e0f2fe',

  '--secondary-50': '#0f172a',
  '--secondary-100': '#1e293b',
  '--secondary-200': '#334155',
  '--secondary-300': '#475569',
  '--secondary-400': '#64748b',
  '--secondary-500': '#94a3b8',
  '--secondary-600': '#cbd5e1',
  '--secondary-700': '#e2e8f0',
  '--secondary-800': '#f1f5f9',
  '--secondary-900': '#f8fafc',

  '--success-50': '#052e16',
  '--success-100': '#14532d',
  '--success-500': '#22c55e',
  '--success-600': '#16a34a',

  '--warning-50': '#422006',
  '--warning-100': '#713f12',
  '--warning-500': '#f59e0b',
  '--warning-600': '#d97706',

  '--error-50': '#450a0a',
  '--error-100': '#7f1d1d',
  '--error-500': '#ef4444',
  '--error-600': '#dc2626',

  '--gray-50': '#18181b',
  '--gray-100': '#27272a',
  '--gray-200': '#3f3f46',
  '--gray-300': '#52525b',
  '--gray-400': '#71717a',
  '--gray-500': '#a1a1aa',
  '--gray-600': '#d4d4d8',
  '--gray-700': '#e4e4e7',
  '--gray-800': '#f4f4f5',
  '--gray-900': '#fafafa',

  '--background-primary': '#18181b',
  '--background-secondary': '#27272a',
  '--background-tertiary': '#3f3f46',

  '--text-primary': '#f4f4f5',
  '--text-secondary': '#d4d4d8',
  '--text-tertiary': '#a1a1aa',

  '--border-primary': '#3f3f46',
  '--border-secondary': '#27272a',

  '--shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.3)',
  '--shadow-default': '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
  '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
  '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
  '--shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
} as const

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check if user has a theme preference in localStorage
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    setIsDark(savedTheme === 'dark' || (!savedTheme && prefersDark))
  }, [])

  useEffect(() => {
    // Apply theme variables
    const root = document.documentElement
    const themeValues = isDark ? darkThemeValues : lightThemeValues

    Object.entries(themeValues).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })

    // Update class on html element
    document.documentElement.classList.toggle('dark', isDark)

    // Save preference to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(prev => !prev)
  }

  const value = {
    theme: baseTheme,
    isDark,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
