/**
 * Geocoding Service
 *
 * Provides address validation and geocoding functionality using Google Maps Geocoding API.
 * Converts addresses to geographic coordinates (latitude/longitude) and validates address formats.
 */

import type { Address } from '../types'

export interface GeocodingResult {
  success: boolean
  address: Address
  error?: string
}

export interface GeocodingConfig {
  apiKey?: string
  useGoogleMaps: boolean
  timeout: number
}

const DEFAULT_CONFIG: GeocodingConfig = {
  useGoogleMaps: false, // Default to mock for development
  timeout: 5000,
}

/**
 * Geocoding service for address validation and coordinate lookup
 */
export class GeocodingService {
  private config: GeocodingConfig

  constructor(config?: Partial<GeocodingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Geocode an address to get coordinates and formatted address
   */
  async geocodeAddress(address: Address): Promise<GeocodingResult> {
    // If already geocoded and recent (less than 30 days), skip
    if (this.isRecentlyGeocoded(address)) {
      return {
        success: true,
        address,
      }
    }

    try {
      // Use Google Maps API if configured
      if (this.config.useGoogleMaps && this.config.apiKey) {
        return await this.geocodeWithGoogleMaps(address)
      } else {
        // Use mock geocoding for development/testing
        return await this.geocodeWithMock(address)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      return {
        success: false,
        address: {
          ...address,
          geocode_status: 'failed',
          geocoded_at: new Date().toISOString(),
        },
        error: error instanceof Error ? error.message : 'Unknown geocoding error',
      }
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

    // ROOFTOP = highest precision (exact address)
    // RANGE_INTERPOLATED = interpolated between two precise points
    // GEOMETRIC_CENTER = center of a location (street, neighborhood)
    // APPROXIMATE = approximate location

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
   * Uses a simple hash-based approach to generate consistent coordinates
   */
  private async geocodeWithMock(address: Address): Promise<GeocodingResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))

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
    // This creates consistent coordinates for the same address
    const hash = this.simpleHash(addressString)

    // Brazil approximate bounds
    // Latitude: -33.75 to 5.27
    // Longitude: -73.99 to -34.79

    // São Paulo region as default (most common in Brazil)
    const baseLat = -23.55 // São Paulo latitude
    const baseLng = -46.63 // São Paulo longitude

    // Add variation based on address hash
    const latVariation = (hash % 200 - 100) / 100 // -1 to +1
    const lngVariation = ((hash * 13) % 200 - 100) / 100 // -1 to +1

    const latitude = baseLat + latVariation
    const longitude = baseLng + lngVariation

    const formattedAddress = this.formatAddressString(address)

    return {
      success: true,
      address: {
        ...address,
        latitude,
        longitude,
        formatted_address: formattedAddress,
        geocode_confidence: 0.75, // Mock always returns medium-high confidence
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
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Validate address completeness
   */
  validateAddress(address: Address): {
    isValid: boolean
    missingFields: string[]
    warnings: string[]
  } {
    const missingFields: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!address.street || address.street.trim() === '') {
      missingFields.push('street')
    }

    if (!address.city || address.city.trim() === '') {
      missingFields.push('city')
    }

    if (!address.state || address.state.trim() === '') {
      missingFields.push('state')
    }

    // Optional but recommended fields
    if (!address.number || address.number.trim() === '') {
      warnings.push('Missing street number')
    }

    if (!address.zip || address.zip.trim() === '') {
      warnings.push('Missing ZIP code (CEP)')
    }

    if (!address.neighborhood || address.neighborhood.trim() === '') {
      warnings.push('Missing neighborhood')
    }

    // Check geocoding status
    if (!address.latitude || !address.longitude) {
      warnings.push('Address not geocoded')
    } else if (address.geocode_status === 'partial') {
      warnings.push('Geocoding confidence is low')
    } else if (address.geocode_status === 'failed') {
      warnings.push('Geocoding failed')
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GeocodingConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): GeocodingConfig {
    return { ...this.config }
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService()

// Export factory function for custom configurations
export function createGeocodingService(config?: Partial<GeocodingConfig>): GeocodingService {
  return new GeocodingService(config)
}
