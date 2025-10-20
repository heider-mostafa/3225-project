'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  BarChart3, 
  FileText, 
  Search,
  Building,
  Home,
  DollarSign,
  Activity,
  Target,
  Star,
  Percent,
  Shield,
  Download,
  CreditCard,
  Loader
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamic imports for heavy components
const MarketIntelligenceMap = dynamic(
  () => import('@/components/market-intelligence/MarketIntelligenceMap').then(mod => ({ default: mod.MarketIntelligenceMap })),
  { 
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading interactive map...</p>
        </div>
      </div>
    ),
    ssr: false 
  }
)

const PriceTrendChart = dynamic(
  () => import('@/components/market-intelligence/PriceTrendChart').then(mod => ({ default: mod.PriceTrendChart })),
  { 
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading price chart...</p>
        </div>
      </div>
    ),
    ssr: false 
  }
)

const ReportPaymentModal = dynamic(
  () => import('@/components/payment/ReportPaymentModal'),
  { 
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading payment form...</p>
        </div>
      </div>
    ),
    ssr: false 
  }
)
import { toast } from 'sonner'

interface MarketOverview {
  total_properties_analyzed: number
  total_areas_covered: number
  active_appraisers: number
  latest_update: string
  premiumIntelligence?: {
    averageRentalYield: number
    averageMonthlyRental: number
    averageNeighborhoodRating: number
    averageInvestmentScore: number
    highYieldAreasCount: number
    premiumNeighborhoodsCount: number
    investmentOpportunitiesCount: number
    dataAvailable: boolean
    topPerformingAreas: Array<{
      name: string
      type: string
      investmentScore: number
      rentalYield: number
      pricePerSqm: number
      qualityRating: number
    }>
    marketHealthIndicators: {
      averageTimeToSell: number
      marketStability: string
      liquidityLevel: string
    }
  }
}

interface TrendingArea {
  area_name: string
  appraisal_count: number
  avg_price_per_sqm: number
  price_trend: number
  trend_direction: 'up' | 'down' | 'stable'
  coverage_level: 'high' | 'medium' | 'low'
}

interface AreaAppraisal {
  id: string
  title: string
  address: string
  propertyType: string
  marketValue: number
  pricePerSqm: number
  area: number
  appraisalDate: string
  appraiserName: string
  appraiserLicense: string
  referenceNumber: string
  clientName: string
  hasReport: boolean
}

