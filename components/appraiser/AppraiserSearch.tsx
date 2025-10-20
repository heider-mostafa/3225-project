'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star,
  User,
  Shield,
  Clock,
  SortAsc,
  Grid,
  List,
  Map as MapIcon,
  CheckCircle,
  Award,
  Eye,
  MessageSquare
} from 'lucide-react';
import Image from 'next/image';
import { AppraiserCard } from './AppraiserCard';
import { AppraiserMap } from './AppraiserMap';

interface SearchFilters {
  query: string;
  location: string;
  propertyType: string;
  minRating: number;
  maxPrice: number;
  verifiedOnly: boolean;
  availableNow: boolean;
  sortBy: 'rating' | 'distance' | 'price' | 'experience' | 'reviews';
  radius: number; // in km
  certifications: string[]; // Professional certifications
  specializations: string[]; // Property type specializations
  languages: string[]; // Languages spoken
  experienceYears: number; // Minimum years of experience
  responseTime: number; // Maximum response time in hours
}

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

interface AppraiserSearchProps {
  initialLocation?: string;
  initialPropertyType?: string;
}

export function AppraiserSearch({ 
  initialLocation = '',
  initialPropertyType = 'all'
}: AppraiserSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: initialLocation,
    propertyType: initialPropertyType,
    minRating: 0,
    maxPrice: 10000,
    verifiedOnly: false,
    availableNow: false,
    sortBy: 'rating',
    radius: 25,
    certifications: [],
    specializations: [],
    languages: [],
    experienceYears: 0,
    responseTime: 48, // 48 hours default
  });

  const [appraisers, setAppraisers] = useState<Appraiser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [resultsCount, setResultsCount] = useState(0);

  useEffect(() => {
    searchAppraisers();
  }, [filters]);

  const searchAppraisers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== 0 && value !== false) {
          // Handle array filters
          if (Array.isArray(value) && value.length > 0) {
            queryParams.append(key, value.join(','));
          } else if (!Array.isArray(value)) {
            queryParams.append(key, String(value));
          }
        }
      });

      const fullUrl = `/api/appraisers/search?${queryParams}`;
      console.log('🔍 CLIENT DEBUG - Calling URL:', fullUrl);
      console.log('🔍 CLIENT DEBUG - Query params object:', Object.fromEntries(queryParams.entries()));
      
      const response = await fetch(fullUrl);
      console.log('🔍 CLIENT DEBUG - Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 CLIENT DEBUG - Search API response:', data);
        console.log('🔍 CLIENT DEBUG - Appraisers received:', data.appraisers?.map((a: any) => ({ 
          id: a.id, 
          full_name: a.full_name, 
          valify_status: a.valify_status 
        })));
        setAppraisers(data.appraisers);
        setResultsCount(data.totalCount);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      location: '',
      propertyType: 'all',
      minRating: 0,
      maxPrice: 10000,
      verifiedOnly: false,
      availableNow: false,
      sortBy: 'rating',
      radius: 25,
      certifications: [],
      specializations: [],
      languages: [],
      experienceYears: 0,
      responseTime: 48,
    });
  };

  const renderSearchHeader = () => (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Main Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search appraisers by name, specialization, or keywords..."
                value={filters.query}
                onChange={(e) => updateFilter('query', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="w-64 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Location (City, Area)"
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button onClick={searchAppraisers} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 items-center">
            <Select value={filters.propertyType} onValueChange={(value) => updateFilter('propertyType', value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="agricultural">Agricultural</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={filters.verifiedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('verifiedOnly', !filters.verifiedOnly)}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Verified Only
            </Button>

            <Button
              variant={filters.availableNow ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('availableNow', !filters.availableNow)}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Available Now
            </Button>

            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              More Filters
            </Button>

            {(filters.query || filters.location || filters.propertyType !== 'all' || filters.verifiedOnly || filters.availableNow) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAdvancedFilters = () => (
    showFilters && (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Advanced Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Rating</label>
              <Select value={String(filters.minRating)} onValueChange={(value) => updateFilter('minRating', Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Rating</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Price (EGP)</label>
              <div className="px-2">
                <Slider
                  value={[filters.maxPrice]}
                  onValueChange={(value) => updateFilter('maxPrice', value[0])}
                  max={20000}
                  min={500}
                  step={500}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>500</span>
                  <span>{filters.maxPrice.toLocaleString()} EGP</span>
                  <span>20,000</span>
                </div>
              </div>
            </div>

            {/* Distance */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Radius (km)</label>
              <div className="px-2">
                <Slider
                  value={[filters.radius]}
                  onValueChange={(value) => updateFilter('radius', value[0])}
                  max={100}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 km</span>
                  <span>{filters.radius} km</span>
                  <span>100 km</span>
                </div>
              </div>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={filters.sortBy} onValueChange={(value: any) => updateFilter('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="distance">Closest</SelectItem>
                  <SelectItem value="price">Lowest Price</SelectItem>
                  <SelectItem value="experience">Most Experience</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second Row - Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t">
            {/* Professional Certifications */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Certifications</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {['FRA (Egyptian)', 'RICS International', 'CRE Commercial', 'ASA American', 'IFVS Valuation', 'TEGOVA European'].map((cert) => (
                  <label key={cert} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.certifications.includes(cert)}
                      onChange={(e) => {
                        const newCerts = e.target.checked 
                          ? [...filters.certifications, cert]
                          : filters.certifications.filter(c => c !== cert);
                        updateFilter('certifications', newCerts);
                      }}
                      className="rounded"
                    />
                    <span>{cert}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Property Specializations */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Specializations</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Luxury Properties', 'Heritage Buildings', 'Land Valuation', 'Asset Valuation'].map((spec) => (
                  <label key={spec} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.specializations.includes(spec)}
                      onChange={(e) => {
                        const newSpecs = e.target.checked 
                          ? [...filters.specializations, spec]
                          : filters.specializations.filter(s => s !== spec);
                        updateFilter('specializations', newSpecs);
                      }}
                      className="rounded"
                    />
                    <span>{spec}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Languages</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {['Arabic', 'English', 'French', 'German', 'Spanish', 'Italian'].map((lang) => (
                  <label key={lang} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.languages.includes(lang)}
                      onChange={(e) => {
                        const newLangs = e.target.checked 
                          ? [...filters.languages, lang]
                          : filters.languages.filter(l => l !== lang);
                        updateFilter('languages', newLangs);
                      }}
                      className="rounded"
                    />
                    <span>{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experience & Response Time */}
            <div className="space-y-4">
              {/* Experience Years */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Min. Experience (Years)</label>
                <Select value={String(filters.experienceYears)} onValueChange={(value) => updateFilter('experienceYears', Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Experience</SelectItem>
                    <SelectItem value="1">1+ Years</SelectItem>
                    <SelectItem value="3">3+ Years</SelectItem>
                    <SelectItem value="5">5+ Years</SelectItem>
                    <SelectItem value="10">10+ Years</SelectItem>
                    <SelectItem value="15">15+ Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Response Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Max. Response Time</label>
                <Select value={String(filters.responseTime)} onValueChange={(value) => updateFilter('responseTime', Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Within 1 hour</SelectItem>
                    <SelectItem value="6">Within 6 hours</SelectItem>
                    <SelectItem value="24">Within 24 hours</SelectItem>
                    <SelectItem value="48">Within 48 hours</SelectItem>
                    <SelectItem value="168">Within 1 week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  );

  const renderResultsHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-lg font-semibold">
          {resultsCount} Appraisers Found
        </h2>
        {filters.location && (
          <p className="text-sm text-gray-600">
            Near {filters.location} • Within {filters.radius}km
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-none"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('map')}
            className="rounded-l-none"
          >
            <MapIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      {renderSearchHeader()}

      {/* Advanced Filters */}
      {renderAdvancedFilters()}

      {/* Results Header */}
      {renderResultsHeader()}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === 'map' ? (
        <AppraiserMap appraisers={appraisers} />
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {appraisers.map((appraiser) => (
            <AppraiserCard 
              key={appraiser.id} 
              appraiser={appraiser} 
              viewMode={viewMode}
              showDistance={!!filters.location}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && appraisers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Appraisers Found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or location to find more appraisers.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}