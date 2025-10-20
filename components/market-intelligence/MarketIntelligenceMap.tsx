'use client'

import { useEffect, useState } from 'react'
import GoogleMapView from '@/components/search/GoogleMapView'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Activity, MapPin, BarChart3 } from 'lucide-react'

interface TrendingArea {
  area_name: string
  appraisal_count: number
  avg_price_per_sqm: number
  price_trend: number
  trend_direction: 'up' | 'down' | 'stable'
  coverage_level: 'high' | 'medium' | 'low'
  // Premium intelligence fields
  rental_yield_percentage?: number
  monthly_rental_estimate?: number
  neighborhood_quality_rating?: number
  investment_attractiveness?: string
  investment_score?: number
}

interface MarketIntelligenceMapProps {
  onAreaSelect: (area: string) => void
  selectedArea: string | null
  trendingAreas: TrendingArea[]
}

// Egyptian areas with approximate coordinates for market intelligence visualization
const EGYPTIAN_MARKET_AREAS = [
  { name: 'New Cairo', lat: 30.0330, lng: 31.4913 },
  { name: 'Madinaty', lat: 30.1019, lng: 31.6440 },
  { name: '6th of October', lat: 29.8167, lng: 30.9333 },
  { name: 'New Administrative Capital', lat: 30.1000, lng: 31.7000 },
  { name: 'Heliopolis', lat: 30.0808, lng: 31.3040 },
  { name: 'Zamalek', lat: 30.0616, lng: 31.2166 },
  { name: 'Nasr City', lat: 30.0594, lng: 31.3242 },
  { name: 'Rehab City', lat: 30.0450, lng: 31.4950 },
  { name: 'Sheikh Zayed', lat: 30.0703, lng: 30.9717 },
  { name: 'Katameya Heights', lat: 29.9587, lng: 31.4421 }
]

