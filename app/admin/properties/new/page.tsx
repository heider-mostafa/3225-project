'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface PropertyFormData {
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

export default function NewProperty() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState<PropertyFormData>({
    // Basic Information
    title: '',
    description: '',
    marketing_headline: '',
    property_type: 'apartment',
    status: 'active',
    property_condition: 'good',
    
    // Location
    address: '',
    city: '',
    state: '',
    zip_code: '',
    neighborhood: '',
    compound: '',
    latitude: null,
    longitude: null,
    
    // Property Details
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
    
    // Financial
    monthly_hoa_fee: 0,
    annual_property_tax: 0,
    insurance_cost: 0,
    
    // Distances
    distance_to_metro: null,
    distance_to_airport: null,
    distance_to_mall: null,
    distance_to_hospital: null,
    
    // Infrastructure
    heating_type: '',
    cooling_type: '',
    water_source: '',
    sewer_type: '',
    internet_speed: '',
    
    // Availability
    available_date: '',
    lease_terms: [],
    pet_policy: 'not_allowed',
    
    // Media
    virtual_tour_url: '',
    video_tour_url: '',
    
    // Features and Amenities
    features: [],
    amenities: [],
    key_features: [],
    
    // Amenity Booleans
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
    
    // SEO
    seo_title: '',
    seo_description: '',
    
    // Admin
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
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'sold', label: 'Sold' },
    { value: 'rented', label: 'Rented' }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value
    }))
  }

  const handleBooleanChange = (field: keyof PropertyFormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleArrayChange = (arrayName: keyof PropertyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: (prev[arrayName] as string[]).includes(value)
        ? (prev[arrayName] as string[]).filter(item => item !== value)
        : [...(prev[arrayName] as string[]), value]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Creating new property with sanitized data:', sanitizedData)

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      })

      if (response.ok) {
        const property = await response.json()
        
        await logAdminActivity(
          'property_create',
          'property',
          property.id,
          { title: property.title, type: property.property_type }
        )

        router.push('/admin/properties')
      } else {
        const error = await response.json()
        alert('Failed to create property: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating property:', error)
      alert('Failed to create property')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
            <p className="text-gray-600">Create a comprehensive property listing</p>
        </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            type="button"
            disabled
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-50 cursor-not-allowed transition-colors"
            title="Media management available after property creation"
          >
            <Camera className="w-4 h-4 mr-2" />
            Manage Media
          </button>
          <span className="text-sm text-gray-500">Available after property creation</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter property title"
              />
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marketing Headline
                </label>
                <input
                  type="text"
                  name="marketing_headline"
                  value={formData.marketing_headline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Catchy headline for marketing"
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
                  placeholder="Detailed property description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
              </label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {propertyTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  Property Condition
                </label>
                <select
                  name="property_condition"
                  value={formData.property_condition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {conditionOptions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
          </div>
        </div>
          </div>
        )}

        {/* Location Tab */}
        {activeTab === 'location' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
              Location Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Street address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="State"
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
                placeholder="ZIP Code"
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
                  placeholder="Neighborhood name"
                />
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compound/Development
                </label>
                <input
                  type="text"
                  name="compound"
                  value={formData.compound}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Compound or development name"
                />
        </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude || ''}
                  onChange={handleInputChange}
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="30.0444"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude || ''}
                  onChange={handleInputChange}
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="31.2357"
                />
              </div>

              {/* Distance Section */}
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-900 mb-3">Distances to Key Locations (km)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metro Station
                    </label>
                    <input
                      type="number"
                      name="distance_to_metro"
                      value={formData.distance_to_metro || ''}
                      onChange={handleInputChange}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="25.0"
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
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="3.8"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Property Details Tab */}
        {activeTab === 'details' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Home className="w-5 h-5 mr-2" />
            Property Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                  Price *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Bed className="w-4 h-4 inline mr-1" />
                Bedrooms
              </label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Bath className="w-4 h-4 inline mr-1" />
                Bathrooms
              </label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                required
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Square className="w-4 h-4 inline mr-1" />
                Square Meters
              </label>
              <input
                type="number"
                name="square_meters"
                value={formData.square_meters}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lot Size (sq ft)
              </label>
              <input
                type="number"
                name="lot_size"
                value={formData.lot_size}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
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
                min="1800"
                  max={new Date().getFullYear() + 5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Floors
                </label>
                <input
                  type="number"
                  name="total_floors"
                  value={formData.total_floors || ''}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                />
        </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Balconies
                </label>
                <input
                  type="number"
                  name="balconies"
                  value={formData.balconies}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Car className="w-4 h-4 inline mr-1" />
                  Parking Spaces
                </label>
                <input
                  type="number"
                  name="parking_spaces"
                  value={formData.parking_spaces}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Key Features */}
              <div className="md:col-span-3">
                <h4 className="font-medium text-gray-900 mb-3">Key Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {keyFeatureOptions.map(feature => (
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

              {/* Property Features */}
              <div className="md:col-span-3">
                <h4 className="font-medium text-gray-900 mb-3">Property Features</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableFeatures.map(feature => (
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
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Financial Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly HOA Fee
                </label>
                <input
                  type="number"
                  name="monthly_hoa_fee"
                  value={formData.monthly_hoa_fee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Property Tax
                </label>
                <input
                  type="number"
                  name="annual_property_tax"
                  value={formData.annual_property_tax}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Cost (Annual)
                </label>
                <input
                  type="number"
                  name="insurance_cost"
                  value={formData.insurance_cost}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        )}

        {/* Infrastructure Tab */}
        {activeTab === 'infrastructure' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Wrench className="w-5 h-5 mr-2" />
              Infrastructure & Utilities
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Heating Type
                </label>
                <input
                  type="text"
                  name="heating_type"
                  value={formData.heating_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Central, Gas, Electric, etc."
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
                  placeholder="Central AC, Split units, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Droplets className="w-4 h-4 inline mr-1" />
                  Water Source
                </label>
                <input
                  type="text"
                  name="water_source"
                  value={formData.water_source}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Municipal, Well, etc."
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
                  placeholder="Municipal, Septic, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Wifi className="w-4 h-4 inline mr-1" />
                  Internet Speed
                </label>
                <input
                  type="text"
                  name="internet_speed"
                  value={formData.internet_speed}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100 Mbps, Fiber, etc."
                />
              </div>
            </div>
          </div>
        )}

        {/* Amenities Tab */}
        {activeTab === 'amenities' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Amenities & Features
            </h2>
            
            {/* Quick Toggle Amenities */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Quick Toggle Amenities</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { key: 'furnished', label: 'Furnished', icon: Home },
                  { key: 'has_pool', label: 'Swimming Pool', icon: Droplets },
                  { key: 'has_garden', label: 'Garden', icon: Trees },
                  { key: 'has_security', label: 'Security', icon: Shield },
                  { key: 'has_parking', label: 'Parking', icon: Car },
                  { key: 'has_gym', label: 'Gym', icon: Dumbbell },
                  { key: 'has_playground', label: 'Playground', icon: PlayCircle },
                  { key: 'has_community_center', label: 'Community Center', icon: Users },
                  { key: 'has_elevator', label: 'Elevator', icon: ArrowLeft },
                  { key: 'has_balcony', label: 'Balcony', icon: Home },
                  { key: 'has_terrace', label: 'Terrace', icon: Home },
                  { key: 'has_storage', label: 'Storage', icon: Home },
                  { key: 'has_maid_room', label: 'Maid Room', icon: Home },
                  { key: 'has_driver_room', label: 'Driver Room', icon: Home }
                ].map(amenity => {
                  const Icon = amenity.icon
                  return (
                    <label key={amenity.key} className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData[amenity.key as keyof PropertyFormData] as boolean}
                        onChange={() => handleBooleanChange(amenity.key as keyof PropertyFormData)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{amenity.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Community Amenities */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Community Amenities</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableAmenities.map(amenity => (
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

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Availability & Terms
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Date
                </label>
                <input
                  type="date"
                  name="available_date"
                  value={formData.available_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PawPrint className="w-4 h-4 inline mr-1" />
                  Pet Policy
                </label>
                <select
                  name="pet_policy"
                  value={formData.pet_policy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {petPolicyOptions.map(policy => (
                    <option key={policy.value} value={policy.value}>
                      {policy.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-900 mb-3">Lease Terms Available</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {leaseTermOptions.map(term => (
                    <label key={term} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.lease_terms.includes(term)}
                        onChange={() => handleArrayChange('lease_terms', term)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{term}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PlayCircle className="w-5 h-5 mr-2" />
              Media & Virtual Tours
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Virtual Tour URL
                </label>
                <input
                  type="url"
                  name="virtual_tour_url"
                  value={formData.virtual_tour_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/tour/[tour-id]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the direct iframe URL from your 3D tour provider (e.g., Realsee, Matterport, etc.)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Tour URL
                </label>
                <input
                  type="url"
                  name="video_tour_url"
                  value={formData.video_tour_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="md:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Camera className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Media Management</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Upload photos, videos, and documents for this property after creation.
                      </p>
                      <div className="mt-2 text-xs text-blue-600">
                        <p className="mb-1">
                          📍 <strong>Virtual Tours:</strong> Enter the iframe URL from your 3D tour provider above
                        </p>
                        <p>
                          💡 After creating the property, use the <Camera className="w-3 h-3 inline mx-1" /> camera icon in the Properties list to manage all media files.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO & Admin Tab */}
        {activeTab === 'seo' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              SEO & Admin Settings
            </h2>
            
            <div className="space-y-6">
              {/* SEO Section */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  SEO Settings
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      name="seo_title"
                      value={formData.seo_title}
                      onChange={handleInputChange}
                      maxLength={60}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optimized title for search engines (60 chars max)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.seo_title.length}/60 characters
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Description
                    </label>
                    <textarea
                      name="seo_description"
                      value={formData.seo_description}
                      onChange={handleInputChange}
                      maxLength={160}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Meta description for search engines (160 chars max)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.seo_description.length}/160 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Section */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Admin Notes
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    name="internal_notes"
                    value={formData.internal_notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Private notes for internal use only..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These notes are only visible to admin users and won't be displayed publicly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
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
            <span>{loading ? 'Creating...' : 'Create Property'}</span>
          </button>
        </div>
      </form>
    </div>
  )
} 