'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  RentalYieldCard, 
  InvestmentScoreCard, 
  NeighborhoodQualityCard, 
  MonthlyRentalCard 
} from './PremiumMetricCard'
import { TopPerformingAreas } from './TopPerformingAreas'
import { TrendingUp, Star, Shield, Target, Activity, DollarSign } from 'lucide-react'

interface PremiumIntelligenceData {
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

interface PremiumIntelligenceSectionProps {
  data: PremiumIntelligenceData
  onAreaSelect?: (areaName: string) => void
}

export function PremiumIntelligenceSection({ 
  data, 
  onAreaSelect 
}: PremiumIntelligenceSectionProps) {

  if (!data.dataAvailable) {
    return (
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Star className="h-5 w-5" />
            <span>Premium Market Intelligence</span>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              Coming Soon
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-blue-600 mb-4">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            </div>
            <p className="text-blue-800 font-medium mb-2">
              Premium Intelligence Unlocks Soon
            </p>
            <p className="text-blue-600 text-sm mb-4">
              Complete more appraisals with rental estimates and quality assessments to unlock advanced market intelligence.
            </p>
            <div className="text-xs text-blue-500">
              Premium features include rental yield analysis, investment scoring, and neighborhood quality ratings.
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStabilityColor = (stability: string) => {
    switch (stability) {
      case 'stable': return 'text-green-600'
      case 'moderate': return 'text-blue-600'
      case 'volatile': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getLiquidityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-blue-600'
      case 'low': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Premium Intelligence Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-blue-900">Premium Market Intelligence</CardTitle>
                <p className="text-sm text-blue-700 mt-1">
                  Advanced analytics based on real appraisal data and professional assessments
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              Active
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RentalYieldCard 
          yieldValue={data.averageRentalYield} 
        />
        <InvestmentScoreCard 
          score={data.averageInvestmentScore}
          areas={data.investmentOpportunitiesCount}
        />
        <NeighborhoodQualityCard 
          rating={data.averageNeighborhoodRating}
          count={data.premiumNeighborhoodsCount}
        />
        <MonthlyRentalCard 
          rental={data.averageMonthlyRental}
        />
      </div>

      {/* Market Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Market Health Indicators</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {data.marketHealthIndicators.averageTimeToSell} days
              </div>
              <div className="text-sm text-gray-600">Average Time to Sell</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${getStabilityColor(data.marketHealthIndicators.marketStability)}`}>
                {data.marketHealthIndicators.marketStability}
              </div>
              <div className="text-sm text-gray-600">Market Stability</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${getLiquidityColor(data.marketHealthIndicators.liquidityLevel)}`}>
                {data.marketHealthIndicators.liquidityLevel}
              </div>
              <div className="text-sm text-gray-600">Liquidity Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Areas */}
      <TopPerformingAreas 
        areas={data.topPerformingAreas}
        onAreaSelect={onAreaSelect}
      />

      {/* Summary Stats */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">{data.highYieldAreasCount}</div>
              <div className="text-xs text-gray-600">High Yield Areas</div>
              <div className="text-xs text-gray-500">(>6% yield)</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{data.premiumNeighborhoodsCount}</div>
              <div className="text-xs text-gray-600">Premium Neighborhoods</div>
              <div className="text-xs text-gray-500">(8+ rating)</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{data.investmentOpportunitiesCount}</div>
              <div className="text-xs text-gray-600">Investment Opportunities</div>
              <div className="text-xs text-gray-500">(high potential)</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">{data.topPerformingAreas.length}</div>
              <div className="text-xs text-gray-600">Top Performing Areas</div>
              <div className="text-xs text-gray-500">(70+ score)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}