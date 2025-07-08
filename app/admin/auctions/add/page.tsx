'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, DollarSign, Clock, Building, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase/config'
import { isCurrentUserAdmin, logAdminActivity } from '@/lib/auth/admin-client'
import { useTranslation } from 'react-i18next'

interface Property {
  id: string
  title: string
  address: string
  city: string
  state: string
  price: number
  bedrooms: number
  bathrooms: number
  square_meters: number
  property_type: string
  broker_id?: string
  property_photos: Array<{
    id: string
    url: string
    is_primary: boolean
  }>
}

interface Broker {
  id: string
  name: string
  email: string
}

export default function AddAuction() {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  const [formData, setFormData] = useState({
    property_id: '',
    auction_type: 'live' as 'live' | 'timed',
    start_time: '',
    end_time: '',
    preview_start: '',
    reserve_price: '',
    buy_now_price: '',
    commission_rate: '0.05',
    duration_hours: '1',
    preview_days: '7'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const checkAdminAccess = async () => {
      const isAdmin = await isCurrentUserAdmin()
      if (!isAdmin) {
        router.push('/unauthorized')
        return
      }
      
      await logAdminActivity('auction_add_page_access')
      fetchData()
    }

    checkAdminAccess()
  }, [])

  const fetchData = async () => {
    try {
      console.log('Fetching properties and brokers...')
      
      // First, try to fetch all properties without complex filtering
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          address,
          city,
          state,
          price,
          bedrooms,
          bathrooms,
          square_meters,
          property_type,
          property_photos (
            id,
            url,
            is_primary
          )
        `)
        .limit(50)

      console.log('Properties query result:', { 
        error: propertiesError ? propertiesError.message : null,
        count: propertiesData ? propertiesData.length : 0
      })

      if (propertiesError) {
        console.error('Properties error:', propertiesError)
        throw propertiesError
      }
      
      setProperties(propertiesData || [])

      // For brokers, let's try a simple query first to see if the table exists
      try {
        const { data: brokersData, error: brokersError } = await supabase
          .from('brokers')
          .select('id, name, email')
          .limit(10)

        console.log('Brokers query result:', { 
          error: brokersError ? brokersError.message : null,
          count: brokersData ? brokersData.length : 0
        })

        if (!brokersError) {
          setBrokers(brokersData || [])
        } else {
          console.log('Brokers table might not exist, using empty array')
          setBrokers([])
        }
      } catch (brokerError) {
        console.log('Brokers table error, using empty array:', brokerError)
        setBrokers([])
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    }
  }

  const handlePropertySelect = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId)
    setSelectedProperty(property || null)
    setFormData({ ...formData, property_id: propertyId })
    
    // Auto-populate reserve price based on property price
    if (property) {
      const reservePrice = Math.floor(property.price * 0.8) // 80% of listing price
      setFormData(prev => ({ 
        ...prev, 
        property_id: propertyId,
        reserve_price: reservePrice.toString() 
      }))
    }
  }

  const handleTimeChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value }
    
    // Auto-calculate related times
    if (field === 'start_time') {
      const startTime = new Date(value)
      const previewStart = new Date(startTime)
      previewStart.setDate(startTime.getDate() - parseInt(formData.preview_days))
      
      const endTime = new Date(startTime)
      endTime.setHours(startTime.getHours() + parseInt(formData.duration_hours))
      
      updatedData.preview_start = previewStart.toISOString().slice(0, 16)
      updatedData.end_time = endTime.toISOString().slice(0, 16)
    } else if (field === 'duration_hours') {
      if (formData.start_time) {
        const startTime = new Date(formData.start_time)
        const endTime = new Date(startTime)
        endTime.setHours(startTime.getHours() + parseInt(value))
        updatedData.end_time = endTime.toISOString().slice(0, 16)
      }
    } else if (field === 'preview_days') {
      if (formData.start_time) {
        const startTime = new Date(formData.start_time)
        const previewStart = new Date(startTime)
        previewStart.setDate(startTime.getDate() - parseInt(value))
        updatedData.preview_start = previewStart.toISOString().slice(0, 16)
      }
    }
    
    setFormData(updatedData)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.property_id) {
      newErrors.property_id = 'Please select a property'
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required'
    } else {
      const startTime = new Date(formData.start_time)
      const now = new Date()
      if (startTime <= now) {
        newErrors.start_time = 'Start time must be in the future'
      }
    }

    if (!formData.reserve_price || parseFloat(formData.reserve_price) <= 0) {
      newErrors.reserve_price = 'Reserve price must be greater than 0'
    }

    if (formData.buy_now_price && parseFloat(formData.buy_now_price) <= parseFloat(formData.reserve_price)) {
      newErrors.buy_now_price = 'Buy now price must be greater than reserve price'
    }

    const commissionRate = parseFloat(formData.commission_rate)
    if (commissionRate < 0 || commissionRate > 1) {
      newErrors.commission_rate = 'Commission rate must be between 0 and 100%'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const auctionData = {
        property_id: formData.property_id,
        auction_type: formData.auction_type,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        preview_start: new Date(formData.preview_start).toISOString(),
        reserve_price: parseFloat(formData.reserve_price),
        buy_now_price: formData.buy_now_price ? parseFloat(formData.buy_now_price) : null,
        commission_rate: parseFloat(formData.commission_rate),
        status: 'preview'
      }

      const { data, error } = await supabase
        .from('auction_properties')
        .insert(auctionData)
        .select()
        .single()

      if (error) throw error

      // Log auction creation event
      await supabase
        .from('auction_events')
        .insert({
          auction_property_id: data.id,
          event_type: 'auction_created',
          event_data: {
            property_id: formData.property_id,
            reserve_price: auctionData.reserve_price,
            buy_now_price: auctionData.buy_now_price,
            start_time: auctionData.start_time,
            end_time: auctionData.end_time
          }
        })

      await logAdminActivity('auction_created', { auction_id: data.id, property_id: formData.property_id })
      
      router.push('/admin/auctions')
    } catch (error) {
      console.error('Error creating auction:', error)
      alert('Failed to create auction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/auctions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Auctions
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Auction</h1>
            <p className="text-gray-600 mt-1">Set up a new property auction</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Property Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <Building className="h-5 w-5 mr-2 text-gray-500" />
            <h2 className="text-lg font-semibold">Property Selection</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="property_id">Select Property *</Label>
              <Select value={formData.property_id} onValueChange={handlePropertySelect}>
                <SelectTrigger className={errors.property_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Choose a property to auction" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{property.title}</span>
                        <span className="text-gray-500">- {property.city}, {property.state}</span>
                        <span className="text-blue-600">{formatPrice(property.price)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.property_id && <p className="text-red-500 text-sm mt-1">{errors.property_id}</p>}
            </div>

            {selectedProperty && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedProperty.property_photos?.[0]?.url || '/placeholder.svg'}
                    alt={selectedProperty.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{selectedProperty.title}</h3>
                    <p className="text-gray-600">{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state}</p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{selectedProperty.bedrooms} bed</span>
                      <span>{selectedProperty.bathrooms} bath</span>
                      <span>{selectedProperty.square_meters?.toLocaleString()} sqm</span>
                      <span className="text-blue-600 font-medium">{formatPrice(selectedProperty.price)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auction Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 mr-2 text-gray-500" />
            <h2 className="text-lg font-semibold">Auction Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="auction_type">Auction Type</Label>
              <Select value={formData.auction_type} onValueChange={(value: 'live' | 'timed') => setFormData({ ...formData, auction_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live Auction</SelectItem>
                  <SelectItem value="timed">Timed Auction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="preview_days">Preview Period (Days)</Label>
              <Select value={formData.preview_days} onValueChange={(value) => handleTimeChange('preview_days', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="5">5 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="10">10 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start_time">Auction Start Time *</Label>
              <Input
                type="datetime-local"
                id="start_time"
                value={formData.start_time}
                onChange={(e) => handleTimeChange('start_time', e.target.value)}
                className={errors.start_time ? 'border-red-500' : ''}
              />
              {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>}
            </div>

            <div>
              <Label htmlFor="duration_hours">Auction Duration (Hours)</Label>
              <Select value={formData.duration_hours} onValueChange={(value) => handleTimeChange('duration_hours', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">30 Minutes</SelectItem>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="2">2 Hours</SelectItem>
                  <SelectItem value="4">4 Hours</SelectItem>
                  <SelectItem value="6">6 Hours</SelectItem>
                  <SelectItem value="12">12 Hours</SelectItem>
                  <SelectItem value="24">24 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="preview_start">Preview Start</Label>
              <Input
                type="datetime-local"
                id="preview_start"
                value={formData.preview_start}
                onChange={(e) => setFormData({ ...formData, preview_start: e.target.value })}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="end_time">Auction End Time</Label>
              <Input
                type="datetime-local"
                id="end_time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <DollarSign className="h-5 w-5 mr-2 text-gray-500" />
            <h2 className="text-lg font-semibold">Pricing Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="reserve_price">Reserve Price *</Label>
              <Input
                type="number"
                id="reserve_price"
                value={formData.reserve_price}
                onChange={(e) => setFormData({ ...formData, reserve_price: e.target.value })}
                placeholder="Minimum acceptable price"
                className={errors.reserve_price ? 'border-red-500' : ''}
              />
              {errors.reserve_price && <p className="text-red-500 text-sm mt-1">{errors.reserve_price}</p>}
              <p className="text-sm text-gray-500 mt-1">
                Minimum price you're willing to accept
              </p>
            </div>

            <div>
              <Label htmlFor="buy_now_price">Buy Now Price (Optional)</Label>
              <Input
                type="number"
                id="buy_now_price"
                value={formData.buy_now_price}
                onChange={(e) => setFormData({ ...formData, buy_now_price: e.target.value })}
                placeholder="Immediate purchase price"
                className={errors.buy_now_price ? 'border-red-500' : ''}
              />
              {errors.buy_now_price && <p className="text-red-500 text-sm mt-1">{errors.buy_now_price}</p>}
              <p className="text-sm text-gray-500 mt-1">
                Price for immediate purchase (optional)
              </p>
            </div>

            <div>
              <Label htmlFor="commission_rate">Commission Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                id="commission_rate"
                value={(parseFloat(formData.commission_rate) * 100).toString()}
                onChange={(e) => setFormData({ ...formData, commission_rate: (parseFloat(e.target.value) / 100).toString() })}
                className={errors.commission_rate ? 'border-red-500' : ''}
              />
              {errors.commission_rate && <p className="text-red-500 text-sm mt-1">{errors.commission_rate}</p>}
              <p className="text-sm text-gray-500 mt-1">
                Platform commission on overprice
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Link href="/admin/auctions">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Auction...' : 'Create Auction'}
          </Button>
        </div>
      </form>
    </div>
  )
}