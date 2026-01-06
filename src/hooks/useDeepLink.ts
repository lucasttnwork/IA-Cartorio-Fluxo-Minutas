import { useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export interface DeepLinkSection {
  id: string
  label: string
}

interface UseDeepLinkOptions {
  /** Sections that can be deep-linked */
  sections: DeepLinkSection[]
  /** Scroll behavior - 'smooth' or 'auto' */
  behavior?: ScrollBehavior
  /** Offset from top in pixels (e.g., for fixed headers) */
  offsetTop?: number
  /** Duration of highlight animation in ms */
  highlightDuration?: number
  /** Callback when a section is scrolled to */
  onSectionFocus?: (sectionId: string) => void
}

interface UseDeepLinkReturn {
  /** Currently active section from URL hash */
  activeSection: string | null
  /** Scroll to a specific section and update URL hash */
  scrollToSection: (sectionId: string) => void
  /** Generate a link to a specific section */
  getSectionLink: (sectionId: string) => string
  /** Clear the current hash */
  clearHash: () => void
  /** Get ref callback for a section element */
  getSectionRef: (sectionId: string) => (element: HTMLElement | null) => void
}

const HIGHLIGHT_CLASS = 'deep-link-highlight'

export function useDeepLink(options: UseDeepLinkOptions): UseDeepLinkReturn {
  const {
    sections,
    behavior = 'smooth',
    offsetTop = 80, // Default offset for header
    highlightDuration = 2000,
    onSectionFocus,
  } = options

  const location = useLocation()
  const navigate = useNavigate()
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get current hash without the # symbol
  const currentHash = location.hash.replace('#', '')
  const activeSection = sections.find(s => s.id === currentHash)?.id || null

  // Highlight a section temporarily
  const highlightSection = useCallback((element: HTMLElement) => {
    // Clear any existing timeout
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current)
    }

    // Remove highlight from all sections
    sectionRefs.current.forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS)
    })

    // Add highlight to the target section
    element.classList.add(HIGHLIGHT_CLASS)

    // Remove highlight after duration
    highlightTimeoutRef.current = setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS)
    }, highlightDuration)
  }, [highlightDuration])

  // Scroll to a section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = sectionRefs.current.get(sectionId)
    if (!element) {
      console.warn(`Section "${sectionId}" not found`)
      return
    }

    // Calculate position with offset
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.scrollY - offsetTop

    // Scroll to position
    window.scrollTo({
      top: offsetPosition,
      behavior,
    })

    // Update URL hash without triggering scroll
    navigate(`${location.pathname}#${sectionId}`, { replace: true })

    // Highlight the section
    highlightSection(element)

    // Call callback
    onSectionFocus?.(sectionId)
  }, [behavior, offsetTop, navigate, location.pathname, highlightSection, onSectionFocus])

  // Generate a link to a section
  const getSectionLink = useCallback((sectionId: string): string => {
    return `${location.pathname}#${sectionId}`
  }, [location.pathname])

  // Clear the hash
  const clearHash = useCallback(() => {
    navigate(location.pathname, { replace: true })
  }, [navigate, location.pathname])

  // Get ref callback for a section
  const getSectionRef = useCallback((sectionId: string) => {
    return (element: HTMLElement | null) => {
      if (element) {
        sectionRefs.current.set(sectionId, element)
      } else {
        sectionRefs.current.delete(sectionId)
      }
    }
  }, [])

  // Handle initial hash on mount and hash changes
  useEffect(() => {
    if (!currentHash) return

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const element = sectionRefs.current.get(currentHash)
      if (element) {
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.scrollY - offsetTop

        window.scrollTo({
          top: offsetPosition,
          behavior,
        })

        highlightSection(element)
        onSectionFocus?.(currentHash)
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [currentHash, behavior, offsetTop, highlightSection, onSectionFocus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
    }
  }, [])

  return {
    activeSection,
    scrollToSection,
    getSectionLink,
    clearHash,
    getSectionRef,
  }
}

export default useDeepLink
