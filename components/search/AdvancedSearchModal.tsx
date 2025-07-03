'use client'
import { useState, useEffect } from 'react'
import { Search, MapPin, DollarSign, Home, X, Filter, Star, Users, Car, Waves, Shield, Dumbbell, Trees, Building, Plane, Train, ShoppingBag, Hospital, Bed, Bath, Calendar, CheckCircle2, Sparkles, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

interface AdvancedSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (filters: SearchFilters) => void
  initialFilters?: Partial<SearchFilters>
}

export interface SearchFilters {
  searchQuery: string
  priceRange: [number, number]
  propertyTypes: string[]
  bedrooms: string[]
  bathrooms: string[]
  squareFeetRange: [number, number]
  cities: string[]
  compound?: string
  amenities: string[]
  features: string[]
  maxDistances: {
    metro?: number
    airport?: number
    mall?: number
    hospital?: number
  }
  furnished?: boolean
  yearBuiltRange?: [number, number]
  sortBy: string
  sortOrder: 'asc' | 'desc'
  downPaymentRange?: [number, number]
  monthlyInstallmentRange?: [number, number]
  paymentPlans?: string[]
}

const getPropertyTypes = (t: any) => [
  { value: 'apartment', label: t('search.apartment'), icon: Building, emoji: '🏢' },
  { value: 'villa', label: t('search.villa'), icon: Home, emoji: '🏘️' },
  { value: 'penthouse', label: t('search.penthouse'), icon: Star, emoji: '⭐' },
  { value: 'townhouse', label: t('search.townhouse'), icon: Home, emoji: '🏘️' },
  { value: 'condo', label: t('search.condominium'), icon: Building, emoji: '🏗️' },
]

const getAmenities = (t: any) => [
  { value: 'has_pool', label: t('search.swimmingPool'), icon: Waves, emoji: '🏊‍♀️' },
  { value: 'has_garden', label: t('search.garden'), icon: Trees, emoji: '🌳' },
  { value: 'has_security', label: t('search.security247'), icon: Shield, emoji: '🛡️' },
  { value: 'has_parking', label: t('search.parking'), icon: Car, emoji: '🚗' },
  { value: 'has_gym', label: t('search.gymFitness'), icon: Dumbbell, emoji: '💪' },
  { value: 'has_playground', label: t('search.playground'), icon: Users, emoji: '🎮' },
  { value: 'has_community_center', label: t('search.communityCenter'), icon: Building, emoji: '🏢' },
]

const getCommonFeatures = (t: any) => [
  { value: 'balcony', label: t('search.balcony'), emoji: '🏞️' },
  { value: 'terrace', label: t('search.terrace'), emoji: '🌅' },
  { value: 'maid_room', label: t('search.maidRoom'), emoji: '🏠' },
  { value: 'storage_room', label: t('search.storageRoom'), emoji: '📦' },
  { value: 'laundry_room', label: t('search.laundryRoom'), emoji: '🧺' },
  { value: 'study_room', label: t('search.studyRoom'), emoji: '📚' },
  { value: 'walk_in_closet', label: t('search.walkInCloset'), emoji: '👗' },
  { value: 'built_in_wardrobes', label: t('search.builtInWardrobes'), emoji: '🚪' },
  { value: 'central_ac', label: t('search.centralAC'), emoji: '❄️' },
  { value: 'floor_heating', label: t('search.floorHeating'), emoji: '🔥' },
  { value: 'smart_home', label: t('search.smartHome'), emoji: '🏡' },
  { value: 'solar_panels', label: t('search.solarPanels'), emoji: '☀️' },
]

const egyptianCities = [
  { value: 'cairo', label: 'Cairo', emoji: '🌟' },
  { value: 'giza', label: 'Giza', emoji: '🗿' },
  { value: 'alexandria', label: 'Alexandria', emoji: '🏖️' },
  { value: 'new_cairo', label: 'New Cairo', emoji: '🏙️' },
  { value: 'new_administrative_capital', label: 'New Administrative Capital', emoji: '🏢' },
  { value: 'maadi', label: 'Maadi', emoji: '🌳' },
  { value: 'zamalek', label: 'Zamalek', emoji: '🏝️' },
  { value: 'heliopolis', label: 'Heliopolis', emoji: '✈️' },
  { value: 'mohandessin', label: 'Mohandessin', emoji: '🏗️' },
  { value: 'sheikh_zayed', label: 'Sheikh Zayed', emoji: '🏘️' },
  { value: '6th_of_october', label: '6th of October', emoji: '🌆' },
  { value: 'marina', label: 'Marina', emoji: '⛵' },
  { value: 'new_alamein', label: 'New Alamein', emoji: '🏖️' },
  { value: 'hurghada', label: 'Hurghada', emoji: '🤿' },
  { value: 'sharm_el_sheikh', label: 'Sharm El Sheikh', emoji: '🐠' },
]

