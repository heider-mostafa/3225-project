// Auction system types
export interface AuctionProperty {
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
  
  // Related property data
  properties?: {
    id: string
    title: string
    description: string
    address: string
    city: string
    state: string
    bedrooms: number
    bathrooms: number
    square_meters: number
    property_type: string
    features?: string[]
    amenities?: string[]
    latitude?: number
    longitude?: number
    virtual_tour_url?: string
    property_photos?: Array<{
      id: string
      url: string
      is_primary: boolean
    }>
  }
  
  // Calculated fields
  timeRemaining?: number
  secondsRemaining?: number
  phase?: 'preview' | 'live' | 'ended'
  bids?: Bid[]
  events?: AuctionEvent[]
}

export interface Bid {
  id: string
  auction_property_id: string
  user_id: string
  amount: number
  bid_time: string
  is_winning: boolean
  auto_bid_max?: number
  ip_address?: string
  user_agent?: string
  status: 'active' | 'outbid' | 'winning' | 'cancelled'
}

export interface AuctionEvent {
  id: string
  auction_property_id: string
  event_type: 'bid_placed' | 'auction_started' | 'auction_extended' | 'auction_ended' | 'buy_now_purchase' | 'auction_created' | 'auction_updated'
  event_data: any
  created_at: string
}

export interface UserVerificationAuctions {
  user_id: string
  verification_level: 'basic' | 'verified' | 'premium'
  document_verified: boolean
  phone_verified: boolean
  email_verified: boolean
  credit_check_score?: number
  max_bid_limit: number
  deposit_amount: number
  verification_date?: string
  created_at: string
  updated_at: string
}

export interface UserDepositAuctions {
  id: string
  user_id: string
  auction_property_id: string
  amount: number
  payment_method?: string
  payment_reference?: string
  status: 'pending' | 'confirmed' | 'refunded'
  created_at: string
  updated_at: string
}

export interface AuctionWinner {
  id: string
  auction_property_id: string
  user_id: string
  winning_bid: number
  final_price: number
  commission_amount: number
  developer_share: number
  platform_share: number
  payment_status: 'pending' | 'confirmed' | 'failed'
  contract_signed: boolean
  created_at: string
}

// UI Component Props
export interface AuctionCardProps {
  auction: AuctionProperty
  onBidClick?: (auction: AuctionProperty) => void
  onBuyNowClick?: (auction: AuctionProperty) => void
  onViewTour?: (auction: AuctionProperty) => void
  className?: string
}

export interface LiveAuctionViewProps {
  auctionId: string
  className?: string
}

export interface BiddingControlsProps {
  auction: AuctionProperty
  onBidPlaced: (amount: number, maxBid?: number) => void
  onBuyNow: () => void
  isLoading?: boolean
  userMaxBid?: number
}

export interface AuctionCountdownProps {
  targetTime: string
  onTimeUp?: () => void
  className?: string
  compact?: boolean
}

export interface BidHistoryProps {
  bids: Bid[]
  className?: string
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'bid_update' | 'auction_start' | 'auction_end' | 'user_joined' | 'user_left'
  auctionId: string
  data: any
  timestamp: string
}

export interface BidUpdateMessage extends WebSocketMessage {
  type: 'bid_update'
  data: {
    newBid: number
    bidCount: number
    userId: string
    isReserveMet: boolean
  }
}

// API Response types
export interface AuctionListResponse {
  auctions: AuctionProperty[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface AuctionDetailResponse {
  auction: AuctionProperty
}

export interface BidPlaceResponse {
  success: boolean
  bid: {
    id: string
    amount: number
    bidTime: string
    isWinning: boolean
  }
  auction: {
    currentBid: number
    bidCount: number
    isReserveMet: boolean
  }
}

export interface BuyNowResponse {
  success: boolean
  purchase: {
    id: string
    amount: number
    purchaseTime: string
    commission: number
    platformFee: number
  }
  auction: {
    status: string
    finalPrice: number
    winner: string
  }
}

// Filter and sorting types
export interface AuctionFilters {
  status?: 'all' | 'preview' | 'live' | 'ended' | 'sold'
  propertyType?: string
  priceRange?: [number, number]
  location?: string
  hasVirtualTour?: boolean
  hasBuyNow?: boolean
}

export interface AuctionSorting {
  field: 'start_time' | 'end_time' | 'current_bid' | 'reserve_price' | 'bid_count' | 'created_at'
  direction: 'asc' | 'desc'
}

// Utility types
export type AuctionPhase = 'preview' | 'live' | 'ended'
export type AuctionStatus = 'preview' | 'live' | 'ended' | 'sold' | 'cancelled'
export type BidStatus = 'active' | 'outbid' | 'winning' | 'cancelled'
export type VerificationLevel = 'basic' | 'verified' | 'premium'