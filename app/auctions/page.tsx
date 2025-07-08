"use client"

import { useState, useEffect } from 'react'
import { Gavel, DollarSign, Play, Clock, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { useNumberTranslation } from '@/lib/useNumberTranslation'
import Link from 'next/link'
import { AuctionGrid } from '@/components/auction/AuctionGrid'
import { AuctionProperty } from '@/types/auction'

export default function AuctionsPage() {
  const { t } = useTranslation()
  const { translateNumber, safeT } = useNumberTranslation()
  const [auctions, setAuctions] = useState<AuctionProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Fetch auctions from API
  useEffect(() => {
    fetchAuctions()
  }, [])

  const fetchAuctions = async (pageNum = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/auctions?page=${pageNum}&limit=12`)
      if (!response.ok) {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        throw new Error(`Failed to fetch auctions: ${response.status} - ${errorData}`)
      }
      
      const data = await response.json()
      
      if (pageNum === 1) {
        setAuctions(data.auctions || [])
      } else {
        setAuctions(prev => [...prev, ...(data.auctions || [])])
      }
      
      setTotalCount(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasNextPage || false)
      setPage(pageNum)
    } catch (err) {
      console.error('Error fetching auctions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load auctions')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchAuctions(page + 1)
    }
  }

  const handleBidClick = (auction: AuctionProperty) => {
    // Redirect to auction detail page for bidding
    window.location.href = `/auctions/${auction.id}`
  }

  const handleBuyNowClick = async (auction: AuctionProperty) => {
    try {
      const response = await fetch(`/api/auctions/${auction.id}/buy-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Successfully purchased property for ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(result.purchase.amount)}!`)
        
        // Refresh auctions to reflect changes
        fetchAuctions()
      } else {
        const error = await response.json()
        alert(`Purchase failed: ${error.error}`)
      }
    } catch (err) {
      console.error('Buy now error:', err)
      alert('Failed to process purchase')
    }
  }

  const handleViewTour = (auction: AuctionProperty) => {
    if (auction.properties?.virtual_tour_url) {
      window.open(auction.properties.virtual_tour_url, '_blank')
    } else {
      // Redirect to property detail page
      window.location.href = `/property/${auction.property_id}`
    }
  }

  const getStatusStats = () => {
    const stats = auctions.reduce((acc, auction) => {
      acc[auction.status] = (acc[auction.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      preview: stats.preview || 0,
      live: stats.live || 0,
      ended: stats.ended || 0,
      sold: stats.sold || 0,
      total: auctions.length
    }
  }

  const stats = getStatusStats()

  if (loading && auctions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">
              {t('auction.propertyAuctions', 'Property Auctions')}
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {t('auction.pageDescription', 'Bid on exclusive properties in real-time auctions. Preview, bid, and win your dream property.')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-64 bg-slate-200" />
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-slate-200 rounded" />
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-20 bg-slate-200 rounded" />
                    <div className="h-10 bg-slate-200 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {t('auction.errorTitle', 'Unable to Load Auctions')}
            </h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => fetchAuctions()}>
              {t('common.tryAgain', 'Try Again')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            {safeT('auction.pageTitle', 'Property Auctions')}
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
            {safeT('auction.pageDescription', 'Discover exclusive properties through our live auction platform. Bid in real-time with virtual tours.')}
          </p>
          
          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-slate-800">{translateNumber(stats.total)}</div>
              <div className="text-sm text-slate-600">{safeT('auction.totalAuctions', 'Total Auctions')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{translateNumber(stats.preview)}</div>
              <div className="text-sm text-slate-600">{safeT('auction.preview', 'In Preview')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{translateNumber(stats.live)}</div>
              <div className="text-sm text-slate-600">{safeT('auction.liveNow', 'Live Now')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-gray-600">{translateNumber(stats.ended)}</div>
              <div className="text-sm text-slate-600">{safeT('auction.ended', 'Ended')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{translateNumber(stats.sold)}</div>
              <div className="text-sm text-slate-600">{safeT('auction.sold', 'Sold')}</div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            {safeT('auction.howItWorks', 'How Property Auctions Work')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {safeT('auction.step1Title', '7-Day Preview')}
              </h3>
              <p className="text-slate-600">
                {safeT('auction.step1Description', 'Explore properties with virtual tours and prepare for the auction. Buy now option available.')}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Gavel className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {safeT('auction.step2Title', 'Live Auction')}
              </h3>
              <p className="text-slate-600">
                {safeT('auction.step2Description', 'Compete in real-time during the 1-hour live auction while viewing the virtual tour.')}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {safeT('auction.step3Title', 'Win & Purchase')}
              </h3>
              <p className="text-slate-600">
                {safeT('auction.step3Description', 'Winning bidders get the property, with overprice shared between platform and developers.')}
              </p>
            </div>
          </div>
        </div>

        {/* Auction Grid */}
        <AuctionGrid
          auctions={auctions}
          isLoading={loading}
          onBidClick={handleBidClick}
          onBuyNowClick={handleBuyNowClick}
          onViewTour={handleViewTour}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          totalCount={totalCount}
        />

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            {t('auction.ctaTitle', 'Ready to Start Bidding?')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('auction.ctaDescription', 'Join thousands of buyers competing for exclusive properties in our live auctions.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/properties">
              <Button size="lg" variant="secondary">
                {t('common.browseAllProperties', 'Browse All Properties')}
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                {t('common.contactAgent', 'Contact an Agent')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}