const distanceOptions = [
  { label: 'Walking Distance (0.5km)', value: 0.5, emoji: '🚶‍♀️' },
  { label: 'Short Drive (2km)', value: 2, emoji: '🚗' },
  { label: 'Medium Drive (5km)', value: 5, emoji: '🚙' },
  { label: 'Long Drive (10km)', value: 10, emoji: '🛣️' },
  { label: 'Any Distance', value: null, emoji: '🌍' }
]

export default function AdvancedSearchModal({ 
  isOpen, 
  onClose, 
  onSearch, 
  initialFilters 
}: AdvancedSearchModalProps) {
  const { t } = useTranslation()
  
  // Get translated arrays
  const propertyTypes = getPropertyTypes(t)
  const amenities = getAmenities(t)
  const commonFeatures = getCommonFeatures(t)
  
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    priceRange: [0, 10000000],
    propertyTypes: [],
    bedrooms: [],
    bathrooms: [],
    squareFeetRange: [0, 10000],
    cities: [],
    compound: '',
    amenities: [],
    features: [],
    maxDistances: {},
    furnished: undefined,
    yearBuiltRange: [1900, new Date().getFullYear()],
    sortBy: 'created_at',
    sortOrder: 'desc',
    downPaymentRange: [0, 1000000],
    monthlyInstallmentRange: [0, 10000],
    paymentPlans: []
  })

  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({ ...prev, ...initialFilters }))
    }
  }, [initialFilters])

  const handleArrayToggle = (array: string[], value: string, field: keyof SearchFilters) => {
    const newArray = array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value]
    
    setFilters(prev => ({ ...prev, [field]: newArray }))
  }



  const clearAllFilters = () => {
    setFilters({
      searchQuery: '',
      priceRange: [0, 10000000],
      propertyTypes: [],
      bedrooms: [],
      bathrooms: [],
      squareFeetRange: [0, 10000],
      cities: [],
      compound: '',
      amenities: [],
      features: [],
      maxDistances: {},
      furnished: undefined,
      yearBuiltRange: [1900, new Date().getFullYear()],
      sortBy: 'created_at',
      sortOrder: 'desc',
      downPaymentRange: [0, 1000000],
      monthlyInstallmentRange: [0, 10000],
      paymentPlans: []
    })
  }

  const activeFilterCount = [
    filters.searchQuery ? 1 : 0,
    filters.propertyTypes.length,
    filters.cities.length,
    filters.compound ? 1 : 0,
    filters.amenities.length,
    filters.features.length,
    Object.keys(filters.maxDistances).length,
    filters.furnished !== undefined ? 1 : 0
  ].reduce((sum, count) => sum + count, 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-slate-200">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>
          <div className="relative px-8 py-6 text-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-100/50 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-slate-200/50">
                  <Filter className="w-6 h-6 text-slate-600" />
            </div>
            <div>
                  <h2 className="text-2xl font-bold">{t('search.advancedPropertySearch')}</h2>
                  <p className="text-slate-600">
                    {activeFilterCount > 0 ? t('search.activeFilters', { count: activeFilterCount }) : t('search.findPerfectProperty')}
              </p>
            </div>
          </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-slate-600 hover:bg-slate-100/50 border border-slate-200/50 rounded-xl"
                >
                  <X className="w-4 h-4 mr-2" />
{t('search.clearAll')}
            </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="text-slate-600 hover:bg-slate-100/50 rounded-xl"
                >
                  <X className="w-5 h-5" />
            </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-180px)]">
          <div className="space-y-10">
            {/* Search Query Section */}
            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/60">
              <div className="flex items-center space-x-3 mb-4">
                <Search className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">{t('search.searchKeywords')}</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder={t('search.searchPlaceholder')}
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-12 h-12 text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 rounded-xl"
                />
              </div>
            </div>

            {/* Financing Options - Prominent Section */}
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-6 border border-blue-200/60">
              <div className="flex items-center space-x-3 mb-6">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-800">{t('search.budgetFinancing')}</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">{t('search.popular')}</Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Price Range */}
            <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center justify-between">
                    <span className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-slate-500" />
{t('search.totalPriceRange')}
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      ${filters.priceRange[0].toLocaleString()} - ${filters.priceRange[1].toLocaleString()}
                    </span>
                  </h4>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                max={10000000}
                min={0}
                    step={100000}
                className="w-full"
              />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>$0</span>
                <span>$10M+</span>
              </div>
            </div>

                {/* Down Payment */}
            <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center justify-between">
                    <span className="flex items-center">
                      <Bed className="h-4 w-4 mr-2 text-slate-500" />
                      {t('search.downPaymentRange', 'Down Payment Range')}
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      ${(filters.downPaymentRange?.[0] || 0).toLocaleString()} - ${(filters.downPaymentRange?.[1] || 1000000).toLocaleString()}
                    </span>
                  </h4>
                  <Slider
                    value={filters.downPaymentRange || [0, 1000000]}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, downPaymentRange: value as [number, number] }))}
                    max={2000000}
                    min={0}
                    step={50000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>$0</span>
                    <span>$2M+</span>
              </div>
            </div>

                {/* Monthly Installment */}
              <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                      {t('search.monthlyInstallment', 'Monthly Installment')}
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      ${(filters.monthlyInstallmentRange?.[0] || 0).toLocaleString()} - ${(filters.monthlyInstallmentRange?.[1] || 10000).toLocaleString()}
                    </span>
                  </h4>
                  <Slider
                    value={filters.monthlyInstallmentRange || [0, 10000]}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, monthlyInstallmentRange: value as [number, number] }))}
                    max={50000}
                    min={0}
                    step={500}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>$0</span>
                    <span>$50K+</span>
                  </div>
                </div>

                {/* Payment Plan Type */}
              <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-slate-500" />
                    {t('search.paymentPlanOptions', 'Payment Plan Options')}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'cash', label: t('search.cashPayment', 'Cash Payment'), emoji: '💰' },
                      { value: 'installments', label: t('search.installments', 'Installments'), emoji: '📅' },
                      { value: 'mortgage', label: t('search.mortgage', 'Mortgage'), emoji: '🏦' },
                      { value: 'rent_to_own', label: t('search.rentToOwn', 'Rent to Own'), emoji: '🔄' },
                    ].map((plan) => (
                      <label key={plan.value} className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer">
                        <Checkbox
                          checked={filters.paymentPlans?.includes(plan.value) || false}
                          onCheckedChange={() => {
                            const current = filters.paymentPlans || []
                            const newPlans = current.includes(plan.value)
                              ? current.filter(p => p !== plan.value)
                              : [...current, plan.value]
                            setFilters(prev => ({ ...prev, paymentPlans: newPlans }))
                          }}
                          className="border-slate-300"
                        />
                        <span className="text-lg">{plan.emoji}</span>
                        <span className="text-sm font-medium text-slate-700 flex-1">{plan.label}</span>
                </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Property Basics Section */}
            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/60">
              <div className="flex items-center space-x-3 mb-6">
                <Home className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">{t('search.propertyBasics', 'Property Basics')}</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Property Types */}
            <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-slate-500" />
                    {t('search.propertyTypes', 'Property Types')}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {propertyTypes.map((type) => (
                      <label key={type.value} className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer">
                    <Checkbox
                          checked={filters.propertyTypes.includes(type.value)}
                          onCheckedChange={() => handleArrayToggle(filters.propertyTypes, type.value, 'propertyTypes')}
                          className="border-slate-300"
                    />
                        <span className="text-xl">{type.emoji}</span>
                        <span className="text-sm font-medium text-slate-700 flex-1">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

                {/* Bedrooms & Bathrooms */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
                      <Bed className="h-4 w-4 mr-2 text-slate-500" />
                      {t('search.bedrooms', 'Bedrooms')}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {['1', '2', '3', '4', '5+'].map((bedroom) => (
                        <button
                          key={bedroom}
                          onClick={() => {
                            const isSelected = filters.bedrooms.includes(bedroom)
                            handleArrayToggle(filters.bedrooms, bedroom, 'bedrooms')
                          }}
                          className={`p-3 text-center rounded-xl border-2 transition-all font-medium ${
                            filters.bedrooms.includes(bedroom)
                              ? 'border-slate-400 bg-slate-100 text-slate-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {bedroom}
                        </button>
                      ))}
                    </div>
                  </div>

            <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
                      <Bath className="h-4 w-4 mr-2 text-slate-500" />
                      {t('search.bathrooms', 'Bathrooms')}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {['1', '2', '3', '4', '5+'].map((bathroom) => (
                        <button
                          key={bathroom}
                          onClick={() => handleArrayToggle(filters.bathrooms, bathroom, 'bathrooms')}
                          className={`p-3 text-center rounded-xl border-2 transition-all font-medium ${
                            filters.bathrooms.includes(bathroom)
                              ? 'border-slate-400 bg-slate-100 text-slate-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {bathroom}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Square Feet */}
              <div className="mt-8">
                <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center justify-between">
                  <span className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-slate-500" />
                    {t('search.squareFeet', 'Square Feet')}
                  </span>
                  <span className="text-sm font-medium text-slate-600">
                    {filters.squareFeetRange[0].toLocaleString()} - {filters.squareFeetRange[1].toLocaleString()} sqft
                  </span>
                </h4>
                <Slider
                  value={filters.squareFeetRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, squareFeetRange: value as [number, number] }))}
                  max={10000}
                  min={0}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>0 sqft</span>
                  <span>10,000+ sqft</span>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/60">
              <div className="flex items-center space-x-3 mb-6">
                <MapPin className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">{t('search.locationProximity', 'Location & Proximity')}</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cities */}
            <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">{t('search.preferredCities', 'Preferred Cities')}</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {egyptianCities.map((city) => (
                      <label key={city.value} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer">
                        <Checkbox
                          checked={filters.cities.includes(city.value)}
                          onCheckedChange={() => handleArrayToggle(filters.cities, city.value, 'cities')}
                          className="border-slate-300"
                        />
                        <span className="text-lg">{city.emoji}</span>
                        <span className="text-sm font-medium text-slate-700">{city.label}</span>
              </label>
                ))}
              </div>
            </div>

            {/* Distance Preferences */}
            <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">{t('search.maximumDistanceTo', 'Maximum Distance To')}</h4>
                  <div className="space-y-4">
                {[
                  { key: 'metro', label: 'Metro Station', icon: Train },
                  { key: 'airport', label: 'Airport', icon: Plane },
                  { key: 'mall', label: 'Shopping Mall', icon: ShoppingBag },
                      { key: 'hospital', label: 'Hospital', icon: Hospital },
                    ].map((item) => (
                      <div key={item.key}>
                        <label className="text-sm font-medium text-slate-700 mb-2 flex items-center">
                          <item.icon className="h-4 w-4 mr-2 text-slate-500" />
                          {item.label}
                        </label>
                    <Select
                          value={filters.maxDistances[item.key as keyof typeof filters.maxDistances]?.toString() || 'any'}
                          onValueChange={(value) => {
                            const numValue = value === 'any' ? undefined : parseFloat(value)
                            setFilters(prev => ({
                        ...prev,
                              maxDistances: { ...prev.maxDistances, [item.key]: numValue }
                            }))
                          }}
                    >
                          <SelectTrigger className="h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 rounded-lg">
                        <SelectValue placeholder={t('search.anyDistance', 'Any distance')} />
                      </SelectTrigger>
                      <SelectContent>
                            <SelectItem value="any">{t('search.anyDistance', 'Any distance')}</SelectItem>
                            {distanceOptions.filter(option => option.value !== null).map((option) => (
                          <SelectItem 
                                key={option.value!.toString()} 
                                value={option.value!.toString()}
                          >
                                {option.emoji} {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
                </div>
              </div>
            </div>

            {/* Amenities & Features */}
            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/60">
              <div className="flex items-center space-x-3 mb-6">
                <Star className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">{t('search.amenitiesFeatures', 'Amenities & Features')}</h3>
            </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Amenities */}
            <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">{t('search.communityAmenities', 'Community Amenities')}</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {amenities.map((amenity) => (
                      <label key={amenity.value} className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer">
                        <Checkbox
                          checked={filters.amenities.includes(amenity.value)}
                          onCheckedChange={() => handleArrayToggle(filters.amenities, amenity.value, 'amenities')}
                          className="border-slate-300"
                        />
                        <span className="text-xl">{amenity.emoji}</span>
                        <span className="text-sm font-medium text-slate-700 flex-1">{amenity.label}</span>
              </label>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">{t('search.propertyFeatures', 'Property Features')}</h4>
                  <div className="grid grid-cols-1 gap-3">
                {commonFeatures.map((feature) => (
                      <label key={feature.value} className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer">
                        <Checkbox
                          checked={filters.features.includes(feature.value)}
                          onCheckedChange={() => handleArrayToggle(filters.features, feature.value, 'features')}
                          className="border-slate-300"
                        />
                        <span className="text-xl">{feature.emoji}</span>
                        <span className="text-sm font-medium text-slate-700 flex-1">{feature.label}</span>
                      </label>
                ))}
              </div>
            </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/60">
              <div className="flex items-center space-x-3 mb-6">
                <Building className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">{t('search.additionalOptions', 'Additional Options')}</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Compound/Development */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-slate-500" />
                    {t('search.compoundDevelopment', 'Compound/Development')}
                  </h4>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder={t('search.compoundPlaceholder', 'e.g., Palm Hills, Mivida, Katameya Heights...')}
                      value={filters.compound || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, compound: e.target.value }))}
                      className="pl-12 h-12 text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 rounded-xl"
                    />
                  </div>
                </div>

            {/* Sort Options */}
                <div className="space-y-4">
              <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
                      <SlidersHorizontal className="h-4 w-4 mr-2 text-slate-500" />
                      {t('search.sortResults', 'Sort Results')}
                    </h4>
                <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                      <SelectTrigger className="h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 rounded-xl">
                        <SelectValue placeholder={t('search.sortByPlaceholder', 'Sort by...')} />
                  </SelectTrigger>
                  <SelectContent>
                        <SelectItem value="price">💰 Price</SelectItem>
                        <SelectItem value="created_at">📅 Date Added</SelectItem>
                        <SelectItem value="square_meters">📐 Size</SelectItem>
                        <SelectItem value="bedrooms">🛏️ Bedrooms</SelectItem>
                        <SelectItem value="view_count">👁️ Popularity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                  
              <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">{t('search.sortOrder', 'Sort Order')}</h4>
                <Select value={filters.sortOrder} onValueChange={(value: 'asc' | 'desc') => setFilters(prev => ({ ...prev, sortOrder: value }))}>
                      <SelectTrigger className="h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 rounded-xl">
                        <SelectValue placeholder={t('search.orderPlaceholder', 'Order...')} />
                  </SelectTrigger>
                  <SelectContent>
                        <SelectItem value="asc">⬆️ Low to High</SelectItem>
                        <SelectItem value="desc">⬇️ High to Low</SelectItem>
                  </SelectContent>
                </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="relative overflow-hidden bg-white/30 backdrop-blur-sm px-8 py-6 border-t border-slate-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-slate-700">
                <p className="text-sm font-medium">
                  {activeFilterCount > 0 ? t('search.activeFilters', '{{count}} filters active', { count: activeFilterCount }) : t('search.noFiltersApplied', 'No filters applied')}
                </p>
                <p className="text-xs text-slate-500">
                  {t('search.useAdvancedFilters', 'Use advanced filters to find your perfect property')}
                </p>
              </div>
          </div>
            
          <div className="flex items-center space-x-3">
              <Button 
                onClick={clearAllFilters}
                className="bg-slate-100/50 hover:bg-slate-200/50 text-slate-700 border border-slate-300/50 hover:border-slate-400/50 rounded-xl px-6 font-medium"
              >
                {t('search.resetAll', 'Reset All')}
            </Button>
              <Button 
                onClick={() => onSearch(filters)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
{t('search.searchProperties')}
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-white/20 text-white border-white/30 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
            </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 