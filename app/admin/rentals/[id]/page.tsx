'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit, 
  Eye, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Home,
  Shield,
  Clock,
  Star,
  ImageIcon,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Briefcase,
  Camera
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface RentalListing {
  id: string
  property_id: string
  owner_user_id: string
  rental_type: string
  nightly_rate: number
  monthly_rate: number
  yearly_rate: number
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
  is_active: boolean
  featured: boolean
  total_bookings: number
  average_rating: number
  created_at: string
  updated_at: string
  properties?: {
    title: string
    address: string
    city: string
    property_type: string
    bedrooms: number
    bathrooms: number
    square_meters: number
    price: number
  }
  rental_amenities?: {
    has_wifi: boolean
    has_ac: boolean
    has_kitchen: boolean
    has_swimming_pool: boolean
    has_gym: boolean
    has_sea_view: boolean
    has_nile_view: boolean
    has_balcony: boolean
    has_elevator: boolean
    has_security_guard: boolean
  }[]
}

interface RentalStats {
  total_bookings: number
  confirmed_bookings: number
  total_revenue: number
  average_rating: number
  occupancy_rate: number
  recent_bookings: any[]
}

export default function RentalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [rental, setRental] = useState<RentalListing | null>(null)
  const [stats, setStats] = useState<RentalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const rentalId = params.id as string

  useEffect(() => {
    if (rentalId) {
      fetchRentalDetails()
      fetchRentalStats()
    }
  }, [rentalId])

  const fetchRentalDetails = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('rental_listings')
        .select(`
          *,
          properties (
            title,
            address,
            city,
            property_type,
            bedrooms,
            bathrooms,
            square_meters,
            price
          ),
          rental_amenities (
            has_wifi,
            has_ac,
            has_kitchen,
            has_swimming_pool,
            has_gym,
            has_sea_view,
            has_nile_view,
            has_balcony,
            has_elevator,
            has_security_guard
          )
        `)
        .eq('id', rentalId)
        .single()

      if (error) throw error
      setRental(data)
    } catch (err) {
      console.error('Error fetching rental details:', err)
      setError('Failed to load rental details')
    }
  }

  const fetchRentalStats = async () => {
    try {
      const supabase = createClient()
      
      // Fetch booking statistics
      const { data: bookings, error: bookingsError } = await supabase
        .from('rental_bookings')
        .select('booking_status, total_amount, payment_status, created_at')
        .eq('rental_listing_id', rentalId)

      if (bookingsError) throw bookingsError

      const totalBookings = bookings?.length || 0
      const confirmedBookings = bookings?.filter(b => ['confirmed', 'checked_in', 'checked_out', 'completed'].includes(b.booking_status)).length || 0
      const totalRevenue = bookings?.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0

      setStats({
        total_bookings: totalBookings,
        confirmed_bookings: confirmedBookings,
        total_revenue: totalRevenue,
        average_rating: rental?.average_rating || 0,
        occupancy_rate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0,
        recent_bookings: bookings?.slice(0, 5) || []
      })
    } catch (err) {
      console.error('Error fetching rental stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'expired': return <AlertTriangle className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
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

  if (error || !rental) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Rental Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The rental listing could not be found.'}</p>
          <Link href="/admin/rentals" className="text-blue-600 hover:text-blue-800">
            ← Back to Rentals
          </Link>
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
                href="/admin/rentals" 
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {rental.properties?.title || 'Rental Listing'}
                </h1>
                <p className="text-sm text-gray-500">
                  {rental.properties?.city} • {rental.rental_type.replace('_', ' ')} rental
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href={`/admin/rentals/${rentalId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Rental
              </Link>
              
              <Link
                href={`/admin/rentals/${rentalId}/bookings`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Manage Bookings
              </Link>

              <Link
                href={`/admin/rentals/${rentalId}/images`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Manage Images
              </Link>

              <Link
                href={`/rentals/${rentalId}`}
                target="_blank"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Live
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Property Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-500">Property Type</p>
                  <p className="font-medium">{rental.properties?.property_type}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-500">Bedrooms</p>
                  <p className="font-medium">{rental.properties?.bedrooms}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                    <Home className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-500">Bathrooms</p>
                  <p className="font-medium">{rental.properties?.bathrooms}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-sm text-gray-500">Square Meters</p>
                  <p className="font-medium">{rental.properties?.square_meters}</p>
                </div>
              </div>
            </div>

            {/* Rental Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Rental Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Pricing</h3>
                  <div className="space-y-2">
                    {rental.nightly_rate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nightly Rate:</span>
                        <span className="font-medium">{rental.nightly_rate.toLocaleString()} EGP</span>
                      </div>
                    )}
                    {rental.monthly_rate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Rate:</span>
                        <span className="font-medium">{rental.monthly_rate.toLocaleString()} EGP</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cleaning Fee:</span>
                      <span className="font-medium">{rental.cleaning_fee.toLocaleString()} EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Security Deposit:</span>
                      <span className="font-medium">{rental.security_deposit.toLocaleString()} EGP</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Booking Rules</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Stay:</span>
                      <span className="font-medium">{rental.minimum_stay_nights} nights</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Stay:</span>
                      <span className="font-medium">{rental.maximum_stay_nights} nights</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium">{rental.check_in_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-medium">{rental.check_out_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Instant Book:</span>
                      <span className={`px-2 py-1 rounded text-xs ${rental.instant_book ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rental.instant_book ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {rental.rental_amenities && rental.rental_amenities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(rental.rental_amenities[0]).map(([key, value]) => {
                    if (typeof value === 'boolean' && value) {
                      const amenityName = key.replace('has_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                      return (
                        <div key={key} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{amenityName}</span>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-4">Status & Compliance</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Listing Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    rental.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {rental.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Compliance:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.compliance_status)}`}>
                    {getStatusIcon(rental.compliance_status)}
                    <span className="ml-1">{rental.compliance_status}</span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Featured:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    rental.featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rental.featured ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {rental.tourism_permit_number && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">Tourism Permit:</p>
                  <p className="font-medium text-sm">{rental.tourism_permit_number}</p>
                </div>
              )}

              {rental.developer_qr_code && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">Developer QR:</p>
                  <p className="font-medium text-sm break-all">{rental.developer_qr_code}</p>
                </div>
              )}
            </div>

            {/* Performance Stats */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold mb-4">Performance</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Bookings:</span>
                    <span className="font-semibold">{stats.total_bookings}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Confirmed:</span>
                    <span className="font-semibold text-green-600">{stats.confirmed_bookings}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-semibold">{stats.total_revenue.toLocaleString()} EGP</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avg Rating:</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="font-semibold">{rental.average_rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-semibold">{stats.occupancy_rate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Owner Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-4">Owner Information</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Owner ID:</p>
                  <p className="font-medium">{rental.owner_user_id}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Member Since:</p>
                  <p className="font-medium">{new Date(rental.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Link
                  href={`/admin/rentals/${rentalId}/broker`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full justify-center"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Assign Broker
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}