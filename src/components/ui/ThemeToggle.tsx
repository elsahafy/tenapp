'use client'

import { useTheme } from '@/lib/theme/ThemeProvider'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-colors duration-200
        hover:bg-[var(--background-tertiary)]
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[var(--primary-500)]
        focus-visible:ring-offset-2
        focus-visible:ring-offset-[var(--background-primary)]
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <SunIcon className="h-5 w-5 text-[var(--text-primary)]" />
      ) : (
        <MoonIcon className="h-5 w-5 text-[var(--text-primary)]" />
      )}
    </button>
  )
}
