'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Calendar, DollarSign, Clock, Building, User, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase/config'
import { isCurrentUserAdmin, logAdminActivity } from '@/lib/auth/admin-client'
import { useTranslation } from 'react-i18next'

interface AuctionProperty {
  id: string
  property_id: string
  auction_type: 'timed' | 'live'
  start_time: string
  end_time: string
  preview_start: string
  reserve_price: number
  buy_now_price?: number
  current_bid: number
  bid_count: number
  status: 'preview' | 'live' | 'ended' | 'sold' | 'cancelled'
  commission_rate: number
  created_at: string
  updated_at: string
  properties: {
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
}

interface Broker {
  id: string
  name: string
  email: string
}

export default function EditAuction() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const auctionId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [auction, setAuction] = useState<AuctionProperty | null>(null)
  const [brokers, setBrokers] = useState<Broker[]>([])

  const [formData, setFormData] = useState({
    auction_type: 'live' as 'live' | 'timed',
    start_time: '',
    end_time: '',
    preview_start: '',
    reserve_price: '',
    buy_now_price: '',
    commission_rate: '0.05',
    status: 'preview' as 'preview' | 'live' | 'ended' | 'sold' | 'cancelled'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const checkAdminAccess = async () => {
      const isAdmin = await isCurrentUserAdmin()
      if (!isAdmin) {
        router.push('/unauthorized')
        return
      }
      
      await logAdminActivity('auction_edit_page_access', { auction_id: auctionId })
      fetchData()
    }

    checkAdminAccess()
  }, [auctionId])

