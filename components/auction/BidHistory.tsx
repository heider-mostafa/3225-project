"use client"

import { useState } from 'react'
import { History, Trophy, TrendingUp, Clock, User, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { BidHistoryProps, Bid } from '@/types/auction'

export function BidHistory({ bids, className = "" }: BidHistoryProps) {
  const { t } = useTranslation()
  const [showAllBids, setShowAllBids] = useState(false)
  const [showBidderIds, setShowBidderIds] = useState(false)

  const displayBids = showAllBids ? bids : bids.slice(0, 5)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getBidderDisplay = (bid: Bid, index: number) => {
    if (showBidderIds) {
      return bid.user_id.startsWith('temp_') 
        ? `Anonymous ${bid.user_id.slice(-4)}`
        : `User ${bid.user_id.slice(-4)}`
    }
    return `Bidder ${String.fromCharCode(65 + (index % 26))}` // A, B, C, etc.
  }

  const getBidStatus = (bid: Bid) => {
    switch (bid.status) {
      case 'winning':
        return { text: t('auction.winning', 'Winning'), color: 'bg-green-100 text-green-800' }
      case 'outbid':
        return { text: t('auction.outbid', 'Outbid'), color: 'bg-red-100 text-red-800' }
      case 'active':
        return { text: t('auction.active', 'Active'), color: 'bg-blue-100 text-blue-800' }
      default:
        return { text: bid.status, color: 'bg-gray-100 text-gray-800' }
    }
  }

  if (bids.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            {t('auction.bidHistory', 'Bid History')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              {t('auction.noBidsYet', 'No bids placed yet')}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {t('auction.beFirstBidder', 'Be the first to place a bid!')}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            {t('auction.bidHistory', 'Bid History')}
            <Badge variant="secondary" className="ml-2">
              {bids.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBidderIds(!showBidderIds)}
            className="text-xs"
          >
            {showBidderIds ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showBidderIds ? t('auction.hideBidders', 'Hide IDs') : t('auction.showBidders', 'Show IDs')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayBids.map((bid, index) => {
            const status = getBidStatus(bid)
            const isWinning = bid.is_winning
            
            return (
              <div
                key={bid.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isWinning 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isWinning ? 'bg-green-600 text-white' : 'bg-slate-600 text-white'
                  }`}>
                    {isWinning ? <Trophy className="h-4 w-4" /> : index + 1}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800">
                        {formatPrice(bid.amount)}
                      </span>
                      {bid.auto_bid_max && (
                        <Badge variant="outline" className="text-xs">
                          {t('auction.autoBid', 'Auto')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <User className="h-3 w-3" />
                      <span>{getBidderDisplay(bid, index)}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(bid.bid_time)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge className={status.color}>
                    {status.text}
                  </Badge>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatTime(bid.bid_time)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {bids.length > 5 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllBids(!showAllBids)}
            >
              {showAllBids 
                ? t('auction.showLess', 'Show Less')
                : t('auction.showAllBids', `Show All ${bids.length} Bids`)
              }
            </Button>
          </div>
        )}

        {/* Bid Statistics */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-slate-800">
                {bids.length}
              </div>
              <div className="text-xs text-slate-600">
                {t('auction.totalBids', 'Total Bids')}
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">
                {new Set(bids.map(bid => bid.user_id)).size}
              </div>
              <div className="text-xs text-slate-600">
                {t('auction.uniqueBidders', 'Bidders')}
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">
                {bids.length > 0 ? formatPrice(Math.max(...bids.map(bid => bid.amount)) - Math.min(...bids.map(bid => bid.amount))) : '$0'}
              </div>
              <div className="text-xs text-slate-600">
                {t('auction.bidRange', 'Bid Range')}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}