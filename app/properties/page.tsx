"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import OptimizedImage from "@/components/ui/OptimizedImage"
import ErrorBoundary from "@/components/ui/ErrorBoundary"
import { useSearchParams } from "next/navigation"
import { Search, MapPin, Bed, Bath, Square, Grid, List, SlidersHorizontal, Bookmark, Clock, Filter, Map, Loader2, ChevronUp, Home, DollarSign } from "lucide-react"
import SmartSearchInput from "@/components/search/SmartSearchInput"
import QuickFilterPills from "@/components/search/QuickFilterPills"
import SearchSEO from "@/components/seo/SearchSEO"
import Head from 'next/head'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"
import AdvancedSearchModal, { SearchFilters } from "@/components/search/AdvancedSearchModal"
import GoogleMapView from "@/components/search/GoogleMapView"
import { PropertyCard } from "@/components/property-card"
import { supabase } from "@/lib/supabase/config"
import { useTranslation } from "react-i18next"
import { usePropertiesTranslation } from "@/components/PropertyTranslationWrapper"

interface Property {
  id: string
  title: string
  description: string
  price: number
  bedrooms: number
  bathrooms: number
  square_meters: number
  address: string
  city: string
  state: string
  zip_code: string
  property_type: string
  status: string
  created_at: string
  updated_at: string
  view_count?: number
  features?: string[]
  amenities?: string[]
  latitude?: number
  longitude?: number
  property_photos?: Array<{
    id: string
    url: string
    is_primary: boolean
  }>
}

