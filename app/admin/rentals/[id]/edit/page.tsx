'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

// Tab Components
import BasicInfoTab from '@/components/rental/form/BasicInfoTab'
import PricingTab from '@/components/rental/form/PricingTab'
import BookingRulesTab from '@/components/rental/form/BookingRulesTab'
import AmenitiesTab from '@/components/rental/form/AmenitiesTab'
import HouseRulesTab from '@/components/rental/form/HouseRulesTab'
import ComplianceTab from '@/components/rental/form/ComplianceTab'
import MediaTab from '@/components/rental/form/MediaTab'
import AvailabilityTab from '@/components/rental/form/AvailabilityTab'
import ReviewTab from '@/components/rental/form/ReviewTab'

interface Property {
  id: string
  title: string
  address: string
  city: string
  property_type: string
  bedrooms: number
  bathrooms: number
  square_meters: number
  price: number
}

interface RentalFormData {
  property_id: string
  rental_type: 'short_term' | 'long_term' | 'both'
  nightly_rate: number | null
  monthly_rate: number | null
  yearly_rate: number | null
  minimum_stay_nights: number
  maximum_stay_nights: number
  check_in_time: string
  check_out_time: string
  house_rules: any
  cancellation_policy: string
  instant_book: boolean
  developer_qr_code: string
  tourism_permit_number: string
  compliance_status: string
  cleaning_fee: number
  security_deposit: number
  extra_guest_fee: number
  is_active: boolean
  featured: boolean
  auto_sync_external: boolean
  amenities: any
  media_urls: string[]
  availability_calendar: any[]
}

const TABS = [
  { id: 'basic', label: 'Basic Info', description: 'Property selection and rental type' },
  { id: 'pricing', label: 'Pricing', description: 'Rates and fees structure' },
  { id: 'booking', label: 'Booking Rules', description: 'Stay requirements and policies' },
  { id: 'amenities', label: 'Amenities', description: 'Property features and facilities' },
  { id: 'rules', label: 'House Rules', description: 'Guest policies and restrictions' },
  { id: 'compliance', label: 'Compliance', description: 'Legal requirements and permits' },
  { id: 'media', label: 'Media', description: 'Photos and virtual tours' },
  { id: 'availability', label: 'Availability', description: 'Calendar and pricing calendar' },
  { id: 'review', label: 'Review', description: 'Final review and save changes' }
]

