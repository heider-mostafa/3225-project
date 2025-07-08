"use client"

import { useState } from 'react'
import { Clock, Eye, Gavel, Play, DollarSign, Users, Calendar, MapPin, Bed, Bath, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { useNumberTranslation } from '@/lib/useNumberTranslation'
import Link from 'next/link'
import { AuctionProperty, AuctionCardProps } from '@/types/auction'
import { AuctionCountdown } from './AuctionCountdown'

export function AuctionCard({ 
  auction, 
  onBidClick, 
  onBuyNowClick, 
  onViewTour,
  className = "" 
}: AuctionCardProps) {
  const { t } = useTranslation()
  const { translateNumber, translatePrice, safeT } = useNumberTranslation()
  const [imageError, setImageError] = useState(false)

  const property = auction.properties
  if (!property) return null

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

  const primaryImage = property.property_photos?.find(photo => photo.is_primary)?.url || 
                     property.property_photos?.[0]?.url || 
                     "/placeholder.svg"

  const isReserveMet = auction.current_bid >= auction.reserve_price
  const hasVirtualTour = !!property.virtual_tour_url

  return (
    <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 group ${className}`}>
      <div className="relative">
        <img
          src={imageError ? "/placeholder.svg" : primaryImage}
          alt={property.title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
        />
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <Badge className={getStatusColor(auction.status)}>
            {getStatusText(auction.status)}
          </Badge>
        </div>

        {/* Virtual Tour Badge */}
        {hasVirtualTour && (
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-purple-600 text-white">
              <Play className="h-3 w-3 mr-1" />
              {safeT('auction.virtualTour', '3D Tour')}
            </Badge>
          </div>
        )}

        {/* Reserve Price Indicator */}
        {auction.status === 'live' && (
          <div className="absolute bottom-4 left-4">
            <Badge 
              variant={isReserveMet ? "default" : "destructive"}
              className={isReserveMet ? "bg-green-600" : "bg-red-600"}
            >
              {isReserveMet 
                ? safeT('auction.reserveMet', 'Reserve Met')
                : safeT('auction.reserveNotMet', 'Reserve Not Met')
              }
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-6">
        {/* Property Title and Location */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-slate-800 mb-2 line-clamp-2">
            {property.title}
          </h3>
          <div className="flex items-center text-slate-600 text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            {property.address}, {property.city}, {property.state}
          </div>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-2 sm:gap-4 text-sm text-slate-600 mb-4 flex-wrap">
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">{translateNumber(property.bedrooms || 0)}</span>
          </div>
          <div className="flex items-center">
            <Bath className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">{translateNumber(property.bathrooms || 0)}</span>
          </div>
          <div className="flex items-center">
            <Square className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">{translateNumber(property.square_meters || 0)} {safeT('common.sqm', 'sqm')}</span>
          </div>
        </div>

        {/* Countdown Timer */}
        {['preview', 'live'].includes(auction.status) && (
          <div className="mb-4">
            <AuctionCountdown 
              targetTime={auction.status === 'preview' ? auction.start_time : auction.end_time}
              className="bg-slate-50 rounded-lg p-3"
            />
          </div>
        )}

        {/* Bidding Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 p-3 sm:p-4 bg-slate-50 rounded-lg">
          <div>
            <div className="text-xs sm:text-sm text-slate-600 mb-1">
              {safeT('auction.currentBid', 'Current Bid')}
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-800">
              {auction.current_bid > 0 ? formatPrice(auction.current_bid) : safeT('auction.noBids', 'No bids')}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-slate-600 mb-1">
              {safeT('auction.reservePrice', 'Reserve Price')}
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-800">
              {formatPrice(auction.reserve_price)}
            </div>
          </div>
          {auction.buy_now_price && (
            <div className="col-span-1 sm:col-span-2">
              <div className="text-xs sm:text-sm text-slate-600 mb-1">
                {safeT('auction.buyNowPrice', 'Buy Now Price')}
              </div>
              <div className="text-lg sm:text-xl font-bold text-green-600">
                {formatPrice(auction.buy_now_price)}
              </div>
            </div>
          )}
        </div>

        {/* Auction Stats */}
        <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
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

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {auction.status === 'live' && (
              <Button 
                onClick={() => onBidClick?.(auction)}
                className="bg-blue-600 hover:bg-blue-700 h-10 sm:h-9 touch-manipulation"
              >
                <Gavel className="h-4 w-4 mr-2" />
                <span className="text-sm">{safeT('auction.placeBid', 'Place Bid')}</span>
              </Button>
            )}
            
            {auction.buy_now_price && ['preview', 'live'].includes(auction.status) && (
              <Button 
                onClick={() => onBuyNowClick?.(auction)}
                className="bg-green-600 hover:bg-green-700 h-10 sm:h-9 touch-manipulation"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                <span className="text-sm">{safeT('auction.buyNow', 'Buy Now')}</span>
              </Button>
            )}
            
            {auction.status === 'preview' && !auction.buy_now_price && (
              <Button variant="outline" disabled className="col-span-1 sm:col-span-2 h-10 sm:h-9">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm">{safeT('auction.startsIn', 'Starts in')}</span> <AuctionCountdown targetTime={auction.start_time} compact />
              </Button>
            )}
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hasVirtualTour && (
              <Button 
                variant="outline" 
                onClick={() => onViewTour?.(auction)}
                className="border-purple-300 text-purple-700 hover:bg-purple-50 h-10 sm:h-9 touch-manipulation"
              >
                <Play className="h-4 w-4 mr-2" />
                <span className="text-sm">{safeT('auction.viewTour', 'View Tour')}</span>
              </Button>
            )}
            
            <Link href={`/auctions/${auction.id}`}>
              <Button variant="outline" className="w-full h-10 sm:h-9 touch-manipulation">
                <Eye className="h-4 w-4 mr-2" />
                <span className="text-sm">{safeT('auction.viewDetails', 'View Details')}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Additional Info for Preview Phase */}
        {auction.status === 'preview' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>{safeT('auction.previewPhase', 'Preview Phase')}</strong>
              <p className="mt-1">
                {safeT('auction.previewDescription', 'Explore the property and prepare for the live auction. Buy now option available.')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}