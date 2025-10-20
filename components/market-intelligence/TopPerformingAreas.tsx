'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, MapPin, Star, DollarSign } from 'lucide-react'

interface TopPerformingArea {
  name: string
  type: string
  investmentScore: number
  rentalYield: number
  pricePerSqm: number
  qualityRating: number
}

interface TopPerformingAreasProps {
  areas: TopPerformingArea[]
  onAreaSelect?: (areaName: string) => void
}

export function TopPerformingAreas({ areas, onAreaSelect }: TopPerformingAreasProps) {
  
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getYieldColor = (yieldValue: number) => {
    if (yieldValue >= 6) return 'text-green-600'
    if (yieldValue >= 4) return 'text-blue-600'
    return 'text-gray-600'
  }

  if (!areas || areas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Top Investment Opportunities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No investment opportunities available yet.</p>
            <p className="text-sm mt-2">Complete more appraisals to see top performing areas.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Top Investment Opportunities</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {areas.map((area, index) => (
            <div 
              key={`${area.name}-${index}`}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{area.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {area.type}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatPrice(area.pricePerSqm)}/m²</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>{area.qualityRating}/10</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className={`text-lg font-bold ${getYieldColor(area.rentalYield)}`}>
                    {area.rentalYield}%
                  </div>
                  <div className="text-xs text-gray-500">Rental Yield</div>
                </div>
                
                <Badge 
                  variant="outline" 
                  className={`${getScoreColor(area.investmentScore)}`}
                >
                  {area.investmentScore}/100
                </Badge>
                
                {onAreaSelect && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onAreaSelect(area.name)}
                    className="ml-2"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    View
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {areas.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Investment scores based on rental yield, neighborhood quality, and market trends
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}