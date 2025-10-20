'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Star, TrendingUp, CheckCircle, Users, Car, Waves, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface QuickFilter {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  filters: {
    bedrooms?: string[]
    priceRange?: [number, number]
    amenities?: string[]
    propertyTypes?: string[]
    furnished?: boolean
    status?: string[]
  }
  emoji: string
  color: string
  popularity?: number
}

interface QuickFilterPillsProps {
  onFilterSelect: (filters: any) => void
  activeFilters?: any
}

export default function QuickFilterPills({ onFilterSelect, activeFilters }: QuickFilterPillsProps) {
  const { t } = useTranslation()

  const quickFilters: QuickFilter[] = [
    {
      id: 'family-homes',
      name: t('search.familyHomes', 'Family Homes'),
      icon: Users,
      description: t('search.familyHomesDesc', 'Perfect for families with children'),
      emoji: '👨‍👩‍👧‍👦',
      color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
      popularity: 85,
      filters: {
        bedrooms: ['3', '4', '5+'],
        amenities: ['has_garden', 'has_parking', 'has_playground'],
        propertyTypes: ['villa', 'townhouse', 'apartment']
      }
    },
    {
      id: 'luxury-properties',
      name: t('search.luxuryProperties', 'Luxury Properties'),
      icon: Star,
      description: t('search.luxuryPropertiesDesc', 'Premium properties with high-end amenities'),
      emoji: '✨',
      color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
      popularity: 72,
      filters: {
        priceRange: [500000, 10000000],
        amenities: ['has_pool', 'has_gym', 'has_security'],
        propertyTypes: ['villa', 'penthouse']
      }
    },
    {
      id: 'investment-ready',
      name: t('search.investmentReady', 'Investment Ready'),
      icon: TrendingUp,
      description: t('search.investmentReadyDesc', 'Properties with good ROI potential'),
      emoji: '📈',
      color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
      popularity: 68,
      filters: {
        priceRange: [200000, 800000],
        propertyTypes: ['apartment', 'studio'],
        status: ['active', 'available']
      }
    },
    {
      id: 'move-in-ready',
      name: t('search.moveInReady', 'Move-in Ready'),
      icon: CheckCircle,
      description: t('search.moveInReadyDesc', 'Fully furnished and available immediately'),
      emoji: '🏠',
      color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
      popularity: 91,
      filters: {
        furnished: true,
        status: ['active', 'available']
      }
    }
  ]

  const handleFilterClick = (filter: QuickFilter) => {
    // Toggle filter - if already active, deactivate it
    if (lastClickedFilter === filter.id) {
      setLastClickedFilter(null)
      // Reset to default/empty filters
      onFilterSelect({
        searchQuery: '',
        priceRange: [0, 10000000],
        propertyTypes: [],
        bedrooms: [],
        bathrooms: [],
        squareFeetRange: [0, 10000],
        cities: [],
        amenities: [],
        features: [],
        maxDistances: {},
        furnished: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc' as const
      })
    } else {
      setLastClickedFilter(filter.id)
      // Convert our internal filter format to SearchFilters format
      const searchFilters = {
        searchQuery: '',
        priceRange: filter.filters.priceRange || [0, 10000000],
        propertyTypes: filter.filters.propertyTypes || [],
        bedrooms: filter.filters.bedrooms || [],
        bathrooms: [],
        squareFeetRange: [0, 10000],
        cities: [],
        amenities: filter.filters.amenities || [],
        features: [],
        maxDistances: {},
        furnished: filter.filters.furnished,
        sortBy: 'created_at',
        sortOrder: 'desc' as const
      }
      
      onFilterSelect(searchFilters)
    }
    
    // Track quick filter usage
    trackQuickFilterUsage(filter)
  }

  const trackQuickFilterUsage = async (filter: QuickFilter) => {
    try {
      await fetch('/api/analytics/quick-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter_id: filter.id,
          filter_name: filter.name
        })
      })
    } catch (error) {
      // Silent fail for analytics
      console.log('Analytics tracking failed:', error)
    }
  }

  // Track which filter was last clicked
  const [lastClickedFilter, setLastClickedFilter] = useState<string | null>(null)

  const isFilterActive = (filter: QuickFilter) => {
    return lastClickedFilter === filter.id
  }

  return (
    <div className="flex flex-wrap gap-2">
      {quickFilters.map((filter) => {
        const isActive = isFilterActive(filter)
        
        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterClick(filter)}
            className={`h-9 transition-all ${
              isActive 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="mr-1.5">{filter.emoji}</span>
            {filter.name}
            {filter.popularity && (
              <span className="ml-1.5 text-xs opacity-75">
                {filter.popularity}%
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}