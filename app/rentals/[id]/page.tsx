'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { 
  ArrowLeft,
  MapPin, 
  Users, 
  User,
  Bed, 
  Bath,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Wifi,
  Car,
  Waves,
  Wind,
  Shield,
  Building,
  Phone,
  Mail,
  Share,
  Heart,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  PlayCircle,
  MessageSquare,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { TourViewer } from "@/components/tour-viewer";
import { AIAssistant } from "@/components/ai-assistant";
import { SavePropertyButton } from '@/components/save-property-button';
import { RentalBookingFlow } from '@/components/rental/RentalBookingFlow';
import type { Broker, BookingFormData, ViewingBookingRequest } from '@/types/broker';
import SimilarProperties from '@/components/SimilarProperties';
import LifestyleCompatibilityTool from '@/components/lifestyle/LifestyleCompatibilityTool';

interface RentalDetail {
  id: string;
  property_id: string;
  rental_type: string;
  nightly_rate: number;
  monthly_rate: number;
  yearly_rate: number;
  minimum_stay_nights: number;
  maximum_stay_nights: number;
  check_in_time: string;
  check_out_time: string;
  house_rules: any;
  cancellation_policy: string;
  instant_book: boolean;
  cleaning_fee: number;
  security_deposit: number;
  extra_guest_fee: number;
  max_guests: number;
  total_bookings: number;
  average_rating: number;
  properties: {
    id: string;
    title: string;
    description: string;
    bedrooms: number;
    bathrooms: number;
    square_meters: number;
    address: string;
    city: string;
    property_type: string;
    compound: string;
    property_photos: Array<{
      url: string;
      is_primary: boolean;
      order_index: number;
    }>;
  };
  rental_amenities: {
    has_wifi: boolean;
    has_ac: boolean;
    has_kitchen: boolean;
    has_parking: boolean;
    has_swimming_pool: boolean;
    has_gym: boolean;
    has_elevator: boolean;
    has_sea_view: boolean;
    has_nile_view: boolean;
    has_balcony: boolean;
    has_security_guard: boolean;
  };
  rental_reviews: Array<{
    id: string;
    overall_rating: number;
    review_text: string;
    created_at: string;
  }>;
}