  const fetchData = async () => {
    try {
      setInitialLoading(true)
      console.log('Fetching auction edit data for ID:', auctionId)
      
      // Fetch auction details
      const { data: auctionData, error: auctionError } = await supabase
        .from('auction_properties')
        .select(`
          *,
          properties (
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
          )
        `)
        .eq('id', auctionId)
        .single()

      console.log('Auction query result:', { 
        error: auctionError ? auctionError.message : null,
        auction: auctionData ? { id: auctionData.id, property_title: auctionData.properties?.title } : null
      })

      if (auctionError) {
        console.error('Auction error:', auctionError)
        throw auctionError
      }
      
      setAuction(auctionData)

      // Populate form with existing data
      setFormData({
        auction_type: auctionData.auction_type,
        start_time: new Date(auctionData.start_time).toISOString().slice(0, 16),
        end_time: new Date(auctionData.end_time).toISOString().slice(0, 16),
        preview_start: new Date(auctionData.preview_start).toISOString().slice(0, 16),
        reserve_price: auctionData.reserve_price.toString(),
        buy_now_price: auctionData.buy_now_price?.toString() || '',
        commission_rate: auctionData.commission_rate.toString(),
        status: auctionData.status
      })

      // Fetch brokers - handle gracefully if table doesn't exist
      try {
        const { data: brokersData, error: brokersError } = await supabase
          .from('brokers')
          .select('id, name, email')
          .limit(50)

        console.log('Brokers query result:', { 
          error: brokersError ? brokersError.message : null,
          count: brokersData ? brokersData.length : 0
        })

        if (!brokersError) {
          setBrokers(brokersData || [])
        } else {
          console.log('Brokers query failed, using empty array')
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
      alert('Failed to load auction data')
      router.push('/admin/auctions')
    } finally {
      setInitialLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required'
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

    // Additional validation for live auctions
    if (auction?.status === 'live' && auction.bid_count > 0) {
      const newReservePrice = parseFloat(formData.reserve_price)
      if (newReservePrice > auction.current_bid) {
        newErrors.reserve_price = 'Cannot set reserve price higher than current bid for active auctions'
      }
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
      const updateData = {
        auction_type: formData.auction_type,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        preview_start: new Date(formData.preview_start).toISOString(),
        reserve_price: parseFloat(formData.reserve_price),
        buy_now_price: formData.buy_now_price ? parseFloat(formData.buy_now_price) : null,
        commission_rate: parseFloat(formData.commission_rate),
        status: formData.status,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('auction_properties')
        .update(updateData)
        .eq('id', auctionId)

      if (error) throw error

      // Log auction update event
      await supabase
        .from('auction_events')
        .insert({
          auction_property_id: auctionId,
          event_type: 'auction_updated',
          event_data: {
            changes: updateData,
            updated_by: 'admin'
          }
        })

      await logAdminActivity('auction_updated', { auction_id: auctionId })
      
      router.push('/admin/auctions')
    } catch (error) {
      console.error('Error updating auction:', error)
      alert('Failed to update auction. Please try again.')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preview':
        return 'bg-blue-100 text-blue-800'
      case 'live':
        return 'bg-green-100 text-green-800'
      case 'ended':
        return 'bg-gray-100 text-gray-800'
      case 'sold':
        return 'bg-purple-100 text-purple-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canEditField = (field: string) => {
    if (!auction) return true
    
    // Restrict editing for live auctions with bids
    if (auction.status === 'live' && auction.bid_count > 0) {
      const restrictedFields = ['start_time', 'auction_type']
      return !restrictedFields.includes(field)
    }
    
    // Restrict editing for ended/sold auctions
    if (['ended', 'sold'].includes(auction.status)) {
      const allowedFields = ['status'] // Only status can be changed
      return allowedFields.includes(field)
    }
    
    return true
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Auction Not Found</h2>
        <p className="text-gray-600 mb-6">The auction you're looking for doesn't exist.</p>
        <Link href="/admin/auctions">
          <Button>Back to Auctions</Button>
        </Link>
      </div>
    )
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Auction</h1>
            <p className="text-gray-600 mt-1">Modify auction settings</p>
          </div>
        </div>
        <Badge className={getStatusColor(auction.status)}>
          {auction.status}
        </Badge>
      </div>

      {/* Warnings for live auctions */}
      {auction.status === 'live' && auction.bid_count > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This auction is live and has active bids. Some fields cannot be modified to protect bidder interests.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Property Information (Read-only) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <Building className="h-5 w-5 mr-2 text-gray-500" />
            <h2 className="text-lg font-semibold">Property Information</h2>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-4">
              <img
                src={auction.properties.property_photos?.[0]?.url || '/placeholder.svg'}
                alt={auction.properties.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{auction.properties.title}</h3>
                <p className="text-gray-600">{auction.properties.address}, {auction.properties.city}, {auction.properties.state}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{auction.properties.bedrooms} bed</span>
                  <span>{auction.properties.bathrooms} bath</span>
                  <span>{auction.properties.square_meters?.toLocaleString()} sqm</span>
                  <span className="text-blue-600 font-medium">{formatPrice(auction.properties.price)}</span>
                </div>
                {auction.bid_count > 0 && (
                  <div className="mt-2 text-sm">
                    <span className="text-green-600 font-medium">
                      Current Bid: {formatPrice(auction.current_bid)}
                    </span>
                    <span className="text-gray-500 ml-2">
                      ({auction.bid_count} bids)
                    </span>
                  </div>
                )}
              </div>
            </div>
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
              <Select 
                value={formData.auction_type} 
                onValueChange={(value: 'live' | 'timed') => setFormData({ ...formData, auction_type: value })}
                disabled={!canEditField('auction_type')}
              >
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
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                disabled={!canEditField('status')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preview">Preview</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                disabled={!canEditField('preview_start')}
              />
            </div>

            <div>
              <Label htmlFor="start_time">Auction Start Time *</Label>
              <Input
                type="datetime-local"
                id="start_time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className={errors.start_time ? 'border-red-500' : ''}
                disabled={!canEditField('start_time')}
              />
              {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>}
            </div>

            <div>
              <Label htmlFor="end_time">Auction End Time</Label>
              <Input
                type="datetime-local"
                id="end_time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                disabled={!canEditField('end_time')}
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
                disabled={!canEditField('reserve_price')}
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
                disabled={!canEditField('buy_now_price')}
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
                disabled={!canEditField('commission_rate')}
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
            {loading ? 'Updating Auction...' : 'Update Auction'}
          </Button>
        </div>
      </form>
    </div>
  )
}