interface SavedSearch {
  id: string
  name: string
  search_query: string
  filters: any
  alert_enabled: boolean
  created_at: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PropertiesPage() {
  const { t } = useTranslation()
  
  const [properties, setProperties] = useState<Property[]>([])
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [searchResultsTotal, setSearchResultsTotal] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000])
  const [propertyType, setPropertyType] = useState("all")
  const [bedrooms, setBedrooms] = useState("all")
  const [status, setStatus] = useState("all")
  const [sortBy, setSortBy] = useState("price-low")
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [currentFilters, setCurrentFilters] = useState<Partial<SearchFilters>>({})
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  
  // Use translation hook for properties
  const { translatedProperties, isTranslating } = usePropertiesTranslation(properties)
  
  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // Ref to track if we've already processed current search params to prevent loops
  const processedSearchParams = useRef<string>('')

  // Performance optimization: Limit max properties to prevent memory issues
  const MAX_PROPERTIES = 200 // Maximum properties to keep in memory

  const searchParams = useSearchParams()

  // Auto-trigger search when basic filters change - but only if user has actively searched
  // DISABLED to prevent infinite loops during development
  // useEffect(() => {
  //   // Only trigger if we have search results already displayed (user has searched)
  //   // AND we have either a search query or advanced filters applied
  //   if (searchResultsTotal !== null && (searchQuery.trim() || Object.keys(currentFilters).length > 0)) {
  //     const timer = setTimeout(() => {
  //       handleSearchSubmit()
  //     }, 500) // Debounce to avoid too many API calls
  //     
  //     return () => clearTimeout(timer)
  //   }
  // }, [propertyType, bedrooms, status, priceRange])

  useEffect(() => {
    const currentSearchParamsString = searchParams.toString()
    
    // Prevent infinite loops by checking if we've already processed these exact search params
    // BUT allow first run even if both are empty strings
    if (processedSearchParams.current === currentSearchParamsString && processedSearchParams.current !== '') {
      return
    }
    
    // Load basic data only on first run
    if (processedSearchParams.current === '') {
      loadSavedSearches()
      loadSearchHistory()
      loadSavedProperties()
    }
    
    // Check for URL parameters (smart search, area clicks, compound clicks)
    const hasSearchParams = currentSearchParamsString.length > 0
    
    if (hasSearchParams) {
      // Set loading to false since we're handling search instead of loadProperties
      setLoading(false)
      
      // Parse all search parameters
      const searchQueryParam = searchParams.get('search_query')
      const cityParam = searchParams.get('city')
      const compoundParam = searchParams.get('compound')
      const minPriceParam = searchParams.get('minPrice')
      const maxPriceParam = searchParams.get('maxPrice')
      const bedroomsParams = searchParams.getAll('bedrooms[]')
      const bathroomsParams = searchParams.getAll('bathrooms[]')
      const propertyTypeParams = searchParams.getAll('propertyType[]')
      const cityParams = searchParams.getAll('city[]')
      
      // Amenities from smart search
      const hasPool = searchParams.get('has_pool') === 'true'
      const hasGarden = searchParams.get('has_garden') === 'true'
      const hasParking = searchParams.get('has_parking') === 'true'
      const hasSecurity = searchParams.get('has_security') === 'true'
      const hasGym = searchParams.get('has_gym') === 'true'
      const hasBalcony = searchParams.get('has_balcony') === 'true'
      const hasElevator = searchParams.get('has_elevator') === 'true'
      const furnished = searchParams.get('furnished') === 'true'
      
      // Build amenities array using the correct database column names
      const amenities: string[] = []
      if (hasPool) amenities.push('has_pool')
      if (hasGarden) amenities.push('has_garden')
      if (hasParking) amenities.push('has_parking')
      if (hasSecurity) amenities.push('has_security')
      if (hasGym) amenities.push('has_gym')
      if (hasBalcony) amenities.push('has_balcony')
      if (hasElevator) amenities.push('has_elevator')
      
      // Build cities array - handle both single city and multiple city[] params
      const cities: string[] = []
      if (cityParam) cities.push(decodeURIComponent(cityParam))
      if (cityParams.length > 0) cities.push(...cityParams.map(c => decodeURIComponent(c)))
      
      // Build price range
      const priceRange: [number, number] = [
        minPriceParam ? parseInt(minPriceParam) : 0,
        maxPriceParam ? parseInt(maxPriceParam) : 10000000
      ]
      
      const filters: SearchFilters = {
        searchQuery: searchQueryParam ? decodeURIComponent(searchQueryParam) : '',
        priceRange,
        propertyTypes: propertyTypeParams.map(pt => decodeURIComponent(pt)),
        bedrooms: bedroomsParams.map(b => decodeURIComponent(b)),
        bathrooms: bathroomsParams.map(b => decodeURIComponent(b)),
        squareFeetRange: [0, 10000],
        cities,
        compound: compoundParam ? decodeURIComponent(compoundParam).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : undefined,
        amenities,
        features: [],
        maxDistances: {},
        furnished: furnished || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc'
      }
      
      // Set the search query in the input field if it exists
      if (searchQueryParam) {
        setSearchQuery(decodeURIComponent(searchQueryParam))
      }
      
      // Update basic UI filters to reflect smart search parameters
      if (minPriceParam || maxPriceParam) {
        setPriceRange([
          minPriceParam ? parseInt(minPriceParam) : 0,
          maxPriceParam ? parseInt(maxPriceParam) : 10000000
        ])
      }
      
      // Set property type if only one was specified
      if (propertyTypeParams.length === 1) {
        setPropertyType(propertyTypeParams[0])
      }
      
      // Set bedrooms if only one was specified
      if (bedroomsParams.length === 1) {
        setBedrooms(bedroomsParams[0])
      }
      
      // Apply filters and trigger search only if we have search parameters
      console.log('🎯 Setting filters and triggering search:', filters.searchQuery)
      setCurrentFilters(filters)
      // Add a small delay to ensure state is set before triggering search
      // Mark these search params as processed to prevent re-processing
      processedSearchParams.current = currentSearchParamsString
      
      setTimeout(() => {
        handleAdvancedSearch(filters)
      }, 100)
    } else {
      // No search parameters, load initial properties
      processedSearchParams.current = currentSearchParamsString
      loadProperties(true)
    }
  }, [searchParams])

  // Scroll event listener for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    console.log('👁️ Intersection Observer useEffect triggered')
    console.log('📊 Observer conditions:', {
      hasLoadMoreRef: !!loadMoreRef.current,
      hasMoreData,
      loadingMore,
      loading
    })

    if (!loadMoreRef.current || !hasMoreData || loadingMore || loading) {
      console.log('🚫 Observer not initialized due to conditions not met')
      return
    }

    console.log('✅ Creating intersection observer')
    const observer = new IntersectionObserver(
      (entries) => {
        console.log('👁️ Intersection observer triggered')
        console.log('📊 Intersection entries:', entries.map(e => ({ 
          isIntersecting: e.isIntersecting, 
          intersectionRatio: e.intersectionRatio 
        })))
        
        if (entries[0].isIntersecting && !loadingMore && hasMoreData) {
          console.log('🎯 Intersection conditions met - calling loadMoreProperties')
          loadMoreProperties()
        } else {
          console.log('❌ Intersection conditions not met:', {
            isIntersecting: entries[0].isIntersecting,
            loadingMore,
            hasMoreData
          })
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before reaching the bottom
        threshold: 0.1
      }
    )

    const currentRef = loadMoreRef.current
    console.log('👀 Starting to observe loadMore element')
    observer.observe(currentRef)

    return () => {
      console.log('🔚 Cleaning up intersection observer')
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [loadingMore, hasMoreData, loading])

  const loadProperties = async (reset = false) => {
    console.log('🔍 ========== loadProperties DEBUG START ==========')
    console.log('📚 loadProperties called with reset:', reset)
    console.log('📊 Current state before load:', {
      currentPage,
      propertiesCount: properties.length,
      hasMoreData,
      loading,
      loadingMore
    })
    
    try {
      if (reset) {
        console.log('🔄 Reset mode - clearing state')
        setLoading(true)
        setCurrentPage(1)
        setProperties([])
      } else {
        console.log('➕ Load more mode - setting loadingMore to true')
        setLoadingMore(true)
      }

      const page = reset ? 1 : currentPage + 1
      console.log('📄 Fetching properties for page:', page)
      const apiUrl = `/api/properties?page=${page}&limit=20&context=listing`
      console.log('🔗 API URL:', apiUrl)
      
      const response = await fetch(apiUrl)
      console.log('📡 API Response status:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        const newProperties = data.properties || []
        console.log('✅ Properties API response received:')
        console.log('  - New properties count:', newProperties.length)
        console.log('  - Pagination data:', data.pagination)
        console.log('  - First property title:', newProperties[0]?.title)
        console.log('  - Last property title:', newProperties[newProperties.length - 1]?.title)
        
        setPagination(data.pagination)
        
        if (reset) {
          console.log('🔄 Reset mode: Setting properties to new array')
          console.log('  - Setting', newProperties.length, 'properties')
          setProperties(newProperties)
        } else {
          console.log('➕ Append mode: Adding to existing properties')
          setProperties(prev => {
            console.log('  - Previous properties count:', prev.length)
            console.log('  - Adding properties count:', newProperties.length)
            const updated = [...prev, ...newProperties]
            console.log('  - Total after merge:', updated.length)
            
            // Performance optimization: Keep only the latest MAX_PROPERTIES
            if (updated.length > MAX_PROPERTIES) {
              console.log('⚠️ Trimming properties to MAX_PROPERTIES:', MAX_PROPERTIES)
              return updated.slice(-MAX_PROPERTIES)
            }
            return updated
          })
          setCurrentPage(page)
          console.log('📄 Updated currentPage to:', page)
        }
        
        // Check if we've reached the end
        const hasMore = page < data.pagination.totalPages;
        console.log('📄 Pagination check:')
        console.log('  - Current page:', page)
        console.log('  - Total pages:', data.pagination.totalPages)
        console.log('  - Has more data:', hasMore)
        console.log('  - Total properties in DB:', data.pagination.total)
        setHasMoreData(hasMore)
        
      } else {
        console.error('❌ Failed to load properties:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('❌ Error response body:', errorText)
      }
    } catch (error) {
      console.error('❌ Error loading properties:', error instanceof Error ? error.message : error)
      if (error instanceof Error) {
        console.error('❌ Error stack:', error.stack)
      }
    } finally {
      console.log('🏁 loadProperties finally block - cleaning up state')
      setLoading(false)
      setLoadingMore(false)
      console.log('🔍 ========== loadProperties DEBUG END ==========')
    }
  }

  const loadMoreProperties = useCallback(async () => {
    console.log('🔄 loadMoreProperties called')
    console.log('📊 LoadMore state check:', { loadingMore, hasMoreData, currentPage })
    
    if (loadingMore) {
      console.log('⏳ Already loading more, skipping...')
      return
    }
    
    if (!hasMoreData) {
      console.log('🚫 No more data available, skipping...')
      return
    }
    
    console.log('✅ Conditions met, calling loadProperties(false)')
    await loadProperties(false)
  }, [loadingMore, hasMoreData, currentPage])

  const loadSavedSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (data && !error) {
        setSavedSearches(data)
      }
    } catch (error) {
      console.error('Error loading saved searches:', error instanceof Error ? error.message : error)
    }
  }

  const loadSearchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('search_query')
        .order('created_at', { ascending: false })
        .limit(10)

      if (data && !error) {
        const uniqueQueries = [...new Set(data.map((item: any) => item.search_query).filter(Boolean))] as string[]
        setSearchHistory(uniqueQueries.slice(0, 5))
      }
    } catch (error) {
      console.error('Error loading search history:', error instanceof Error ? error.message : error)
    }
  }

  const loadSavedProperties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('saved_properties')
        .select('property_id')
        .eq('user_id', user.id)

      if (data && !error) {
        setSavedPropertyIds(new Set(data.map((sp: { property_id: string }) => sp.property_id)))
      }
    } catch (error) {
      console.error('Error loading saved properties:', error instanceof Error ? error.message : error)
    }
  }

  const resetAndLoadProperties = () => {
    setProperties([])
    setCurrentPage(1)
    setHasMoreData(true)
    setPagination(null)
    setSearchResultsTotal(null)
    loadProperties(true)
  }

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) {
      // If search query is empty, reset to show all properties
      setCurrentFilters({})
      setSearchResultsTotal(null)
      resetAndLoadProperties()
      return
    }

    // Map UI sort values to database column names
    const getSortMapping = (sortValue: string): { sortBy: string, sortOrder: 'asc' | 'desc' } => {
      switch (sortValue) {
        case "price-low":
          return { sortBy: 'price', sortOrder: 'asc' }
        case "price-high":
          return { sortBy: 'price', sortOrder: 'desc' }
        case "beds":
          return { sortBy: 'bedrooms', sortOrder: 'desc' }
        case "sqm":
          return { sortBy: 'square_meters', sortOrder: 'desc' }
        case "newest":
          return { sortBy: 'created_at', sortOrder: 'desc' }
        default:
          return { sortBy: 'created_at', sortOrder: 'desc' }
      }
    }

    const { sortBy: dbSortBy, sortOrder: dbSortOrder } = getSortMapping(sortBy)

    // Create simple search filters from current search query and basic filters
    const filters: SearchFilters = {
      searchQuery: searchQuery.trim(),
      priceRange: priceRange,
      propertyTypes: propertyType === "all" ? [] : [propertyType],
      bedrooms: bedrooms === "all" ? [] : [bedrooms],
      bathrooms: [],
      squareFeetRange: [0, 10000],
      cities: [],
      amenities: [],
      features: [],
      maxDistances: {},
      sortBy: dbSortBy,
      sortOrder: dbSortOrder
    }
    
    // Apply the search
    await handleAdvancedSearch(filters)
  }

  const handleAdvancedSearch = async (filters: SearchFilters) => {
    if (isSearching) {
      return
    }
    
    setIsSearching(true)
    setCurrentFilters(filters)
    
    // Sync basic UI filters with advanced filters for consistency
    if (filters.searchQuery) {
      setSearchQuery(filters.searchQuery)
    }
    
    // Update price range if it's different from default
    if (filters.priceRange && (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000000)) {
      setPriceRange(filters.priceRange)
    }
    
    // Update property type if only one is selected
    if (filters.propertyTypes.length === 1) {
      setPropertyType(filters.propertyTypes[0])
    } else if (filters.propertyTypes.length === 0) {
      setPropertyType("all")
    }
    
    // Update bedrooms if only one is selected
    if (filters.bedrooms.length === 1) {
      setBedrooms(filters.bedrooms[0])
    } else if (filters.bedrooms.length === 0) {
      setBedrooms("all")
    }
    
    try {
      // Build API query parameters from filters
      const params = new URLSearchParams()
      
      if (filters.searchQuery) params.append('search_query', filters.searchQuery)
      if (filters.priceRange[0] > 0) params.append('minPrice', filters.priceRange[0].toString())
      if (filters.priceRange[1] < 10000000) params.append('maxPrice', filters.priceRange[1].toString())
      
      filters.propertyTypes.forEach(type => params.append('propertyType', type))
      filters.cities.forEach(city => params.append('city', city))
      if (filters.compound) params.append('compound', filters.compound)
      filters.amenities.forEach(amenity => params.append(amenity, 'true'))
      
      filters.bedrooms.forEach(bedroom => params.append('bedrooms', bedroom))
      filters.bathrooms.forEach(bathroom => params.append('bathrooms', bathroom))
      
      Object.entries(filters.maxDistances).forEach(([key, value]) => {
        if (value) params.append(`maxDistanceTo${key.charAt(0).toUpperCase() + key.slice(1)}`, value.toString())
      })
      
      params.append('sortBy', filters.sortBy)
      params.append('sortOrder', filters.sortOrder)

      console.log('Search URL:', `/api/properties/search?${params.toString()}`)
      console.log('Search filters:', filters)
      
      const response = await fetch(`/api/properties/search?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Search response received:', data.total, 'properties found')
        setProperties(data.properties || [])
        setSearchResultsTotal(data.total || data.properties?.length || 0)
        console.log('📊 Search state updated - total:', data.total)
        
        // Reset pagination for search results
        setCurrentPage(1)
        setHasMoreData(false) // Disable infinite scroll for search results for now
        setPagination(null)
        
        // Log search activity
        await logSearchActivity(filters.searchQuery, filters, data.properties?.length || 0)
      } else {
        console.error('Search failed:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error details:', errorText)
      }
    } catch (error) {
      console.error('Error during advanced search:', error instanceof Error ? error.message : error)
    } finally {
      console.log('🏁 Search completed, setting isSearching to false')
      setIsSearching(false)
    }
  }

  const logSearchActivity = async (query: string, filters: SearchFilters, resultCount: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        await supabase.rpc('log_search_activity', {
          p_user_id: session.user.id,
          p_search_query: query,
          p_filters: filters,
          p_results_count: resultCount
        })
      }
    } catch (error) {
      console.error('Error logging search activity:', error instanceof Error ? error.message : error)
    }
  }

  const saveCurrentSearch = async (name: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) return

      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: session.user.id,
          name,
          search_query: searchQuery,
          filters: currentFilters,
          alert_enabled: false
        })

      if (!error) {
        loadSavedSearches()
      }
    } catch (error) {
      console.error('Error saving search:', error instanceof Error ? error.message : error)
    }
  }

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setSearchQuery(savedSearch.search_query || '')
    setCurrentFilters(savedSearch.filters || {})
    handleAdvancedSearch(savedSearch.filters as SearchFilters)
  }

  const handleLocationSearch = async (lat: number, lng: number, radius: number) => {
    setIsSearching(true)
    
    try {
      const params = new URLSearchParams()
      params.append('latitude', lat.toString())
      params.append('longitude', lng.toString())
      params.append('radius_km', radius.toString())
      
      const response = await fetch(`/api/properties/search?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties || [])
      }
    } catch (error) {
      console.error('Error during location search:', error instanceof Error ? error.message : error)
    } finally {
      setIsSearching(false)
    }
  }

  const handlePropertySelect = (property: Property) => {
    // Just log the selection for analytics, don't navigate
    console.log('Property selected on map:', property.title)
    
    // You could add analytics tracking here
    // trackPropertyView(property.id, 'map-view')
  }

  // Determine which properties to show: search results or filtered local properties
  const displayProperties = (() => {
    console.log('🔍 ========== DISPLAY PROPERTIES DEBUG START ==========')
    console.log('📊 Raw properties from state:', properties.length)
    console.log('🔍 Search state:', { searchResultsTotal, currentFiltersLength: Object.keys(currentFilters).length })
    
    // If we have search results (from API), use those directly
    if (searchResultsTotal !== null || Object.keys(currentFilters).length > 0) {
      console.log('📈 Using search results/filtered properties:', properties.length)
      console.log('🔍 ========== DISPLAY PROPERTIES DEBUG END ==========')
      return properties // These are already filtered by the API
    }
    
    // Check if user has actively set any filters (not just defaults)
    const hasActiveFilters = 
      searchQuery.trim() !== "" || 
      priceRange[0] !== 0 || 
      priceRange[1] !== 10000000 || 
      propertyType !== "all" || 
      bedrooms !== "all" || 
      status !== "all"
    
    // If no active filters, return all properties (don't filter by defaults)
    if (!hasActiveFilters) {
      console.log('📋 No active filters applied - showing all properties:', properties.length)
      console.log('🔍 ========== DISPLAY PROPERTIES DEBUG END ==========')
      return properties
    }
    
    console.log('🔧 Applying local filters to properties')
    console.log('🔧 Filter settings:', { searchQuery, priceRange, propertyType, bedrooms, status })
    
    // Otherwise, filter local properties based on basic UI filters
    const filtered = properties.filter((property) => {
      const matchesSearch =
        !searchQuery.trim() ||
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1]
      const matchesType = propertyType === "all" || property.property_type.toLowerCase() === propertyType.toLowerCase()
      const matchesBeds = bedrooms === "all" || (property.bedrooms?.toString() ?? "") === bedrooms
      const matchesStatus = status === "all" || property.status.toLowerCase() === status.toLowerCase()

      const passes = matchesSearch && matchesPrice && matchesType && matchesBeds && matchesStatus
      
      if (!passes) {
        console.log('❌ Property filtered out:', property.title, {
          matchesSearch, matchesPrice, matchesType, matchesBeds, matchesStatus
        })
      }

      return passes
    })
    
    console.log('✅ Local filtering complete:', filtered.length, 'properties passed filters')
    console.log('🔍 ========== DISPLAY PROPERTIES DEBUG END ==========')
    return filtered
  })()

  // Sort properties
  const sortedProperties = [...displayProperties].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "beds":
        return b.bedrooms - a.bedrooms
      case "sqm":
        return b.square_meters! - a.square_meters!
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return 0
    }
  })

  // Get translated versions of the sorted properties for display
  const sortedTranslatedProperties: Property[] = sortedProperties.map(property => {
    const translated = translatedProperties.find(tp => tp.id === property.id)
    if (translated) {
      // Merge translation data with the original property structure to maintain Property type
      return {
        ...property,
        title: translated.title || property.title,
        description: translated.description || property.description,
        address: translated.address || property.address,
        features: translated.features || property.features,
        amenities: translated.amenities || property.amenities
      }
    }
    return property
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatPropertyType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ErrorBoundary 
      level="page" 
      onError={(error, errorInfo) => {
        console.error('Properties page error:', error, errorInfo);
      }}
    >
      <SearchSEO 
        resultsCount={searchResultsTotal !== null ? searchResultsTotal : (pagination?.total || sortedProperties.length)}
        properties={sortedProperties}
      />
      <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('properties.pageTitle', 'All Properties')}</h1>
          <p className="text-slate-600">{t('properties.pageDescription', 'Discover your perfect home with immersive virtual tours')}</p>
        </div>

        {/* Enhanced Search Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mb-8">
          {/* Enhanced Smart Search Bar */}
          <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
            <div className="flex items-center space-x-4">
              <SmartSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearchSubmit}
                placeholder={t('properties.searchPlaceholder', 'Search by location, property type, or features...')}
              />
            <Button
              onClick={() => setShowAdvancedSearch(true)}
                    variant="outline"
                className="h-12 px-6 border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl transition-all flex items-center space-x-2 shadow-sm"
              >
                <Filter className="h-4 w-4" />
                <span className="font-medium">{t('properties.advancedFilters', 'Advanced Filters')}</span>
                {(Object.keys(currentFilters).length > 0 || searchQuery) && (
                  <div className="w-2 h-2 bg-slate-500 rounded-full ml-1"></div>
                    )}
                  </Button>
              </div>
            </div>


          {/* Compact Filter Section - Clickable Buttons */}
          <div className="p-6 space-y-4">
            {/* Property Type and Sort By Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Property Type Buttons */}
              <div className="lg:col-span-2 space-y-3">
                <label className="text-sm font-semibold text-slate-700 flex items-center">
                  <Home className="h-4 w-4 mr-2 text-slate-500" />
                  {t('properties.propertyType', 'Property Type')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: t('properties.allTypes', 'All'), icon: '🏠' },
                    { value: 'apartment', label: t('properties.apartment', 'Apartment'), icon: '🏢' },
                    { value: 'villa', label: t('properties.villa', 'Villa'), icon: '🏘️' },
                    { value: 'penthouse', label: t('properties.penthouse', 'Penthouse'), icon: '⭐' },
                    { value: 'townhouse', label: t('properties.townhouse', 'Townhouse'), icon: '🏘️' },
                    { value: 'house', label: t('properties.house', 'House'), icon: '🏠' }
                  ].map((type) => (
                    <Button
                      key={type.value}
                      onClick={() => setPropertyType(type.value)}
                      variant={propertyType === type.value ? "default" : "outline"}
                      size="sm"
                      className={`h-9 transition-all ${
                        propertyType === type.value 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="mr-1.5">{type.icon}</span>
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sort By Buttons */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 flex items-center">
                  <SlidersHorizontal className="h-4 w-4 mr-2 text-slate-500" />
                  {t('properties.sortBy', 'Sort By')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'price-low', label: 'Price ↑', icon: '💰' },
                    { value: 'price-high', label: 'Price ↓', icon: '💎' },
                    { value: 'newest', label: t('properties.newest', 'Newest'), icon: '🆕' },
                    { value: 'bedrooms', label: 'Beds', icon: '🛏️' },
                    { value: 'size', label: 'Size', icon: '📐' }
                  ].map((sort) => (
                    <Button
                      key={sort.value}
                      onClick={() => setSortBy(sort.value)}
                      variant={sortBy === sort.value ? "default" : "outline"}
                      size="sm"
                      className={`h-9 transition-all ${
                        sortBy === sort.value 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="mr-1.5">{sort.icon}</span>
                      {sort.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bedrooms Row */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center">
                <Bed className="h-4 w-4 mr-2 text-slate-500" />
                {t('properties.bedrooms', 'Bedrooms')}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: t('properties.any', 'Any') },
                  { value: '1', label: '1+' },
                  { value: '2', label: '2+' },
                  { value: '3', label: '3+' },
                  { value: '4', label: '4+' },
                  { value: '5', label: '5+' }
                ].map((bed) => (
                  <Button
                    key={bed.value}
                    onClick={() => setBedrooms(bed.value)}
                    variant={bedrooms === bed.value ? "default" : "outline"}
                    size="sm"
                    className={`h-9 transition-all ${
                      bedrooms === bed.value 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {bed.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Filters and Price Range Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Filters */}
              <div className="lg:col-span-2 space-y-3">
                <label className="text-sm font-semibold text-slate-700 flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-slate-500" />
                  {t('properties.quickFilters', 'Quick Filters')}
                </label>
                <QuickFilterPills 
                  onFilterSelect={handleAdvancedSearch}
                  activeFilters={currentFilters}
                />
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-slate-500" />
                    {t('properties.priceRange', 'Price Range')}
                  </label>
                  <span className="text-sm font-medium text-slate-600">
                    ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  max={2000000}
                  min={0}
                  step={50000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>$0</span>
                  <span>$2M+</span>
                </div>
              </div>
            </div>

          </div>

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div className="px-6 pb-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Bookmark className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">{t('properties.savedSearches', 'Saved Searches')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedSearches.map((savedSearch) => (
                    <Button
                      key={savedSearch.id}
                      variant="outline"
                      size="sm"
                      onClick={() => loadSavedSearch(savedSearch)}
                      className="h-8 rounded-lg border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      {savedSearch.name}
                      {savedSearch.alert_enabled && (
                        <Badge variant="secondary" className="ml-2 text-xs h-4 px-1.5">
                          🔔
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(Object.keys(currentFilters).length > 0 || searchQuery) && (
            <div className="px-6 pb-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-blue-900">{t('properties.activeFilters', 'Active Filters')}</span>
                    </div>
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                        <Badge variant="secondary" className="bg-white border-blue-200 text-blue-800 hover:bg-blue-50">
                        {t('common.search', 'Search')}: {searchQuery}
                      </Badge>
                    )}
                    {currentFilters.propertyTypes?.map(type => (
                        <Badge key={type} variant="secondary" className="bg-white border-blue-200 text-blue-800 hover:bg-blue-50">
                        {t('properties.propertyType', 'Type')}: {type}
                      </Badge>
                    ))}
                    {currentFilters.cities?.map(city => (
                        <Badge key={city} variant="secondary" className="bg-white border-blue-200 text-blue-800 hover:bg-blue-50">
                        {t('common.filterBy', 'City')}: {city}
                      </Badge>
                    ))}
                    {currentFilters.compound && (
                        <Badge variant="secondary" className="bg-white border-blue-200 text-blue-800 hover:bg-blue-50">
                        {t('search.compound', 'Compound')}: {currentFilters.compound}
                      </Badge>
                    )}
                    {currentFilters.bedrooms?.map(bedroom => (
                        <Badge key={bedroom} variant="secondary" className="bg-white border-blue-200 text-blue-800 hover:bg-blue-50">
                        {t('search.bedrooms', 'Bedrooms')}: {bedroom}
                      </Badge>
                    ))}
                    {currentFilters.amenities?.map(amenity => (
                        <Badge key={amenity} variant="secondary" className="bg-white border-blue-200 text-blue-800 hover:bg-blue-50">
                        {t('search.amenitiesFeatures', 'Amenity')}: {amenity.replace('_', ' ')}
                      </Badge>
                    ))}
                    {(currentFilters.priceRange && (currentFilters.priceRange[0] > 0 || currentFilters.priceRange[1] < 10000000)) && (
                        <Badge variant="secondary" className="bg-white border-blue-200 text-blue-800 hover:bg-blue-50">
                        {t('search.totalPriceRange', 'Price')}: ${currentFilters.priceRange[0].toLocaleString()} - ${currentFilters.priceRange[1].toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentFilters({})
                    setSearchQuery('')
                    setSearchResultsTotal(null)
                    // Reset basic UI filters to default
                    setPropertyType("all")
                    setBedrooms("all")
                    setStatus("all")
                    setPriceRange([0, 500000])
                    resetAndLoadProperties()
                  }}
                    className="text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-lg"
                >
                  {t('properties.clearAll', 'Clear All')}
                </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-slate-600">
              {isSearching ? (
                t('properties.searching', 'Searching...')
              ) : searchResultsTotal !== null ? (
                t('properties.showingResults', 'Showing {{count}} of {{total}} properties', { 
                  count: sortedProperties.length, 
                  total: searchResultsTotal 
                })
              ) : pagination ? (
                t('properties.showingResults', 'Showing {{count}} of {{total}} properties', { 
                  count: sortedProperties.length, 
                  total: pagination.total 
                })
              ) : (
                t('properties.showingProperties', 'Showing {{count}} properties', { 
                  count: sortedProperties.length 
                })
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Save Search Button */}
            {(searchQuery || Object.keys(currentFilters).length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const name = prompt(t('properties.enterSearchName', 'Enter a name for this search:'))
                  if (name) saveCurrentSearch(name)
                }}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                {t('properties.saveSearch', 'Save Search')}
              </Button>
            )}
            
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              aria-label={t('properties.gridView', 'Grid view')}
              aria-pressed={viewMode === "grid"}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              aria-label={t('properties.listView', 'List view')}
              aria-pressed={viewMode === "list"}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("map")}
              aria-label={t('properties.mapView', 'Map view')}
              aria-pressed={viewMode === "map"}
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Properties Grid/List */}
        {viewMode === "grid" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTranslatedProperties.map((property) => (
                <Link key={property.id} href={`/property/${property.id}`} className="block">
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <div className="relative">
                      <OptimizedImage
                        src={property.property_photos?.[0]?.url || "/placeholder.svg"}
                        alt={property.title}
                        width={400}
                        height={240}
                        className="w-full h-48 group-hover:scale-105 transition-transform duration-300"
                        priority={false}
                        lazy={true}
                        trackPerformance={true}
                        category="property-grid"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className={property.status === "active" ? "bg-green-600" : 
                                        property.status === "pending" ? "bg-yellow-600" : 
                                        property.status === "sold" ? "bg-blue-600" : "bg-gray-600"}>
                          {formatPropertyType(property.status)}
                        </Badge>
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="cursor-pointer hover:bg-slate-300 transition-colors">
                          {t('properties.virtualTour', 'Virtual Tour')}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">{property.title}</h3>
                      <div className="flex items-center text-slate-600 mb-3">
                        <MapPin className="h-4 w-4 mr-2" />
                        {property.address}, {property.city}, {property.state}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          {property.bedrooms} {t('common.bed', 'bed')}
                        </div>
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1" />
                          {property.bathrooms} {t('common.bath', 'bath')}
                        </div>
                        {property.square_meters && (
                          <div className="flex items-center">
                            <Square className="h-4 w-4 mr-1" />
                            {property.square_meters} {t('common.sqm', 'sqm')}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {property.features?.slice(0, 2).map((feature) => (
                          <button
                            key={feature}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSearchQuery(feature)
                            }}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-full transition-colors cursor-pointer"
                            aria-label={`Filter by ${feature}`}
                          >
                            {feature}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-slate-800">{formatPrice(property.price)}</span>
                        <Button className="group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {t('properties.viewDetails', 'View Details')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            
            {/* Infinite Scroll Loading Indicator */}
            {hasMoreData && !isSearching && sortedProperties.length > 0 && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {loadingMore ? (
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>{t('properties.loadingMoreProperties', 'Loading more properties...')}</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">
                    {t('properties.scrollToLoadMore', 'Scroll down to load more properties')}
                  </div>
                )}
              </div>
            )}
            
            {/* Pagination Info */}
            {pagination && !isSearching && (
              <div className="text-center py-4 text-sm text-slate-600">
                {t('properties.showingOf', 'Showing {{current}} of {{total}} properties', { current: properties.length, total: pagination.total })}
                {!hasMoreData && pagination.total > 0 && (
                  <span className="block mt-1 text-slate-500">{t('properties.reachedEnd', "You've reached the end!")}</span>
                )}
              </div>
            )}
          </>
        ) : viewMode === "list" ? (
          <>
            <div className="space-y-6">
              {sortedTranslatedProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3">
                        <OptimizedImage
                          src={property.property_photos?.[0]?.url || "/placeholder.svg"}
                          alt={property.title}
                          width={400}
                          height={300}
                          className="w-full h-48 md:h-full"
                          priority={false}
                          lazy={true}
                          trackPerformance={true}
                          category="property-list"
                        />
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-800 mb-2">{property.title}</h3>
                            <div className="flex items-center text-slate-600 mb-3">
                              <MapPin className="h-4 w-4 mr-2" />
                              {property.address}, {property.city}, {property.state}
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-slate-800">{formatPrice(property.price)}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-600 mb-4">
                          <div className="flex items-center">
                            <Bed className="h-4 w-4 mr-1" />
                            {property.bedrooms} {t('properties.beds', 'beds')}
                          </div>
                          <div className="flex items-center">
                            <Bath className="h-4 w-4 mr-1" />
                            {property.bathrooms} {t('properties.baths', 'baths')}
                          </div>
                          {property.square_meters && (
                            <div className="flex items-center">
                              <Square className="h-4 w-4 mr-1" />
                              {property.square_meters} {t('common.sqm', 'sqm')}
                            </div>
                          )}
                          <div className="text-slate-500">
                            {formatPropertyType(property.property_type)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {property.features?.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <Link href={`/property/${property.id}`}>
                            <Button>{t('properties.viewDetails', 'View Details')}</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Infinite Scroll Loading Indicator for List View */}
            {hasMoreData && !isSearching && sortedProperties.length > 0 && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {loadingMore ? (
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>{t('properties.loadingMoreProperties', 'Loading more properties...')}</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">
                    {t('properties.scrollToLoadMore', 'Scroll down to load more properties')}
                  </div>
                )}
              </div>
            )}
            
            {/* Pagination Info for List View */}
            {pagination && !isSearching && (
              <div className="text-center py-4 text-sm text-slate-600">
                {t('properties.showingOf', 'Showing {{current}} of {{total}} properties', { current: properties.length, total: pagination.total })}
                {!hasMoreData && pagination.total > 0 && (
                  <span className="block mt-1 text-slate-500">{t('properties.reachedEnd', "You've reached the end!")}</span>
                )}
              </div>
            )}
          </>
        ) : (
          <GoogleMapView 
            properties={sortedTranslatedProperties} 
            onPropertySelect={handlePropertySelect}
            onLocationSearch={handleLocationSearch}
            height="600px"
          />
        )}

        {/* No Results */}
        {sortedProperties.length === 0 && !isSearching && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">{t('properties.noPropertiesFound', 'No properties found')}</h3>
            <p className="text-slate-600 mb-4">{t('properties.noPropertiesDescription', 'Try adjusting your search criteria or filters')}</p>
            <Button
              onClick={() => {
                setSearchQuery("")
                setPropertyType("all")
                setBedrooms("all")
                setStatus("all")
                setPriceRange([0, 500000])
                setCurrentFilters({})
                setSearchResultsTotal(null)
                resetAndLoadProperties()
              }}
            >
              {t('properties.clearFilters', 'Clear Filters')}
            </Button>
          </div>
        )}
      </div>

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearch={handleAdvancedSearch}
        initialFilters={currentFilters}
      />

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4"
          onClick={scrollToTop}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}
      </div>
    </ErrorBoundary>
  )
}
