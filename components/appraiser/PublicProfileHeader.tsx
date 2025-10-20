'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  Star, 
  MapPin, 
  Clock, 
  Phone, 
  Mail,
  Globe,
  Linkedin,
  Award,
  Eye,
  MessageCircle
} from 'lucide-react';
import Image from 'next/image';

interface PublicProfileHeaderProps {
  appraiser: {
    id: string;
    full_name: string;
    profile_headline?: string;
    profile_summary?: string;
    professional_headshot_url?: string;
    valify_status: string;
    average_rating?: number;
    total_reviews?: number;
    years_of_experience?: number;
    appraiser_license_number?: string;
    languages?: string[];
    service_areas?: string[];
    response_time_hours?: number;
    total_appraisals?: number;
    social_media_links?: Record<string, string>;
    certifications?: Array<{
      name: string;
      authority: string;
      verified: boolean;
    }>;
  };
  onContactClick: () => void;
  onBookingClick: () => void;
  isLoggedIn?: boolean;
}

export function PublicProfileHeader({ 
  appraiser, 
  onContactClick, 
  onBookingClick,
  isLoggedIn = false 
}: PublicProfileHeaderProps) {
  const { t } = useTranslation();
  
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
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {t('appraisers.professionalCertification')}
          </Badge>
        );
    }
  };

  const renderRating = () => {
    if (!appraiser.average_rating || !appraiser.total_reviews) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <Star className="h-4 w-4" />
          <span className="text-sm">{t('appraisers.reviewsRatings')}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= appraiser.average_rating!
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="font-medium">{appraiser.average_rating.toFixed(1)}</span>
        <span className="text-gray-500">({appraiser.total_reviews} {t('appraisers.reviewsRatings')})</span>
      </div>
    );
  };

  const renderStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{appraiser.years_of_experience || 0}</div>
        <div className="text-sm text-gray-600">{t('appraisers.yearsExperience')}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{appraiser.total_appraisals || 0}</div>
        <div className="text-sm text-gray-600">{t('appraisers.completedAppraisals')}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{appraiser.response_time_hours || 24}h</div>
        <div className="text-sm text-gray-600">{t('appraisers.responseTime')}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{appraiser.total_reviews || 0}</div>
        <div className="text-sm text-gray-600">{t('appraisers.clientFeedback')}</div>
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Image and Basic Info */}
          <div className="flex flex-col items-center md:items-start">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
              {appraiser.professional_headshot_url ? (
                <Image
                  src={appraiser.professional_headshot_url}
                  alt={`${appraiser.full_name} - Professional Headshot`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Eye className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {/* Verification Badge Overlay */}
              {appraiser.valify_status === 'verified' && (
                <div className="absolute bottom-2 right-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col w-full md:w-auto gap-2">
              <Button onClick={onBookingClick} className="w-full md:w-auto">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('appraisers.bookAppraisal')}
              </Button>
              <Button variant="outline" onClick={onContactClick} className="w-full md:w-auto">
                <Phone className="h-4 w-4 mr-2" />
                {t('appraisers.contactAppraiser')}
              </Button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-4">
            {/* Name and Headline */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{appraiser.full_name}</h1>
                {getVerificationBadge()}
              </div>
              
              {appraiser.profile_headline && (
                <p className="text-lg text-gray-700 font-medium">{appraiser.profile_headline}</p>
              )}
              
              {appraiser.appraiser_license_number && (
                <p className="text-sm text-gray-600">
                  {t('appraisers.licenseNumber')}: {appraiser.appraiser_license_number}
                </p>
              )}
            </div>

            {/* Rating and Reviews */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {renderRating()}
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {appraiser.service_areas && appraiser.service_areas.length > 0 && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{t('appraisers.serves')}: {appraiser.service_areas.slice(0, 3).join(', ')}</span>
                  {appraiser.service_areas.length > 3 && <span>+{appraiser.service_areas.length - 3} more</span>}
                </div>
              )}
              
              {appraiser.languages && appraiser.languages.length > 0 && (
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span>{t('appraisers.languages')}: {appraiser.languages.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Certifications */}
            {appraiser.certifications && appraiser.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {appraiser.certifications.map((cert, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {cert.name}
                    {cert.verified && <CheckCircle className="h-3 w-3 text-green-600" />}
                  </Badge>
                ))}
              </div>
            )}

            {/* Summary */}
            {appraiser.profile_summary && (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {appraiser.profile_summary.length > 200 
                    ? `${appraiser.profile_summary.substring(0, 200)}...`
                    : appraiser.profile_summary
                  }
                </p>
              </div>
            )}

            {/* Social Media Links */}
            {appraiser.social_media_links && Object.keys(appraiser.social_media_links).length > 0 && (
              <div className="flex gap-3">
                {appraiser.social_media_links.linkedin && (
                  <a 
                    href={appraiser.social_media_links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {appraiser.social_media_links.website && (
                  <a 
                    href={appraiser.social_media_links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6">
          {renderStats()}
        </div>
      </CardContent>
    </Card>
  );
}