"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MapPin, Calendar, Clock, Eye, Users, Share2, Heart, ArrowLeft, Play, Gavel, DollarSign, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from 'react-i18next'
import { useNumberTranslation } from '@/lib/useNumberTranslation'
import Link from 'next/link'
import { AuctionProperty } from '@/types/auction'
import { AuctionCountdown } from '@/components/auction/AuctionCountdown'
import { BiddingControls } from '@/components/auction/BiddingControls'
import { BidHistory } from '@/components/auction/BidHistory'
import { TourViewer } from '@/components/tour-viewer'
import { TourBidOverlay } from '@/components/auction/TourBidOverlay'

export default function AuctionDetailPage() {
  const { t } = useTranslation()
  const { translateNumber, translatePrice, safeT } = useNumberTranslation()
  const params = useParams()
  const auctionId = params.id as string
  
  const [auction, setAuction] = useState<AuctionProperty | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTour, setShowTour] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isPlacingBid, setIsPlacingBid] = useState(false)
  const [showTourBidOverlay, setShowTourBidOverlay] = useState(true)

  // Fetch auction details
  useEffect(() => {
    if (auctionId) {
      fetchAuctionDetails()
    }
  }, [auctionId])

  const fetchAuctionDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/auctions/${auctionId}`)
      if (!response.ok) {
        throw new Error('Auction not found')
      }
      
      const data = await response.json()
      setAuction(data.auction)
    } catch (err) {
      console.error('Error fetching auction:', err)
      setError(err instanceof Error ? err.message : 'Failed to load auction')
    } finally {
      setLoading(false)
    }
  }

  const handleBidPlaced = async (amount: number, maxBid?: number) => {
    if (!auction) return
    
    try {
      setIsPlacingBid(true)
      
      const response = await fetch(`/api/auctions/${auction.id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          auto_bid_max: maxBid
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Update auction with new bid data
        setAuction(prev => prev ? {
          ...prev,
          current_bid: result.auction.currentBid,
          bid_count: result.auction.bidCount
        } : null)
        
        // Refresh full auction data to get updated bid history
        fetchAuctionDetails()
      } else {
        const error = await response.json()
        alert(`Bid failed: ${error.error}`)
      }
    } catch (err) {
      console.error('Bid placement error:', err)
      alert('Failed to place bid')
    } finally {
      setIsPlacingBid(false)
    }
  }

  const handleBuyNow = async () => {
    if (!auction?.buy_now_price) return
    
    const confirmed = confirm(
      `Are you sure you want to buy this property for ${translatePrice(auction.buy_now_price, 'USD')}? This will end the auction immediately.`
    )
    
    if (!confirmed) return
    
    try {
      const response = await fetch(`/api/auctions/${auction.id}/buy-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Successfully purchased property for ${translatePrice(result.purchase.amount, 'USD')}!`)
        
        // Refresh auction data
        fetchAuctionDetails()
      } else {
        const error = await response.json()
        alert(`Purchase failed: ${error.error}`)
      }
    } catch (err) {
      console.error('Buy now error:', err)
      alert('Failed to process purchase')
    }
  }

  const formatPrice = (price: number) => {
    return translatePrice(price, 'USD')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preview': return 'bg-blue-100 text-blue-800'
      case 'live': return 'bg-green-100 text-green-800 animate-pulse'
      case 'ended': return 'bg-gray-100 text-gray-800'
      case 'sold': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'preview': return safeT('auction.preview', 'Preview')
      case 'live': return safeT('auction.liveNow', 'Live Now')
      case 'ended': return safeT('auction.ended', 'Ended')
      case 'sold': return safeT('auction.sold', 'Sold')
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-slate-200 rounded-lg" />
              <div className="space-y-4">
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-32 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {safeT('auction.auctionNotFound', 'Auction Not Found')}
            </h2>
            <p className="text-slate-600 mb-6">{error || safeT('auction.auctionNotFoundDescription', 'This auction may have been removed or does not exist.')}</p>
            <Link href="/auctions">
              <Button>{safeT('auction.backToAuctions', 'Back to Auctions')}</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const property = auction.properties
  const photos = property?.property_photos || []
  const primaryImage = photos.find(p => p.is_primary)?.url || photos[0]?.url || "/placeholder.svg"
  const isReserveMet = auction.current_bid >= auction.reserve_price
  const hasVirtualTour = !!property?.virtual_tour_url

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/auctions">
            <Button variant="ghost" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {safeT('auction.backToAuctions', 'Back to Auctions')}
            </Button>
          </Link>
          
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(auction.status)}>
              {getStatusText(auction.status)}
            </Badge>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              {safeT('common.share', 'Share')}
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Left Column - Images and Tour */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Main Image/Tour */}
            <div className="relative">
              {showTour && hasVirtualTour ? (
                <div className="h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden relative">
                  <TourViewer tourId={`tour_${auction.property_id}`} className="w-full h-full" />
                  <Button
                    onClick={() => setShowTour(false)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70"
                    size="sm"
                  >
                    {safeT('common.closePreview', 'Close Tour')}
                  </Button>
                  
                  {/* Tour Bid Overlay */}
                  {auction.status === 'live' && (
                    <TourBidOverlay
                      auction={auction}
                      onBidPlaced={handleBidPlaced}
                      onBuyNow={handleBuyNow}
                      isLoading={isPlacingBid}
                      isVisible={showTourBidOverlay}
                      onToggleVisibility={() => setShowTourBidOverlay(!showTourBidOverlay)}
                    />
                  )}
                </div>
              ) : (
                <div className="relative h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden">
                  <img
                    src={photos[activeImageIndex]?.url || primaryImage}
                    alt={property?.title || 'Property'}
                    className="w-full h-full object-cover"
                  />
                  
                  {hasVirtualTour && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => setShowTour(true)}
                        className="bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {safeT('auction.viewTour', 'View Virtual Tour')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {photos.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setActiveImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      index === activeImageIndex ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>{safeT('auction.propertyDetails', 'Property Details')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{property?.title}</h3>
                    <div className="flex items-center text-slate-600 mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property?.address}, {property?.city}, {property?.state}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 py-4 border-y border-slate-200">
                    <div>
                      <div className="text-xs sm:text-sm text-slate-600">{safeT('common.bedrooms', 'Bedrooms')}</div>
                      <div className="text-base sm:text-lg font-semibold">{translateNumber(property?.bedrooms || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-slate-600">{safeT('common.bathrooms', 'Bathrooms')}</div>
                      <div className="text-base sm:text-lg font-semibold">{translateNumber(property?.bathrooms || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-slate-600">{safeT('common.area', 'Area')}</div>
                      <div className="text-base sm:text-lg font-semibold">{translateNumber(property?.square_meters || 0)} {safeT('common.sqm', 'sqm')}</div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-slate-600">{safeT('common.type', 'Type')}</div>
                      <div className="text-base sm:text-lg font-semibold capitalize">{property?.property_type.replace('_', ' ')}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">{safeT('common.description', 'Description')}</h4>
                    <p className="text-slate-600">{property?.description}</p>
                  </div>
                  
                  {property?.features && property.features.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">{safeT('common.features', 'Features')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {property.features.map((feature, index) => (
                          <Badge key={index} variant="outline">{feature}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Auction Info */}
          <div className="space-y-4 lg:space-y-6">
            {/* Auction Status */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="text-center mb-4">
                  <Badge className={`${getStatusColor(auction.status)} text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2`}>
                    {getStatusText(auction.status)}
                  </Badge>
                </div>
                
                {['preview', 'live'].includes(auction.status) && (
                  <AuctionCountdown
                    targetTime={auction.status === 'preview' ? auction.start_time : auction.end_time}
                    className="mb-4"
                  />
                )}
                
                {/* Pricing Info */}
                <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-slate-600 mb-1">
                      {safeT('auction.currentBid', 'Current Bid')}
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                      {auction.current_bid > 0 ? formatPrice(auction.current_bid) : safeT('auction.noBids', 'No bids')}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-slate-600 mb-1">
                        {safeT('auction.reservePrice', 'Reserve')}
                      </div>
                      <div className="text-lg font-bold text-slate-800">
                        {formatPrice(auction.reserve_price)}
                      </div>
                    </div>
                    
                    {auction.buy_now_price && (
                      <div className="text-center">
                        <div className="text-sm text-slate-600 mb-1">
                          {safeT('auction.buyNow', 'Buy Now')}
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(auction.buy_now_price)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Auction Stats */}
                <div className="flex items-center justify-between text-sm text-slate-600 mt-4">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {translateNumber(auction.bid_count)} {safeT('auction.bids', 'bids')}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(auction.start_time).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(auction.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bidding Controls */}
            <BiddingControls
              auction={auction}
              onBidPlaced={handleBidPlaced}
              onBuyNow={handleBuyNow}
              isLoading={isPlacingBid}
            />

            {/* Reserve Price Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Info className="h-4 w-4 text-slate-600 mr-2" />
                    <span className="text-sm text-slate-600">
                      {safeT('auction.reservePrice', 'Reserve Price')}
                    </span>
                  </div>
                  <Badge variant={isReserveMet ? "default" : "destructive"}>
                    {isReserveMet 
                      ? safeT('auction.reserveMet', 'Reserve Met')
                      : safeT('auction.reserveNotMet', 'Reserve Not Met')
                    }
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  {safeT('auction.reserveDescription', 'The reserve price is the minimum amount the seller will accept for this property.')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8">
          <Tabs defaultValue="bidHistory" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bidHistory">{safeT('auction.bidHistory', 'Bid History')}</TabsTrigger>
              <TabsTrigger value="auctionInfo">{safeT('auction.auctionInfo', 'Auction Info')}</TabsTrigger>
              <TabsTrigger value="location">{safeT('common.location', 'Location')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bidHistory">
              <BidHistory bids={auction.bids || []} />
            </TabsContent>
            
            <TabsContent value="auctionInfo">
              <Card>
                <CardHeader>
                  <CardTitle>{safeT('auction.auctionInformation', 'Auction Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-600">{safeT('auction.auctionType', 'Auction Type')}</div>
                      <div className="font-semibold capitalize">{auction.auction_type}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">{safeT('auction.previewStart', 'Preview Starts')}</div>
                      <div className="font-semibold">{new Date(auction.preview_start).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">{safeT('auction.auctionStart', 'Auction Starts')}</div>
                      <div className="font-semibold">{new Date(auction.start_time).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">{safeT('auction.auctionEnd', 'Auction Ends')}</div>
                      <div className="font-semibold">{new Date(auction.end_time).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">{safeT('auction.commissionRate', 'Commission Rate')}</div>
                      <div className="font-semibold">{translateNumber((auction.commission_rate * 100).toFixed(1))}%</div>
                    </div>
                  </div>
                  
                  {auction.events && auction.events.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">{safeT('auction.recentActivity', 'Recent Activity')}</h4>
                      <div className="space-y-2">
                        {auction.events.slice(0, 5).map((event, index) => (
                          <div key={event.id} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 capitalize">{event.event_type.replace('_', ' ')}</span>
                            <span className="text-slate-500">{new Date(event.created_at).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle>{safeT('common.location', 'Location')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-slate-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{property?.address}, {property?.city}, {property?.state}</span>
                    </div>
                    
                    {property?.latitude && property?.longitude && (
                      <div className="h-64 bg-slate-200 rounded-lg flex items-center justify-center">
                        <p className="text-slate-600">
                          {safeT('common.mapPlaceholder', 'Map will be displayed here')}
                        </p>
                      </div>
                    )}
                    
                    <div className="text-sm text-slate-600">
                      <p>{safeT('auction.locationDescription', 'This property is located in a prime area with excellent access to amenities and transportation.')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}