'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Home, 
  Bath, 
  Bed,
  Square,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Camera,
  MapPinIcon,
  Wrench,
  Zap,
  Droplets,
  Wifi,
  Car,
  Trees,
  Shield,
  Dumbbell,
  Users,
  PlayCircle,
  Calendar,
  PawPrint,
  Settings,
  FileText,
  Globe
} from 'lucide-react'
import { logAdminActivity } from '@/lib/auth/admin-client'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

interface PropertyFormData {
  id: string
  // Basic Information
  title: string
  description: string
  marketing_headline: string
  property_type: string
  status: string
  property_condition: string
  
  // Location
  address: string
  city: string
  state: string
  zip_code: string
  neighborhood: string
  compound: string
  latitude: number | null
  longitude: number | null
  
  // Property Details
  price: number
  bedrooms: number
  bathrooms: number
  square_meters: number
  lot_size: number
  year_built: number
  floor_level: number | null
  total_floors: number | null
  balconies: number
  parking_spaces: number
  
  // Financial
  monthly_hoa_fee: number
  annual_property_tax: number
  insurance_cost: number
  
  // Distances (km)
  distance_to_metro: number | null
  distance_to_airport: number | null
  distance_to_mall: number | null
  distance_to_hospital: number | null
  
  // Infrastructure
  heating_type: string
  cooling_type: string
  water_source: string
  sewer_type: string
  internet_speed: string
  
  // Availability
  available_date: string
  lease_terms: string[]
  pet_policy: string
  
  // Media
  virtual_tour_url: string
  video_tour_url: string
  
  // Features and Amenities (arrays)
  features: string[]
  amenities: string[]
  key_features: string[]
  
  // Amenity Booleans
  furnished: boolean
  has_pool: boolean
  has_garden: boolean
  has_security: boolean
  has_parking: boolean
  has_gym: boolean
  has_playground: boolean
  has_community_center: boolean
  has_elevator: boolean
  has_balcony: boolean
  has_terrace: boolean
  has_storage: boolean
  has_maid_room: boolean
  has_driver_room: boolean
  
  // SEO
  seo_title: string
  seo_description: string
  
  // Admin
  internal_notes: string
}

