"use client"

import { Database } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/config';
import { triggerPropertyUpdateWorkflow } from '@/lib/n8n/client';
import { Bed, Bath, Square, MapPin, TrendingUp, Eye } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from 'next/image';
import { SavePropertyButton } from '@/components/save-property-button';
import { Property } from '@/types/property';
import { PropertyTranslationWrapper } from '@/components/PropertyTranslationWrapper';
import { useTranslation } from 'react-i18next';

interface PropertyCardProps {
  property: Property;
  initialSaved?: boolean;
}

export function PropertyCard({ property, initialSaved = false }: PropertyCardProps) {
  const { t } = useTranslation();
  const primaryPhoto = property.property_photos?.find((photo: any) => photo.is_primary)?.url || 
    property.property_photos?.[0]?.url || 
    '/placeholder-property.jpg';

  // Helper function to format price with dollar sign
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleInquiry = async () => {
    await triggerPropertyUpdateWorkflow(property.id, 'view');
  };

  return (
    <PropertyTranslationWrapper property={property}>
      {(translatedProperty, isTranslating) => (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group h-full">
      <Link href={`/property/${property.id}`} className="block">
        <div className="relative h-48 w-full">
          <Image
            src={primaryPhoto}
                alt={translatedProperty.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {property.status && (
            <div className="absolute top-4 left-4">
              <Badge className={property.status === "For Sale" ? "bg-green-600" : "bg-blue-600"}>
                {property.status}
              </Badge>
            </div>
          )}
          {property.isHot && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-red-500 text-white animate-pulse">
                <TrendingUp className="h-3 w-3 mr-1" />
                {t('properties.hot', 'HOT')}
              </Badge>
            </div>
          )}
          {property.priceChange && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-red-500 text-white animate-pulse">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{property.priceChange.percentage}%
              </Badge>
            </div>
          )}
          {property.daysOnMarket && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-black/50 text-white">
                {property.daysOnMarket}{t('properties.daysAgo', 'd ago')}
              </Badge>
            </div>
          )}
              {isTranslating && (
                <div className="absolute bottom-4 right-4">
                  <Badge variant="secondary" className="bg-blue-500/90 text-white text-xs">
                    {t('common.loading', 'Translating...')}
                  </Badge>
                </div>
              )}
        </div>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">{translatedProperty.title}</h3>
              <div className="flex items-center text-slate-600 mb-3">
                <MapPin className="h-4 w-4 mr-2" />
                    {translatedProperty.address || `${property.city}, ${property.state}`}
              </div>
            </div>
            <SavePropertyButton propertyId={property.id} initialSaved={initialSaved} />
          </div>
          <div className="hidden min-[480px]:flex items-center gap-4 text-sm text-slate-600 mb-4">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              {property.bedrooms || 0}
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{property.bathrooms} {t('properties.baths', 'baths')}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
              <span className="text-sm font-medium">{property.square_meters || 0} {t('properties.sqm', 'sqm')}</span>
            </div>
          </div>
              {translatedProperty.features && translatedProperty.features.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
                  {translatedProperty.features.slice(0, 2).map((feature: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-slate-800">{formatPrice(property.price)}</span>
            {property.views && (
              <div className="hidden min-[480px]:flex items-center text-xs text-slate-500">
                <Eye className="h-3 w-3 mr-1" />
                {property.views}
              </div>
            )}
          </div>
          <button
            onClick={handleInquiry}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            {t('properties.inquireNow', 'Inquire Now')}
          </button>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0">
        <div className="flex justify-between items-center w-full text-sm text-gray-600">
          <span>{property.property_type}</span>
          <span className="capitalize">{property.status}</span>
        </div>
      </CardFooter>
    </Card>
      )}
    </PropertyTranslationWrapper>
  )
} 