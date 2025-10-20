'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Phone, 
  Mail, 
  DollarSign,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Eye,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  CreditCard,
  QrCode,
  MessageSquare,
  RefreshCw
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface RentalBooking {
  id: string
  rental_listing_id: string
  guest_user_id: string
  check_in_date: string
  check_out_date: string
  number_of_nights: number
  number_of_guests: number
  nightly_rate: number
  total_nights_cost: number
  cleaning_fee: number
  security_deposit: number
  platform_fee: number
  total_amount: number
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded' | 'failed'
  booking_status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed'
  guest_phone: string
  guest_email: string
  special_requests: string
  paymob_transaction_id: string
  qr_upload_status: 'pending' | 'uploaded' | 'expired'
  qr_uploaded_at: string | null
  created_at: string
  guest_profiles: {
    full_name: string
    profile_photo_url: string
  }
}

interface RentalListing {
  id: string
  property_id: string
  properties: {
    title: string
    city: string
    address: string
  }
}

interface BookingStats {
  total_bookings: number
  confirmed_bookings: number
  pending_bookings: number
  total_revenue: number
  average_nightly_rate: number
  occupancy_rate: number
}

export default function RentalBookingsPage() {
  const params = useParams()
  const router = useRouter()
  const [rental, setRental] = useState<RentalListing | null>(null)
  const [bookings, setBookings] = useState<RentalBooking[]>([])
  const [stats, setStats] = useState<BookingStats>({
    total_bookings: 0,
    confirmed_bookings: 0,
    pending_bookings: 0,
    total_revenue: 0,
    average_nightly_rate: 0,
    occupancy_rate: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<RentalBooking | null>(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedBookingForQR, setSelectedBookingForQR] = useState<RentalBooking | null>(null)
  const [bookingQRCodes, setBookingQRCodes] = useState<any[]>([])
  const [loadingQRCodes, setLoadingQRCodes] = useState(false)

  const rentalId = params.id as string

  useEffect(() => {
    if (rentalId) {
      fetchRentalData()
      fetchBookings()
      fetchBookingStats()
    }
  }, [rentalId])

  const fetchRentalData = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('rental_listings')
        .select(`
          id,
          property_id,
          properties (
            title,
            city,
            address
          )
        `)
        .eq('id', rentalId)
        .single()

      if (error) throw error
      setRental(data)
    } catch (err) {
      console.error('Error fetching rental data:', err)
      toast.error('Failed to load rental information')
    }
  }

  const fetchBookings = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('rental_bookings')
        .select(`
          *,
          guest_profiles:user_profiles!rental_bookings_guest_user_id_fkey (
            full_name,
            profile_photo_url
          )
        `)
        .eq('rental_listing_id', rentalId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (err) {
      console.error('Error fetching bookings:', err)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookingStats = async () => {
    try {
      const supabase = createClient()
      
      // Get booking statistics
      const { data: bookingData, error } = await supabase
        .from('rental_bookings')
        .select('booking_status, payment_status, total_amount, nightly_rate')
        .eq('rental_listing_id', rentalId)

      if (error) throw error

      if (bookingData) {
        const totalBookings = bookingData.length
        const confirmedBookings = bookingData.filter(b => b.booking_status === 'confirmed').length
        const pendingBookings = bookingData.filter(b => b.booking_status === 'pending').length
        const totalRevenue = bookingData.reduce((sum, b) => sum + b.total_amount, 0)
        const avgNightlyRate = totalBookings > 0 ? bookingData.reduce((sum, b) => sum + b.nightly_rate, 0) / totalBookings : 0
        
        setStats({
          total_bookings: totalBookings,
          confirmed_bookings: confirmedBookings,
          pending_bookings: pendingBookings,
          total_revenue: totalRevenue,
          average_nightly_rate: avgNightlyRate,
          occupancy_rate: 0 // Would need calendar data to calculate this
        })
      }
    } catch (err) {
      console.error('Error fetching booking stats:', err)
    }
  }

  const handleBookingStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('rental_bookings')
        .update({ 
          booking_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      toast.success(`Booking ${newStatus} successfully`)
      fetchBookings()
      fetchBookingStats()
    } catch (err) {
      console.error('Error updating booking status:', err)
      toast.error('Failed to update booking status')
    }
  }

  const handleQRCodeManagement = async (booking: RentalBooking) => {
    setSelectedBookingForQR(booking)
    setLoadingQRCodes(true)
    setShowQRModal(true)

    try {
      const response = await fetch(`/api/admin/bookings-qr/${booking.id}/qr-codes`)
      if (response.ok) {
        const data = await response.json()
        setBookingQRCodes(data.qrCodes || [])
      } else {
        toast.error('Failed to load QR codes')
      }
    } catch (error) {
      console.error('Error loading QR codes:', error)
      toast.error('Failed to load QR codes')
    } finally {
      setLoadingQRCodes(false)
    }
  }

  const handleUploadQRCode = async (qrData: any) => {
    if (!selectedBookingForQR) return

    try {
      const response = await fetch(`/api/admin/bookings-qr/${selectedBookingForQR.id}/qr-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qrData),
      })

      if (response.ok) {
        const data = await response.json()
        setBookingQRCodes(prev => [...prev, data.qrCode])
        toast.success('QR code uploaded successfully')
        fetchBookings() // Refresh to update QR status
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload QR code')
      }
    } catch (error) {
      console.error('Error uploading QR code:', error)
      toast.error('Failed to upload QR code')
    }
  }

  const getFilteredBookings = () => {
    return bookings.filter(booking => {
      const matchesSearch = !searchTerm || 
        booking.guest_profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter
      const matchesPayment = paymentFilter === 'all' || booking.payment_status === paymentFilter
      
      return matchesSearch && matchesStatus && matchesPayment
    })
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'checked_in': return 'bg-blue-100 text-blue-800'
      case 'checked_out': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentBadgeColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'partial': return 'bg-orange-100 text-orange-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} EGP`
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  if (!rental) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Rental Not Found</h2>
          <p className="text-gray-600 mb-4">Could not load rental information</p>
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
                href={`/admin/rentals/${rentalId}`}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Booking Management
                </h1>
                <p className="text-sm text-gray-500">
                  {rental.properties?.title} • {rental.properties?.city}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={fetchBookings}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.total_bookings}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmed_bookings}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_bookings}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.total_revenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Nightly</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.average_nightly_rate)}</p>
                </div>
                <Star className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupancy</p>
                  <p className="text-2xl font-bold">{Math.round(stats.occupancy_rate)}%</p>
                </div>
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by guest name, email, or booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings ({getFilteredBookings().length})</CardTitle>
            <CardDescription>
              Manage guest bookings and reservations for this rental property
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getFilteredBookings().length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No bookings found</h3>
                <p className="text-gray-500">
                  {bookings.length === 0 
                    ? 'This rental property has no bookings yet'
                    : 'Try adjusting your search or filters'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredBookings().map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Guest Avatar */}
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {booking.guest_profiles.profile_photo_url ? (
                            <img
                              src={booking.guest_profiles.profile_photo_url}
                              alt={booking.guest_profiles.full_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-blue-600" />
                          )}
                        </div>

                        {/* Booking Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {booking.guest_profiles.full_name}
                            </h3>
                            <Badge className={getStatusBadgeColor(booking.booking_status)}>
                              {booking.booking_status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPaymentBadgeColor(booking.payment_status)}>
                              {booking.payment_status}
                            </Badge>
                            {/* QR Code Status Badge */}
                            {booking.qr_upload_status === 'uploaded' && (
                              <Badge className="bg-purple-100 text-purple-800">
                                <QrCode className="w-3 h-3 mr-1" />
                                QR Ready
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{booking.number_of_guests} guests • {booking.number_of_nights} nights</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatCurrency(booking.total_amount)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4" />
                              <span>{booking.guest_email}</span>
                            </div>
                          </div>

                          {booking.special_requests && (
                            <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 mb-3">
                              <strong>Special requests:</strong> {booking.special_requests}
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            Booking ID: {booking.id} • Created {formatDate(booking.created_at)}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 ml-4">
                        {booking.booking_status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleBookingStatusChange(booking.id, 'confirmed')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBookingStatusChange(booking.id, 'cancelled')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}

                        {booking.booking_status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBookingStatusChange(booking.id, 'checked_in')}
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Check In
                          </Button>
                        )}

                        {booking.booking_status === 'checked_in' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBookingStatusChange(booking.id, 'checked_out')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Check Out
                          </Button>
                        )}

                        {/* QR Code Management Button - Show for confirmed/checked_in bookings */}
                        {['confirmed', 'checked_in', 'checked_out'].includes(booking.booking_status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQRCodeManagement(booking)}
                            className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                          >
                            <QrCode className="w-4 h-4 mr-1" />
                            QR Codes
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowBookingDetails(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowBookingDetails(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Booking Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Guest</label>
                    <p className="text-sm text-gray-900">{selectedBooking.guest_profiles.full_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Check-in / Check-out</label>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedBooking.check_in_date)} - {formatDate(selectedBooking.check_out_date)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Payment Breakdown</label>
                    <div className="text-sm text-gray-900 space-y-1">
                      <p>Nightly rate: {formatCurrency(selectedBooking.nightly_rate)} × {selectedBooking.number_of_nights} nights</p>
                      <p>Subtotal: {formatCurrency(selectedBooking.total_nights_cost)}</p>
                      {selectedBooking.cleaning_fee > 0 && <p>Cleaning fee: {formatCurrency(selectedBooking.cleaning_fee)}</p>}
                      {selectedBooking.security_deposit > 0 && <p>Security deposit: {formatCurrency(selectedBooking.security_deposit)}</p>}
                      <p>Platform fee: {formatCurrency(selectedBooking.platform_fee)}</p>
                      <p className="font-semibold border-t pt-1">Total: {formatCurrency(selectedBooking.total_amount)}</p>
                    </div>
                  </div>
                  
                  {selectedBooking.paymob_transaction_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Transaction ID</label>
                      <p className="text-sm text-gray-900">{selectedBooking.paymob_transaction_id}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button onClick={() => setShowBookingDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Management Modal */}
      {showQRModal && selectedBookingForQR && (
        <QRCodeManagementModal
          booking={selectedBookingForQR}
          qrCodes={bookingQRCodes}
          loading={loadingQRCodes}
          onClose={() => {
            setShowQRModal(false)
            setSelectedBookingForQR(null)
            setBookingQRCodes([])
          }}
          onUploadQR={handleUploadQRCode}
          onRefresh={() => handleQRCodeManagement(selectedBookingForQR)}
        />
      )}
    </div>
  )
}

// QR Code Management Modal Component
function QRCodeManagementModal({
  booking,
  qrCodes,
  loading,
  onClose,
  onUploadQR,
  onRefresh
}: {
  booking: RentalBooking
  qrCodes: any[]
  loading: boolean
  onClose: () => void
  onUploadQR: (qrData: any) => void
  onRefresh: () => void
}) {
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadFormData, setUploadFormData] = useState({
    qr_image_url: '',
    qr_type: 'access',
    qr_label: '',
    qr_description: '',
    valid_from: '',
    valid_until: '',
    usage_limit: ''
  })

  // Set default dates when form opens
  useEffect(() => {
    if (showUploadForm && !uploadFormData.valid_from) {
      const checkIn = new Date(booking.check_in_date)
      const checkOut = new Date(booking.check_out_date)
      
      // Set QR codes to be valid from 1 day before check-in to check-out date
      checkIn.setDate(checkIn.getDate() - 1)
      
      setUploadFormData(prev => ({
        ...prev,
        valid_from: checkIn.toISOString().slice(0, 16),
        valid_until: checkOut.toISOString().slice(0, 16)
      }))
    }
  }, [showUploadForm, booking, uploadFormData.valid_from])

  const handleSubmitQR = () => {
    // Validate form
    if (!uploadFormData.qr_image_url || !uploadFormData.valid_from || !uploadFormData.valid_until) {
      toast.error('Please fill in all required fields')
      return
    }

    const qrData = {
      ...uploadFormData,
      usage_limit: uploadFormData.usage_limit ? parseInt(uploadFormData.usage_limit) : null
    }

    onUploadQR(qrData)
    setShowUploadForm(false)
    setUploadFormData({
      qr_image_url: '',
      qr_type: 'access',
      qr_label: '',
      qr_description: '',
      valid_from: '',
      valid_until: '',
      usage_limit: ''
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getQRTypeColor = (type: string) => {
    switch (type) {
      case 'access': return 'bg-blue-100 text-blue-800'
      case 'parking': return 'bg-green-100 text-green-800'
      case 'amenity': return 'bg-purple-100 text-purple-800'
      case 'gate': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  QR Code Management
                </h3>
                <p className="text-sm text-gray-600">
                  {booking.guest_profiles.full_name} • {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => setShowUploadForm(true)}
                  disabled={showUploadForm}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Upload QR Code
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading QR codes...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Upload Form */}
                {showUploadForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Upload New QR Code</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            QR Code Image URL *
                          </label>
                          <Input
                            value={uploadFormData.qr_image_url}
                            onChange={(e) => setUploadFormData(prev => ({...prev, qr_image_url: e.target.value}))}
                            placeholder="https://example.com/qr-code.png"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            QR Type
                          </label>
                          <Select value={uploadFormData.qr_type} onValueChange={(value) => 
                            setUploadFormData(prev => ({...prev, qr_type: value}))
                          }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="access">Property Access</SelectItem>
                              <SelectItem value="parking">Parking</SelectItem>
                              <SelectItem value="gate">Gate Access</SelectItem>
                              <SelectItem value="elevator">Elevator</SelectItem>
                              <SelectItem value="pool">Pool Area</SelectItem>
                              <SelectItem value="gym">Gym</SelectItem>
                              <SelectItem value="amenity">Other Amenity</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Label
                          </label>
                          <Input
                            value={uploadFormData.qr_label}
                            onChange={(e) => setUploadFormData(prev => ({...prev, qr_label: e.target.value}))}
                            placeholder="e.g., Main Gate Access"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Usage Limit (optional)
                          </label>
                          <Input
                            type="number"
                            value={uploadFormData.usage_limit}
                            onChange={(e) => setUploadFormData(prev => ({...prev, usage_limit: e.target.value}))}
                            placeholder="Leave empty for unlimited"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <Input
                          value={uploadFormData.qr_description}
                          onChange={(e) => setUploadFormData(prev => ({...prev, qr_description: e.target.value}))}
                          placeholder="Additional instructions or notes"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valid From *
                          </label>
                          <Input
                            type="datetime-local"
                            value={uploadFormData.valid_from}
                            onChange={(e) => setUploadFormData(prev => ({...prev, valid_from: e.target.value}))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valid Until *
                          </label>
                          <Input
                            type="datetime-local"
                            value={uploadFormData.valid_until}
                            onChange={(e) => setUploadFormData(prev => ({...prev, valid_until: e.target.value}))}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setShowUploadForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSubmitQR}>
                          Upload QR Code
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Existing QR Codes */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Existing QR Codes ({qrCodes.length})
                  </h4>
                  
                  {qrCodes.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No QR codes uploaded yet</p>
                      <p className="text-sm text-gray-500">Upload QR codes to provide guest access</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {qrCodes.map((qr) => (
                        <div key={qr.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <Badge className={getQRTypeColor(qr.qr_type)}>
                                  {qr.qr_type.replace('_', ' ')}
                                </Badge>
                                {qr.qr_label && (
                                  <span className="font-medium text-gray-900">{qr.qr_label}</span>
                                )}
                                <Badge className={qr.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {qr.status}
                                </Badge>
                              </div>
                              
                              {qr.qr_description && (
                                <p className="text-sm text-gray-600 mb-2">{qr.qr_description}</p>
                              )}
                              
                              <div className="text-xs text-gray-500 space-y-1">
                                <p>Valid: {formatDate(qr.valid_from)} - {formatDate(qr.valid_until)}</p>
                                <p>Usage: {qr.times_used}{qr.usage_limit ? ` / ${qr.usage_limit}` : ' (unlimited)'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(qr.qr_image_url, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}