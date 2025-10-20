'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Award, 
  Globe, 
  MapPin,
  Clock,
  Star,
  CheckCircle,
  Building,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Languages
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Certification {
  name: string;
  authority: string;
  verified: boolean;
  issue_date?: string;
  expiry_date?: string;
}

interface ProfileAboutTabProps {
  appraiser_id: string;
  profile_summary?: string;
  certifications?: Certification[];
  languages?: string[];
  service_areas?: string[];
  years_of_experience?: number;
  specializations?: string[];
  property_statistics: Array<{
    property_type: string;
    properties_appraised: number;
    total_value_appraised: number;
    average_appraisal_time_days?: number;
  }>;
  pricing_info?: {
    base_fee?: number;
    rush_fee?: number;
    currency?: string;
    payment_terms?: string;
  };
  response_time_hours?: number;
  total_appraisals?: number;
  average_rating?: number;
  total_reviews?: number;
}

export function ProfileAboutTab({
  appraiser_id,
  profile_summary,
  certifications = [],
  languages = [],
  service_areas = [],
  years_of_experience,
  specializations = [],
  property_statistics = [],
  pricing_info,
  response_time_hours,
  total_appraisals,
  average_rating,
  total_reviews
}: ProfileAboutTabProps) {
  const { t } = useTranslation();

  const formatCurrency = (value: number, currency: string = 'EGP') => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatLargeNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const getSpecializationFromStats = () => {
    if (property_statistics.length === 0) return [];
    
    return property_statistics
      .sort((a, b) => b.properties_appraised - a.properties_appraised)
      .slice(0, 3)
      .map(stat => ({
        type: stat.property_type,
        count: stat.properties_appraised,
        percentage: total_appraisals ? Math.round((stat.properties_appraised / total_appraisals) * 100) : 0
      }));
  };

  const topSpecializations = getSpecializationFromStats();

  return (
    <div className="space-y-6">
      {/* Professional Summary */}
      {profile_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Professional Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{profile_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Statistics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Professional Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {years_of_experience && (
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{years_of_experience}+</div>
                <div className="text-sm text-gray-600">Years Experience</div>
              </div>
            )}
            
            {total_appraisals && (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{total_appraisals}</div>
                <div className="text-sm text-gray-600">Properties Appraised</div>
              </div>
            )}
            
            {average_rating && total_reviews && (
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{average_rating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">{total_reviews} {t('appraiserDashboard.reviewsCount')}</div>
              </div>
            )}
            
            {response_time_hours && (
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{response_time_hours}h</div>
                <div className="text-sm text-gray-600">Response Time</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Specializations */}
      {topSpecializations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Specializations
            </CardTitle>
            <CardDescription>
              Property types and experience breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSpecializations.map((spec, index) => (
                <div key={spec.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-blue-600' : 
                      index === 1 ? 'bg-green-600' : 'bg-purple-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {spec.type.replace('_', ' ')} Properties
                      </div>
                      <div className="text-sm text-gray-600">
                        {spec.count} properties appraised
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{spec.percentage}%</div>
                    <div className="text-xs text-gray-500">of portfolio</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certifications & Licenses */}
      {certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Certifications & Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {certifications.map((cert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="mt-1">
                    {cert.verified ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{cert.name}</div>
                    <div className="text-sm text-gray-600">{cert.authority}</div>
                    {cert.issue_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        Issued: {new Date(cert.issue_date).toLocaleDateString()}
                        {cert.expiry_date && ` | Expires: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                      </div>
                    )}
                  </div>
                  <Badge variant={cert.verified ? "default" : "secondary"} className="text-xs">
                    {cert.verified ? "Verified" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Areas & Languages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Areas */}
        {service_areas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Service Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {service_areas.map((area, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {area}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {languages.map((language, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    <Globe className="h-3 w-3 mr-1" />
                    {language}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pricing Information */}
      {pricing_info && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pricing Information
            </CardTitle>
            <CardDescription>
              Base rates and payment terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {pricing_info.base_fee && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Base Fee:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(pricing_info.base_fee, pricing_info.currency)}
                    </span>
                  </div>
                )}
                {pricing_info.rush_fee && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rush Fee:</span>
                    <span className="font-medium text-gray-900">
                      +{formatCurrency(pricing_info.rush_fee, pricing_info.currency)}
                    </span>
                  </div>
                )}
              </div>
              
              {pricing_info.payment_terms && (
                <div>
                  <span className="text-gray-600 text-sm">Payment Terms:</span>
                  <p className="text-gray-900 font-medium mt-1">{pricing_info.payment_terms}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Property Statistics Details */}
      {property_statistics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Detailed Portfolio Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Property Type</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Properties</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Total Value</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Avg. Time</th>
                  </tr>
                </thead>
                <tbody>
                  {property_statistics.map((stat, index) => (
                    <tr key={stat.property_type} className="border-b border-gray-100">
                      <td className="py-3">
                        <div className="font-medium text-gray-900 capitalize">
                          {stat.property_type.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="text-right py-3 font-medium text-gray-900">
                        {stat.properties_appraised}
                      </td>
                      <td className="text-right py-3 font-medium text-gray-900">
                        {formatCurrency(stat.total_value_appraised)}
                      </td>
                      <td className="text-right py-3 text-gray-600">
                        {stat.average_appraisal_time_days || 'N/A'} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}