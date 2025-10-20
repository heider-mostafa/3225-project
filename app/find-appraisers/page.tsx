'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppraiserSearch } from '@/components/appraiser/AppraiserSearch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Star, 
  Clock,
  CheckCircle,
  Award,
  MapPin,
  Users,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';

export default function FindAppraisersPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('appraisers.pageTitle')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('appraisers.pageDescription')}
            </p>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{t('appraisers.verifiedAppraisers')}</h3>
              <p className="text-sm text-gray-600">{t('appraisers.professionalCertification')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{t('appraisers.reviewsRatings')}</h3>
              <p className="text-sm text-gray-600">{t('appraisers.clientFeedback')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{t('appraisers.certifiedProfessionals')}</h3>
              <p className="text-sm text-gray-600">{t('appraisers.licenseNumber')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{t('appraisers.quickResponse')}</h3>
              <p className="text-sm text-gray-600">{t('appraisers.responseTime')}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">150+</div>
              <div className="text-sm text-gray-600">{t('appraisers.verifiedAppraisers')}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">12,000+</div>
              <div className="text-sm text-gray-600">{t('appraisers.completedAppraisals')}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">4.8</div>
              <div className="text-sm text-gray-600">{t('appraisers.reviewsRatings')}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">27</div>
              <div className="text-sm text-gray-600">{t('appraisers.availability')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AppraiserSearch />
      </div>

      {/* How It Works Section */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('appraisers.findAppraisers')}</h2>
            <p className="text-lg text-gray-600">
              {t('appraisers.servicesOffered')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. {t('appraisers.searchByLocation')}</h3>
              <p className="text-gray-600">
                {t('appraisers.searchBySpecialization')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2. {t('appraisers.viewProfile')}</h3>
              <p className="text-gray-600">
                {t('appraisers.portfolioSamples')} {t('appraisers.caseStudies')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3. {t('appraisers.bookAppraisal')}</h3>
              <p className="text-gray-600">
                {t('appraisers.contactAppraiser')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Tips */}
      <div className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t('appraisers.specializations')}
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('appraisers.residentialAppraisal')}</h3>
                    <p className="text-gray-600">{t('appraisers.commercialAppraisal')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('appraisers.marketAnalysis')}</h3>
                    <p className="text-gray-600">{t('appraisers.investmentConsulting')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('appraisers.portfolioSamples')}</h3>
                    <p className="text-gray-600">{t('appraisers.caseStudies')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('appraisers.responseTime')}</h3>
                    <p className="text-gray-600">{t('appraisers.availability')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Filter className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">8+</div>
                  <div className="text-sm text-gray-600">Search Filters</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">100km</div>
                  <div className="text-sm text-gray-600">Search Radius</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">5.0</div>
                  <div className="text-sm text-gray-600">Top Rated</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">24h</div>
                  <div className="text-sm text-gray-600">Fast Response</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('appraisers.findAppraisers')}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t('appraisers.successStories')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Badge className="bg-white text-blue-600 px-6 py-2 text-base">
              <Shield className="h-4 w-4 mr-2" />
              {t('appraisers.verifiedAppraisers')}
            </Badge>
            <Badge className="bg-white text-blue-600 px-6 py-2 text-base">
              <Star className="h-4 w-4 mr-2" />
              {t('appraisers.topRated')}
            </Badge>
            <Badge className="bg-white text-blue-600 px-6 py-2 text-base">
              <Clock className="h-4 w-4 mr-2" />
              {t('appraisers.quickResponse')}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}