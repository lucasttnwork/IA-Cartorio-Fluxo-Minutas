/**
 * Geocoding Service for Worker
 *
 * Handles address geocoding and validation in the worker process.
 * Integrates with property extraction to automatically geocode addresses.
 */

export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip: string
  // Geocoding fields
  latitude?: number
  longitude?: number
  formatted_address?: string
  geocoded_at?: string
  geocode_confidence?: number
  geocode_status?: 'pending' | 'success' | 'failed' | 'partial'
}

export interface GeocodingResult {
  success: boolean
  address: Address
  error?: string
}

export interface GeocodingConfig {
  apiKey?: string
  useGoogleMaps: boolean
  timeout: number
  retryAttempts: number
}

const DEFAULT_CONFIG: GeocodingConfig = {
  useGoogleMaps: false, // Default to mock for development
  timeout: 5000,
  retryAttempts: 2,
}

/**
 * Geocoding service for address validation and coordinate lookup in worker
 */
export class GeocodingService {
  private config: GeocodingConfig

  constructor(config?: Partial<GeocodingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Check for Google Maps API key in environment
    if (process.env.GOOGLE_MAPS_API_KEY) {
      this.config.apiKey = process.env.GOOGLE_MAPS_API_KEY
      this.config.useGoogleMaps = true
    }
  }

  /**
   * Geocode an address to get coordinates and formatted address
   */
  async geocodeAddress(address: Address): Promise<GeocodingResult> {
    // If already geocoded and recent (less than 30 days), skip
    if (this.isRecentlyGeocoded(address)) {
      console.log('[Geocoding] Address already geocoded recently, skipping')
      return {
        success: true,
        address,
      }
    }

    let lastError: Error | undefined

    // Retry logic
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`[Geocoding] Attempt ${attempt + 1}/${this.config.retryAttempts + 1}`)

        // Use Google Maps API if configured
        if (this.config.useGoogleMaps && this.config.apiKey) {
          return await this.geocodeWithGoogleMaps(address)
        } else {
          // Use mock geocoding for development/testing
          return await this.geocodeWithMock(address)
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.error(`[Geocoding] Attempt ${attempt + 1} failed:`, error)

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All attempts failed
    console.error('[Geocoding] All attempts failed:', lastError)
    return {
      success: false,
      address: {
        ...address,
        geocode_status: 'failed',
        geocoded_at: new Date().toISOString(),
      },
      error: lastError?.message || 'Unknown geocoding error',
    }
  }

  /**
   * Check if address was recently geocoded
   */
  private isRecentlyGeocoded(address: Address): boolean {
    if (!address.geocoded_at || !address.latitude || !address.longitude) {
      return false
    }

    const geocodedDate = new Date(address.geocoded_at)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return geocodedDate > thirtyDaysAgo && address.geocode_status === 'success'
  }

  /**
   * Geocode using Google Maps Geocoding API
   */
  private async geocodeWithGoogleMaps(address: Address): Promise<GeocodingResult> {
    const addressString = this.formatAddressString(address)
    console.log('[Geocoding] Geocoding with Google Maps:', addressString)

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
    url.searchParams.append('address', addressString)
    url.searchParams.append('key', this.config.apiKey!)
    url.searchParams.append('region', 'br') // Bias to Brazil

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0]
        const location = result.geometry.location

        // Calculate confidence based on location type
        const confidence = this.calculateGoogleMapsConfidence(result)

        console.log('[Geocoding] Success:', {
          lat: location.lat,
          lng: location.lng,
          confidence,
          formatted: result.formatted_address,
        })

        return {
          success: true,
          address: {
            ...address,
            latitude: location.lat,
            longitude: location.lng,
            formatted_address: result.formatted_address,
            geocode_confidence: confidence,
            geocode_status: confidence >= 0.8 ? 'success' : 'partial',
            geocoded_at: new Date().toISOString(),
          },
        }
      } else {
        console.warn('[Geocoding] No results:', data.status)
        return {
          success: false,
          address: {
            ...address,
            geocode_status: 'failed',
            geocoded_at: new Date().toISOString(),
          },
          error: `Geocoding failed: ${data.status}`,
        }
      }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Calculate confidence score from Google Maps result
   */
  private calculateGoogleMapsConfidence(result: any): number {
    const locationType = result.geometry.location_type

    const confidenceMap: Record<string, number> = {
      'ROOFTOP': 1.0,
      'RANGE_INTERPOLATED': 0.85,
      'GEOMETRIC_CENTER': 0.6,
      'APPROXIMATE': 0.4,
    }

    return confidenceMap[locationType] || 0.5
  }

  /**
   * Mock geocoding for development/testing
   */
  private async geocodeWithMock(address: Address): Promise<GeocodingResult> {
    console.log('[Geocoding] Using mock geocoding')

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))

    const addressString = this.formatAddressString(address)

    // Validate that address has minimum required fields
    if (!address.city || !address.state) {
      return {
        success: false,
        address: {
          ...address,
          geocode_status: 'failed',
          geocoded_at: new Date().toISOString(),
        },
        error: 'Missing required address fields (city, state)',
      }
    }

    // Generate mock coordinates based on city/state
    const hash = this.simpleHash(addressString)

    // São Paulo region as default
    const baseLat = -23.55
    const baseLng = -46.63

    const latVariation = (hash % 200 - 100) / 100
    const lngVariation = ((hash * 13) % 200 - 100) / 100

    const latitude = baseLat + latVariation
    const longitude = baseLng + lngVariation

    const formattedAddress = this.formatAddressString(address)

    console.log('[Geocoding] Mock result:', { latitude, longitude })

    return {
      success: true,
      address: {
        ...address,
        latitude,
        longitude,
        formatted_address: formattedAddress,
        geocode_confidence: 0.75,
        geocode_status: 'success',
        geocoded_at: new Date().toISOString(),
      },
    }
  }

  /**
   * Format address as string for geocoding
   */
  private formatAddressString(address: Address): string {
    const parts: string[] = []

    if (address.street) {
      let street = address.street
      if (address.number) {
        street += `, ${address.number}`
      }
      parts.push(street)
    }

    if (address.complement) {
      parts.push(address.complement)
    }

    if (address.neighborhood) {
      parts.push(address.neighborhood)
    }

    if (address.city) {
      parts.push(address.city)
    }

    if (address.state) {
      parts.push(address.state)
    }

    if (address.zip) {
      parts.push(address.zip)
    }

    parts.push('Brasil')

    return parts.join(', ')
  }

  /**
   * Simple hash function for generating consistent mock coordinates
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GeocodingConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService()