export default function EditProperty() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState<PropertyFormData>({
    id: '',
    title: '',
    description: '',
    marketing_headline: '',
    property_type: 'apartment',
    status: 'available',
    property_condition: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    neighborhood: '',
    compound: '',
    latitude: null,
    longitude: null,
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    square_meters: 0,
    lot_size: 0,
    year_built: new Date().getFullYear(),
    floor_level: null,
    total_floors: null,
    balconies: 0,
    parking_spaces: 0,
    monthly_hoa_fee: 0,
    annual_property_tax: 0,
    insurance_cost: 0,
    distance_to_metro: null,
    distance_to_airport: null,
    distance_to_mall: null,
    distance_to_hospital: null,
    heating_type: '',
    cooling_type: '',
    water_source: '',
    sewer_type: '',
    internet_speed: '',
    available_date: '',
    lease_terms: [],
    pet_policy: '',
    virtual_tour_url: '',
    video_tour_url: '',
    features: [],
    amenities: [],
    key_features: [],
    furnished: false,
    has_pool: false,
    has_garden: false,
    has_security: false,
    has_parking: false,
    has_gym: false,
    has_playground: false,
    has_community_center: false,
    has_elevator: false,
    has_balcony: false,
    has_terrace: false,
    has_storage: false,
    has_maid_room: false,
    has_driver_room: false,
    seo_title: '',
    seo_description: '',
    internal_notes: ''
  })

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'condo', label: 'Condominium' },
    { value: 'house', label: 'House' },
    { value: 'studio', label: 'Studio' },
    { value: 'commercial', label: 'Commercial' }
  ]

  const propertyStatuses = [
    { value: 'available', label: 'Available (Public)' },
    { value: 'for_rent', label: 'For Rent (Public)' },
    { value: 'for_sale', label: 'For Sale (Public)' },
    { value: 'appraised_pending_review', label: 'Appraised - Pending Review (Hidden)' },
    { value: 'awaiting_photos', label: 'Awaiting Photos (Hidden)' },
    { value: 'pending_approval', label: 'Pending Approval (Hidden)' },
    { value: 'inactive', label: 'Inactive (Hidden)' },
    { value: 'pending', label: 'Pending (Hidden)' },
    { value: 'sold', label: 'Sold (Hidden)' }
  ]

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'very_good', label: 'Very Good' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'needs_work', label: 'Needs Work' }
  ]

  const petPolicyOptions = [
    { value: 'allowed', label: 'Pets Allowed' },
    { value: 'cats_only', label: 'Cats Only' },
    { value: 'dogs_only', label: 'Dogs Only' },
    { value: 'not_allowed', label: 'No Pets' },
    { value: 'deposit_required', label: 'Pets with Deposit' }
  ]

  const availableFeatures = [
    'Parking', 'Balcony', 'Garden', 'Terrace', 'Storage', 'Elevator',
    'Fireplace', 'Walk-in Closet', 'Central Air', 'Hardwood Floors',
    'Stainless Steel Appliances', 'Granite Countertops', 'High Ceilings',
    'Built-in Wardrobes', 'Marble Floors', 'Smart Home Systems',
    'Private Pool', 'Jacuzzi', 'Maid\'s Room', 'Driver\'s Room',
    'Study Room', 'Guest Room', 'Laundry Room', 'Pantry'
  ]

  const availableAmenities = [
    'Swimming Pool', 'Gym', 'Concierge', 'Security', 'Spa', 'Roof Deck',
    'Business Center', 'Pet Friendly', 'Laundry Facility', 'Parking Garage',
    'Tennis Court', 'Playground', 'BBQ Area', 'Golf Course', 'Marina',
    'Beach Access', 'Clubhouse', 'Shopping Center', 'Restaurant'
  ]

  const keyFeatureOptions = [
    'Prime Location', 'Luxury Finishes', 'Move-in Ready', 'Investment Opportunity',
    'Family Friendly', 'Pet Friendly', 'Recently Renovated', 'Corner Unit',
    'High Floor', 'City Views', 'Water Views', 'Garden Views'
  ]

  const leaseTermOptions = [
    '6 months', '1 year', '2 years', '3 years', 'Flexible', 'Short term'
  ]

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Building2 },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'details', label: 'Details', icon: Home },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'infrastructure', label: 'Infrastructure', icon: Wrench },
    { id: 'amenities', label: 'Amenities', icon: Users },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'media', label: 'Media', icon: PlayCircle },
    { id: 'seo', label: 'SEO & Admin', icon: Settings }
  ]

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoadingData(true)
        setError(null)
        
        console.log('Loading property:', propertyId)
        
        const response = await fetch(`/api/properties/${propertyId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to load property: ${response.status}`)
        }
        
        const data = await response.json()
        const property = data.property || data
        
        console.log('Loaded property data:', property)
        
        setFormData({
          id: property.id || propertyId,
          title: property.title || '',
          description: property.description || '',
          marketing_headline: property.marketing_headline || '',
          property_type: property.property_type || 'apartment',
          status: property.status || 'available',
          property_condition: property.property_condition || '',
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          zip_code: property.zip_code || '',
          neighborhood: property.neighborhood || '',
          compound: property.compound || '',
          latitude: property.latitude || null,
          longitude: property.longitude || null,
          price: property.price || 0,
          bedrooms: property.bedrooms || 1,
          bathrooms: property.bathrooms || 1,
          square_meters: property.square_meters || 0,
          lot_size: property.lot_size || 0,
          year_built: property.year_built || new Date().getFullYear(),
          floor_level: property.floor_level || null,
          total_floors: property.total_floors || null,
          balconies: property.balconies || 0,
          parking_spaces: property.parking_spaces || 0,
          monthly_hoa_fee: property.monthly_hoa_fee || 0,
          annual_property_tax: property.annual_property_tax || 0,
          insurance_cost: property.insurance_cost || 0,
          distance_to_metro: property.distance_to_metro || null,
          distance_to_airport: property.distance_to_airport || null,
          distance_to_mall: property.distance_to_mall || null,
          distance_to_hospital: property.distance_to_hospital || null,
          heating_type: property.heating_type || '',
          cooling_type: property.cooling_type || '',
          water_source: property.water_source || '',
          sewer_type: property.sewer_type || '',
          internet_speed: property.internet_speed || '',
          available_date: property.available_date || '',
          lease_terms: Array.isArray(property.lease_terms) ? property.lease_terms : [],
          pet_policy: property.pet_policy || '',
          virtual_tour_url: property.virtual_tour_url || '',
          video_tour_url: property.video_tour_url || '',
          features: Array.isArray(property.features) ? property.features : [],
          amenities: Array.isArray(property.amenities) ? property.amenities : [],
          key_features: Array.isArray(property.key_features) ? property.key_features : [],
          furnished: property.furnished || false,
          has_pool: property.has_pool || false,
          has_garden: property.has_garden || false,
          has_security: property.has_security || false,
          has_parking: property.has_parking || false,
          has_gym: property.has_gym || false,
          has_playground: property.has_playground || false,
          has_community_center: property.has_community_center || false,
          has_elevator: property.has_elevator || false,
          has_balcony: property.has_balcony || false,
          has_terrace: property.has_terrace || false,
          has_storage: property.has_storage || false,
          has_maid_room: property.has_maid_room || false,
          has_driver_room: property.has_driver_room || false,
          seo_title: property.seo_title || '',
          seo_description: property.seo_description || '',
          internal_notes: property.internal_notes || ''
        })
        
      } catch (error) {
        console.error('Error loading property:', error)
        setError(error instanceof Error ? error.message : 'Failed to load property')
        setTimeout(() => router.push('/admin/properties'), 3000)
      } finally {
        setLoadingData(false)
      }
    }

    if (propertyId) {
      loadProperty()
    }
  }, [propertyId, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
    
    // Clear any previous errors
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleArrayChange = (arrayName: 'features' | 'amenities' | 'key_features' | 'lease_terms', value: string) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].includes(value)
        ? prev[arrayName].filter(item => item !== value)
        : [...prev[arrayName], value]
    }))
  }

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Property title is required'
    if (!formData.address.trim()) return 'Address is required'
    if (!formData.city.trim()) return 'City is required'
    if (!formData.state.trim()) return 'State is required'
    if (formData.price <= 0) return 'Price must be greater than 0'
    if (formData.bedrooms < 0) return 'Bedrooms cannot be negative'
    if (formData.bathrooms < 0) return 'Bathrooms cannot be negative'
    if (formData.square_meters < 0) return 'Square meters cannot be negative'
    if (formData.year_built < 1800 || formData.year_built > new Date().getFullYear() + 5) {
      return 'Year built must be between 1800 and ' + (new Date().getFullYear() + 5)
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('Submitting property update:', formData)
      
      // Sanitize data before sending to API
      const sanitizedData = {
        ...formData,
        // Convert empty strings to null for date fields
        available_date: formData.available_date === '' ? null : formData.available_date,
        // Convert empty strings to null for nullable number fields
        latitude: formData.latitude === null || formData.latitude === 0 ? null : formData.latitude,
        longitude: formData.longitude === null || formData.longitude === 0 ? null : formData.longitude,
        floor_level: formData.floor_level === null || formData.floor_level === 0 ? null : formData.floor_level,
        total_floors: formData.total_floors === null || formData.total_floors === 0 ? null : formData.total_floors,
        distance_to_metro: formData.distance_to_metro === null || formData.distance_to_metro === 0 ? null : formData.distance_to_metro,
        distance_to_airport: formData.distance_to_airport === null || formData.distance_to_airport === 0 ? null : formData.distance_to_airport,
        distance_to_mall: formData.distance_to_mall === null || formData.distance_to_mall === 0 ? null : formData.distance_to_mall,
        distance_to_hospital: formData.distance_to_hospital === null || formData.distance_to_hospital === 0 ? null : formData.distance_to_hospital,
        // Convert empty strings to null for optional string fields
        marketing_headline: formData.marketing_headline === '' ? null : formData.marketing_headline,
        neighborhood: formData.neighborhood === '' ? null : formData.neighborhood,
        compound: formData.compound === '' ? null : formData.compound,
        heating_type: formData.heating_type === '' ? null : formData.heating_type,
        cooling_type: formData.cooling_type === '' ? null : formData.cooling_type,
        water_source: formData.water_source === '' ? null : formData.water_source,
        sewer_type: formData.sewer_type === '' ? null : formData.sewer_type,
        internet_speed: formData.internet_speed === '' ? null : formData.internet_speed,
        pet_policy: formData.pet_policy === '' ? null : formData.pet_policy,
        virtual_tour_url: formData.virtual_tour_url === '' ? null : formData.virtual_tour_url,
        video_tour_url: formData.video_tour_url === '' ? null : formData.video_tour_url,
        seo_title: formData.seo_title === '' ? null : formData.seo_title,
        seo_description: formData.seo_description === '' ? null : formData.seo_description,
        internal_notes: formData.internal_notes === '' ? null : formData.internal_notes,
        updated_at: new Date().toISOString()
      }
      
      console.log('Sanitized data for API:', sanitizedData)
      
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const updatedProperty = await response.json()
      console.log('Property updated successfully:', updatedProperty)
      
      await logAdminActivity(
        'property_update',
        'property',
        updatedProperty.id,
        { title: updatedProperty.title, changes: 'Property updated via admin panel' }
      )

      setSuccess('Property updated successfully!')
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push('/admin/properties')
      }, 2000)
      
    } catch (error) {
      console.error('Error updating property:', error)
      setError(error instanceof Error ? error.message : 'Failed to update property')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property data...</p>
        </div>
      </div>
    )
  }

  if (error && !formData.id) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Property</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/properties')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Properties
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
          <p className="text-gray-600">Update property information</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            href={`/admin/properties/${propertyId}/images`}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Camera className="w-4 h-4 mr-2" />
            Manage Media
          </Link>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marketing Headline
                    </label>
                    <input
                      type="text"
                      name="marketing_headline"
                      value={formData.marketing_headline}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 'Luxury Penthouse with Stunning Views'"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="villa">Villa</option>
                      <option value="penthouse">Penthouse</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="studio">Studio</option>
                      <option value="duplex">Duplex</option>
                      <option value="land">Land</option>
                      <option value="commercial">Commercial</option>
                      <option value="office">Office</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Condition
                    </label>
                    <select
                      name="property_condition"
                      value={formData.property_condition}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Condition</option>
                      {conditionOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
              >
                {propertyStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year Built
                    </label>
                    <input
                      type="number"
                      name="year_built"
                      value={formData.year_built}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1800"
                      max={new Date().getFullYear()}
                    />
          </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                    />
        </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Square Meters
                    </label>
                    <input
                      type="number"
                      name="square_meters"
                      value={formData.square_meters}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>
                </div>
              )}

              {/* Location Tab */}
              {activeTab === 'location' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
              />
            </div>

                  <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
              />
            </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Neighborhood
                    </label>
                    <input
                      type="text"
                      name="neighborhood"
                      value={formData.neighborhood}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Downtown, Westside"
                    />
          </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compound/Building Name
                    </label>
                    <input
                      type="text"
                      name="compound"
                      value={formData.compound}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Marina Plaza, Green Valley"
                    />
        </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
              </label>
              <input
                type="number"
                      name="latitude"
                      value={formData.latitude || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="any"
                      placeholder="25.0760"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
              </label>
              <input
                type="number"
                      name="longitude"
                      value={formData.longitude || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="any"
                      placeholder="55.1888"
              />
            </div>

                  {/* Distance to key locations */}
                  <div className="md:col-span-2 mt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Distance to Key Locations (km)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                          Metro Station
              </label>
              <input
                type="number"
                          name="distance_to_metro"
                          value={formData.distance_to_metro || ''}
                onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          step="0.1"
                min="0"
                          placeholder="2.5"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Airport
                        </label>
                        <input
                          type="number"
                          name="distance_to_airport"
                          value={formData.distance_to_airport || ''}
                          onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          step="0.1"
                          min="0"
                          placeholder="15.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                          Shopping Mall
              </label>
              <input
                type="number"
                          name="distance_to_mall"
                          value={formData.distance_to_mall || ''}
                onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          step="0.1"
                min="0"
                          placeholder="1.2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hospital
                        </label>
                        <input
                          type="number"
                          name="distance_to_hospital"
                          value={formData.distance_to_hospital || ''}
                          onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          step="0.1"
                          min="0"
                          placeholder="3.0"
              />
            </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lot Size (sq ft)
              </label>
              <input
                type="number"
                name="lot_size"
                value={formData.lot_size}
                onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Floor Level
                    </label>
                    <input
                      type="number"
                      name="floor_level"
                      value={formData.floor_level || ''}
                      onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Floors in Building
              </label>
              <input
                type="number"
                      name="total_floors"
                      value={formData.total_floors || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
              />
            </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Balconies
                    </label>
                    <input
                      type="number"
                      name="balconies"
                      value={formData.balconies}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
          </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parking Spaces
                    </label>
                    <input
                      type="number"
                      name="parking_spaces"
                      value={formData.parking_spaces}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
        </div>

                  {/* Key Features */}
                  <div className="md:col-span-2 mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Key Features
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {keyFeatureOptions.map((feature) => (
                        <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.key_features.includes(feature)}
                            onChange={() => handleArrayChange('key_features', feature)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="md:col-span-2 mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Features
                    </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availableFeatures.map((feature) => (
              <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.features.includes(feature)}
                  onChange={() => handleArrayChange('features', feature)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{feature}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
                  <div className="md:col-span-2 mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Amenities
                    </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availableAmenities.map((amenity) => (
              <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => handleArrayChange('amenities', amenity)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>
                </div>
              )}

              {/* Financial Tab */}
              {activeTab === 'financial' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly HOA Fee ($)
                    </label>
                    <input
                      type="number"
                      name="monthly_hoa_fee"
                      value={formData.monthly_hoa_fee}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Property Tax ($)
                    </label>
                    <input
                      type="number"
                      name="annual_property_tax"
                      value={formData.annual_property_tax}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Cost ($)
                    </label>
                    <input
                      type="number"
                      name="insurance_cost"
                      value={formData.insurance_cost}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>
              )}

              {/* Infrastructure Tab */}
              {activeTab === 'infrastructure' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heating Type
                    </label>
                    <input
                      type="text"
                      name="heating_type"
                      value={formData.heating_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cooling Type
                    </label>
                    <input
                      type="text"
                      name="cooling_type"
                      value={formData.cooling_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Water Source
                    </label>
                    <input
                      type="text"
                      name="water_source"
                      value={formData.water_source}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sewer Type
                    </label>
                    <input
                      type="text"
                      name="sewer_type"
                      value={formData.sewer_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Internet Speed
                    </label>
                    <input
                      type="text"
                      name="internet_speed"
                      value={formData.internet_speed}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Amenities Tab */}
              {activeTab === 'amenities' && (
                <div className="space-y-6">
                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Property Features
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availableFeatures.map((feature) => (
                        <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.features.includes(feature)}
                            onChange={() => handleArrayChange('features', feature)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Building/Community Amenities
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availableAmenities.map((amenity) => (
                        <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(amenity)}
                            onChange={() => handleArrayChange('amenities', amenity)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Key Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Key Features & Highlights
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {keyFeatureOptions.map((feature) => (
                        <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.key_features.includes(feature)}
                            onChange={() => handleArrayChange('key_features', feature)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Boolean Amenity Checkboxes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Quick Amenity Features
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="furnished"
                          checked={formData.furnished}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Furnished</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="has_pool"
                          checked={formData.has_pool}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Swimming Pool</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="has_garden"
                          checked={formData.has_garden}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Garden</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="has_security"
                          checked={formData.has_security}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Security</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="has_parking"
                          checked={formData.has_parking}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Parking</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="has_gym"
                          checked={formData.has_gym}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Gym</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="has_playground"
                          checked={formData.has_playground}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Playground</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="has_elevator"
                          checked={formData.has_elevator}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Elevator</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="has_balcony"
                          checked={formData.has_balcony}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Balcony</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="has_terrace"
                          checked={formData.has_terrace}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Terrace</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="has_storage"
                          checked={formData.has_storage}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Storage</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="has_maid_room"
                          checked={formData.has_maid_room}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Maid's Room</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Availability Tab */}
              {activeTab === 'availability' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Date
                    </label>
                    <input
                      type="text"
                      name="available_date"
                      value={formData.available_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lease Terms
                    </label>
                    <div className="space-y-2">
                      {leaseTermOptions.map((term) => (
                        <div key={term} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`lease_term_${term}`}
                            checked={formData.lease_terms.includes(term)}
                            onChange={() => handleArrayChange('lease_terms', term)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`lease_term_${term}`} className="ml-2 text-sm text-gray-700">
                            {term}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pet Policy
                    </label>
                    <select
                      name="pet_policy"
                      value={formData.pet_policy}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {petPolicyOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Virtual Tour URL
                    </label>
                    <input
                      type="text"
                      name="virtual_tour_url"
                      value={formData.virtual_tour_url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video Tour URL
                    </label>
                    <input
                      type="text"
                      name="video_tour_url"
                      value={formData.video_tour_url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* SEO & Admin Tab */}
              {activeTab === 'seo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      name="seo_title"
                      value={formData.seo_title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Description
                    </label>
                    <textarea
                      name="seo_description"
                      value={formData.seo_description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Internal Notes
                    </label>
                    <textarea
                      name="internal_notes"
                      value={formData.internal_notes}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

        {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Updating...' : 'Update Property'}</span>
          </button>
              </div>

        </div>
      </form>
        </CardContent>
      </Card>
    </div>
  )
} 