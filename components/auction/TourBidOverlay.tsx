"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gavel, DollarSign, ChevronUp, ChevronDown, X, Users, Clock, TrendingUp, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { useNumberTranslation } from '@/lib/useNumberTranslation'
import { AuctionProperty } from '@/types/auction'
import { BidSuccessAnimation } from './BidSuccessAnimation'

interface TourBidOverlayProps {
  auction: AuctionProperty
  onBidPlaced: (amount: number, maxBid?: number) => void
  onBuyNow?: () => void
  isLoading?: boolean
  isVisible?: boolean
  onToggleVisibility?: () => void
}

export function TourBidOverlay({ 
  auction, 
  onBidPlaced, 
  onBuyNow, 
  isLoading = false,
  isVisible = true,
  onToggleVisibility 
}: TourBidOverlayProps) {
  const { t } = useTranslation()
  const { translatePrice, translateNumber, safeT } = useNumberTranslation()
  const [isMinimized, setIsMinimized] = useState(false)
  const [showQuickBids, setShowQuickBids] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [showAnimation, setShowAnimation] = useState(false)
  const [lastBidData, setLastBidData] = useState<{
    amount: number
    isWinning: boolean
    isReserveMet: boolean
    bidRank: 'first' | 'outbid_previous' | 'new_high' | 'reserve_met'
  } | null>(null)

  // Calculate minimum bid increment
  const calculateMinimumIncrement = (currentBid: number) => {
    if (currentBid < 100000) return 1000
    if (currentBid < 500000) return 5000
    if (currentBid < 1000000) return 10000
    return 25000
  }

  const minimumIncrement = calculateMinimumIncrement(auction.current_bid)
  const minimumBid = auction.current_bid + minimumIncrement
  const isReserveMet = auction.current_bid >= auction.reserve_price

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const endTime = new Date(auction.end_time)
      const diff = endTime.getTime() - now.getTime()
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeLeft('Ended')
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [auction.end_time])

  const handleQuickBid = (multiplier: number) => {
    const amount = minimumBid + (minimumIncrement * multiplier)
    
    // Determine bid rank
    let bidRank: 'first' | 'outbid_previous' | 'new_high' | 'reserve_met' = 'new_high'
    
    if (auction.current_bid === 0) {
      bidRank = 'first'
    } else if (auction.current_bid < auction.reserve_price && amount >= auction.reserve_price) {
      bidRank = 'reserve_met'
    } else if (amount > auction.current_bid) {
      bidRank = 'outbid_previous'
    }
    
    setLastBidData({
      amount,
      isWinning: true,
      isReserveMet: amount >= auction.reserve_price,
      bidRank
    })
    
    onBidPlaced(amount)
    
    // Show animation
    setTimeout(() => {
      setShowAnimation(true)
    }, 300)
  }

  if (!isVisible) return null

  // Minimized state
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        >
          <Gavel className="w-5 h-5" />
          <span className="ml-2 text-sm font-medium">
            {translatePrice(auction.current_bid || minimumBid, 'USD')}
          </span>
        </Button>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed top-4 right-4 z-40 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 max-w-sm sm:max-w-xs md:max-w-sm w-[90vw] sm:w-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-slate-800">
              {safeT('auction.liveBidding', 'Live Bidding')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 touch-manipulation"
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-6 w-6 p-0 touch-manipulation"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Auction Stats */}
        <div className="p-2 sm:p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">
              {safeT('auction.currentBid', 'Current Bid')}
            </span>
            <span className="text-sm font-bold text-slate-800">
              {auction.current_bid > 0 ? translatePrice(auction.current_bid, 'USD') : safeT('auction.noBids', 'No bids')}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">
              {safeT('auction.timeLeft', 'Time Left')}
            </span>
            <span className="text-xs font-medium text-red-600">
              {timeLeft}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">
              {safeT('auction.bids', 'Bids')}
            </span>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-500" />
              <span className="text-xs font-medium">
                {translateNumber(auction.bid_count)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">
              {safeT('auction.reserve', 'Reserve')}
            </span>
            <Badge variant={isReserveMet ? "default" : "destructive"} className="text-xs">
              {isReserveMet ? '✅' : '❌'}
            </Badge>
          </div>
        </div>

        {/* Quick Bid Buttons */}
        {showQuickBids && auction.status === 'live' && (
          <div className="p-2 sm:p-3 border-t border-slate-200">
            <div className="text-xs text-slate-600 mb-2">
              {safeT('auction.quickBid', 'Quick Bid')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleQuickBid(0)}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-2 h-9 sm:h-8 touch-manipulation"
              >
                {translatePrice(minimumBid, 'USD')}
              </Button>
              <Button
                onClick={() => handleQuickBid(1)}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-2 h-9 sm:h-8 touch-manipulation"
              >
                {translatePrice(minimumBid + minimumIncrement, 'USD')}
              </Button>
            </div>
            
            {/* Buy Now Button */}
            {auction.buy_now_price && (
              <Button
                onClick={onBuyNow}
                disabled={isLoading}
                className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-2 h-9 sm:h-8 touch-manipulation"
              >
                <DollarSign className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">{safeT('auction.buyNow', 'Buy Now')} - </span>
                {translatePrice(auction.buy_now_price, 'USD')}
              </Button>
            )}
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-200 p-3"
          >
            <div className="text-xs text-slate-600 mb-2">
              {safeT('auction.moreOptions', 'More Options')}
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => handleQuickBid(2)}
                disabled={isLoading}
                variant="outline"
                className="w-full text-xs py-1 px-2 h-8"
              >
                {translatePrice(minimumBid + (minimumIncrement * 2), 'USD')}
              </Button>
              <Button
                onClick={() => handleQuickBid(5)}
                disabled={isLoading}
                variant="outline"
                className="w-full text-xs py-1 px-2 h-8"
              >
                {translatePrice(minimumBid + (minimumIncrement * 5), 'USD')}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-600">
                {safeT('auction.placingBid', 'Placing bid...')}
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Left Sidebar Mini Panel - Hidden on mobile */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:block fixed left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-slate-200 p-2"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-slate-600 text-center">
            {safeT('auction.currentBid', 'Current Bid')}
          </div>
          <div className="text-sm font-bold text-slate-800 text-center">
            {translatePrice(auction.current_bid || 0, 'USD')}
          </div>
          <div className="w-full h-px bg-slate-200 my-1"></div>
          <Button
            onClick={() => handleQuickBid(0)}
            disabled={isLoading || auction.status !== 'live'}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 h-7 w-full touch-manipulation"
          >
            <Gavel className="w-3 h-3 mr-1" />
            {safeT('auction.bid', 'Bid')}
          </Button>
        </div>
      </motion.div>

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