'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  MapPin, 
  Clock, 
  Shield,
  User,
  Eye,
  MessageSquare,
  CheckCircle,
  Award,
  Timer,
  Phone,
  Heart
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Appraiser {
  id: string;
  full_name: string;
  profile_headline?: string;
  professional_headshot_url?: string;
  valify_status: string;
  average_rating?: number;
  total_reviews?: number;
  years_of_experience?: number;
  response_time_hours?: number;
  service_areas?: string[];
  certifications?: Array<{
    name: string;
    authority: string;
    verified: boolean;
  }>;
  property_types: string[];
  price_range: {
    min: number;
    max: number;
    currency: string;
  };
  distance?: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  is_available_now: boolean;
  next_available_date?: string;
}

interface AppraiserCardProps {
  appraiser: Appraiser;
  viewMode: 'grid' | 'list';
  showDistance?: boolean;
}

export function AppraiserCard({ appraiser, viewMode, showDistance = false }: AppraiserCardProps) {
  const { t } = useTranslation();
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getVerificationBadge = () => {
    switch (appraiser.valify_status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {t('appraisers.verifiedAppraisers')}
          </Badge>
        );
      case 'manual_review':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t('appraisers.responseTime')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderRating = () => {
    if (!appraiser.average_rating || appraiser.average_rating === 0 || !appraiser.total_reviews) {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <Star className="h-4 w-4" />
          <span className="text-sm">{t('appraisers.reviewsRatings')}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= (appraiser.average_rating || 0)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="font-medium">{(appraiser.average_rating || 0).toFixed(1)}</span>
        <span className="text-gray-500 text-sm">({appraiser.total_reviews || 0})</span>
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Profile Image */}
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {appraiser.professional_headshot_url ? (
                <Image
                  src={appraiser.professional_headshot_url}
                  alt={`${appraiser.full_name} - Professional Headshot`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
              )}
              
              {/* Verification Badge Overlay */}
              {appraiser.valify_status === 'verified' && (
                <div className="absolute bottom-0 right-0">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{appraiser.full_name}</h3>
                    {getVerificationBadge()}
                  </div>
                  
                  {appraiser.profile_headline && (
                    <p className="text-gray-700 text-sm">{appraiser.profile_headline}</p>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(appraiser.price_range.min)} - {formatCurrency(appraiser.price_range.max)}
                  </div>
                  {appraiser.is_available_now ? (
                    <Badge className="bg-green-100 text-green-800">{t('appraisers.availableNow')}</Badge>
                  ) : (
                    <Badge variant="outline">
                      {appraiser.next_available_date ? 
                        `${t('appraisers.availability')} ${new Date(appraiser.next_available_date).toLocaleDateString()}` :
                        t('appraisers.contactAppraiser')
                      }
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                {renderRating()}
                
                {appraiser.years_of_experience && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>{appraiser.years_of_experience} {t('appraisers.yearsExperience')}</span>
                    </div>
                  </>
                )}
                
                {appraiser.response_time_hours && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      <span>{t('appraisers.responseTime')} {appraiser.response_time_hours}h</span>
                    </div>
                  </>
                )}
                
                {showDistance && appraiser.distance && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{appraiser.distance.toFixed(1)} km {t('appraisers.away')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {appraiser.property_types.slice(0, 3).map((type, index) => (
                    <Badge key={index} variant="secondary" className="text-xs capitalize">
                      {type.replace('_', ' ')}
                    </Badge>
                  ))}
                  {appraiser.property_types.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{appraiser.property_types.length - 3} {t('common.viewMore')}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/appraisers/${appraiser.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      {t('appraisers.viewProfile')}
                    </Link>
                  </Button>
                  <Button size="sm">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {t('appraisers.contactAppraiser')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        {/* Header with Image */}
        <div className="relative p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
              {appraiser.professional_headshot_url ? (
                <Image
                  src={appraiser.professional_headshot_url}
                  alt={`${appraiser.full_name} - Professional Headshot`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
              )}
              
              {/* Verification Badge */}
              {appraiser.valify_status === 'verified' && (
                <div className="absolute -bottom-1 -right-1">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base truncate">{appraiser.full_name}</h3>
                {getVerificationBadge()}
              </div>
              
              {appraiser.profile_headline && (
                <p className="text-sm text-gray-600 line-clamp-2">{appraiser.profile_headline}</p>
              )}
            </div>
          </div>
        </div>

        {/* Rating and Stats */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            {renderRating()}
            
            {appraiser.years_of_experience && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Award className="h-4 w-4" />
                <span>{appraiser.years_of_experience}y</span>
              </div>
            )}
          </div>

          {/* Location and Distance */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{appraiser.location.address}</span>
            {showDistance && appraiser.distance && (
              <>
                <span>•</span>
                <span>{appraiser.distance.toFixed(1)}km {t('appraisers.away')}</span>
              </>
            )}
          </div>

          {/* Property Types */}
          <div className="flex flex-wrap gap-1 mb-3">
            {appraiser.property_types.slice(0, 2).map((type, index) => (
              <Badge key={index} variant="secondary" className="text-xs capitalize">
                {type.replace('_', ' ')}
              </Badge>
            ))}
            {appraiser.property_types.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{appraiser.property_types.length - 2}
              </Badge>
            )}
          </div>

          {/* Price and Availability */}
          <div className="space-y-2 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(appraiser.price_range.min)} - {formatCurrency(appraiser.price_range.max)}
              </div>
              <div className="text-xs text-gray-500">{t('appraisers.serviceFee')}</div>
            </div>
            
            {appraiser.is_available_now ? (
              <Badge className="w-full justify-center bg-green-100 text-green-800">
                {t('appraisers.availableNow')}
              </Badge>
            ) : (
              <Badge variant="outline" className="w-full justify-center">
                {appraiser.response_time_hours ? `${t('appraisers.responseTime')} ${appraiser.response_time_hours}h` : t('appraisers.contactAppraiser')}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button className="w-full" size="sm" asChild>
              <Link href={`/appraisers/${appraiser.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                {t('appraisers.viewProfile')}
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('appraisers.contactAppraiser')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}