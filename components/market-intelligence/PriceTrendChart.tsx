'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface PriceTrendData {
  period: string
  avg_price_per_sqm: number
  change_from_previous: number
  confidence_level: number
  sample_size: number
  rental_yield?: number
  investment_score?: number
  neighborhood_rating?: number
}

interface PriceTrendChartProps {
  data: PriceTrendData[]
  title: string
  area_name?: string
  currency?: string
  showPremiumMetrics?: boolean
}

export function PriceTrendChart({ 
  data, 
  title, 
  area_name,
  currency = 'EGP',
  showPremiumMetrics = false
}: PriceTrendChartProps) {
  
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  // Calculate overall trend
  const latestData = data[data.length - 1]
  const previousData = data[data.length - 2]
  const overallTrend = latestData && previousData 
    ? ((latestData.avg_price_per_sqm - previousData.avg_price_per_sqm) / previousData.avg_price_per_sqm) * 100
    : 0

  const getTrendDirection = (trend: number) => {
    if (trend > 2) return 'up'
    if (trend < -2) return 'down'
    return 'stable'
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

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const trendDirection = getTrendDirection(overallTrend)
  
  // Custom tooltip for better data presentation
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          <p className="text-sm text-slate-600">
            <span className="font-medium">Avg Price: </span>
            {formatPrice(data.avg_price_per_sqm)}/m²
          </p>
          {data.change_from_previous !== 0 && (
            <p className={`text-sm ${data.change_from_previous > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span className="font-medium">Change: </span>
              {formatPercentage(data.change_from_previous)}
            </p>
          )}
          
          {/* Premium Intelligence Data */}
          {showPremiumMetrics && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              {data.rental_yield && (
                <p className="text-sm text-blue-600">
                  <span className="font-medium">Rental Yield: </span>
                  {data.rental_yield}%
                </p>
              )}
              {data.investment_score && (
                <p className="text-sm text-green-600">
                  <span className="font-medium">Investment Score: </span>
                  {data.investment_score}/100
                </p>
              )}
              {data.neighborhood_rating && (
                <p className="text-sm text-purple-600">
                  <span className="font-medium">Quality Rating: </span>
                  {data.neighborhood_rating}/10
                </p>
              )}
            </div>
          )}
          
          <p className="text-xs text-slate-500 mt-2">
            <span className="font-medium">Sample Size: </span>
            {data.sample_size} properties
          </p>
          <p className="text-xs text-slate-500">
            <span className="font-medium">Confidence: </span>
            {data.confidence_level}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              {showPremiumMetrics && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Premium
                </Badge>
              )}
            </div>
            {area_name && (
              <p className="text-sm text-slate-600 mt-1">{area_name}</p>
            )}
          </div>
          <div className="text-right">
            {latestData && (
              <>
                <div className="text-lg font-bold text-slate-800">
                  {formatPrice(latestData.avg_price_per_sqm)}/m²
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor(trendDirection)}`}>
                  {getTrendIcon(trendDirection)}
                  {formatPercentage(overallTrend)}
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="period" 
                  stroke="#64748b"
                  fontSize={12}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tick={{ fill: '#64748b' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="avg_price_per_sqm" 
                  stroke="#059669" 
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Data Quality Indicators */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-center border-t border-gray-100 pt-4">
              <div>
                <p className="text-xs text-gray-600">Average Sample Size</p>
                <p className="font-semibold text-slate-800">
                  {Math.round(data.reduce((sum, d) => sum + d.sample_size, 0) / data.length)} properties
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Data Confidence</p>
                <p className="font-semibold text-slate-800">
                  {Math.round(data.reduce((sum, d) => sum + d.confidence_level, 0) / data.length)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Data Points</p>
                <p className="font-semibold text-slate-800">{data.length} periods</p>
              </div>
            </div>

            {/* Trend Analysis */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm text-slate-800 mb-2">Trend Analysis</h4>
              <div className="text-sm text-slate-600">
                {trendDirection === 'up' && (
                  <p>
                    📈 <strong>Upward trend:</strong> Prices have increased by {formatPercentage(overallTrend)} 
                    in the latest period, indicating strong market demand.
                  </p>
                )}
                {trendDirection === 'down' && (
                  <p>
                    📉 <strong>Downward trend:</strong> Prices have decreased by {formatPercentage(Math.abs(overallTrend))} 
                    in the latest period, suggesting market correction.
                  </p>
                )}
                {trendDirection === 'stable' && (
                  <p>
                    📊 <strong>Stable market:</strong> Prices show minimal change ({formatPercentage(overallTrend)}), 
                    indicating market equilibrium.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No trend data available for this area</p>
            <p className="text-sm text-gray-400 mt-2">
              Minimum 3 data points required for trend analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}