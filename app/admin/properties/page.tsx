'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Building2,
  DollarSign,
  MapPin,
  Calendar,
  MoreVertical,
  Home,
  TrendingUp,
  Camera,
  SlidersHorizontal,
  X
} from 'lucide-react'
import { isCurrentUserAdmin, logAdminActivity } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

interface Property {
  id: string
  title: string
  marketing_headline?: string
  address: string
  city: string
  state: string
  price: number
  bedrooms: number
  bathrooms: number
  square_meters: number | null
  property_type: string
  property_condition?: string
  status: string
  view_count: number
  created_at: string
  updated_at: string
  lot_size?: number
  year_built?: number
  monthly_hoa_fee?: number
  annual_property_tax?: number
  neighborhood?: string
  compound?: string
  furnished?: boolean
  has_pool?: boolean
  has_garden?: boolean
  has_security?: boolean
  has_parking?: boolean
  has_gym?: boolean
  has_elevator?: boolean
  property_photos: Array<{
    id: string
    url: string
    is_primary: boolean
  }>
}

interface AdminFilters {
  searchTerm: string
  priceRange: [number, number]
  propertyTypes: string[]
  statuses: string[]
  conditions: string[]
  cities: string[]
  bedroomRange: [number, number]
  squareFeetRange: [number, number]
  yearBuiltRange: [number, number]
  amenities: string[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showBasicFilters, setShowBasicFilters] = useState(false)