export default function EditRentalPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('basic')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [completedTabs, setCompletedTabs] = useState<Set<string>>(new Set())

  const rentalId = params.id as string

  // Initialize form data
  const [formData, setFormData] = useState<RentalFormData>({
    property_id: '',
    rental_type: 'short_term',
    nightly_rate: null,
    monthly_rate: null,
    yearly_rate: null,
    minimum_stay_nights: 1,
    maximum_stay_nights: 365,
    check_in_time: '15:00',
    check_out_time: '11:00',
    house_rules: {
      smoking_allowed: false,
      pets_allowed: false,
      parties_allowed: false,
      quiet_hours: '22:00-08:00',
      maximum_occupancy: null,
      additional_rules: []
    },
    cancellation_policy: 'moderate',
    instant_book: false,
    developer_qr_code: '',
    tourism_permit_number: '',
    compliance_status: 'pending',
    cleaning_fee: 0,
    security_deposit: 0,
    extra_guest_fee: 0,
    is_active: true,
    featured: false,
    auto_sync_external: false,
    amenities: {},
    media_urls: [],
    availability_calendar: []
  })

  useEffect(() => {
    fetchProperties()
    fetchRentalData()
  }, [rentalId])

  const fetchProperties = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, address, city, property_type, bedrooms, bathrooms, square_meters, price')
        .eq('status', 'available')
        .eq('furnished', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProperties(data || [])
    } catch (err) {
      console.error('Error fetching properties:', err)
    }
  }

  const fetchRentalData = async () => {
    try {
      console.log('📥 Fetching comprehensive rental data for:', rentalId)
      
      // Use the enhanced admin API to get complete rental data
      const response = await fetch(`/api/admin/rentals/${rentalId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch rental data')
      }

      if (result.success && result.rental) {
        const rental = result.rental
        console.log('📋 Loaded rental data:', rental)

        // Extract comprehensive data
        const amenities = rental.rental_amenities?.[0] || {}
        const property = rental.properties || {}
        const photos = property.property_photos || []
        const videos = property.property_videos || []
        const documents = property.property_documents || []
        
        setFormData({
          property_id: rental.property_id,
          rental_type: rental.rental_type,
          nightly_rate: rental.nightly_rate,
          monthly_rate: rental.monthly_rate,
          yearly_rate: rental.yearly_rate,
          minimum_stay_nights: rental.minimum_stay_nights,
          maximum_stay_nights: rental.maximum_stay_nights,
          check_in_time: rental.check_in_time,
          check_out_time: rental.check_out_time,
          house_rules: rental.house_rules || {
            smoking_allowed: false,
            pets_allowed: false,
            parties_allowed: false,
            quiet_hours: '22:00-08:00',
            maximum_occupancy: null,
            additional_rules: []
          },
          cancellation_policy: rental.cancellation_policy,
          instant_book: rental.instant_book,
          developer_qr_code: rental.developer_qr_code || '',
          tourism_permit_number: rental.tourism_permit_number || '',
          compliance_status: rental.compliance_status,
          cleaning_fee: rental.cleaning_fee,
          security_deposit: rental.security_deposit,
          extra_guest_fee: rental.extra_guest_fee,
          is_active: rental.is_active,
          featured: rental.featured,
          auto_sync_external: rental.auto_sync_external,
          
          // Comprehensive data
          amenities: amenities,
          photos: photos.map(photo => ({
            ...photo,
            type: 'photo'
          })),
          videos: videos.map(video => ({
            ...video,
            type: 'video'
          })),
          documents: documents.map(doc => ({
            ...doc,
            type: 'document',
            category: doc.document_type
          })),
          availability_calendar: rental.calendar?.upcoming_availability || [],
          
          // Legacy fields for compatibility
          media_urls: photos.map(p => p.url)
        })

        // Mark tabs as completed based on comprehensive data
        const completed = new Set<string>()
        completed.add('basic') // Always completed if rental exists
        
        if (rental.nightly_rate || rental.monthly_rate) {
          completed.add('pricing')
        }
        
        completed.add('booking') // Basic booking rules always exist
        
        if (Object.keys(amenities).length > 0) {
          completed.add('amenities')
        }
        
        if (rental.house_rules && Object.keys(rental.house_rules).length > 0) {
          completed.add('rules')
        }
        
        if (rental.tourism_permit_number || rental.developer_qr_code) {
          completed.add('compliance')
        }
        
        if (photos.length > 0 || videos.length > 0 || documents.length > 0) {
          completed.add('media')
        }
        
        if (rental.calendar?.upcoming_availability?.length > 0) {
          completed.add('availability')
        }
        
        setCompletedTabs(completed)
        console.log('✅ Rental data loaded successfully, completed tabs:', completed)
      }
    } catch (err) {
      console.error('Error fetching rental data:', err)
      setErrors({ general: 'Failed to load rental data. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateTab = (tabId: string): boolean => {
    const newErrors: Record<string, string> = {}

    switch (tabId) {
      case 'basic':
        if (!formData.property_id) newErrors.property_id = 'Property is required'
        if (!formData.rental_type) newErrors.rental_type = 'Rental type is required'
        break
      
      case 'pricing':
        if (formData.rental_type === 'short_term' && !formData.nightly_rate) {
          newErrors.nightly_rate = 'Nightly rate is required for short-term rentals'
        }
        if ((formData.rental_type === 'long_term' || formData.rental_type === 'both') && !formData.monthly_rate) {
          newErrors.monthly_rate = 'Monthly rate is required'
        }
        break
      
      case 'booking':
        if (formData.minimum_stay_nights < 1) {
          newErrors.minimum_stay_nights = 'Minimum stay must be at least 1 night'
        }
        if (formData.maximum_stay_nights < formData.minimum_stay_nights) {
          newErrors.maximum_stay_nights = 'Maximum stay must be greater than minimum stay'
        }
        break
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      setCompletedTabs(prev => new Set([...prev, tabId]))
      return true
    }
    
    return false
  }

  const handleTabChange = (tabId: string) => {
    // Validate current tab before switching
    if (validateTab(activeTab)) {
      setActiveTab(tabId)
    }
  }

  const handleSave = async (publish: boolean = false) => {
    try {
      setSaving(true)
      
      // Validate all required tabs
      const requiredTabs = ['basic', 'pricing', 'booking']
      for (const tab of requiredTabs) {
        if (!validateTab(tab)) {
          setActiveTab(tab)
          return
        }
      }
      
      // Prepare data for the comprehensive API structure
      const {
        amenities,
        photos,
        videos,
        documents,
        availability_calendar,
        media_urls,
        ...rentalData
      } = formData

      const updateData = {
        // Main rental listing data
        ...rentalData,
        is_active: publish ? formData.is_active : formData.is_active,

        // Separated components for comprehensive API
        amenities: amenities && Object.keys(amenities).length > 0 ? amenities : undefined,
        photos: photos || undefined,
        videos: videos || undefined, 
        documents: documents || undefined,
        calendar_updates: availability_calendar || undefined,

        // Property updates if needed (mark as available for rent)
        property_updates: formData.property_id ? {
          available_for_rent: true,
          rental_ready: true
        } : undefined,

        // QR integrations if developer QR code is provided
        qr_integrations: formData.developer_qr_code ? {
          developer_name: 'Generic', // Can be enhanced to detect developer
          qr_code_data: formData.developer_qr_code,
          qr_code_type: 'property_access',
          integration_status: 'active'
        } : undefined,

        // External sync placeholder (can be expanded)
        external_sync: formData.auto_sync_external ? [
          {
            platform_name: 'airbnb',
            auto_sync_enabled: true,
            sync_pricing: true,
            sync_availability: true,
            sync_photos: true,
            sync_status: 'pending'
          }
        ] : undefined
      }

      console.log('📤 Sending comprehensive update data:', updateData)

      // Use the admin API route to update with SERVICE_ROLE permissions
      const response = await fetch(`/api/admin/rentals/${rentalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update rental listing')
      }

      if (result.success) {
        console.log('✅ Update successful:', result.updated_components)
        router.push(`/admin/rentals/${rentalId}`)
      } else {
        throw new Error(result.error || 'Update failed')
      }
    } catch (err) {
      console.error('Error updating rental:', err)
      setErrors({ general: `Failed to update rental listing: ${err instanceof Error ? err.message : 'Please try again.'}` })
    } finally {
      setSaving(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <BasicInfoTab
            formData={formData}
            properties={properties}
            updateFormData={updateFormData}
            errors={errors}
          />
        )
      case 'pricing':
        return (
          <PricingTab
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )
      case 'booking':
        return (
          <BookingRulesTab
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )
      case 'amenities':
        return (
          <AmenitiesTab
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )
      case 'rules':
        return (
          <HouseRulesTab
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )
      case 'compliance':
        return (
          <ComplianceTab
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )
      case 'media':
        return (
          <MediaTab
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )
      case 'availability':
        return (
          <AvailabilityTab
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )
      case 'review':
        return (
          <ReviewTab
            formData={formData}
            properties={properties}
            completedTabs={completedTabs}
            onSave={handleSave}
            saving={saving}
          />
        )
      default:
        return null
    }
  }

  const getTabStatus = (tabId: string) => {
    if (completedTabs.has(tabId)) return 'completed'
    if (tabId === activeTab) return 'active'
    return 'pending'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rental details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/admin/rentals/${rentalId}`}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Edit Rental Listing
                </h1>
                <p className="text-sm text-gray-500">
                  Update rental property details and settings
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {activeTab === 'review' ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <Link
                    href={`/rentals/${rentalId}`}
                    target="_blank"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Live
                  </Link>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>

                  <Link
                    href={`/rentals/${rentalId}`}
                    target="_blank"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Tab Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {TABS.map((tab, index) => {
                const status = getTabStatus(tab.id)
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                      status === 'active'
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                        : status === 'completed'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mr-3 ${
                        status === 'active'
                          ? 'bg-blue-600 text-white'
                          : status === 'completed'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{tab.label}</p>
                        <p className="text-xs text-gray-500">{tab.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-red-800">{errors.general}</p>
                  </div>
                </div>
              )}
              
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}