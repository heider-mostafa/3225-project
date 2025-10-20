'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search,
  MapPin,
  Users,
  Star,
  Wifi,
  Car,
  Waves,
  Building,
  Calendar,
  DollarSign,
  Heart,
  Filter,
  Grid,
  List,
  SlidersHorizontal
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { RentalSearchFilters } from '@/components/rental/RentalSearchFilters';
import { toast } from 'sonner';

interface RentalListing {
  id: string;
  nightly_rate: number;
  monthly_rate: number;
  rental_type: string;
  minimum_stay_nights: number;
  average_rating: number;
  total_bookings: number;
  is_active: boolean;
  featured: boolean;
  properties: {
    id: string;
    title: string;
    description: string;
    bedrooms: number;
    bathrooms: number;
    address: string;
    city: string;
    property_type: string;
    compound: string;
    property_photos: Array<{
      url: string;
      is_primary: boolean;
    }>;
  };
  rental_amenities: {
    has_wifi: boolean;
    has_parking: boolean;
    has_swimming_pool: boolean;
    has_ac: boolean;
    has_sea_view: boolean;
    has_nile_view: boolean;
  };
}

export default function RentalsPage() {
  const { t } = useTranslation();
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async (searchParams: any = {}) => {
    console.log('🏠 Frontend: Loading rentals with params:', searchParams);
    setIsLoading(true);
    
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...searchParams
      });

      console.log('📡 Frontend: Fetching rentals API...');
      const response = await fetch(`/api/rentals?${queryParams}`);
      
      console.log('📡 Frontend: API response status:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Frontend: API response data:', {
        success: data.success,
        listingsCount: data.listings?.length || 0,
        pagination: data.pagination
      });

      if (data.success) {
        setListings(data.listings || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
      } else {
        console.error('❌ Frontend: API returned unsuccessful response:', data);
        toast.error('Failed to load rental listings');
      }
    } catch (error) {
      console.error('💥 Frontend: Failed to load rentals:', error);
      toast.error('Failed to load rental listings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (results: RentalListing[]) => {
    setListings(results);
  };

  const toggleFavorite = (listingId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(listingId)) {
        newFavorites.delete(listingId);
        toast.success('Removed from favorites');
      } else {
        newFavorites.add(listingId);
        toast.success('Added to favorites');
      }
      return newFavorites;
    });
  };

  const getPrimaryImage = (photos: Array<{ url: string; is_primary: boolean }>) => {
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return '/placeholder.jpg';
    }
    const primary = photos.find(photo => photo.is_primary);
    return primary?.url || photos[0]?.url || '/placeholder.jpg';
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <Card key={listing.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
          <div className="relative">
            <Image
              src={getPrimaryImage(listing.properties.property_photos)}
              alt={listing.properties.title}
              width={400}
              height={250}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {listing.featured && (
              <Badge className="absolute top-2 left-2 bg-yellow-500">
                {t('search.popular')}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              onClick={() => toggleFavorite(listing.id)}
            >
              <Heart className={`h-4 w-4 ${favorites.has(listing.id) ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <div className="absolute bottom-2 left-2 flex gap-1">
              {listing.rental_amenities?.has_wifi && <Badge variant="secondary" className="text-xs">{t('rentals.freeWifi')}</Badge>}
              {listing.rental_amenities?.has_parking && <Badge variant="secondary" className="text-xs">{t('rentals.parking')}</Badge>}
              {listing.rental_amenities?.has_swimming_pool && <Badge variant="secondary" className="text-xs">{t('rentals.swimmingPool')}</Badge>}
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {listing.properties.property_type}
                </Badge>
                {listing.average_rating > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{listing.average_rating.toFixed(1)}</span>
                    <span className="text-gray-500">({listing.total_bookings})</span>
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-sm line-clamp-1">{listing.properties.title}</h3>
              
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{listing.properties.city}</span>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  <span>{listing.properties.bedrooms}BR</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{t('rentals.guests')}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-lg">{listing.nightly_rate?.toLocaleString()} EGP</span>
                    <span className="text-xs text-gray-600"> / {t('rentals.nightlyRate')}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('rentals.minimumStay')} {listing.minimum_stay_nights}
                  </div>
                </div>
              </div>
            </div>
            
            <Link href={`/rentals/${listing.id}`}>
              <Button className="w-full mt-3" size="sm">
                {t('common.viewAll')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {listings.map((listing) => (
        <Card key={listing.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="flex">
              <div className="relative w-80 h-48">
                <Image
                  src={getPrimaryImage(listing.properties.property_photos)}
                  alt={listing.properties.title}
                  fill
                  className="object-cover"
                />
                {listing.featured && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500">
                    {t('search.popular')}
                  </Badge>
                )}
              </div>
              
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{listing.properties.property_type}</Badge>
                      <span className="text-sm text-gray-600">{listing.properties.compound}</span>
                    </div>
                    <h3 className="text-xl font-semibold">{listing.properties.title}</h3>
                    <div className="flex items-center gap-1 text-gray-600 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{listing.properties.address}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFavorite(listing.id)}
                  >
                    <Heart className={`h-4 w-4 ${favorites.has(listing.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {listing.properties.description}
                </p>

                <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>{listing.properties.bedrooms} {t('common.bed')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{listing.properties.bathrooms} {t('common.bath')}</span>
                  </div>
                  <div>{t('rentals.minimumStay')} {listing.minimum_stay_nights}</div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {listing.rental_amenities?.has_wifi && <Badge variant="secondary" className="text-xs">{t('rentals.freeWifi')}</Badge>}
                  {listing.rental_amenities?.has_ac && <Badge variant="secondary" className="text-xs">{t('rentals.airConditioning')}</Badge>}
                  {listing.rental_amenities?.has_parking && <Badge variant="secondary" className="text-xs">{t('rentals.parking')}</Badge>}
                  {listing.rental_amenities?.has_swimming_pool && <Badge variant="secondary" className="text-xs">{t('rentals.swimmingPool')}</Badge>}
                  {listing.rental_amenities?.has_sea_view && <Badge variant="secondary" className="text-xs">{t('rentals.seaView')}</Badge>}
                  {listing.rental_amenities?.has_nile_view && <Badge variant="secondary" className="text-xs">{t('rentals.nileView')}</Badge>}
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    {listing.average_rating > 0 && (
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{listing.average_rating.toFixed(1)}</span>
                        <span className="text-gray-500">({listing.total_bookings} {t('appraisers.reviewsRatings')})</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{listing.nightly_rate?.toLocaleString()} EGP</span>
                      <span className="text-gray-600"> / {t('rentals.nightlyRate')}</span>
                    </div>
                  </div>
                  
                  <Link href={`/rentals/${listing.id}`}>
                    <Button>
                      {t('common.viewAll')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSkeletons = () => (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className={viewMode === 'grid' ? 'h-48 w-full' : 'h-48 w-80'} />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('rentals.pageTitle')}</h1>
        <p className="text-xl text-gray-600 mb-8">
          {t('rentals.pageDescription')}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <RentalSearchFilters
          onSearch={handleSearch}
          onFiltersChange={(filters) => loadRentals(filters)}
        />
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">{t('rentals.vacationRentals')}</h2>
          {pagination.total > 0 && (
            <p className="text-gray-600">
              {pagination.total.toLocaleString()} {t('nav.properties')}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Listings */}
      <div className="mb-8">
        {isLoading ? (
          renderSkeletons()
        ) : listings.length > 0 ? (
          viewMode === 'grid' ? renderGridView() : renderListView()
        ) : (
          <Card className="text-center p-12">
            <div className="space-y-4">
              <Search className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="text-xl font-semibold">{t('rentals.vacationRentals')}</h3>
              <p className="text-gray-600">
                {t('rentals.availableDates')}
              </p>
              <Button onClick={() => loadRentals()}>
                {t('rentals.vacationRentals')}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Load More */}
      {pagination.pages > pagination.page && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => {
              const nextPage = pagination.page + 1;
              setPagination(prev => ({ ...prev, page: nextPage }));
              loadRentals({ page: nextPage });
            }}
            disabled={isLoading}
          >
            {t('common.viewMore')}
          </Button>
        </div>
      )}
    </div>
  );
}