"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TourViewer } from '@/components/tour-viewer'
import { TourBidOverlay } from './TourBidOverlay'
import { AuctionProperty } from '@/types/auction'
import { useTranslation } from 'react-i18next'
import { useNumberTranslation } from '@/lib/useNumberTranslation'

interface TourModalProps {
  auction: AuctionProperty
  isOpen: boolean
  onClose: () => void
  onBidPlaced: (amount: number, maxBid?: number) => void
  onBuyNow?: () => void
  isLoading?: boolean
}

export function TourModal({ 
  auction, 
  isOpen, 
  onClose, 
  onBidPlaced, 
  onBuyNow, 
  isLoading = false 
}: TourModalProps) {
  const { t } = useTranslation()
  const { safeT } = useNumberTranslation()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showBidOverlay, setShowBidOverlay] = useState(true)

  const property = auction.properties
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${
          isFullscreen 
            ? 'max-w-screen max-h-screen w-screen h-screen m-0 rounded-none' 
            : 'max-w-6xl max-h-[90vh] w-full h-full'
        } p-0 overflow-hidden`}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>
            {safeT('auction.virtualTour', 'Virtual Tour')} - {property?.title}
          </DialogTitle>
        </DialogHeader>

        {/* Tour Container */}
        <div className="relative w-full h-full">
          {/* Tour Viewer */}
          <TourViewer 
            tourId={`tour_${auction.property_id}`} 
            className="w-full h-full"
            fullscreen={isFullscreen}
          />

          {/* Control Bar */}
          <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
              <h3 className="text-white font-medium text-sm">
                {property?.title}
              </h3>
              <p className="text-white/80 text-xs">
                {property?.address}, {property?.city}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="sm"
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bid Overlay - Only show for live auctions */}
          {auction.status === 'live' && showBidOverlay && (
            <TourBidOverlay
              auction={auction}
              onBidPlaced={onBidPlaced}
              onBuyNow={onBuyNow}
              isLoading={isLoading}
              isVisible={showBidOverlay}
              onToggleVisibility={() => setShowBidOverlay(!showBidOverlay)}
            />
          )}

          {/* Toggle Bid Overlay Button */}
          {auction.status === 'live' && (
            <Button
              onClick={() => setShowBidOverlay(!showBidOverlay)}
              variant="ghost"
              size="sm"
              className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white"
            >
              {showBidOverlay ? safeT('common.hide', 'Hide') : safeT('common.show', 'Show')} {safeT('auction.bidding', 'Bidding')}
            </Button>
          )}

          {/* Auction Status Indicator */}
          {auction.status !== 'live' && (
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
              <p className="text-sm">
                {auction.status === 'preview' && safeT('auction.previewMode', 'Preview Mode - Bidding starts soon')}
                {auction.status === 'ended' && safeT('auction.auctionEnded', 'Auction has ended')}
                {auction.status === 'sold' && safeT('auction.propertySold', 'Property sold')}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}