export default function RentalDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const [listing, setListing] = useState<RentalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Enhanced UI states
  const [isFullscreenTour, setIsFullscreenTour] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  
  // Property owner/manager state
  const [propertyBrokers, setPropertyBrokers] = useState<Broker[]>([]);
  const [primaryBroker, setPrimaryBroker] = useState<Broker | null>(null);
  const [brokersLoading, setBrokersLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadRentalDetail(params.id as string);
    }
  }, [params.id]);

  // Fetch brokers after rental data is loaded
  useEffect(() => {
    if (listing?.property_id) {
      fetchPropertyBrokers(listing.property_id);
    }
  }, [listing?.property_id]);

  const fetchPropertyBrokers = async (propertyId: string) => {
    try {
      setBrokersLoading(true);
      console.log('🏢 Fetching property managers for property:', propertyId);
      
      const response = await fetch(`/api/properties/${propertyId}/brokers`);
      
      if (!response.ok) {
        console.warn('No brokers found for this property');
        setPropertyBrokers([]);
        setPrimaryBroker(null);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.brokers) {
        console.log('✅ Brokers loaded:', data.brokers);
        setPropertyBrokers(data.brokers);
        
        // Find primary broker
        const primary = data.brokers.find((broker: Broker) => (broker as any).is_primary);
        setPrimaryBroker(primary || data.brokers[0] || null);
      } else {
        setPropertyBrokers([]);
        setPrimaryBroker(null);
      }
    } catch (error) {
      console.error('❌ Error fetching property managers:', error);
      setPropertyBrokers([]);
      setPrimaryBroker(null);
    } finally {
      setBrokersLoading(false);
    }
  };

  const loadRentalDetail = async (id: string) => {
    try {
      setIsLoading(true);
      console.log('🏠 Fetching rental detail for ID:', id);
      
      const response = await fetch(`/api/rentals/${id}`);
      
      if (!response.ok) {
        console.error('❌ Rental API response not OK:', response.status, response.statusText);
        if (response.status === 404) {
          toast.error('Rental listing not found');
        } else {
          toast.error('Failed to load rental details');
        }
        return;
      }
      
      const data = await response.json();
      console.log('✅ Rental data loaded:', data);
      console.log('📊 Rental listing structure:', data.listing);
      console.log('🏠 Properties structure:', data.listing?.properties);
      
      setListing(data.listing);
    } catch (error) {
      console.error('❌ Failed to load rental detail:', error);
      toast.error('Failed to load rental details');
    } finally {
      setIsLoading(false);
    }
  };

  const getPrimaryImage = (photos: Array<{ url: string; is_primary: boolean; order_index: number }>) => {
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return '/placeholder.jpg';
    }
    const primary = photos.find(photo => photo.is_primary);
    return primary?.url || photos[0]?.url || '/placeholder.jpg';
  };

  const getSortedPhotos = (photos: Array<{ url: string; is_primary: boolean; order_index: number }>) => {
    if (!photos || !Array.isArray(photos)) return [];
    return [...photos].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.order_index || 0) - (b.order_index || 0);
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    console.log('⚠️ Listing is null/undefined');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">{t('rentals.rentalNotFound')}</h2>
          <p className="text-gray-600 mb-6">The rental listing you're looking for doesn't exist or has been removed.</p>
          <Link href="/rentals">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('rentals.backToRentals')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Additional debug logging
  console.log('🔍 Current listing:', listing);
  console.log('🔍 Listing title:', listing?.properties?.title);
  console.log('🔍 Property data keys:', listing?.properties ? Object.keys(listing.properties) : 'No properties');
  console.log('🔍 Has distance_to_metro:', !!(listing?.properties as any)?.distance_to_metro);
  console.log('🔍 Has virtual_tour_url:', !!(listing?.properties as any)?.virtual_tour_url);
  console.log('🔍 Listing properties:', listing?.properties);
  console.log('🔍 Listing property_id:', listing?.property_id);

  console.log('📸 Processing photos for listing:', listing?.properties?.property_photos);
  const photos = getSortedPhotos(listing?.properties?.property_photos || []);
  
  // Fix: rental_amenities is an array, get the first object or empty object
  const amenitiesArray = listing?.rental_amenities || [];
  const amenities = Array.isArray(amenitiesArray) && amenitiesArray.length > 0 ? amenitiesArray[0] : {};
  
  console.log('📸 Processed photos:', photos);
  console.log('🏠 Amenities array:', amenitiesArray);
  console.log('🏠 Amenities object for UI:', amenities);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/rentals" className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('rentals.backToRentals')}
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Property Title and Location - Always at Top */}
        <div className="mb-6">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {listing?.properties?.title || `${listing?.properties?.property_type || 'Property'} in ${listing?.properties?.city || 'Unknown Location'}`}
            </h1>
            <div className="flex items-center justify-center text-gray-600 text-lg">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              <span>
                {listing?.properties?.address || 'Address'}, {listing?.properties?.city || 'City'}
              </span>
            </div>
            {listing?.properties?.compound && (
              <p className="text-gray-600 text-base">{listing.properties.compound}</p>
            )}
          </div>
        </div>

        {/* Trust Badges Row */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 py-3 px-4 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="whitespace-nowrap">{t('rentals.verifiedProperty')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <span className="whitespace-nowrap">{t('rentals.securePayment')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <span className="whitespace-nowrap">{t('rentals.support247')}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Photo Gallery with Actions */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-96">
            <div className="lg:col-span-3 relative">
              {photos.length > 0 ? (
                <Image
                  src={photos[selectedPhoto]?.url || getPrimaryImage(photos)}
                  alt={listing?.properties?.title || 'Rental Property'}
                  width={800}
                  height={400}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                // Show placeholder when no photos
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">{t('rentals.noPhotosAvailable')}</p>
                    <p className="text-gray-400 text-sm">Property photos will appear here</p>
                  </div>
                </div>
              )}
              
              {/* Gallery Navigation */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedPhoto(selectedPhoto > 0 ? selectedPhoto - 1 : photos.length - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedPhoto(selectedPhoto < photos.length - 1 ? selectedPhoto + 1 : 0)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Action Buttons Overlay */}
              <div className="absolute top-4 right-4 flex gap-2">
                <SavePropertyButton propertyId={listing?.properties?.id || listing?.property_id} />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/75 text-white border-none">
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] p-0">
                    <div className="relative h-[80vh]">
                      <Image
                        src={photos[selectedPhoto]?.url || getPrimaryImage(photos)}
                        alt={listing?.properties?.title || 'Rental Property'}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-black/50 hover:bg-black/75 text-white border-none"
                  onClick={() => {
                    if ((listing?.properties as any)?.virtual_tour_url) {
                      setIsFullscreenTour(true);
                    } else {
                      toast.info('Virtual tour coming soon for this property');
                    }
                  }}
                >
                  <PlayCircle className="w-4 h-4 mr-1" />
                  {t('rentals.virtualTour')}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 lg:grid-cols-1 gap-2 h-full">
              {photos.length > 0 ? (
                photos.slice(0, 4).map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPhoto(index)}
                    className={`relative rounded-lg overflow-hidden h-full ${
                      selectedPhoto === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <Image
                      src={photo.url}
                      alt={`${listing?.properties?.title || 'Rental Property'} ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))
              ) : (
                // Show placeholders when no photos
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg overflow-hidden h-full bg-gray-200 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gray-300 rounded mb-2 mx-auto flex items-center justify-center">
                        <Building className="w-4 h-4 text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-500">Photo {index + 1}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Badges */}
            <div className="mb-8">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{listing?.properties?.property_type || 'Property'}</Badge>
                <Badge variant="secondary">{listing?.rental_type || 'Rental'}</Badge>
                {listing?.instant_book && <Badge className="bg-green-100 text-green-800">Instant Book</Badge>}
              </div>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Bed className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <span className="text-sm font-medium">{listing?.properties?.bedrooms || 0} {t('rentals.bedrooms')}</span>
              </div>
              <div className="text-center">
                <Bath className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <span className="text-sm font-medium">{listing?.properties?.bathrooms || 0} {t('rentals.bathrooms')}</span>
              </div>
              <div className="text-center">
                <Users className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <span className="text-sm font-medium">{t('rentals.upTo')} {listing?.max_guests || 0} {t('rentals.guests')}</span>
              </div>
              <div className="text-center">
                <Building className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <span className="text-sm font-medium">{listing?.properties?.square_meters || 0} m²</span>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-3">{t('rentals.aboutThisPlace')}</h2>
              <p className="text-gray-700 leading-relaxed">{listing?.properties?.description || t('rentals.noDescriptionAvailable')}</p>
            </div>

            {/* Virtual Tour Section */}
            {(listing?.properties as any)?.virtual_tour_url && (
              <div className="mt-12 mb-10">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-6">
                  <h2 className="text-2xl font-bold mb-2 flex items-center text-gray-900">
                    <PlayCircle className="w-7 h-7 mr-3 text-blue-600" />
                    {t('rentals.virtualTour')}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {t('rentals.exploreEveryRoom')}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  <div className="aspect-video">
                    <iframe
                      src={(listing?.properties as any).virtual_tour_url}
                      className="w-full h-full"
                      allowFullScreen
                      title={t('rentals.virtualTour')}
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Property Highlights Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Star className="w-6 h-6 mr-2 text-yellow-500" />
{t('rentals.propertyHighlights')}
              </h2>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Key Features */}
                  {(listing?.properties as any)?.year_built && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{t('propertyDetails.builtIn')} {(listing.properties as any).year_built}</p>
                        <p className="text-sm text-gray-600">{t('propertyDetails.modernConstruction')}</p>
                      </div>
                    </div>
                  )}
                  
                  {(listing?.properties as any)?.floor_level && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Floor {(listing.properties as any).floor_level}</p>
                        <p className="text-sm text-gray-600">
                          {(listing.properties as any).total_floors ? `of ${(listing.properties as any).total_floors} floors` : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {(listing?.properties as any)?.furnished && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{t('propertyDetails.fullyFurnished')}</p>
                        <p className="text-sm text-gray-600">{t('propertyDetails.moveInReady')}</p>
                      </div>
                    </div>
                  )}

                  {(listing?.properties as any)?.balconies && (listing.properties as any).balconies > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{(listing.properties as any).balconies} Balcony{(listing.properties as any).balconies > 1 ? 's' : ''}</p>
                        <p className="text-sm text-gray-600">Outdoor space</p>
                      </div>
                    </div>
                  )}

                  {(listing?.properties as any)?.parking_spaces && (listing.properties as any).parking_spaces > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Car className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{(listing.properties as any).parking_spaces} Parking Space(s)</p>
                        <p className="text-sm text-gray-600">Secure parking included</p>
                      </div>
                    </div>
                  )}

                  {(listing?.properties as any)?.pet_policy === 'allowed' && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{t('propertyDetails.petFriendly')}</p>
                        <p className="text-sm text-gray-600">{t('propertyDetails.petsWelcome')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('rentals.amenities')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {amenities?.has_wifi && (
                  <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.wifi')}</span>
                  </div>
                )}
                {amenities?.has_ac && (
                  <div className="flex items-center gap-2">
                    <Wind className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.airConditioning')}</span>
                  </div>
                )}
                {amenities?.has_heating && (
                  <div className="flex items-center gap-2">
                    <Wind className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.heating')}</span>
                  </div>
                )}
                {amenities?.has_kitchen && (
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.kitchen')}</span>
                  </div>
                )}
                {amenities?.has_tv && (
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.tv')}</span>
                  </div>
                )}
                {amenities?.has_washing_machine && (
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.washingMachine')}</span>
                  </div>
                )}
                {amenities?.has_parking && (
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.parking')}</span>
                  </div>
                )}
                {amenities?.has_swimming_pool && (
                  <div className="flex items-center gap-2">
                    <Waves className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.swimmingPool')}</span>
                  </div>
                )}
                {amenities?.has_gym && (
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.gym')}</span>
                  </div>
                )}
                {amenities?.has_security_guard && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.securityGuard')}</span>
                  </div>
                )}
                {amenities?.has_elevator && (
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.elevator')}</span>
                  </div>
                )}
                {amenities?.has_balcony && (
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.balcony')}</span>
                  </div>
                )}
                {amenities?.has_sea_view && (
                  <div className="flex items-center gap-2">
                    <Waves className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.seaView')}</span>
                  </div>
                )}
                {amenities?.has_nile_view && (
                  <div className="flex items-center gap-2">
                    <Waves className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.nileView')}</span>
                  </div>
                )}
                {amenities?.has_city_view && (
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.cityView')}</span>
                  </div>
                )}
                {amenities?.has_cctv && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.cctvSecurity')}</span>
                  </div>
                )}
                {amenities?.has_concierge && (
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.conciergeService')}</span>
                  </div>
                )}
                {amenities?.has_valet_parking && (
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.valetParking')}</span>
                  </div>
                )}
                {amenities?.has_spa && (
                  <div className="flex items-center gap-2">
                    <Waves className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.spa')}</span>
                  </div>
                )}
                {amenities?.has_beach_access && (
                  <div className="flex items-center gap-2">
                    <Waves className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.beachAccess')}</span>
                  </div>
                )}
                {amenities?.has_safe && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.safe')}</span>
                  </div>
                )}
                {amenities?.has_satellite_tv && (
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    <span>{t('amenities.satelliteTV')}</span>
                  </div>
                )}
                
                {/* Custom Amenities */}
                {amenities?.additional_amenities && Object.entries(amenities.additional_amenities).map(([key, value]) => (
                  value && (
                    <div key={key} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span>{String(value)}</span>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Guest Experience Highlights */}
            <div className="mb-8">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-slate-800 flex items-center">
                    <CheckCircle className="w-5 h-5 text-slate-600 mr-2" />
                    {t('rentals.guestExperienceHighlights')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {(listing?.properties as any)?.year_built >= 2020 && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-slate-700">
                          {t('rentals.brandNewBuilding')} ({(listing.properties as any).year_built}) {t('rentals.modernInfrastructure')}
                        </span>
                      </div>
                    )}
                    {(listing?.properties as any)?.furnished && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-slate-700">
                          {t('rentals.fullyFurnished')} - {t('rentals.moveInReadyNoHassle')}
                        </span>
                      </div>
                    )}
                    {(listing?.properties as any)?.features?.includes('City Views') && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-slate-700">
                          {t('rentals.stunningViews')}
                        </span>
                      </div>
                    )}
                    {listing?.properties?.city === 'Cairo' && listing?.properties?.address?.includes('Tahrir') && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-slate-700">
                          {t('rentals.primeLocation')}
                        </span>
                      </div>
                    )}
                    {(listing?.properties as any)?.amenities?.includes('Spa') && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-slate-700">
                          {t('rentals.exclusiveSpaAccess')}
                        </span>
                      </div>
                    )}
                    {(listing?.properties as any)?.has_security && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-slate-700">
                          {t('rentals.professionalSecurity')}
                        </span>
                      </div>
                    )}
                    {listing?.properties?.square_meters >= 50 && listing?.properties?.property_type === 'studio' && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-slate-700">
                          {t('rentals.spaciousLayout')} {listing.properties.square_meters}m², {t('rentals.generousForDowntown')}
                        </span>
                      </div>
                    )}
                    {(listing?.properties as any)?.features?.includes('Modern Design') && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-slate-700">
                          {t('rentals.contemporaryDesign')}
                        </span>
                      </div>
                    )}
                    {(listing?.properties as any)?.features?.includes('High-speed fiber internet') && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-slate-700">
                          {t('rentals.highSpeedFiberInternet')}
                        </span>
                      </div>
                    )}
                    {(listing?.properties as any)?.features?.includes('Smart home automation') && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-slate-700">
                          {t('rentals.smartHomeAutomation')}
                        </span>
                      </div>
                    )}
                    {(listing?.properties as any)?.features?.includes('Premium bedding') && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-slate-700">
                          {t('rentals.premiumBedding')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Location & Infrastructure Details - Always show if we have property data */}
            {listing?.properties && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <MapPin className="w-6 h-6 mr-2 text-blue-600" />
                  {t('rentals.locationAndInfrastructure')}
                </h2>
                <div className="bg-white rounded-xl shadow-sm p-6">

                  {/* Distance Information (show if available) */}
                  {((listing.properties as any).distance_to_metro || 
                    (listing.properties as any).distance_to_airport || 
                    (listing.properties as any).distance_to_mall || 
                    (listing.properties as any).distance_to_hospital) && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-slate-800 mb-3">{t('rentals.distanceToKeyLocations')}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        {(listing.properties as any).distance_to_metro && (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 text-xs font-bold">M</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{t('rentals.metroStation')}</p>
                              <p className="text-slate-600">{(listing.properties as any).distance_to_metro} km</p>
                            </div>
                          </div>
                        )}
                        {(listing.properties as any).distance_to_airport && (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-green-600 text-xs font-bold">✈</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{t('rentals.airport')}</p>
                              <p className="text-slate-600">{(listing.properties as any).distance_to_airport} km</p>
                            </div>
                          </div>
                        )}
                        {(listing.properties as any).distance_to_mall && (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-purple-600 text-xs font-bold">🛍</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{t('rentals.shoppingMall')}</p>
                              <p className="text-slate-600">{(listing.properties as any).distance_to_mall} km</p>
                            </div>
                          </div>
                        )}
                        {(listing.properties as any).distance_to_hospital && (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-red-600 text-xs font-bold">+</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{t('rentals.hospital')}</p>
                              <p className="text-slate-600">{(listing.properties as any).distance_to_hospital} km</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location Details */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-slate-800 mb-3">{t('rentals.locationInformation')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-800">{t('rentals.city')}</span>
                        <p className="text-slate-600">{listing.properties.city || t('rentals.notSpecified')}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-800">{t('rentals.propertyType')}</span>
                        <p className="text-slate-600">{listing.properties.property_type || t('rentals.notSpecified')}</p>
                      </div>
                      {listing.properties.compound && (
                        <div>
                          <span className="font-medium text-slate-800">{t('rentals.compound')}</span>
                          <p className="text-slate-600">{listing.properties.compound}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Infrastructure Details (if available) */}
                  {((listing.properties as any).heating_type || 
                    (listing.properties as any).cooling_type || 
                    (listing.properties as any).water_source || 
                    (listing.properties as any).internet_speed) && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold text-slate-800 mb-3">{t('rentals.infrastructure')}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        {(listing.properties as any).heating_type && (
                          <div>
                            <span className="font-medium text-slate-800">{t('rentals.heating')}</span>
                            <p className="text-slate-600">{(listing.properties as any).heating_type}</p>
                          </div>
                        )}
                        {(listing.properties as any).cooling_type && (
                          <div>
                            <span className="font-medium text-slate-800">{t('rentals.cooling')}</span>
                            <p className="text-slate-600">{(listing.properties as any).cooling_type}</p>
                          </div>
                        )}
                        {(listing.properties as any).water_source && (
                          <div>
                            <span className="font-medium text-slate-800">{t('rentals.waterSource')}</span>
                            <p className="text-slate-600">{(listing.properties as any).water_source}</p>
                          </div>
                        )}
                        {(listing.properties as any).internet_speed && (
                          <div>
                            <span className="font-medium text-slate-800">{t('rentals.internet')}</span>
                            <p className="text-slate-600">{(listing.properties as any).internet_speed}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lifestyle Compatibility Analysis - Enhanced with map and search */}
            {listing?.properties && (listing.properties as any).latitude && (listing.properties as any).longitude && (
              <div className="mb-8">
                <LifestyleCompatibilityTool
                  propertyId={listing.properties.id || listing.property_id}
                  propertyLocation={{
                    latitude: (listing.properties as any).latitude,
                    longitude: (listing.properties as any).longitude,
                    address: listing.properties.address
                  }}
                />
              </div>
            )}

            {/* Fallback for properties without coordinates */}
            {listing?.properties && (!(listing.properties as any).latitude || !(listing.properties as any).longitude) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <User className="w-6 h-6 mr-2 text-blue-600" />
                  Location Information
                </h2>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      View this rental location on Google Maps for detailed directions and nearby amenities.
                    </p>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">Address</h4>
                        <p className="text-gray-600">{listing.properties.address || 'Address not available'}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          const query = encodeURIComponent(`${listing.properties.address}, ${listing.properties.city}`)
                          window.open(`https://www.google.com/maps/search/${query}`, "_blank")
                        }}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        {t('rentals.viewOnGoogleMaps')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            {listing.rental_reviews && listing.rental_reviews.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">{t('rentals.reviews')}</h2>
                <div className="space-y-4">
                  {listing.rental_reviews.slice(0, 3).map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{review.overall_rating}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.review_text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold">{formatPrice(listing?.nightly_rate || 0)}</span>
                    <span className="text-gray-600"> / {t('rentals.perNight')}</span>
                  </div>
                  {(listing?.average_rating || 0) > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{(listing?.average_rating || 0).toFixed(1)}</span>
                      <span className="text-gray-500">({listing?.total_bookings || 0})</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing Options */}
                <div className="space-y-2">
                  {listing?.monthly_rate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('rentals.monthlyRate')}:</span>
                      <span className="font-medium">{formatPrice(listing.monthly_rate)}</span>
                    </div>
                  )}
                  {listing?.yearly_rate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('rentals.yearlyRate')}:</span>
                      <span className="font-medium">{formatPrice(listing.yearly_rate)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Stay Requirements */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('rentals.minimumStay')}:</span>
                    <span>{listing?.minimum_stay_nights || 1} {t('rentals.nights')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('rentals.checkIn')}:</span>
                    <span>{listing?.check_in_time || '3:00 PM'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('rentals.checkOut')}:</span>
                    <span>{listing?.check_out_time || '11:00 AM'}</span>
                  </div>
                </div>

                <Separator />

                {/* Additional Fees */}
                <div className="space-y-2 text-sm">
                  {(listing?.cleaning_fee || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('rentals.cleaningFee')}:</span>
                      <span>{formatPrice(listing.cleaning_fee)}</span>
                    </div>
                  )}
                  {(listing?.security_deposit || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('rentals.securityDeposit')}:</span>
                      <span>{formatPrice(listing.security_deposit)}</span>
                    </div>
                  )}
                  {(listing?.extra_guest_fee || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('rentals.extraGuestFee')}:</span>
                      <span>{formatPrice(listing.extra_guest_fee)} {t('rentals.perGuest')}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setShowBookingFlow(true)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {listing?.instant_book ? t('rentals.bookNow') : t('rentals.checkAvailability')}
                  </Button>
                  
                  {!listing?.instant_book && (
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      size="lg"
                      onClick={() => setShowBookingFlow(true)}
                    >
                      {t('rentals.requestToBook')}
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Share className="w-4 h-4 mr-2" />
                    {t('rentals.share')}
                  </Button>
                  <SavePropertyButton 
                    propertyId={listing?.properties?.id || listing?.property_id}
                    className="flex-1"
                    variant="outline"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property Manager/Broker Card */}
            {!brokersLoading && primaryBroker && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('rentals.propertyManager')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{primaryBroker.full_name}</h3>
                      <p className="text-sm text-gray-600">
                        {primaryBroker.license_number ? `${t('rentals.license')}: ${primaryBroker.license_number}` : t('rentals.propertyManager')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="w-4 h-4 mr-2" />
                      {t('rentals.call')}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Mail className="w-4 h-4 mr-2" />
                      {t('rentals.email')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Similar Rentals */}
        {listing?.properties && (
          <div className="mt-12">
            <SimilarProperties 
              currentProperty={{
                id: listing.properties.id || listing.property_id,
                title: listing.properties.title || 'Rental Property',
                price: listing.nightly_rate || 0,
                bedrooms: listing.properties.bedrooms || 0,
                bathrooms: listing.properties.bathrooms || 0,
                square_meters: listing.properties.square_meters || 0,
                address: listing.properties.address || '',
                city: listing.properties.city || '',
                state: listing.properties.city || '',
                property_type: listing.properties.property_type || 'rental',
                status: 'active',
                compound: listing.properties.compound,
                property_photos: (listing.properties.property_photos || []).map((photo: any, index: number) => ({
                  id: `photo-${index}`,
                  url: photo.url || '',
                  is_primary: photo.is_primary || false,
                  order_index: photo.order_index || index
                }))
              }}
            />
          </div>
        )}

      </div>

      {/* Virtual Tour Modal */}
      {(listing?.properties as any)?.virtual_tour_url && (
        <Dialog open={isFullscreenTour} onOpenChange={setIsFullscreenTour}>
          <DialogContent className="max-w-7xl max-h-[95vh] p-0">
            <VisuallyHidden>
              <DialogHeader>
                <DialogTitle>Virtual Property Tour</DialogTitle>
              </DialogHeader>
            </VisuallyHidden>
            <div className="relative h-[90vh]">
              <TourViewer 
                tourId={(listing?.properties as any)?.virtual_tour_url}
                onRoomChange={(room) => console.log('Room changed:', room)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Assistant Modal */}
      <Dialog open={showAIAssistant} onOpenChange={setShowAIAssistant}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>AI Property Assistant</DialogTitle>
            </DialogHeader>
          </VisuallyHidden>
          <AIAssistant 
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            propertyData={{
              id: listing?.properties?.id || listing?.property_id,
              title: listing?.properties?.title || 'Rental Property',
              description: listing?.properties?.description || '',
              location: `${listing?.properties?.address || ''}, ${listing?.properties?.city || ''}`,
              price: listing?.nightly_rate || 0,
              bedrooms: listing?.properties?.bedrooms || 0,
              bathrooms: listing?.properties?.bathrooms || 0,
              propertyType: listing?.properties?.property_type || 'rental',
              amenities: amenities || {}
            }}
            currentRoom="overview"
            tourContext={{
              visitedRooms: ['overview'],
              timeInRoom: 0,
              totalTimeSpent: 0
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Rental Booking Flow Modal */}
      <Dialog open={showBookingFlow} onOpenChange={setShowBookingFlow}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>Complete Your Rental Booking</DialogTitle>
            </DialogHeader>
          </VisuallyHidden>
          <RentalBookingFlow
            listingId={listing?.id || ''}
            listing={listing || {}}
            onBookingComplete={(booking) => {
              console.log('Booking completed:', booking);
              toast.success(t('rentals.bookingComplete'));
              setShowBookingFlow(false);
            }}
            onBookingCancel={() => {
              setShowBookingFlow(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}