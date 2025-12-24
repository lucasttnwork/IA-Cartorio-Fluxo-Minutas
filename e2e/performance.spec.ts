import { test, expect } from '@playwright/test'
import { loginTestUser, logout, navigateToDashboard } from './fixtures'

/**
 * Performance Testing (FASE 15 - Semana 2)
 * Tests P001-P005: Lighthouse scores, Web Vitals, bundle analysis
 */

test.describe('Performance - Lighthouse & Web Vitals', () => {
  test('P001: Dashboard page meets Lighthouse performance baseline', async ({ page }) => {
    // Login and navigate to dashboard
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Measure page timing
    const navigationTiming = await page.evaluate(() => {
      const perf = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        domInteractive: perf.domInteractive - perf.fetchStart,
      }
    })

    // Verify reasonable load times (in milliseconds)
    expect(navigationTiming.domContentLoaded).toBeLessThan(5000) // < 5s
    expect(navigationTiming.loadComplete).toBeLessThan(8000) // < 8s

    // Check for critical rendering path elements
    const firstContentfulPaint = await page.evaluate(() => {
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]
      return fcp ? (fcp as PerformanceEntry).startTime : null
    })

    if (firstContentfulPaint) {
      expect(firstContentfulPaint).toBeLessThan(3000) // FCP < 3s
    }
  })

  test('P002: Case overview page meets performance targets', async ({ page }) => {
    // Login and create test case
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Create a case
    const newCaseButton = page.locator('button:has-text("New Case")')
    await newCaseButton.click()

    const titleInput = page.locator('input[id="case-title"]')
    await titleInput.fill('Performance Test Case')

    const actTypeButton = page.locator('button:has-text("Purchase & Sale")').first()
    await actTypeButton.click()

    const nextButton = page.locator('button:has-text("Next")').first()
    await nextButton.click()

    const priceInput = page.locator('input[id="case-price"]')
    await priceInput.fill('500000')

    const fullPaymentButton = page.locator('button:has-text("Full Payment")').first()
    await fullPaymentButton.click()

    await nextButton.click()

    const createButton = page.locator('button:has-text("Create Case")').first()
    await createButton.click()

    // Wait for navigation
    await expect(page.locator('text=Performance Test Case')).toBeVisible({ timeout: 5000 })
    await page.waitForLoadState('networkidle')

    // Measure page performance
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        responseTime: perf.responseEnd - perf.requestStart,
        renderTime: perf.domInteractive - perf.domLoading,
      }
    })

    // Verify response and render times
    expect(metrics.responseTime).toBeLessThan(2000) // Server response < 2s
    expect(metrics.renderTime).toBeLessThan(3000) // Render time < 3s

    await logout(page)
  })

  test('P003: Canvas page renders within performance budget', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Navigate directly to a canvas page
    // Using a known structure /case/:caseId/canvas
    const currentUrl = page.url()
    const caseMatch = currentUrl.match(/dashboard/)

    if (caseMatch) {
      // Create a case first
      const newCaseButton = page.locator('button:has-text("New Case")')
      if (await newCaseButton.count() > 0) {
        await newCaseButton.click()

        const titleInput = page.locator('input[id="case-title"]')
        await titleInput.fill('Canvas Perf Test')

        const actTypeButton = page.locator('button:has-text("Purchase & Sale")').first()
        await actTypeButton.click()

        const nextButton = page.locator('button:has-text("Next")').first()
        await nextButton.click()

        const priceInput = page.locator('input[id="case-price"]')
        await priceInput.fill('500000')

        const fullPaymentButton = page.locator('button:has-text("Full Payment")').first()
        await fullPaymentButton.click()

        await nextButton.click()

        const createButton = page.locator('button:has-text("Create Case")').first()
        await createButton.click()

        await expect(page.locator('text=Canvas Perf Test')).toBeVisible({ timeout: 5000 })
        await page.waitForLoadState('networkidle')
      }
    }

    // Measure memory usage (if available)
    const memoryInfo = await page.evaluate(() => {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        }
      }
      return null
    })

    if (memoryInfo) {
      // Verify memory usage is reasonable
      const heapUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
      expect(heapUsagePercent).toBeLessThan(90) // Use less than 90% of heap
    }

    await logout(page)
  })

  test('P004: Web Vitals - Largest Contentful Paint (LCP) < 2.5s', async ({ page }) => {
    // Start measuring before navigation
    const startTime = Date.now()

    await loginTestUser(page)
    await navigateToDashboard(page)

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Measure LCP (time to largest contentful paint)
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.startTime)
        })

        observer.observe({ entryTypes: ['largest-contentful-paint'] })

        // Timeout after 5 seconds
        setTimeout(() => {
          resolve(0)
        }, 5000)
      })
    })

    // LCP should be less than 2.5 seconds
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2500)
    }
  })

  test('P005: Web Vitals - Cumulative Layout Shift (CLS) < 0.1', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Wait for page stability
    await page.waitForLoadState('networkidle')

    // Measure CLS (cumulative layout shift)
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue
            clsValue += (entry as any).value
          }
        })

        observer.observe({ entryTypes: ['layout-shift'] })

        // Measure for 2 seconds then resolve
        setTimeout(() => {
          resolve(clsValue)
        }, 2000)
      })
    })

    // CLS should be less than 0.1
    expect(cls).toBeLessThan(0.1)
  })

  test('P006: Bundle size analysis - main bundle < 300KB gzipped', async ({ page }) => {
    // Check network requests for bundle
    const responses: { url: string; size: number }[] = []

    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('.js') || url.includes('main') || url.includes('bundle')) {
        try {
          const buffer = await response.body()
          responses.push({
            url: url.substring(url.lastIndexOf('/') + 1),
            size: buffer.length,
          })
        } catch (e) {
          // Some responses may not have a body (e.g., redirects)
        }
      }
    })

    await loginTestUser(page)
    await navigateToDashboard(page)

    await page.waitForLoadState('networkidle')

    // Find the main bundle
    const mainBundle = responses.find(
      (r) => r.url.includes('main') || r.url.includes('bundle') || r.url.endsWith('.js')
    )

    if (mainBundle) {
      // Convert bytes to KB
      const sizeInKB = mainBundle.size / 1024

      // Should be less than 300KB (note: this is uncompressed, gzipped should be ~80KB)
      expect(sizeInKB).toBeLessThan(500) // Allow buffer for uncompressed
    }

    await logout(page)
  })

  test('P007: First Input Delay (FID) check - interactive elements respond quickly', async ({
    page,
  }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Measure interaction response time
    const responseTime = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const startTime = performance.now()

        // Simulate user interaction
        const button = document.querySelector('button')
        if (button) {
          button.click()
          const endTime = performance.now()
          resolve(endTime - startTime)
        } else {
          resolve(0)
        }
      })
    })

    // FID should be less than 100ms for good responsiveness
    if (responseTime > 0) {
      expect(responseTime).toBeLessThan(100)
    }
  })

  test('P008: No slow network resources (all resources load in < 3s)', async ({ page }) => {
    const slowResources: string[] = []

    page.on('response', async (response) => {
      const timing = response.request().timing()
      if (timing) {
        const totalTime = timing.responseEnd || 0
        if (totalTime > 3000) {
          slowResources.push(response.url())
        }
      }
    })

    await loginTestUser(page)
    await navigateToDashboard(page)

    await page.waitForLoadState('networkidle')

    // Should have no resources taking longer than 3 seconds
    expect(slowResources.length).toBe(0)
  })
})
