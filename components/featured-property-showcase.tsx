"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'
import { Bed, Bath, MapPin, Eye, Star, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { Property } from '@/types/property'
import { EmbeddedPropertyDetails } from './embedded-property-details'

const FEATURED_PROPERTY_ID = "2cf44323-fee4-4872-9582-ea6b4f91eac3"

export function FeaturedPropertyShowcase() {
  const { t, i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPropertyDetails, setShowPropertyDetails] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch property data from API
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/properties/${FEATURED_PROPERTY_ID}`)
        
        if (!response.ok) {
          console.error('Failed to fetch property')
          return
        }
        
        const data = await response.json()
        setProperty(data.property)
      } catch (error) {
        console.error('Error fetching property:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [])

  useEffect(() => {
    if (!mounted || !property) return
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % (property.property_photos?.length || 1))
    }, 4000)
    
    return () => clearInterval(interval)
  }, [mounted, property])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const primaryPhoto = property?.property_photos?.find((photo: any) => photo.is_primary)?.url || 
    property?.property_photos?.[0]?.url || 
    '/placeholder.svg?height=400&width=600'

  if (!mounted || loading || !property) {
    return (
      <section className="py-16 bg-gradient-to-br from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-12 bg-slate-200 rounded w-96 mx-auto mb-8"></div>
              <div className="bg-slate-200 rounded-2xl h-96"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        {/* Geometric pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full px-6 py-3 mb-6 shadow-lg">
            <Star className="w-5 h-5 fill-current" />
            <span className="font-semibold text-sm tracking-wide">
              {t('featuredProperty.badge', 'FEATURED PROPERTY')}
            </span>
            <Star className="w-5 h-5 fill-current" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
            {t('featuredProperty.title', 'Now Available on OpenBeit')}
          </h2>
          <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed">
            {t('featuredProperty.subtitle', 'Experience our first featured property with immersive virtual tours')}
          </p>
        </motion.div>

        {/* Featured Property Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div 
            onClick={() => setShowPropertyDetails(true)}
            className="block cursor-pointer"
          >
            <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group bg-white/80 backdrop-blur-xl border border-slate-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Image Section */}
                <div className="relative h-64 md:h-80 lg:h-full min-h-[300px] overflow-hidden">
                  <Image
                    src={primaryPhoto}
                    alt={property.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-emerald-600 text-white shadow-lg">
                      {t('property.forSale', 'For Sale')}
                    </Badge>
                  </div>

                  {/* New Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white animate-pulse shadow-lg">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      {t('property.featured', 'Featured')}
                    </Badge>
                  </div>

                  {/* Views Counter */}
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {property.view_count || 0}
                    </div>
                  </div>

                  {/* Image Navigation Dots */}
                  {property.property_photos && property.property_photos.length > 1 && (
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      {property.property_photos.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setCurrentImageIndex(index)
                          }}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <CardContent className="p-6 lg:p-8 flex flex-col justify-between">
                  <div>
                    <div className="mb-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                        {property.title}
                      </h3>
                      <div className="flex items-center text-slate-600 mb-4">
                        <MapPin className="h-5 w-5 mr-2 text-cyan-600" />
                        <span className="text-sm leading-relaxed">
                          {property.address}
                        </span>
                      </div>
                    </div>

                    {/* Property Stats */}
                    <div className="flex items-center gap-6 text-slate-700 mb-6">
                      <div className="flex items-center">
                        <Bed className="h-5 w-5 mr-2 text-cyan-600" />
                        <span className="font-semibold">{property.bedrooms}</span>
                        <span className="ml-1 text-sm">{t('property.rooms', 'rooms')}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-5 w-5 mr-2 text-cyan-600" />
                        <span className="font-semibold">{property.bathrooms}</span>
                        <span className="ml-1 text-sm">{t('property.baths', 'baths')}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        </svg>
                        <span className="font-semibold">{property.square_meters}</span>
                        <span className="ml-1 text-sm">{t('property.sqm', 'sqm')}</span>
                      </div>
                    </div>

                    {/* Features */}
                    {property.features && property.features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {property.features.slice(0, 3).map((feature: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-cyan-50 text-cyan-700 border border-cyan-200">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-3xl md:text-4xl font-bold text-slate-900">
                        {formatPrice(property.price)}
                      </span>
                      <span className="text-slate-600 ml-2 text-sm">
                        {t('property.negotiable', 'Negotiable')}
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                  >
                    <span className="flex items-center justify-center gap-3">
                      <Eye className="h-5 w-5" />
                      {t('property.viewDetails', 'View Property Details')}
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </Button>

                  {/* Quick Info */}
                  <div className="flex justify-between items-center mt-4 text-sm text-slate-500">
                    <span>{property.property_type}</span>
                    <span className="capitalize">{property.status}</span>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Full Property Details - Embedded */}
      {showPropertyDetails && (
        <EmbeddedPropertyDetails
          propertyId={FEATURED_PROPERTY_ID}
          onClose={() => setShowPropertyDetails(false)}
        />
      )}
    </section>
  )
}