  // Filter states
  const [filters, setFilters] = useState<AdminFilters>({
    searchTerm: '',
    priceRange: [0, 10000000],
    propertyTypes: [],
    statuses: [],
    conditions: [],
    cities: [],
    bedroomRange: [0, 10],
    squareFeetRange: [0, 10000],
    yearBuiltRange: [1900, new Date().getFullYear()],
    amenities: [],
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  // Legacy filter states for backward compatibility
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Filter options
  const propertyTypeOptions = [
    'apartment', 'villa', 'penthouse', 'townhouse', 'house', 'studio', 'duplex', 'commercial', 'office'
  ]

  const statusOptions = [
    'available', 'pending', 'sold', 'for_rent', 'for_sale', 'inactive'
  ]

  const conditionOptions = [
    'excellent', 'very_good', 'good', 'fair', 'needs_work'
  ]

  const amenityOptions = [
    'furnished', 'has_pool', 'has_garden', 'has_security', 'has_parking', 'has_gym', 'has_elevator'
  ]

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      const isAdmin = await isCurrentUserAdmin()
      if (!isAdmin) {
        window.location.href = '/unauthorized'
        return
      }
      
      await loadProperties()
    }

    checkAdminAndLoad()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, properties, searchTerm, statusFilter, typeFilter])

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_photos (
            id,
            url,
            is_primary
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading properties:', error)
        return
      }

      setProperties(data || [])
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...properties]

    // Legacy search filter
    const searchQuery = filters.searchTerm || searchTerm
    if (searchQuery) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.marketing_headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.neighborhood?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.compound?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Price range filter
    filtered = filtered.filter(property => 
      property.price >= filters.priceRange[0] && property.price <= filters.priceRange[1]
    )

    // Property types filter
    if (filters.propertyTypes.length > 0) {
      filtered = filtered.filter(property => 
        filters.propertyTypes.includes(property.property_type)
      )
    } else if (typeFilter !== 'all') {
      filtered = filtered.filter(property => property.property_type === typeFilter)
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(property => 
        filters.statuses.includes(property.status)
      )
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter)
    }

    // Condition filter
    if (filters.conditions.length > 0) {
      filtered = filtered.filter(property => 
        property.property_condition && filters.conditions.includes(property.property_condition)
      )
    }

    // Cities filter
    if (filters.cities.length > 0) {
      filtered = filtered.filter(property => 
        filters.cities.some(city => 
          property.city.toLowerCase().includes(city.toLowerCase()) ||
          property.neighborhood?.toLowerCase().includes(city.toLowerCase())
        )
      )
    }

    // Bedroom range filter
    filtered = filtered.filter(property => 
      property.bedrooms >= filters.bedroomRange[0] && property.bedrooms <= filters.bedroomRange[1]
    )

    // Square feet range filter
    filtered = filtered.filter(property => 
      (property.square_meters || 0) >= filters.squareFeetRange[0] && (property.square_meters || 0) <= filters.squareFeetRange[1]
    )

    // Year built range filter
    if (filters.yearBuiltRange[0] > 1900 || filters.yearBuiltRange[1] < new Date().getFullYear()) {
      filtered = filtered.filter(property => {
        const yearBuilt = property.year_built || new Date(property.created_at).getFullYear()
        return yearBuilt >= filters.yearBuiltRange[0] && yearBuilt <= filters.yearBuiltRange[1]
      })
    }

    // Amenities filter
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(property => 
        filters.amenities.every(amenity => {
          switch (amenity) {
            case 'furnished': return property.furnished
            case 'has_pool': return property.has_pool
            case 'has_garden': return property.has_garden
            case 'has_security': return property.has_security
            case 'has_parking': return property.has_parking
            case 'has_gym': return property.has_gym
            case 'has_elevator': return property.has_elevator
            default: return false
          }
        })
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filters.sortBy) {
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'bedrooms':
          aValue = a.bedrooms
          bValue = b.bedrooms
          break
        case 'square_meters':
          aValue = a.square_meters
          bValue = b.square_meters
          break
        case 'view_count':
          aValue = a.view_count || 0
          bValue = b.view_count || 0
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'created_at':
        default:
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredProperties(filtered)
  }

  const handleArrayToggle = (array: string[], value: string, field: keyof AdminFilters) => {
    const newArray = array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value]
    
    setFilters(prev => ({ ...prev, [field]: newArray }))
  }

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      priceRange: [0, 10000000],
      propertyTypes: [],
      statuses: [],
      conditions: [],
      cities: [],
      bedroomRange: [0, 10],
      squareFeetRange: [0, 10000],
      yearBuiltRange: [1900, new Date().getFullYear()],
      amenities: [],
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
    setSearchTerm('')
    setStatusFilter('all')
    setTypeFilter('all')
  }

  const getActiveFilterCount = () => {
    return [
      filters.searchTerm ? 1 : 0,
      searchTerm ? 1 : 0,
      filters.propertyTypes.length,
      filters.statuses.length,
      filters.conditions.length,
      filters.cities.length,
      filters.amenities.length,
      statusFilter !== 'all' ? 1 : 0,
      typeFilter !== 'all' ? 1 : 0,
      filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000 ? 1 : 0,
      filters.bedroomRange[0] > 0 || filters.bedroomRange[1] < 10 ? 1 : 0,
      filters.squareFeetRange[0] > 0 || filters.squareFeetRange[1] < 10000 ? 1 : 0,
      filters.yearBuiltRange[0] > 1900 || filters.yearBuiltRange[1] < new Date().getFullYear() ? 1 : 0
    ].reduce((sum, count) => sum + count, 0)
  }

  // Keep legacy filter functions for backward compatibility
  const filterProperties = applyFilters

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      const property = properties.find(p => p.id === propertyId)
      
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProperties(prev => prev.filter(p => p.id !== propertyId))
        setDeleteConfirm(null)
        
        // Log admin activity will be handled by the API endpoint
      } else {
        const error = await response.json()
        console.error('Error deleting property:', error)
        alert('Failed to delete property: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      alert('Failed to delete property')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      sold: 'bg-blue-100 text-blue-800',
      inactive: 'bg-gray-100 text-gray-800'
    }
    
    return statusStyles[status as keyof typeof statusStyles] || statusStyles.inactive
  }

  const getTypeBadge = (type: string) => {
    const typeStyles = {
      apartment: 'bg-purple-100 text-purple-800',
      villa: 'bg-indigo-100 text-indigo-800',
      penthouse: 'bg-pink-100 text-pink-800',
      townhouse: 'bg-orange-100 text-orange-800'
    }
    
    return typeStyles[type as keyof typeof typeStyles] || 'bg-gray-100 text-gray-800'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties Management</h1>
          <p className="text-gray-600">Manage and monitor all properties in the system</p>
        </div>
        <Link
          href="/admin/properties/new"
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Properties</p>
              <p className="text-2xl font-bold text-gray-900">
                {properties.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Price</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(properties.reduce((sum, p) => sum + p.price, 0) / properties.length || 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {properties.reduce((sum, p) => sum + (p.view_count || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Main Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
              type="text"
                placeholder="Search properties, headlines, locations..."
                value={filters.searchTerm || searchTerm}
                onChange={(e) => {
                  const value = e.target.value
                  setFilters(prev => ({ ...prev, searchTerm: value }))
                  setSearchTerm(value)
                }}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle Buttons */}
            <Button
              variant="outline"
              onClick={() => setShowBasicFilters(!showBasicFilters)}
              className="flex items-center space-x-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Basic Filters</span>
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>

            <Button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Filter className="h-4 w-4" />
              <span>Advanced Filters</span>
            </Button>

            {getActiveFilterCount() > 0 && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                <span>Clear All</span>
              </Button>
            )}
          </div>

          {/* Basic Filters */}
          {showBasicFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pt-6 border-t border-gray-200">
              {/* Legacy Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="for_rent">For Rent</SelectItem>
                    <SelectItem value="for_sale">For Sale</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Legacy Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="bedrooms">Bedrooms</SelectItem>
                    <SelectItem value="square_meters">Size</SelectItem>
                    <SelectItem value="view_count">Views</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                <Select 
                  value={filters.sortOrder} 
                  onValueChange={(value: 'asc' | 'desc') => setFilters(prev => ({ ...prev, sortOrder: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="pt-6 border-t border-gray-200 space-y-6">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Price Range: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                </label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                  max={10000000}
                  min={0}
                  step={50000}
                  className="w-full"
                />
              </div>

              {/* Bedroom Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bedrooms: {filters.bedroomRange[0]} - {filters.bedroomRange[1]}
                </label>
                <Slider
                  value={filters.bedroomRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, bedroomRange: value as [number, number] }))}
                  max={10}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Square Feet Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Square Feet: {filters.squareFeetRange[0].toLocaleString()} - {filters.squareFeetRange[1].toLocaleString()}
                </label>
                <Slider
                  value={filters.squareFeetRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, squareFeetRange: value as [number, number] }))}
                  max={10000}
                  min={0}
                  step={100}
                  className="w-full"
                />
              </div>

              {/* Year Built Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Year Built: {filters.yearBuiltRange[0]} - {filters.yearBuiltRange[1]}
                </label>
                <Slider
                  value={filters.yearBuiltRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, yearBuiltRange: value as [number, number] }))}
                  max={new Date().getFullYear()}
                  min={1900}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Property Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Property Types</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {propertyTypeOptions.map((type) => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={filters.propertyTypes.includes(type)}
                        onCheckedChange={() => handleArrayToggle(filters.propertyTypes, type, 'propertyTypes')}
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Property Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Property Conditions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {conditionOptions.map((condition) => (
                    <label key={condition} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={filters.conditions.includes(condition)}
                        onCheckedChange={() => handleArrayToggle(filters.conditions, condition, 'conditions')}
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {condition.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Filter (Advanced) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Status Filter</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {statusOptions.map((status) => (
                    <label key={status} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={filters.statuses.includes(status)}
                        onCheckedChange={() => handleArrayToggle(filters.statuses, status, 'statuses')}
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {amenityOptions.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={filters.amenities.includes(amenity)}
                        onCheckedChange={() => handleArrayToggle(filters.amenities, amenity, 'amenities')}
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {amenity.replace('has_', '').replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cities Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Cities/Areas</label>
                <Input
                  placeholder="Add city or area to filter..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim()
                      if (value && !filters.cities.includes(value)) {
                        setFilters(prev => ({ 
                          ...prev, 
                          cities: [...prev.cities, value] 
                        }))
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                  className="mb-2"
                />
                {filters.cities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.cities.map((city, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{city}</span>
                        <button
                          onClick={() => handleArrayToggle(filters.cities, city, 'cities')}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {getActiveFilterCount() > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <strong>{filteredProperties.length}</strong> properties found with <strong>{getActiveFilterCount()}</strong> active filters
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Reset All Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No properties found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                    Property Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                    Price & Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Status & Views
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {property.property_photos?.[0]?.url ? (
                            <img
                              src={property.property_photos[0].url}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1 leading-tight">
                            {property.title}
                          </p>
                          {property.marketing_headline && (
                            <p className="text-xs text-blue-600 font-medium mb-2 leading-tight">
                              {property.marketing_headline}
                            </p>
                          )}
                          <div className="text-sm text-gray-600 mb-2">
                            <div className="flex items-center text-gray-500 mb-1">
                              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{property.address}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {property.city}, {property.state}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(property.property_type)}`}>
                              {property.property_type}
                            </span>
                            {property.property_condition && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                property.property_condition === 'excellent' ? 'bg-green-100 text-green-800' :
                                property.property_condition === 'very_good' ? 'bg-blue-100 text-blue-800' :
                                property.property_condition === 'good' ? 'bg-yellow-100 text-yellow-800' :
                                property.property_condition === 'fair' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {property.property_condition.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {formatPrice(property.price)}
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>{property.bedrooms} bed • {property.bathrooms} bath</div>
                        <div>{property.square_meters?.toLocaleString()} sqm</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(property.status)}`}>
                          {property.status}
                        </span>
                        <div className="text-xs text-gray-500">
                          <div className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {property.view_count || 0} views
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{formatDate(property.created_at)}</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Link
                          href={`/property/${property.id}`}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                          title="View Property"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/properties/${property.id}/images`}
                          className="text-purple-600 hover:text-purple-800 p-1.5 rounded-md hover:bg-purple-50 transition-colors"
                          title="Manage Images"
                        >
                          <Camera className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/properties/${property.id}/edit`}
                          className="text-green-600 hover:text-green-800 p-1.5 rounded-md hover:bg-green-50 transition-colors"
                          title="Edit Property"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(property.id)}
                          className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete Property"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Property</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this property? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProperty(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 