/**
 * Centralized Google Maps API loader to prevent multiple script inclusions
 */

interface LoadGoogleMapsOptions {
  apiKey: string
  libraries?: string[]
  language?: string
  region?: string
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader
  private isLoaded: boolean = false
  private isLoading: boolean = false
  private loadPromise: Promise<void> | null = null
  private loadedLibraries: Set<string> = new Set()

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader()
    }
    return GoogleMapsLoader.instance
  }

  /**
   * Load Google Maps API with specified options
   */
  async load(options: LoadGoogleMapsOptions): Promise<void> {
    const { apiKey, libraries = [], language = 'en', region = 'EG' } = options

    // Check if Google Maps is already loaded
    if (this.isLoaded && window.google && window.google.maps) {
      return Promise.resolve()
    }

    // If already loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise
    }

    // Remove any existing Google Maps scripts to prevent conflicts
    this.removeExistingScripts()

    // Create new load promise
    this.loadPromise = new Promise<void>((resolve, reject) => {
      this.isLoading = true

      // Combine all requested libraries with existing ones
      const allLibraries = [...new Set([...libraries, ...this.loadedLibraries])]
      
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${allLibraries.join(',')}&language=${language}&region=${region}`
      script.async = true
      script.defer = true

      script.onload = () => {
        this.isLoaded = true
        this.isLoading = false
        this.loadedLibraries = new Set(allLibraries)
        resolve()
      }

      script.onerror = (error) => {
        this.isLoading = false
        this.loadPromise = null
        reject(new Error(`Failed to load Google Maps API: ${error}`))
      }

      document.head.appendChild(script)
    })

    return this.loadPromise
  }

  /**
   * Remove existing Google Maps scripts to prevent conflicts
   */
  private removeExistingScripts(): void {
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
    existingScripts.forEach(script => {
      script.remove()
    })
  }

  /**
   * Check if Google Maps is loaded and ready
   */
  isReady(): boolean {
    return this.isLoaded && !!(window.google && window.google.maps)
  }

  /**
   * Get the loaded libraries
   */
  getLoadedLibraries(): string[] {
    return Array.from(this.loadedLibraries)
  }

  /**
   * Reset the loader state (useful for testing)
   */
  reset(): void {
    this.isLoaded = false
    this.isLoading = false
    this.loadPromise = null
    this.loadedLibraries.clear()
  }
}

// Export singleton instance
export const googleMapsLoader = GoogleMapsLoader.getInstance()

// Convenience function for easy usage
export const loadGoogleMaps = (options: LoadGoogleMapsOptions): Promise<void> => {
  return googleMapsLoader.load(options)
}

// Type definitions for Google Maps
declare global {
  interface Window {
    google: {
      maps: {
        Map: any
        Marker: any
        InfoWindow: any
        places: any
        geometry: any
        [key: string]: any
      }
    }
  }
}