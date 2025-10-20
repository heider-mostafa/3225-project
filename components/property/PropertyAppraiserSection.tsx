'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Award,
  Eye,
  MessageSquare,
  Calculator,
  User,
  Building2,
  TrendingUp
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

interface RecommendedAppraiser {
  id: string;
  full_name: string;
  profile_headline?: string;
  standardized_headshot_url?: string;
  valify_status: string;
  average_rating?: number;
  total_reviews?: number;
  years_of_experience?: number;
  appraiser_license_number?: string;
  response_time_hours?: number;
  service_areas?: string[];
  property_types: string[];
  price_range: {
    min: number;
    max: number;
    currency: string;
  };
  distance?: number;
  location: {
    address: string;
  };
  is_available_now: boolean;
  specialization_match: number; // 0-100 match score
}

interface Property {
  id: string;
  property_type: string;
  address: string;
  city: string;
  neighborhood?: string;
  square_meters: number;
  price: number;
}

interface PropertyAppraiserSectionProps {
  property: Property;
  className?: string;
}

export function PropertyAppraiserSection({ property, className }: PropertyAppraiserSectionProps) {
  const [recommendedAppraisers, setRecommendedAppraisers] = useState<RecommendedAppraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppraiser, setSelectedAppraiser] = useState<RecommendedAppraiser | null>(null);

  useEffect(() => {
    fetchRecommendedAppraisers();
  }, [property.id]);

  const fetchRecommendedAppraisers = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/appraisers/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_type: property.property_type,
          location: property.city,
          neighborhood: property.neighborhood,
          property_size: property.square_meters,
          property_value: property.price,
          limit: 3
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendedAppraisers(data.appraisers || []);
        if (data.appraisers && data.appraisers.length > 0) {
          setSelectedAppraiser(data.appraisers[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching recommended appraisers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Verified
          </Badge>
        );
      case 'manual_review':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Under Review
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderRating = (appraiser: RecommendedAppraiser) => {
    if (!appraiser.average_rating || !appraiser.total_reviews) {
      return (
        <div className="flex items-center gap-1 text-slate-500">
          <Star className="h-3 w-3" />
          <span className="text-xs">No reviews</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 text-yellow-400 fill-current" />
        <span className="text-xs font-medium">{appraiser.average_rating.toFixed(1)}</span>
        <span className="text-xs text-slate-500">({appraiser.total_reviews})</span>
      </div>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleQuickContact = (appraiser: RecommendedAppraiser) => {
    // In production, this would open a contact modal with pre-filled property details
    toast.success(`Contact information will be shared with ${appraiser.full_name}`);
  };

  const handleRequestAppraisal = (appraiser: RecommendedAppraiser) => {
    // In production, this would open booking modal with property context
    toast.success(`Appraisal request will be sent to ${appraiser.full_name}`);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Professional Appraisers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-slate-200"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedAppraiser) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Professional Appraisers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Building2 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No appraisers available</p>
            <p className="text-xs text-slate-500">Contact us for assistance</p>
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link href="/find-appraisers">
                <Eye className="h-4 w-4 mr-2" />
                Find Appraisers
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Professional Appraisers
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Get accurate property valuation from verified professionals
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Request Buttons */}
          <div className="space-y-2">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 h-11 text-base" 
              size="lg"
              onClick={() => handleRequestAppraisal(selectedAppraiser)}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Request Appraisal
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-11 text-base" 
              size="lg"
              onClick={() => handleQuickContact(selectedAppraiser)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Quick Contact
            </Button>
          </div>

          <div className="border-t border-slate-100 pt-4">
            {/* Featured Appraiser */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                {selectedAppraiser.standardized_headshot_url ? (
                  <Image
                    src={selectedAppraiser.standardized_headshot_url}
                    alt={`${selectedAppraiser.full_name} - Professional Headshot`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-400" />
                  </div>
                )}
                
                {/* Verification Badge Overlay */}
                {selectedAppraiser.valify_status === 'verified' && (
                  <div className="absolute -bottom-1 -right-1">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{selectedAppraiser.full_name}</p>
                  {getVerificationBadge(selectedAppraiser.valify_status)}
                </div>
                <p className="text-sm text-slate-600">Licensed Property Appraiser</p>
                <div className="flex items-center gap-2 mt-1">
                  {renderRating(selectedAppraiser)}
                  {selectedAppraiser.specialization_match && (
                    <>
                      <span className="text-xs text-slate-400">•</span>
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {selectedAppraiser.specialization_match}% match
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Appraiser Details */}
            <div className="space-y-2 text-sm">
              {selectedAppraiser.years_of_experience && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Experience:</span>
                  <span className="font-medium">{selectedAppraiser.years_of_experience}+ years</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-slate-600">License:</span>
                <span className="font-medium">{selectedAppraiser.appraiser_license_number || 'FRA Licensed'}</span>
              </div>
              
              {selectedAppraiser.response_time_hours && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Response Time:</span>
                  <span className="font-medium">{selectedAppraiser.response_time_hours}h</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-slate-600">Pricing:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(selectedAppraiser.price_range.min)} - {formatCurrency(selectedAppraiser.price_range.max)}
                </span>
              </div>
              
              {selectedAppraiser.distance && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Distance:</span>
                  <span className="font-medium">{selectedAppraiser.distance.toFixed(1)} km away</span>
                </div>
              )}
            </div>

            {/* Property Type Specialization */}
            {selectedAppraiser.property_types.length > 0 && (
              <div className="mt-4">
                <span className="text-sm text-slate-600">Specializes in:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedAppraiser.property_types.slice(0, 3).map((type) => (
                    <Badge key={type} variant="outline" className="text-xs capitalize">
                      {type.replace('_', ' ')}
                    </Badge>
                  ))}
                  {selectedAppraiser.property_types.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedAppraiser.property_types.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Availability Status */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              {selectedAppraiser.is_available_now ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-slate-700 font-medium">Available Now</span>
                  <span className="text-xs text-slate-500">• Quick response guaranteed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-slate-700 font-medium">Available Soon</span>
                  <span className="text-xs text-slate-500">• Responds within {selectedAppraiser.response_time_hours || 24}h</span>
                </div>
              )}
            </div>

            {/* Additional Appraisers */}
            {recommendedAppraisers.length > 1 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700">
                    More Appraisers ({recommendedAppraisers.length - 1})
                  </p>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/find-appraisers">
                      View All
                    </Link>
                  </Button>
                </div>
                <div className="space-y-2">
                  {recommendedAppraisers
                    .slice(1, 3)
                    .map((appraiser) => (
                      <div key={appraiser.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200">
                            {appraiser.standardized_headshot_url ? (
                              <Image
                                src={appraiser.standardized_headshot_url}
                                alt={appraiser.full_name}
                                width={24}
                                height={24}
                                className="object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-slate-400 m-1" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {appraiser.full_name}
                            </p>
                            {renderRating(appraiser)}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setSelectedAppraiser(appraiser)}
                        >
                          Select
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* View All Button */}
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href={`/find-appraisers?propertyType=${property.property_type}&location=${property.city}`}>
                <Eye className="h-4 w-4 mr-2" />
                View All Property Appraisers
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}