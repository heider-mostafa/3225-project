'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  MapPin, 
  Calendar as CalendarIcon, 
  Users, 
  DollarSign, 
  Filter,
  Home,
  Wifi,
  Car,
  Waves,
  Utensils,
  Wind,
  Tv,
  Shield,
  Building,
  Sparkles,
  Star,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import rentalMarketplaceService from '@/lib/services/rental-marketplace-service';

interface RentalSearchFiltersProps {
  onSearch: (results: any[]) => void;
  onFiltersChange?: (filters: any) => void;
  initialFilters?: any;
}

interface SearchFilters {
  // Basic search
  location: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  
  // Price range
  min_price: number;
  max_price: number;
  
  // Property type
  property_type: string[];
  rental_type: 'short_term' | 'long_term' | 'both' | '';
  
  // Amenities
  amenities: string[];
  
  // Features
  instant_book: boolean;
  has_reviews: boolean;
  min_rating: number;
  
  // Location features
  has_sea_view: boolean;
  has_nile_view: boolean;
  has_balcony: boolean;
  
  // Accommodation details
  min_bedrooms: number;
  min_bathrooms: number;
  
  // Sorting
  sort_by: 'price_low' | 'price_high' | 'rating' | 'newest' | 'distance';
}

export function RentalSearchFilters({ 
  onSearch, 
  onFiltersChange,
  initialFilters 
}: RentalSearchFiltersProps) {
  const { t } = useTranslation();
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    check_in_date: '',
    check_out_date: '',
    guests: 1,
    min_price: 0,
    max_price: 10000,
    property_type: [],
    rental_type: '',
    amenities: [],
    instant_book: false,
    has_reviews: false,
    min_rating: 0,
    has_sea_view: false,
    has_nile_view: false,
    has_balcony: false,
    min_bedrooms: 0,
    min_bathrooms: 0,
    sort_by: 'rating',
    ...initialFilters
  });

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  const propertyTypes = [
    { id: 'apartment', label: t('search.apartment'), icon: Building },
    { id: 'villa', label: t('search.villa'), icon: Home },
    { id: 'penthouse', label: t('search.penthouse'), icon: Building },
    { id: 'townhouse', label: t('search.townhouse'), icon: Home },
    { id: 'studio', label: t('search.studios'), icon: Building }
  ];

  const amenitiesList = [
    { id: 'has_wifi', label: t('rentals.freeWifi'), icon: Wifi },
    { id: 'has_parking', label: t('rentals.parking'), icon: Car },
    { id: 'has_ac', label: t('rentals.airConditioning'), icon: Wind },
    { id: 'has_kitchen', label: t('rentals.kitchen'), icon: Utensils },
    { id: 'has_swimming_pool', label: t('rentals.swimmingPool'), icon: Waves },
    { id: 'has_tv', label: 'TV', icon: Tv },
    { id: 'has_security_guard', label: t('common.security'), icon: Shield },
    { id: 'has_elevator', label: t('common.elevator'), icon: Building },
    { id: 'has_gym', label: t('common.gym'), icon: Sparkles },
    { id: 'has_spa', label: t('common.spa'), icon: Sparkles }
  ];

  const egyptianCities = [
    'Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh', 'Hurghada',
    'Luxor', 'Aswan', 'Dahab', 'El Gouna', 'Marsa Alam',
    'New Cairo', '6th of October', 'New Administrative Capital',
    'North Coast', 'Ain Sokhna', 'Fayoum'
  ];

  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters]); // Removed onFiltersChange from dependencies to prevent infinite loop

  useEffect(() => {
    if (selectedDates.from) {
      updateFilter('check_in_date', format(selectedDates.from, 'yyyy-MM-dd'));
    }
    if (selectedDates.to) {
      updateFilter('check_out_date', format(selectedDates.to, 'yyyy-MM-dd'));
    }
  }, [selectedDates]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
    const currentArray = filters[key] as string[];
    const updatedArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, updatedArray);
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      check_in_date: '',
      check_out_date: '',
      guests: 1,
      min_price: 0,
      max_price: 10000,
      property_type: [],
      rental_type: '',
      amenities: [],
      instant_book: false,
      has_reviews: false,
      min_rating: 0,
      has_sea_view: false,
      has_nile_view: false,
      has_balcony: false,
      min_bedrooms: 0,
      min_bathrooms: 0,
      sort_by: 'rating'
    });
    setSelectedDates({ from: undefined, to: undefined });
  };

  const performSearch = async () => {
    setIsSearching(true);
    
    try {
      const searchParams = {
        location: filters.location || undefined,
        check_in_date: filters.check_in_date || undefined,
        check_out_date: filters.check_out_date || undefined,
        guests: filters.guests,
        min_price: filters.min_price > 0 ? filters.min_price : undefined,
        max_price: filters.max_price < 10000 ? filters.max_price : undefined,
        rental_type: filters.rental_type || undefined,
        // Add more search parameters as needed
      };

      const result = await rentalMarketplaceService.searchRentals(searchParams);
      
      if (result.success && result.listings) {
        setSearchResults(result.listings);
        setTotalResults(result.total_count || 0);
        onSearch(result.listings);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.location) count++;
    if (filters.check_in_date && filters.check_out_date) count++;
    if (filters.property_type.length > 0) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.min_price > 0 || filters.max_price < 10000) count++;
    if (filters.rental_type) count++;
    if (filters.instant_book) count++;
    if (filters.has_reviews) count++;
    if (filters.min_rating > 0) count++;
    if (filters.min_bedrooms > 0) count++;
    if (filters.min_bathrooms > 0) count++;
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Main Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Location */}
            <div className="lg:col-span-2">
              <Label className="text-sm font-medium mb-2 block">{t('rentals.location')}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={filters.location}
                  onChange={(e) => updateFilter('location', e.target.value)}
                  placeholder={t('rentals.location')}
                  className="pl-10"
                />
              </div>
              {filters.location && (
                <div className="mt-2 space-y-1">
                  {egyptianCities
                    .filter(city => city.toLowerCase().includes(filters.location.toLowerCase()))
                    .slice(0, 3)
                    .map(city => (
                      <Button
                        key={city}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => updateFilter('location', city)}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {city}
                      </Button>
                    ))
                  }
                </div>
              )}
            </div>

            {/* Dates */}
            <div>
              <Label className="text-sm font-medium mb-2 block">{t('rentals.checkIn')} & {t('rentals.checkOut')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDates.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDates?.from ? (
                      selectedDates.to ? (
                        <span className="text-xs">
                          {format(selectedDates.from, "MMM dd")} - {format(selectedDates.to, "MMM dd")}
                        </span>
                      ) : (
                        format(selectedDates.from, "MMM dd, yyyy")
                      )
                    ) : (
                      <span>{t('rentals.availableDates')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={selectedDates?.from}
                    selected={selectedDates}
                    onSelect={(range) => setSelectedDates(range || { from: undefined, to: undefined })}
                    numberOfMonths={2}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Guests */}
            <div>
              <Label className="text-sm font-medium mb-2 block">{t('rentals.guests')}</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('guests', Math.max(1, filters.guests - 1))}
                  disabled={filters.guests <= 1}
                  className="h-9 w-9 p-0"
                >
                  -
                </Button>
                <span className="text-center w-12 text-sm">{filters.guests}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('guests', filters.guests + 1)}
                  className="h-9 w-9 p-0"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Search Button */}
            <div>
              <Label className="text-sm font-medium mb-2 block invisible">{t('common.search')}</Label>
              <Button 
                onClick={performSearch} 
                disabled={isSearching}
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? t('common.loading') : t('common.search')}
              </Button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              {t('common.filter')}
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 h-4 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>

            {filters.rental_type === 'short_term' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter('rental_type', '')}>
                {t('rentals.shortTermRentals')} <X className="h-3 w-3 ml-1" />
              </Badge>
            )}

            {filters.rental_type === 'long_term' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter('rental_type', '')}>
                {t('rentals.longTermRentals')} <X className="h-3 w-3 ml-1" />
              </Badge>
            )}

            {filters.instant_book && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter('instant_book', false)}>
                {t('rentals.instantBook')} <X className="h-3 w-3 ml-1" />
              </Badge>
            )}

            {getActiveFiltersCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {t('common.clearAll')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t('rentals.advancedFilters')}
            </CardTitle>
            <CardDescription>
              {t('rentals.narrowDownSearch')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price Range */}
            <div>
              <Label className="text-sm font-medium mb-4 block">{t('rentals.priceRange')} (EGP per night)</Label>
              <div className="px-4">
                <Slider
                  value={[filters.min_price, filters.max_price]}
                  onValueChange={([min, max]) => {
                    updateFilter('min_price', min);
                    updateFilter('max_price', max);
                  }}
                  max={10000}
                  min={0}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{filters.min_price} EGP</span>
                  <span>{filters.max_price}+ EGP</span>
                </div>
              </div>
            </div>

            {/* Property Type */}
            <div>
              <Label className="text-sm font-medium mb-4 block">{t('rentals.propertyType')}</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {propertyTypes.map(({ id, label, icon: Icon }) => (
                  <div
                    key={id}
                    className={cn(
                      "flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all",
                      filters.property_type.includes(id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => toggleArrayFilter('property_type', id)}
                  >
                    <Icon className={cn(
                      "h-6 w-6 mb-2",
                      filters.property_type.includes(id) ? "text-blue-600" : "text-gray-600"
                    )} />
                    <span className={cn(
                      "text-xs text-center",
                      filters.property_type.includes(id) ? "text-blue-600 font-medium" : "text-gray-600"
                    )}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rental Type */}
            <div>
              <Label className="text-sm font-medium mb-4 block">{t('rentals.rentalDuration')}</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'short_term', label: t('rentals.shortTermDaily') },
                  { value: 'long_term', label: t('rentals.longTermMonthly') },
                  { value: 'both', label: t('common.both') }
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={filters.rental_type === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('rental_type', filters.rental_type === value ? '' : value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <Label className="text-sm font-medium mb-4 block">{t('rentals.amenities')}</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {amenitiesList.map(({ id, label, icon: Icon }) => (
                  <div
                    key={id}
                    className={cn(
                      "flex items-center p-3 border rounded-lg cursor-pointer transition-all",
                      filters.amenities.includes(id) ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => toggleArrayFilter('amenities', id)}
                  >
                    <Icon className={cn(
                      "h-4 w-4 mr-2",
                      filters.amenities.includes(id) ? "text-green-600" : "text-gray-600"
                    )} />
                    <span className={cn(
                      "text-xs",
                      filters.amenities.includes(id) ? "text-green-600 font-medium" : "text-gray-600"
                    )}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('rentals.minimumBedrooms')}</Label>
                <Select value={filters.min_bedrooms.toString()} onValueChange={(value) => updateFilter('min_bedrooms', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num === 0 ? t('common.any') : `${num}+ ${t('common.bedroom')}${num > 1 ? 's' : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">{t('rentals.minimumBathrooms')}</Label>
                <Select value={filters.min_bathrooms.toString()} onValueChange={(value) => updateFilter('min_bathrooms', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num === 0 ? t('common.any') : `${num}+ ${t('common.bathroom')}${num > 1 ? 's' : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Special Features */}
            <div>
              <Label className="text-sm font-medium mb-4 block">{t('rentals.specialFeatures')}</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <Label className="text-sm">{t('rentals.instantBook')}</Label>
                  </div>
                  <Switch
                    checked={filters.instant_book}
                    onCheckedChange={(checked) => updateFilter('instant_book', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <Label className="text-sm">{t('rentals.hasReviews')}</Label>
                  </div>
                  <Switch
                    checked={filters.has_reviews}
                    onCheckedChange={(checked) => updateFilter('has_reviews', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waves className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm">{t('rentals.seaView')}</Label>
                  </div>
                  <Switch
                    checked={filters.has_sea_view}
                    onCheckedChange={(checked) => updateFilter('has_sea_view', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waves className="h-4 w-4 text-teal-600" />
                    <Label className="text-sm">{t('rentals.nileView')}</Label>
                  </div>
                  <Switch
                    checked={filters.has_nile_view}
                    onCheckedChange={(checked) => updateFilter('has_nile_view', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <Label className="text-sm font-medium mb-4 block">{t('rentals.minimumRating')}</Label>
              <div className="flex gap-2">
                {[0, 3, 4, 4.5, 5].map(rating => (
                  <Button
                    key={rating}
                    variant={filters.min_rating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('min_rating', filters.min_rating === rating ? 0 : rating)}
                  >
                    {rating === 0 ? t('common.any') : (
                      <div className="flex items-center gap-1">
                        {rating}
                        <Star className="h-3 w-3 fill-current" />
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <Label className="text-sm font-medium mb-2 block">{t('rentals.sortBy')}</Label>
              <Select value={filters.sort_by} onValueChange={(value) => updateFilter('sort_by', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">{t('rentals.highestRated')}</SelectItem>
                  <SelectItem value="price_low">{t('rentals.priceLowToHigh')}</SelectItem>
                  <SelectItem value="price_high">{t('rentals.priceHighToLow')}</SelectItem>
                  <SelectItem value="newest">{t('rentals.newestFirst')}</SelectItem>
                  <SelectItem value="distance">{t('rentals.distance')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results Summary */}
      {totalResults > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t('rentals.foundProperties', { count: totalResults.toLocaleString() })}
                {filters.location && ` في ${filters.location}`}
              </span>
              <Button variant="ghost" size="sm" onClick={performSearch}>
                <Search className="h-4 w-4 mr-1" />
{t('rentals.updateResults')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}