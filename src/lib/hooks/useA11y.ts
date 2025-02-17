import { useCallback, useEffect, useRef } from 'react'

interface UseA11yOptions {
  ariaLabel?: string
  ariaDescribedBy?: string
  role?: string
  tabIndex?: number
}

export function useA11y({
  ariaLabel,
  ariaDescribedBy,
  role,
  tabIndex = 0,
}: UseA11yOptions = {}) {
  const ref = useRef<HTMLElement>(null)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!ref.current) return

      // Handle Enter and Space key presses for interactive elements
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        ref.current.click()
      }
    },
    [ref]
  )

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Add keyboard event listeners
    element.addEventListener('keydown', handleKeyDown)

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    ref,
    a11yProps: {
      role,
      tabIndex,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
    },
  }
}

export function useAriaAnnounce() {
  const announceRef = useRef<HTMLDivElement>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceRef.current) return

    announceRef.current.setAttribute('aria-live', priority)
    announceRef.current.textContent = message

    // Clear the message after it's been announced
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = ''
      }
    }, 3000)
  }, [])

  return {
    announceRef,
    announce,
  }
}

export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault()
          lastFocusable.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstFocusable?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive])

  return containerRef
}

export function useSkipLink(targetId: string) {
  const skipLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const skipLink = skipLinkRef.current
    if (!skipLink) return

    const handleClick = (event: MouseEvent) => {
      event.preventDefault()
      const target = document.getElementById(targetId)
      if (target) {
        target.focus()
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }

    skipLink.addEventListener('click', handleClick)

    return () => {
      skipLink.removeEventListener('click', handleClick)
    }
  }, [targetId])

  return skipLinkRef
}
