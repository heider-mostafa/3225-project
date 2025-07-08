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
  Gavel,
  DollarSign,
  MapPin,
  Calendar,
  MoreVertical,
  Clock,
  TrendingUp,
  Users,
  SlidersHorizontal,
  X,
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { isCurrentUserAdmin, logAdminActivity } from '@/lib/auth/admin-client'
import { supabase } from '@/lib/supabase/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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

interface AdminFilters {
  searchTerm: string
  statuses: string[]
  auctionTypes: string[]
  cities: string[]
  priceRange: [number, number]
  dateRange: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export default function AdminAuctions() {
  const { t } = useTranslation()
  const [auctions, setAuctions] = useState<AuctionProperty[]>([])
  const [filteredAuctions, setFilteredAuctions] = useState<AuctionProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showBasicFilters, setShowBasicFilters] = useState(false)

  // Filter states
  const [filters, setFilters] = useState<AdminFilters>({
    searchTerm: '',
    statuses: [],
    auctionTypes: [],
    cities: [],
    priceRange: [0, 10000000],
    dateRange: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const [stats, setStats] = useState({
    total: 0,
    preview: 0,
    live: 0,
    ended: 0,
    sold: 0,
    totalValue: 0,
    avgBidCount: 0
  })

  useEffect(() => {
    const checkAdminAccess = async () => {
      const isAdmin = await isCurrentUserAdmin()
      if (!isAdmin) {
        window.location.href = '/unauthorized'
        return
      }
      
      await logAdminActivity('auctions_page_access')
      fetchAuctions()
    }

    checkAdminAccess()
  }, [])

  const fetchAuctions = async () => {
    try {
      setLoading(true)
      console.log('Fetching auctions for admin panel...')
      
      const { data, error } = await supabase
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
        .order('created_at', { ascending: false })

      console.log('Admin auctions query result:', { 
        error: error ? error.message : null,
        count: data ? data.length : 0
      })

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      setAuctions(data || [])
      setFilteredAuctions(data || [])
      
      // Calculate stats
      const totalAuctions = data?.length || 0
      const previewCount = data?.filter(a => a.status === 'preview').length || 0
      const liveCount = data?.filter(a => a.status === 'live').length || 0
      const endedCount = data?.filter(a => a.status === 'ended').length || 0
      const soldCount = data?.filter(a => a.status === 'sold').length || 0
      const totalValue = data?.reduce((sum, a) => sum + (a.current_bid || a.reserve_price), 0) || 0
      const avgBidCount = totalAuctions > 0 ? (data?.reduce((sum, a) => sum + a.bid_count, 0) || 0) / totalAuctions : 0

      console.log('Calculated stats:', { totalAuctions, previewCount, liveCount, endedCount, soldCount })

      setStats({
        total: totalAuctions,
        preview: previewCount,
        live: liveCount,
        ended: endedCount,
        sold: soldCount,
        totalValue,
        avgBidCount: Math.round(avgBidCount * 10) / 10
      })
    } catch (error) {
      console.error('Error fetching auctions:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('auction_properties')
        .delete()
        .eq('id', id)

      if (error) throw error

      await logAdminActivity('auction_deleted', { auction_id: id })
      setAuctions(auctions.filter(a => a.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting auction:', error)
      alert('Failed to delete auction')
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = [...auctions]

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(auction =>
        auction.properties.title.toLowerCase().includes(term) ||
        auction.properties.address.toLowerCase().includes(term) ||
        auction.properties.city.toLowerCase().includes(term) ||
        auction.id.toLowerCase().includes(term)
      )
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(auction => filters.statuses.includes(auction.status))
    }

    // Auction type filter
    if (filters.auctionTypes.length > 0) {
      filtered = filtered.filter(auction => filters.auctionTypes.includes(auction.auction_type))
    }

    // City filter
    if (filters.cities.length > 0) {
      filtered = filtered.filter(auction => filters.cities.includes(auction.properties.city))
    }

    // Price range filter
    filtered = filtered.filter(auction => {
      const price = auction.current_bid || auction.reserve_price
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
    })

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      
      filtered = filtered.filter(auction => new Date(auction.created_at) >= filterDate)
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filters.sortBy) {
        case 'title':
          aValue = a.properties.title
          bValue = b.properties.title
          break
        case 'reserve_price':
          aValue = a.reserve_price
          bValue = b.reserve_price
          break
        case 'current_bid':
          aValue = a.current_bid
          bValue = b.current_bid
          break
        case 'bid_count':
          aValue = a.bid_count
          bValue = b.bid_count
          break
        case 'start_time':
          aValue = new Date(a.start_time)
          bValue = new Date(b.start_time)
          break
        case 'end_time':
          aValue = new Date(a.end_time)
          bValue = b.end_time
          break
        default:
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredAuctions(filtered)
  }, [auctions, filters])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'preview':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'live':
        return <PlayCircle className="h-4 w-4 text-green-600" />
      case 'ended':
        return <XCircle className="h-4 w-4 text-gray-600" />
      case 'sold':
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auction Management</h1>
          <p className="text-gray-600 mt-1">Manage property auctions and bidding</p>
        </div>
        <Link href="/admin/auctions/add">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Auction
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Auctions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Gavel className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Live Auctions</p>
              <p className="text-2xl font-bold text-green-600">{stats.live}</p>
            </div>
            <PlayCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-600">{formatPrice(stats.totalValue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Bids</p>
              <p className="text-2xl font-bold text-orange-600">{stats.avgBidCount}</p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBasicFilters(!showBasicFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Basic Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Advanced
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search auctions by title, address, city, or ID..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Basic Filters */}
        {showBasicFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Select
              value={filters.statuses[0] || ''}
              onValueChange={(value) => setFilters({ ...filters, statuses: value ? [value] : [] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="preview">Preview</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.auctionTypes[0] || ''}
              onValueChange={(value) => setFilters({ ...filters, auctionTypes: value ? [value] : [] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="timed">Timed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-')
                setFilters({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="start_time-asc">Start Time</SelectItem>
                <SelectItem value="end_time-asc">End Time</SelectItem>
                <SelectItem value="reserve_price-desc">Highest Reserve</SelectItem>
                <SelectItem value="current_bid-desc">Highest Bid</SelectItem>
                <SelectItem value="bid_count-desc">Most Bids</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Auctions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bids
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAuctions.map((auction) => (
                <tr key={auction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0">
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={auction.properties.property_photos?.[0]?.url || '/placeholder.svg'}
                          alt={auction.properties.title}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {auction.properties.title}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {auction.properties.city}, {auction.properties.state}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(auction.status)}
                      <Badge className={`ml-2 ${getStatusColor(auction.status)}`}>
                        {auction.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {auction.auction_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        Start: {formatDate(auction.start_time)}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        End: {formatDate(auction.end_time)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="font-medium">
                        Reserve: {formatPrice(auction.reserve_price)}
                      </div>
                      <div className="text-green-600 font-medium">
                        Current: {auction.current_bid > 0 ? formatPrice(auction.current_bid) : 'No bids'}
                      </div>
                      {auction.buy_now_price && (
                        <div className="text-blue-600 text-xs">
                          Buy Now: {formatPrice(auction.buy_now_price)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-gray-400" />
                      {auction.bid_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link href={`/auctions/${auction.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/auctions/edit/${auction.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {auction.status !== 'live' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(auction.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAuctions.length === 0 && (
          <div className="text-center py-12">
            <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No auctions found</h3>
            <p className="text-gray-500">Try adjusting your filters or create a new auction.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this auction? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}