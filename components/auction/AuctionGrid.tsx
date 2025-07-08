"use client"

import { useState, useEffect } from 'react'
import { Filter, SortAsc, SortDesc, Search, MapPin, Calendar, Gavel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useTranslation } from 'react-i18next'
import { useNumberTranslation } from '@/lib/useNumberTranslation'
import { AuctionCard } from './AuctionCard'
import { TourModal } from './TourModal'
import { AuctionProperty, AuctionFilters, AuctionSorting } from '@/types/auction'

interface AuctionGridProps {
  auctions: AuctionProperty[]
  isLoading?: boolean
  onBidClick?: (auction: AuctionProperty) => void
  onBuyNowClick?: (auction: AuctionProperty) => void
  onViewTour?: (auction: AuctionProperty) => void
  onLoadMore?: () => void
  hasMore?: boolean
  totalCount?: number
  className?: string
}

export function AuctionGrid({
  auctions,
  isLoading = false,
  onBidClick,
  onBuyNowClick,
  onViewTour,
  onLoadMore,
  hasMore = false,
  totalCount = 0,
  className = ""
}: AuctionGridProps) {
  const { t } = useTranslation()
  const { safeT } = useNumberTranslation()
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTourAuction, setSelectedTourAuction] = useState<AuctionProperty | null>(null)
  const [filters, setFilters] = useState<AuctionFilters>({
    status: 'all',
    hasVirtualTour: false,
    hasBuyNow: false
  })
  const [sorting, setSorting] = useState<AuctionSorting>({
    field: 'start_time',
    direction: 'asc'
  })

  const [filteredAuctions, setFilteredAuctions] = useState(auctions)

  useEffect(() => {
    let filtered = auctions

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(auction =>
        auction.properties?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.properties?.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.properties?.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.properties?.state.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(auction => auction.status === filters.status)
    }

    // Apply property type filter
    if (filters.propertyType && filters.propertyType !== 'all') {
      filtered = filtered.filter(auction => 
        auction.properties?.property_type === filters.propertyType
      )
    }

    // Apply price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(auction => {
        const price = auction.buy_now_price || auction.reserve_price
        return price >= filters.priceRange![0] && price <= filters.priceRange![1]
      })
    }

    // Apply virtual tour filter
    if (filters.hasVirtualTour) {
      filtered = filtered.filter(auction => !!auction.properties?.virtual_tour_url)
    }

    // Apply buy now filter
    if (filters.hasBuyNow) {
      filtered = filtered.filter(auction => !!auction.buy_now_price)
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(auction =>
        auction.properties?.city.toLowerCase().includes(filters.location!.toLowerCase()) ||
        auction.properties?.state.toLowerCase().includes(filters.location!.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sorting.field) {
        case 'start_time':
          aValue = new Date(a.start_time).getTime()
          bValue = new Date(b.start_time).getTime()
          break
        case 'end_time':
          aValue = new Date(a.end_time).getTime()
          bValue = new Date(b.end_time).getTime()
          break
        case 'current_bid':
          aValue = a.current_bid
          bValue = b.current_bid
          break
        case 'reserve_price':
          aValue = a.reserve_price
          bValue = b.reserve_price
          break
        case 'bid_count':
          aValue = a.bid_count
          bValue = b.bid_count
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        default:
          aValue = a[sorting.field]
          bValue = b[sorting.field]
      }

      if (sorting.direction === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredAuctions(filtered)
  }, [auctions, searchTerm, filters, sorting])

  const getStatusCounts = () => {
    const counts = {
      all: auctions.length,
      preview: auctions.filter(a => a.status === 'preview').length,
      live: auctions.filter(a => a.status === 'live').length,
      ended: auctions.filter(a => a.status === 'ended').length,
      sold: auctions.filter(a => a.status === 'sold').length
    }
    return counts
  }

  const statusCounts = getStatusCounts()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {t('auction.propertyAuctions', 'Property Auctions')}
          </h2>
          <p className="text-slate-600 mt-1">
            {totalCount > 0 
              ? t('auction.showingResults', `Showing ${filteredAuctions.length} of ${totalCount} auctions`)
              : t('auction.noResults', 'No auctions found')
            }
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center"
        >
          <Filter className="h-4 w-4 mr-2" />
          {t('auction.filters', 'Filters')}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder={t('auction.searchPlaceholder', 'Search by property title, address, or location...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Button
            key={status}
            variant={filters.status === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters({ ...filters, status: status as any })}
            className="flex items-center"
          >
            <span className="capitalize">{status === 'all' ? t('auction.all', 'All') : t(`auction.${status}`, status)}</span>
            <Badge variant="secondary" className="ml-2">
              {count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('auction.advancedFilters', 'Advanced Filters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Location Filter */}
              <div>
                <Label htmlFor="location" className="text-sm font-medium">
                  {t('auction.location', 'Location')}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="location"
                    placeholder={t('auction.cityState', 'City, State')}
                    value={filters.location || ''}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Property Type Filter */}
              <div>
                <Label className="text-sm font-medium">
                  {t('auction.propertyType', 'Property Type')}
                </Label>
                <Select
                  value={filters.propertyType || ''}
                  onValueChange={(value) => setFilters({ ...filters, propertyType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('auction.selectPropertyType', 'Select type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('auction.allTypes', 'All Types')}</SelectItem>
                    <SelectItem value="house">{t('auction.house', 'House')}</SelectItem>
                    <SelectItem value="apartment">{t('auction.apartment', 'Apartment')}</SelectItem>
                    <SelectItem value="condo">{t('auction.condo', 'Condo')}</SelectItem>
                    <SelectItem value="townhouse">{t('auction.townhouse', 'Townhouse')}</SelectItem>
                    <SelectItem value="land">{t('auction.land', 'Land')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div>
                <Label className="text-sm font-medium">
                  {t('auction.sortBy', 'Sort By')}
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={sorting.field}
                    onValueChange={(value) => setSorting({ ...sorting, field: value as any })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start_time">{t('auction.startTime', 'Start Time')}</SelectItem>
                      <SelectItem value="end_time">{t('auction.endTime', 'End Time')}</SelectItem>
                      <SelectItem value="current_bid">{t('auction.currentBid', 'Current Bid')}</SelectItem>
                      <SelectItem value="reserve_price">{t('auction.reservePrice', 'Reserve Price')}</SelectItem>
                      <SelectItem value="bid_count">{t('auction.bidCount', 'Bid Count')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSorting({ ...sorting, direction: sorting.direction === 'asc' ? 'desc' : 'asc' })}
                  >
                    {sorting.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Checkbox Filters */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasVirtualTour"
                  checked={filters.hasVirtualTour}
                  onCheckedChange={(checked) => setFilters({ ...filters, hasVirtualTour: !!checked })}
                />
                <Label htmlFor="hasVirtualTour" className="text-sm">
                  {t('auction.hasVirtualTour', 'Has Virtual Tour')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasBuyNow"
                  checked={filters.hasBuyNow}
                  onCheckedChange={(checked) => setFilters({ ...filters, hasBuyNow: !!checked })}
                />
                <Label htmlFor="hasBuyNow" className="text-sm">
                  {t('auction.hasBuyNow', 'Buy Now Available')}
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auction Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="overflow-hidden animate-pulse">
              <div className="h-64 bg-slate-200" />
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-20 bg-slate-200 rounded" />
                  <div className="h-10 bg-slate-200 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAuctions.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onBidClick={onBidClick}
                onBuyNowClick={onBuyNowClick}
                onViewTour={(auction) => {
                  setSelectedTourAuction(auction)
                  onViewTour?.(auction)
                }}
              />
            ))}
          </div>
          
          {hasMore && (
            <div className="text-center">
              <Button
                onClick={onLoadMore}
                variant="outline"
                className="px-8"
                disabled={isLoading}
              >
                {isLoading ? t('auction.loading', 'Loading...') : t('auction.loadMore', 'Load More')}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Gavel className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {t('auction.noAuctionsFound', 'No auctions found')}
          </h3>
          <p className="text-slate-600">
            {t('auction.tryAdjustingFilters', 'Try adjusting your filters or search criteria')}
          </p>
        </div>
      )}

      {/* Tour Modal */}
      {selectedTourAuction && (
        <TourModal
          auction={selectedTourAuction}
          isOpen={!!selectedTourAuction}
          onClose={() => setSelectedTourAuction(null)}
          onBidPlaced={(amount, maxBid) => {
            onBidClick?.(selectedTourAuction)
            // You might want to handle the bid placement here
          }}
          onBuyNow={() => {
            onBuyNowClick?.(selectedTourAuction)
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}