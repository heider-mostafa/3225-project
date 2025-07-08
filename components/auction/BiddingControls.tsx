"use client"

import { useState } from 'react'
import { Gavel, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { BiddingControlsProps } from '@/types/auction'
import { BidSuccessAnimation } from './BidSuccessAnimation'

export function BiddingControls({ 
  auction, 
  onBidPlaced, 
  onBuyNow, 
  isLoading = false,
  userMaxBid 
}: BiddingControlsProps) {
  const { t } = useTranslation()
  const [bidAmount, setBidAmount] = useState('')
  const [autoBidMax, setAutoBidMax] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [lastBidData, setLastBidData] = useState<{
    amount: number
    isWinning: boolean
    isReserveMet: boolean
    bidRank: 'first' | 'outbid_previous' | 'new_high' | 'reserve_met'
  } | null>(null)

  const calculateMinimumIncrement = (currentBid: number) => {
    if (currentBid < 100000) return 1000
    if (currentBid < 500000) return 5000
    if (currentBid < 1000000) return 10000
    return 25000
  }

  const minimumIncrement = calculateMinimumIncrement(auction.current_bid)
  const minimumBid = auction.current_bid + minimumIncrement
  const isValidBid = parseFloat(bidAmount) >= minimumBid
  const isReserveMet = auction.current_bid >= auction.reserve_price

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidBid) return
    
    const amount = parseFloat(bidAmount)
    const maxBid = autoBidMax ? parseFloat(autoBidMax) : undefined
    
    // Determine bid rank for animation
    let bidRank: 'first' | 'outbid_previous' | 'new_high' | 'reserve_met' = 'new_high'
    
    if (auction.current_bid === 0) {
      bidRank = 'first'
    } else if (auction.current_bid < auction.reserve_price && amount >= auction.reserve_price) {
      bidRank = 'reserve_met'
    } else if (amount > auction.current_bid) {
      bidRank = 'outbid_previous'
    }
    
    // Store bid data for animation
    setLastBidData({
      amount,
      isWinning: true, // Always true for new bids
      isReserveMet: amount >= auction.reserve_price,
      bidRank
    })
    
    // Create enhanced onBidPlaced callback
    const enhancedOnBidPlaced = (amount: number, maxBid?: number) => {
      onBidPlaced(amount, maxBid)
      
      // Show success animation after a brief delay
      setTimeout(() => {
        setShowAnimation(true)
      }, 300)
    }
    
    enhancedOnBidPlaced(amount, maxBid)
    setBidAmount('')
    setAutoBidMax('')
  }

  const handleQuickBid = (multiplier: number) => {
    const amount = minimumBid + (minimumIncrement * multiplier)
    
    // Determine bid rank for quick bid animation
    let bidRank: 'first' | 'outbid_previous' | 'new_high' | 'reserve_met' = 'new_high'
    
    if (auction.current_bid === 0) {
      bidRank = 'first'
    } else if (auction.current_bid < auction.reserve_price && amount >= auction.reserve_price) {
      bidRank = 'reserve_met'
    } else if (amount > auction.current_bid) {
      bidRank = 'outbid_previous'
    }
    
    // Store bid data for animation
    setLastBidData({
      amount,
      isWinning: true,
      isReserveMet: amount >= auction.reserve_price,
      bidRank
    })
    
    // Create enhanced callback for quick bid
    const enhancedOnBidPlaced = (amount: number, maxBid?: number) => {
      onBidPlaced(amount, maxBid)
      
      // Show success animation after a brief delay
      setTimeout(() => {
        setShowAnimation(true)
      }, 300)
    }
    
    enhancedOnBidPlaced(amount, undefined)
  }

  if (auction.status !== 'live') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gavel className="h-5 w-5 mr-2" />
            {t('auction.biddingControls', 'Bidding Controls')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              {auction.status === 'preview' 
                ? t('auction.biddingStartsSoon', 'Bidding starts soon')
                : t('auction.biddingEnded', 'Bidding has ended')
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Gavel className="h-5 w-5 mr-2" />
              {t('auction.placeBid', 'Place Bid')}
            </div>
            <Badge variant={isReserveMet ? "default" : "destructive"}>
              {isReserveMet 
                ? t('auction.reserveMet', 'Reserve Met')
                : t('auction.reserveNotMet', 'Reserve Not Met')
              }
            </Badge>
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Bid Info */}
        <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <div className="text-xs sm:text-sm text-slate-600">
                {t('auction.currentBid', 'Current Bid')}
              </div>
              <div className="text-lg sm:text-xl font-bold">
                {auction.current_bid > 0 ? formatPrice(auction.current_bid) : t('auction.noBids', 'No bids')}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-slate-600">
                {t('auction.minimumBid', 'Minimum Bid')}
              </div>
              <div className="text-lg sm:text-xl font-bold text-blue-600">
                {formatPrice(minimumBid)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Bid Buttons */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            {t('auction.quickBid', 'Quick Bid')}
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickBid(0)}
              disabled={isLoading}
              className="h-10 sm:h-9 touch-manipulation"
            >
              <span className="text-xs sm:text-sm">{formatPrice(minimumBid)}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickBid(1)}
              disabled={isLoading}
              className="h-10 sm:h-9 touch-manipulation"
            >
              <span className="text-xs sm:text-sm">{formatPrice(minimumBid + minimumIncrement)}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickBid(2)}
              disabled={isLoading}
              className="h-10 sm:h-9 touch-manipulation"
            >
              <span className="text-xs sm:text-sm">{formatPrice(minimumBid + (minimumIncrement * 2))}</span>
            </Button>
          </div>
        </div>

        {/* Manual Bid Form */}
        <form onSubmit={handleBidSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bidAmount" className="text-sm font-medium">
              {t('auction.bidAmount', 'Bid Amount')}
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="bidAmount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={minimumBid.toString()}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {bidAmount && !isValidBid && (
              <p className="text-sm text-red-600 mt-1">
                {t('auction.minimumBidError', 'Bid must be at least')} {formatPrice(minimumBid)}
              </p>
            )}
          </div>

          {/* Advanced Options */}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              {t('auction.advancedOptions', 'Advanced Options')}
            </Button>
            
            {showAdvanced && (
              <div className="mt-2 space-y-2">
                <div>
                  <Label htmlFor="autoBidMax" className="text-sm">
                    {t('auction.autoBidMax', 'Auto-bid Maximum')}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="autoBidMax"
                      type="number"
                      value={autoBidMax}
                      onChange={(e) => setAutoBidMax(e.target.value)}
                      placeholder={t('auction.optional', 'Optional')}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {t('auction.autoBidDescription', 'Automatically bid up to this amount')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 sm:h-10 touch-manipulation"
            disabled={!isValidBid || isLoading}
          >
            <Gavel className="h-4 w-4 mr-2" />
            <span className="text-sm sm:text-base">
              {isLoading 
                ? t('auction.placingBid', 'Placing Bid...')
                : t('auction.placeBid', 'Place Bid')
              }
            </span>
          </Button>
        </form>

        {/* Buy Now Option */}
        {auction.buy_now_price && (
          <div className="pt-4 border-t">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">
                  {t('auction.buyNowOption', 'Buy Now Option')}
                </span>
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(auction.buy_now_price)}
                </span>
              </div>
              <p className="text-sm text-green-700 mb-3">
                {t('auction.buyNowDescription', 'End the auction immediately and secure the property')}
              </p>
              <Button
                onClick={onBuyNow}
                className="w-full bg-green-600 hover:bg-green-700 h-12 sm:h-10 touch-manipulation"
                disabled={isLoading}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                <span className="text-sm sm:text-base">
                  {isLoading 
                    ? t('auction.processing', 'Processing...')
                    : t('auction.buyNow', 'Buy Now')
                  }
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* User Bid Limit Warning */}
        {userMaxBid && parseFloat(bidAmount) > userMaxBid && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                {t('auction.bidLimitWarning', 'This bid exceeds your verified limit of')} {formatPrice(userMaxBid)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Bid Success Animation */}
    {lastBidData && (
      <BidSuccessAnimation
        isVisible={showAnimation}
        bidAmount={lastBidData.amount}
        isWinning={lastBidData.isWinning}
        isReserveMet={lastBidData.isReserveMet}
        bidRank={lastBidData.bidRank}
        onComplete={() => {
          setShowAnimation(false)
          setLastBidData(null)
        }}
      />
    )}
  </>
  )
}