export function MarketIntelligenceMap({ 
  onAreaSelect, 
  selectedArea, 
  trendingAreas 
}: MarketIntelligenceMapProps) {
  const [mockProperties, setMockProperties] = useState<any[]>([])

  useEffect(() => {
    // Convert market areas to property format for GoogleMapView
    const marketProperties = EGYPTIAN_MARKET_AREAS.map(area => {
      // Find corresponding trending data
      const trendingData = trendingAreas.find(t => t.area_name === area.name)
      
      // Create mock property object for map visualization
      return {
        id: `market-area-${area.name.toLowerCase().replace(/\\s+/g, '-')}`,
        title: area.name,
        description: trendingData 
          ? `${trendingData.appraisal_count} appraisals • ${formatPrice(trendingData.avg_price_per_sqm)}/m²`
          : 'Market area with limited data',
        price: trendingData?.avg_price_per_sqm || 15000, // Use for marker sizing/coloring
        bedrooms: 0,
        bathrooms: 0,
        square_meters: 0,
        address: area.name,
        city: area.name,
        state: 'Cairo', // Default state
        zip_code: '00000',
        property_type: getPropertyTypeForCoverage(trendingData?.coverage_level || 'low'),
        status: 'market_intelligence',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        latitude: area.lat,
        longitude: area.lng,
        // Custom properties for market intelligence
        market_data: trendingData,
        coverage_level: trendingData?.coverage_level || 'low',
        appraisal_count: trendingData?.appraisal_count || 0,
        price_trend: trendingData?.price_trend || 0
      }
    })

    setMockProperties(marketProperties)
  }, [trendingAreas])

  // Also fetch real map data from API
  useEffect(() => {
    fetchRealMapData();
  }, []);

  const fetchRealMapData = async () => {
    try {
      const response = await fetch('/api/market-intelligence/dashboard?type=areas');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          console.log('🗺️ MARKET MAP DEBUG - Got real data from API:', data.data.length, 'areas');
          // If we have real data, use it instead of mock data
          const realProperties = data.data.map((area: any) => ({
            id: `real-area-${area.id}`,
            title: area.location_name,
            description: `${area.total_appraisals || 0} appraisals • ${formatPrice(area.avg_price_per_sqm || 0)}/m²`,
            price: area.avg_price_per_sqm || 0,
            latitude: area.coordinates?.lat || 30.0444,
            longitude: area.coordinates?.lng || 31.2357,
            property_type: getPropertyTypeForCoverage(area.coverage_level || 'low'),
            market_data: {
              coverage_level: area.coverage_level || 'low',
              appraisal_count: area.total_appraisals || 0,
              price_trend: area.price_trend_1_month || 0,
              // Premium intelligence data
              rental_yield_percentage: area.rental_yield_percentage,
              monthly_rental_estimate: area.monthly_rental_estimate,
              neighborhood_quality_rating: area.neighborhood_quality_rating,
              investment_attractiveness: area.investment_attractiveness,
              investment_score: area.investment_score
            },
            coverage_level: area.coverage_level || 'low',
            appraisal_count: area.total_appraisals || 0,
            price_trend: area.price_trend_1_month || 0
          }));
          setMockProperties(realProperties);
        } else {
          console.log('🗺️ MARKET MAP DEBUG - No real data available, using mock data');
        }
      }
    } catch (error) {
      console.error('Error fetching real map data:', error);
    }
  };

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

  // Map coverage level to property type for GoogleMapView coloring
  function getPropertyTypeForCoverage(coverage: string): string {
    switch (coverage) {
      case 'high':
        return 'villa' // Green markers
      case 'medium':
        return 'apartment' // Blue markers  
      case 'low':
        return 'townhouse' // Orange markers
      default:
        return 'penthouse' // Purple markers
    }
  }

  const getCoverageBadgeColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-blue-100 text-blue-800'
      case 'low':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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

  const handlePropertySelect = (property: any) => {
    onAreaSelect(property.title)
  }

  // Custom tooltip renderer for premium intelligence data
  const renderCustomTooltip = (property: any) => {
    const marketData = property.market_data;
    
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[280px] max-w-[320px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{property.title}</h3>
          <Badge className={getCoverageBadgeColor(property.coverage_level)}>
            {property.coverage_level} coverage
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Avg Price/m²:</span>
            <span className="font-medium">{formatPrice(property.price)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Appraisals:</span>
            <span className="font-medium">{property.appraisal_count}</span>
          </div>
          
          {/* Premium Intelligence Section */}
          {(marketData?.rental_yield_percentage || marketData?.investment_score) && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs font-medium text-blue-600 mb-2">Premium Intelligence</div>
              
              {marketData.rental_yield_percentage && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rental Yield:</span>
                  <span className="font-medium text-green-600">{marketData.rental_yield_percentage}%</span>
                </div>
              )}
              
              {marketData.monthly_rental_estimate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Rental:</span>
                  <span className="font-medium">{formatPrice(marketData.monthly_rental_estimate)}</span>
                </div>
              )}
              
              {marketData.neighborhood_quality_rating && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Quality Rating:</span>
                  <span className="font-medium text-purple-600">{marketData.neighborhood_quality_rating}/10</span>
                </div>
              )}
              
              {marketData.investment_score && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Investment Score:</span>
                  <span className={`font-medium ${
                    marketData.investment_score >= 80 ? 'text-green-600' : 
                    marketData.investment_score >= 60 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {marketData.investment_score}/100
                  </span>
                </div>
              )}
              
              {marketData.investment_attractiveness && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Investment Level:</span>
                  <Badge variant="outline" className={`text-xs ${
                    marketData.investment_attractiveness === 'high' ? 'bg-green-50 text-green-700 border-green-200' :
                    marketData.investment_attractiveness === 'medium' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    {marketData.investment_attractiveness}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-100">
          <button 
            onClick={() => handlePropertySelect(property)}
            className="w-full text-sm bg-blue-50 text-blue-700 py-2 px-3 rounded hover:bg-blue-100 transition-colors"
          >
            View Detailed Analysis
          </button>
        </div>
      </div>
    );
  }

  const selectedAreaData = trendingAreas.find(area => area.area_name === selectedArea)

  return (
    <div className="relative">
      {/* Google Maps with Market Intelligence Overlay */}
      <GoogleMapView 
        properties={mockProperties}
        onPropertySelect={handlePropertySelect}
        height="500px"
        className="rounded-lg"
      />
      
      {/* Market Intelligence Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur rounded-lg p-4 shadow-lg max-w-xs">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Appraisal Coverage
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm">High Coverage (20+ appraisals)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Medium Coverage (5-20 appraisals)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span className="text-sm">Low Coverage (1-5 appraisals)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
            <span className="text-sm">No Data Available</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Click on areas to view detailed market intelligence
          </p>
        </div>
      </div>

      {/* Selected Area Details Overlay */}
      {selectedArea && selectedAreaData && (
        <Card className="absolute top-4 left-4 w-80 shadow-lg bg-white/95 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{selectedAreaData.area_name}</h3>
                <p className="text-sm text-gray-600">Market Intelligence Overview</p>
              </div>
              <Badge className={getCoverageBadgeColor(selectedAreaData.coverage_level)}>
                {selectedAreaData.coverage_level} coverage
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">Avg Price per m²</p>
                <p className="text-lg font-bold text-slate-800">
                  {formatPrice(selectedAreaData.avg_price_per_sqm)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Price Trend</p>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  selectedAreaData.trend_direction === 'up' ? 'text-green-600' : 
                  selectedAreaData.trend_direction === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {getTrendIcon(selectedAreaData.trend_direction)}
                  {formatPercentage(selectedAreaData.price_trend)}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-600">Appraisals Completed</p>
              <p className="text-lg font-semibold text-slate-800">
                {selectedAreaData.appraisal_count} properties analyzed
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => window.open(`/reports?area=${encodeURIComponent(selectedAreaData.area_name)}`, '_blank')}
              >
                View Reports
              </button>
              <button 
                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                onClick={() => window.open(`/find-appraisers?area=${encodeURIComponent(selectedAreaData.area_name)}`, '_blank')}
              >
                Find Appraisers
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coverage Summary Stats */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg p-4 max-w-xs">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Coverage Summary
        </h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Areas with Data:</span>
            <span className="font-medium">{trendingAreas.length}/10</span>
          </div>
          <div className="flex justify-between">
            <span>Total Appraisals:</span>
            <span className="font-medium">
              {trendingAreas.reduce((sum, area) => sum + area.appraisal_count, 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Avg Coverage:</span>
            <span className="font-medium">
              {Math.round(trendingAreas.reduce((sum, area) => sum + area.appraisal_count, 0) / trendingAreas.length)} per area
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}