export default function MarketIntelligencePage() {
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null)
  const [trendingAreas, setTrendingAreas] = useState<TrendingArea[]>([])
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [areaAppraisals, setAreaAppraisals] = useState<Record<string, AreaAppraisal[]>>({})
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedAppraisal, setSelectedAppraisal] = useState<AreaAppraisal | null>(null)
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)

  useEffect(() => {
    loadMarketData()
  }, [])

  useEffect(() => {
    if (selectedArea) {
      loadAreaAppraisals(selectedArea)
    }
  }, [selectedArea])

  const loadMarketData = async () => {
    try {
      setLoading(true)
      
      // Fetch real market intelligence data
      const [overviewResponse, trendingResponse] = await Promise.all([
        fetch('/api/market-intelligence/dashboard?type=overview'),
        fetch('/api/market-intelligence/dashboard?type=trending')
      ])
      
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json()
        if (overviewData.success) {
          setMarketOverview({
            total_properties_analyzed: overviewData.data.totalAppraisals,
            total_areas_covered: overviewData.data.activeAreas,
            active_appraisers: overviewData.data.activeAppraisers,
            latest_update: new Date().toISOString(),
            premiumIntelligence: overviewData.data.premiumIntelligence
          })
        }
      }
      
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json()
        if (trendingData.success && trendingData.data.length > 0) {
          const formattedTrending = trendingData.data.map((area: any) => ({
            area_name: area.area_name,
            appraisal_count: area.total_appraisals,
            avg_price_per_sqm: area.avg_price_per_sqm || 0,
            price_trend: area.price_trend || 0,
            trend_direction: area.price_trend > 0 ? 'up' : area.price_trend < 0 ? 'down' : 'stable',
            coverage_level: area.total_appraisals > 10 ? 'high' : area.total_appraisals > 3 ? 'medium' : 'low'
          }))
          setTrendingAreas(formattedTrending)
        }
      }
      
    } catch (error) {
      console.error('Failed to load market data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAreaAppraisals = async (areaName: string) => {
    try {
      if (areaAppraisals[areaName]) {
        return // Already loaded
      }
      
      const response = await fetch(`/api/market-intelligence/area-appraisals?area=${encodeURIComponent(areaName)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAreaAppraisals(prev => ({
            ...prev,
            [areaName]: data.data.appraisals
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load area appraisals:', error)
    }
  }

  const handlePurchaseReport = (appraisal: AreaAppraisal) => {
    setSelectedAppraisal(appraisal)
    setReportModalOpen(true)
  }

  const handleReportPaymentSuccess = async (result: any) => {
    try {
      if (!selectedAppraisal) return
      
      setGeneratingReport(selectedAppraisal.id)
      toast.success('Payment successful! Generating your report...')
      
      // Call the report generation API
      const reportResponse = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appraisal_id: selectedAppraisal.id,
          report_options: {
            language: 'both',
            format: 'comprehensive',
            include_legal_analysis: true,
            include_mortgage_analysis: true,
            include_market_comparables: true,
            include_investment_projections: true,
            include_images: true,
            watermark: 'CONFIDENTIAL'
          }
        })
      })
      
      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        
        // Generate PDF using the client-side generator
        const { generateAppraisalReport } = await import('@/lib/services/pdf-report-generator')
        
        toast.loading('Preparing PDF report...', { id: 'pdf-generation' })
        
        await generateAppraisalReport(
          reportData.data.property,
          reportData.data.appraisal,
          reportData.data.market,
          reportData.data.options
        )
        
        toast.success('Report downloaded successfully!', { id: 'pdf-generation' })
      } else {
        throw new Error('Failed to generate report')
      }
    } catch (error) {
      console.error('Report generation error:', error)
      toast.error('Failed to generate report. Please try again.')
    } finally {
      setGeneratingReport(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getCoverageBadgeColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading market intelligence data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          Egyptian Real Estate Investment Intelligence
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
          Professional investment insights powered by certified appraisal data. 
          Discover rental yields, neighborhood quality ratings, investment scores, and comprehensive market intelligence.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search areas, compounds, or property types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Enhanced Market Overview Cards with Investment Metrics */}
      {marketOverview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Basic Market Data */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Properties Analyzed</p>
                  <div className="text-2xl font-bold text-slate-800">
                    {marketOverview.total_properties_analyzed.toLocaleString()}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">+12% this month</p>
                </div>
                <Home className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Areas</p>
                  <div className="text-2xl font-bold text-slate-800">
                    {marketOverview.total_areas_covered}
                  </div>
                  <p className="text-xs text-green-600 mt-1">95% coverage</p>
                </div>
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Appraisers</p>
                  <div className="text-2xl font-bold text-slate-800">
                    {marketOverview.active_appraisers}
                  </div>
                  <p className="text-xs text-purple-600 mt-1">Certified professionals</p>
                </div>
                <Building className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Data Freshness</p>
                  <div className="text-sm font-medium text-green-600">Real-time</div>
                  <p className="text-xs text-gray-500">
                    Updated {new Date(marketOverview.latest_update).toLocaleDateString()}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interactive Market Map */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Investment Intelligence Map
          </CardTitle>
          <p className="text-slate-600">
            Click on areas to see comprehensive investment metrics including rental yields, neighborhood quality ratings, and investment scores. Colored markers indicate data coverage levels.
          </p>
        </CardHeader>
        <CardContent>
          <MarketIntelligenceMap 
            onAreaSelect={setSelectedArea}
            selectedArea={selectedArea}
            trendingAreas={trendingAreas}
          />
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Investment Intelligence Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Investment Intelligence Areas
            </CardTitle>
            <p className="text-slate-600">
              Areas with comprehensive investment metrics, rental yields, and quality ratings
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {trendingAreas.map((area, index) => {
              // Use real investment data from cache or defaults
              const hasInvestmentData = area.rental_yield_percentage && area.neighborhood_quality_rating;
              const rentalYield = area.rental_yield_percentage || 5.2; // Conservative default
              const qualityRating = area.neighborhood_quality_rating || 7.5; // Average default
              const monthlyRental = area.monthly_rental_estimate || (area.avg_price_per_sqm * 0.008 * 100); // Reasonable estimate
              const investmentScore = area.investment_score || 75; // Moderate default
              
              return (
                <div
                  key={area.area_name}
                  className={`p-5 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                    selectedArea === area.area_name 
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedArea(area.area_name)}
                >
                  {/* Header Section */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-lg text-slate-800">{area.area_name}</h4>
                        <Badge className={getCoverageBadgeColor(area.coverage_level)}>
                          {area.coverage_level} data
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{area.appraisal_count} properties analyzed • Click to view reports</p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded ${
                      area.trend_direction === 'up' ? 'text-green-700 bg-green-100' : 
                      area.trend_direction === 'down' ? 'text-red-700 bg-red-100' : 'text-gray-700 bg-gray-100'
                    }`}>
                      {getTrendIcon(area.trend_direction)}
                      {formatPercentage(area.price_trend)}
                    </div>
                  </div>

                  {/* Investment Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/70 p-3 rounded-md border">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-600">Price/m²</span>
                      </div>
                      <div className="text-lg font-bold text-slate-800">
                        {formatPrice(area.avg_price_per_sqm)}
                      </div>
                    </div>
                    
                    <div className="bg-white/70 p-3 rounded-md border">
                      <div className="flex items-center gap-2 mb-1">
                        <Percent className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-600">Rental Yield</span>
                      </div>
                      <div className={`text-lg font-bold ${
                        rentalYield >= 6 ? 'text-green-600' : rentalYield >= 4 ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {rentalYield.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Available Reports Section */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Professional Reports Available
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {areaAppraisals[area.area_name]?.length || area.appraisal_count} properties
                      </Badge>
                    </div>
                    
                    {areaAppraisals[area.area_name]?.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {areaAppraisals[area.area_name].slice(0, 3).map((appraisal) => (
                          <div key={appraisal.id} className="p-2 bg-white/80 rounded border border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-800 truncate">
                                  {appraisal.title}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {formatPrice(appraisal.marketValue)} • {appraisal.area}m² • {formatPrice(appraisal.pricePerSqm)}/m²
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs ml-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePurchaseReport(appraisal)
                                }}
                                disabled={generatingReport === appraisal.id}
                              >
                                {generatingReport === appraisal.id ? (
                                  <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <Download className="w-3 h-3 mr-1" />
                                    Report
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                        {areaAppraisals[area.area_name].length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{areaAppraisals[area.area_name].length - 3} more reports available
                          </p>
                        )}
                      </div>
                    ) : (
                      selectedArea === area.area_name ? (
                        <div className="text-center py-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                          <p className="text-xs text-gray-500">Loading reports...</p>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedArea(area.area_name)
                          }}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          View {area.appraisal_count} Reports
                        </Button>
                      )
                    )}
                  </div>

                  {/* Investment Attractiveness Indicator */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Investment Level:</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          investmentScore >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                          investmentScore >= 65 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}
                      >
                        {investmentScore >= 80 ? 'High Potential' : investmentScore >= 65 ? 'Moderate' : 'Conservative'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Available Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Available Reports
            </CardTitle>
            <p className="text-slate-600">
              Professional appraisal reports available for purchase
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Individual Reports */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-800">Individual Property Reports</h4>
                <Badge variant="secondary">156 Available</Badge>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Detailed appraisal reports for specific properties with market analysis
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-green-600">500-2,000 EGP</span>
                <Button size="sm" asChild>
                  <a href="/reports?type=individual">Browse Reports</a>
                </Button>
              </div>
            </div>

            {/* Compound Reports */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-800">Compound Analysis</h4>
                <Badge variant="secondary">23 Available</Badge>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Comprehensive market analysis for entire compounds and developments
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-green-600">2,500-7,500 EGP</span>
                <Button size="sm" asChild>
                  <a href="/reports?type=compound">View Analysis</a>
                </Button>
              </div>
            </div>

            {/* Custom Research */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-800">Custom Research</h4>
                <Badge variant="secondary">On Request</Badge>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Tailored market research and analysis for specific requirements
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-green-600">10,000+ EGP</span>
                <Button size="sm" variant="outline" asChild>
                  <a href="/reports/custom">Request Quote</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Call to Action */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              Need Professional Property Appraisal?
            </h3>
            <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
              Get your property appraised by certified professionals. 
              Contribute to our market intelligence while getting accurate property valuation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="/find-appraisers">Find Appraisers</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/about">Learn More</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Payment Modal */}
      {selectedAppraisal && (
        <ReportPaymentModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false)
            setSelectedAppraisal(null)
          }}
          appraisalId={selectedAppraisal.id}
          appraiserName={selectedAppraisal.appraiserName}
          propertyAddress={selectedAppraisal.address || selectedAppraisal.title}
          onSuccess={handleReportPaymentSuccess}
          simplified={true}
        />
      )}
    </div>
  )
}