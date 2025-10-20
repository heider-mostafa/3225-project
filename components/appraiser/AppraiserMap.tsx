'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Star, 
  Shield,
  User,
  MessageSquare,
  Eye,
  Navigation,
  ZoomIn,
  ZoomOut,
  Locate
} from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

interface Appraiser {
  id: string;
  full_name: string;
  profile_headline?: string;
  standardized_headshot_url?: string;
  valify_status: string;
  average_rating?: number;
  total_reviews?: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  price_range: {
    min: number;
    max: number;
    currency: string;
  };
  is_available_now: boolean;
}

interface AppraiserMapProps {
  appraisers: Appraiser[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onAppraiserSelect?: (appraiser: Appraiser) => void;
}

export function AppraiserMap({ 
  appraisers, 
  center = { lat: 30.0444, lng: 31.2357 }, // Cairo default
  zoom = 10,
  onAppraiserSelect 
}: AppraiserMapProps) {
  const { t } = useTranslation();
  const [selectedAppraiser, setSelectedAppraiser] = useState<Appraiser | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    // Initialize Google Map
    if (typeof window !== 'undefined' && window.google) {
      initializeMap();
    } else {
      // Load Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    }
  }, [appraisers]);

  const initializeMap = () => {
    if (!window.google) return;

    const mapElement = document.getElementById('appraiser-map');
    if (!mapElement) return;

    const map = new window.google.maps.Map(mapElement, {
      center: center,
      zoom: zoom,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMapInstance(map);

    // Add appraiser markers
    appraisers.forEach((appraiser) => {
      const marker = new window.google.maps.Marker({
        position: { lat: appraiser.location.lat, lng: appraiser.location.lng },
        map: map,
        title: appraiser.full_name,
        icon: {
          url: createCustomMarkerIcon(appraiser),
          size: new window.google.maps.Size(60, 80),
          scaledSize: new window.google.maps.Size(60, 80),
          anchor: new window.google.maps.Point(30, 80)
        }
      });

      marker.addListener('click', () => {
        setSelectedAppraiser(appraiser);
        onAppraiserSelect?.(appraiser);
      });
    });

    // Add user location marker if available
    if (userLocation) {
      new window.google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Your Location',
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
            </svg>
          `),
          size: new window.google.maps.Size(24, 24),
          scaledSize: new window.google.maps.Size(24, 24),
          anchor: new window.google.maps.Point(12, 12)
        }
      });
    }
  };

  const createCustomMarkerIcon = (appraiser: Appraiser) => {
    const isVerified = appraiser.valify_status === 'verified';
    const isAvailable = appraiser.is_available_now;
    
    const markerSvg = `
      <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 0C13.431 0 0 13.431 0 30C0 46.569 30 80 30 80S60 46.569 60 30C60 13.431 46.569 0 30 0Z" 
              fill="${isAvailable ? '#10B981' : '#6B7280'}"/>
        <circle cx="30" cy="30" r="20" fill="white"/>
        ${appraiser.standardized_headshot_url ? 
          `<image href="${appraiser.standardized_headshot_url}" x="15" y="15" width="30" height="30" clip-path="circle(15px at 30px 30px)"/>` :
          `<circle cx="30" cy="30" r="12" fill="#E5E7EB"/>
           <path d="M30 20C26.686 20 24 22.686 24 26C24 29.314 26.686 32 30 32C33.314 32 36 29.314 36 26C36 22.686 33.314 20 30 20Z" fill="#9CA3AF"/>
           <path d="M42 40C42 35.582 35.732 32 30 32C24.268 32 18 35.582 18 40V42H42V40Z" fill="#9CA3AF"/>`
        }
        ${isVerified ? 
          `<circle cx="45" cy="15" r="8" fill="#10B981"/>
           <path d="M41 15L44 18L49 12" stroke="white" stroke-width="2" fill="none"/>` : 
          ''
        }
      </svg>
    `;
    
    return 'data:image/svg+xml;base64,' + btoa(markerSvg);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderRating = (appraiser: Appraiser) => {
    if (!appraiser.average_rating || !appraiser.total_reviews) {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <Star className="h-3 w-3" />
          <span className="text-xs">{t('appraiserDashboard.noReviews')}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 text-yellow-400 fill-current" />
        <span className="text-xs font-medium">{appraiser.average_rating.toFixed(1)}</span>
        <span className="text-xs text-gray-500">({appraiser.total_reviews})</span>
      </div>
    );
  };

  const zoomIn = () => {
    if (mapInstance) {
      mapInstance.setZoom(mapInstance.getZoom() + 1);
    }
  };

  const zoomOut = () => {
    if (mapInstance) {
      mapInstance.setZoom(mapInstance.getZoom() - 1);
    }
  };

  const centerOnUser = () => {
    if (mapInstance && userLocation) {
      mapInstance.setCenter(userLocation);
      mapInstance.setZoom(12);
    }
  };

  return (
    <div className="relative">
      {/* Map Container */}
      <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden border">
        <div id="appraiser-map" className="w-full h-full" />
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button size="sm" variant="outline" className="bg-white" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="bg-white" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          {userLocation && (
            <Button size="sm" variant="outline" className="bg-white" onClick={centerOnUser}>
              <Locate className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Available Now</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500"></div>
              <span>Contact for Availability</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Appraiser Info Card */}
      {selectedAppraiser && (
        <Card className="absolute top-4 left-4 w-80 shadow-lg bg-white/95 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {selectedAppraiser.standardized_headshot_url ? (
                  <Image
                    src={selectedAppraiser.standardized_headshot_url}
                    alt={selectedAppraiser.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">{selectedAppraiser.full_name}</h3>
                  {selectedAppraiser.valify_status === 'verified' && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                {selectedAppraiser.profile_headline && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {selectedAppraiser.profile_headline}
                  </p>
                )}
                
                <div className="flex items-center justify-between mb-2">
                  {renderRating(selectedAppraiser)}
                  
                  {selectedAppraiser.is_available_now ? (
                    <Badge className="bg-green-100 text-green-800 text-xs">Available Now</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Contact for Availability</Badge>
                  )}
                </div>
                
                <div className="text-sm font-medium text-green-600 mb-2">
                  {formatCurrency(selectedAppraiser.price_range.min)} - {formatCurrency(selectedAppraiser.price_range.max)}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{selectedAppraiser.location.address}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 text-xs" asChild>
                    <a href={`/appraisers/${selectedAppraiser.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      View Profile
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                onClick={() => setSelectedAppraiser(null)}
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {appraisers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Loading appraisers...</p>
          </div>
        </div>
      )}
    </div>
  );
}