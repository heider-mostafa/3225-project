'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Activity, DollarSign, Home, Target, Star } from 'lucide-react'

interface PremiumMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
  }
  status?: 'high' | 'medium' | 'low' | 'stable' | 'volatile'
  icon?: React.ReactNode
  currency?: boolean
  percentage?: boolean
}

export function PremiumMetricCard({
  title,
  value,
  subtitle,
  trend,
  status,
  icon,
  currency = false,
  percentage = false
}: PremiumMetricCardProps) {
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (currency) {
        return new Intl.NumberFormat('en-EG', {
          style: 'currency',
          currency: 'EGP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val)
      }
      if (percentage) {
        return `${val}%`
      }
      return val.toLocaleString()
    }
    return val
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-red-100 text-red-800 border-red-200'
      case 'stable': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'volatile': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTrendIcon = (direction?: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatValue(value)}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {status && (
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor(status)}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            )}
            
            {trend && (
              <div className="flex items-center space-x-1">
                {getTrendIcon(trend.direction)}
                <span className={`text-xs font-medium ${
                  trend.direction === 'up' ? 'text-green-600' : 
                  trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trend.percentage > 0 ? '+' : ''}{trend.percentage}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Specific metric card components for common use cases
export function RentalYieldCard({ yieldValue, change }: { yieldValue: number, change?: number }) {
  return (
    <PremiumMetricCard
      title="Average Rental Yield"
      value={yieldValue}
      percentage={true}
      subtitle="Based on real appraisal data"
      status={yieldValue > 6 ? 'high' : yieldValue > 4 ? 'medium' : 'low'}
      trend={change ? { 
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable', 
        percentage: change 
      } : undefined}
      icon={<DollarSign className="h-4 w-4" />}
    />
  )
}

export function InvestmentScoreCard({ score, areas }: { score: number, areas: number }) {
  return (
    <PremiumMetricCard
      title="Investment Score"
      value={`${score}/100`}
      subtitle={`${areas} areas analyzed`}
      status={score > 80 ? 'high' : score > 60 ? 'medium' : 'low'}
      icon={<Target className="h-4 w-4" />}
    />
  )
}

export function NeighborhoodQualityCard({ rating, count }: { rating: number, count: number }) {
  return (
    <PremiumMetricCard
      title="Neighborhood Quality"
      value={`${rating}/10`}
      subtitle={`${count} premium neighborhoods`}
      status={rating >= 8 ? 'high' : rating >= 6 ? 'medium' : 'low'}
      icon={<Star className="h-4 w-4" />}
    />
  )
}

export function MonthlyRentalCard({ rental, currency = 'EGP' }: { rental: number, currency?: string }) {
  return (
    <PremiumMetricCard
      title="Average Monthly Rental"
      value={rental}
      currency={true}
      subtitle="Professional estimates"
      icon={<Home className="h-4 w-4" />}
    />
  )
}