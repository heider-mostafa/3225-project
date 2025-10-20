'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Users, 
  DollarSign,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  MapPin,
  Home,
  CreditCard,
  TrendingUp,
  Star
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface BookingWithDetails {
  id: string
  rental_listing_id: string
  guest_user_id: string
  check_in_date: string
  check_out_date: string
  total_nights: number
  guest_count: number
  nightly_rate: number
  total_amount: number
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded' | 'failed'
  booking_status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed'
  guest_email: string
  guest_phone: string
  special_requests: string
  created_at: string
  rental_listings: {
    id: string
    properties: {
      title: string
      city: string
      address: string
    }
  }
  guest_profiles: {
    full_name: string
    profile_photo_url: string
  }
}

interface GlobalBookingStats {
  total_bookings: number
  pending_bookings: number
  confirmed_bookings: number
  checked_in_bookings: number
  completed_bookings: number
  cancelled_bookings: number
  total_revenue: number
  pending_revenue: number
  this_month_bookings: number
  this_month_revenue: number
}

export default function GlobalBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [stats, setStats] = useState<GlobalBookingStats>({
    total_bookings: 0,
    pending_bookings: 0,
    confirmed_bookings: 0,
    checked_in_bookings: 0,
    completed_bookings: 0,
    cancelled_bookings: 0,
    total_revenue: 0,
    pending_revenue: 0,
    this_month_bookings: 0,
    this_month_revenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)

  useEffect(() => {
    fetchBookings()
    fetchBookingStats()
  }, [])

  const fetchBookings = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('rental_bookings')
        .select(`
          *,
          rental_listings!inner (
            id,
            properties!inner (
              title,
              city,
              address
            )
          ),
          guest_profiles:user_profiles!rental_bookings_guest_user_id_fkey (
            full_name,
            profile_photo_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

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
      
      const { data, error } = await supabase
        .from('rental_bookings')
        .select('booking_status, payment_status, total_amount, created_at')

      if (error) throw error

      if (data) {
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const thisMonthBookings = data.filter(b => new Date(b.created_at) >= thisMonth)
        
        setStats({
          total_bookings: data.length,
          pending_bookings: data.filter(b => b.booking_status === 'pending').length,
          confirmed_bookings: data.filter(b => b.booking_status === 'confirmed').length,
          checked_in_bookings: data.filter(b => b.booking_status === 'checked_in').length,
          completed_bookings: data.filter(b => b.booking_status === 'completed').length,
          cancelled_bookings: data.filter(b => b.booking_status === 'cancelled').length,
          total_revenue: data.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + b.total_amount, 0),
          pending_revenue: data.filter(b => b.payment_status === 'pending').reduce((sum, b) => sum + b.total_amount, 0),
          this_month_bookings: thisMonthBookings.length,
          this_month_revenue: thisMonthBookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + b.total_amount, 0)
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

  const getFilteredBookings = () => {
    return bookings.filter(booking => {
      const matchesSearch = !searchTerm || 
        booking.guest_profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.rental_listings.properties.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter
      const matchesPayment = paymentFilter === 'all' || booking.payment_status === paymentFilter
      const matchesCity = cityFilter === 'all' || booking.rental_listings.properties.city === cityFilter
      
      let matchesDate = true
      if (dateRange !== 'all') {
        const bookingDate = new Date(booking.created_at)
        const now = new Date()
        
        switch (dateRange) {
          case 'today':
            matchesDate = bookingDate.toDateString() === now.toDateString()
            break
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = bookingDate >= weekAgo
            break
          case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            matchesDate = bookingDate >= monthStart
            break
        }
      }
      
      return matchesSearch && matchesStatus && matchesPayment && matchesCity && matchesDate
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

  const uniqueCities = [...new Set(bookings.map(b => b.rental_listings.properties.city))]

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                <span>Global Booking Management</span>
              </h1>
              <p className="text-sm text-gray-500">
                Manage all rental bookings across your platform
              </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.total_bookings}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +{stats.this_month_bookings} this month
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_bookings}</p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(stats.pending_revenue)} pending
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Bookings</p>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmed_bookings + stats.checked_in_bookings}</p>
                  <p className="text-xs text-gray-500">
                    {stats.confirmed_bookings} confirmed, {stats.checked_in_bookings} checked in
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +{formatCurrency(stats.this_month_revenue)} this month
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all-bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all-bookings">All Bookings</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending_bookings})</TabsTrigger>
            <TabsTrigger value="active">Active ({stats.confirmed_bookings + stats.checked_in_bookings})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.completed_bookings})</TabsTrigger>
          </TabsList>

          <TabsContent value="all-bookings" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Primary Filter Row */}
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by guest name, property, email, or booking ID..."
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

                {/* Secondary Filter Row */}
                <div className="flex flex-col md:flex-row gap-4">
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {uniqueCities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                      setPaymentFilter('all')
                      setCityFilter('all')
                      setDateRange('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bookings List */}
            <Card>
              <CardHeader>
                <CardTitle>Bookings ({getFilteredBookings().length})</CardTitle>
                <CardDescription>
                  Manage guest bookings across all rental properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getFilteredBookings().length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">No bookings found</h3>
                    <p className="text-gray-500">
                      {bookings.length === 0 
                        ? 'No bookings have been made yet'
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
                              </div>

                              <div className="mb-2">
                                <p className="font-medium text-gray-900">
                                  {booking.rental_listings.properties.title}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {booking.rental_listings.properties.city}
                                </p>
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
                                  <span>{booking.guest_count} guests • {booking.total_nights} nights</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4" />
                                  <span>{formatCurrency(booking.total_amount)}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(booking.created_at)}
                                </div>
                              </div>

                              {booking.special_requests && (
                                <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 mb-3">
                                  <strong>Special requests:</strong> {booking.special_requests}
                                </div>
                              )}
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

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/rentals/${booking.rental_listing_id}/bookings`)}
                            >
                              <Home className="w-4 h-4 mr-1" />
                              Property
                            </Button>

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
          </TabsContent>

          {/* Other tab contents would be similar but filtered by status */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Bookings ({stats.pending_bookings})</CardTitle>
                <CardDescription>Bookings awaiting approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-gray-600">Filtered view for pending bookings would appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Bookings ({stats.confirmed_bookings + stats.checked_in_bookings})</CardTitle>
                <CardDescription>Confirmed and checked-in bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">Filtered view for active bookings would appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Bookings ({stats.completed_bookings})</CardTitle>
                <CardDescription>Successfully completed stays</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                  <p className="text-gray-600">Filtered view for completed bookings would appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowBookingDetails(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Booking Details - {selectedBooking.id}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Property</label>
                      <p className="text-sm text-gray-900">{selectedBooking.rental_listings.properties.title}</p>
                      <p className="text-xs text-gray-600">{selectedBooking.rental_listings.properties.city}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Guest</label>
                      <p className="text-sm text-gray-900">{selectedBooking.guest_profiles.full_name}</p>
                      <p className="text-xs text-gray-600">{selectedBooking.guest_email}</p>
                      {selectedBooking.guest_phone && (
                        <p className="text-xs text-gray-600">{selectedBooking.guest_phone}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Stay Details</label>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedBooking.check_in_date)} - {formatDate(selectedBooking.check_out_date)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedBooking.total_nights} nights • {selectedBooking.guest_count} guests
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="flex space-x-2 mt-1">
                        <Badge className={getStatusBadgeColor(selectedBooking.booking_status)}>
                          {selectedBooking.booking_status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPaymentBadgeColor(selectedBooking.payment_status)}>
                          {selectedBooking.payment_status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Payment</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(selectedBooking.total_amount)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatCurrency(selectedBooking.nightly_rate)} per night
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Booking Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedBooking.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                {selectedBooking.special_requests && (
                  <div className="mt-6">
                    <label className="text-sm font-medium text-gray-700">Special Requests</label>
                    <p className="text-sm text-gray-900 bg-gray-50 rounded p-3 mt-1">
                      {selectedBooking.special_requests}
                    </p>
                  </div>
                )}
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
    </div>
  )
}