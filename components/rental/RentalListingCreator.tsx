'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  DollarSign, 
  Calendar, 
  Settings, 
  QrCode, 
  Shield, 
  Sparkles,
  Clock,
  Users,
  Wifi,
  Car,
  Waves,
  Utensils,
  Tv,
  Wind,
  MapPin,
  CheckCircle,
  AlertCircle,
  Building
} from 'lucide-react';
import { toast } from 'sonner';
import rentalMarketplaceService from '@/lib/services/rental-marketplace-service';

interface RentalListingCreatorProps {
  propertyId?: string;
  ownerId: string;
  onListingCreated?: (listing: any) => void;
}

type FormStep = 'property' | 'pricing' | 'rules' | 'amenities' | 'compliance' | 'review';

export function RentalListingCreator({ 
  propertyId, 
  ownerId, 
  onListingCreated 
}: RentalListingCreatorProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('property');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    // Property selection
    property_id: propertyId || '',
    
    // Rental type and pricing
    rental_type: 'both' as 'short_term' | 'long_term' | 'both',
    nightly_rate: 0,
    monthly_rate: 0,
    yearly_rate: 0,
    
    // Rules and policies
    minimum_stay_nights: 1,
    maximum_stay_nights: 365,
    check_in_time: '15:00',
    check_out_time: '11:00',
    cancellation_policy: 'moderate',
    instant_book: false,
    
    // House rules
    smoking_allowed: false,
    pets_allowed: false,
    parties_allowed: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    maximum_occupancy: 4,
    additional_rules: '',
    
    // Fees
    cleaning_fee: 0,
    security_deposit: 0,
    extra_guest_fee: 0,
    
    // QR and compliance
    developer_qr_code: '',
    developer_name: '',
    tourism_permit_number: '',
    
    // Amenities
    has_wifi: true,
    has_ac: true,
    has_heating: false,
    has_kitchen: true,
    has_washing_machine: true,
    has_tv: true,
    has_satellite_tv: false,
    has_balcony: false,
    has_sea_view: false,
    has_nile_view: false,
    has_elevator: false,
    has_swimming_pool: false,
    has_gym: false,
    has_spa: false,
    has_concierge: false,
    has_security_guard: false,
    has_cctv: false,
    has_safe: false,
    has_parking: true,
  });

  useEffect(() => {
    if (!propertyId) {
      loadAvailableProperties();
    }
  }, [propertyId]);

  const loadAvailableProperties = async () => {
    // Load user's properties that aren't already listed for rent
    // This would be implemented with actual API call
    setAvailableProperties([]);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: FormStep): boolean => {
    switch (step) {
      case 'property':
        return !!formData.property_id;
      case 'pricing':
        return (formData.rental_type === 'short_term' && formData.nightly_rate > 0) ||
               (formData.rental_type === 'long_term' && (formData.monthly_rate > 0 || formData.yearly_rate > 0)) ||
               (formData.rental_type === 'both' && formData.nightly_rate > 0 && (formData.monthly_rate > 0 || formData.yearly_rate > 0));
      case 'rules':
        return formData.minimum_stay_nights > 0 && formData.maximum_stay_nights >= formData.minimum_stay_nights;
      default:
        return true;
    }
  };

  const nextStep = () => {
    const steps: FormStep[] = ['property', 'pricing', 'rules', 'amenities', 'compliance', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1 && validateStep(currentStep)) {
      setCurrentStep(steps[currentIndex + 1]);
    } else if (!validateStep(currentStep)) {
      toast.error('Please complete all required fields before proceeding');
    }
  };

  const prevStep = () => {
    const steps: FormStep[] = ['property', 'pricing', 'rules', 'amenities', 'compliance', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const submitRentalListing = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await rentalMarketplaceService.createRentalListing({
        property_id: formData.property_id,
        owner_user_id: ownerId,
        rental_type: formData.rental_type,
        rates: {
          nightly_rate: formData.nightly_rate,
          monthly_rate: formData.monthly_rate,
          yearly_rate: formData.yearly_rate
        },
        rules: {
          minimum_stay_nights: formData.minimum_stay_nights,
          maximum_stay_nights: formData.maximum_stay_nights,
          check_in_time: formData.check_in_time,
          check_out_time: formData.check_out_time,
          house_rules: {
            smoking_allowed: formData.smoking_allowed,
            pets_allowed: formData.pets_allowed,
            parties_allowed: formData.parties_allowed,
            quiet_hours: `${formData.quiet_hours_start}-${formData.quiet_hours_end}`,
            maximum_occupancy: formData.maximum_occupancy,
            additional_rules: formData.additional_rules.split('\n').filter(rule => rule.trim())
          },
          cancellation_policy: formData.cancellation_policy,
          instant_book: formData.instant_book
        },
        fees: {
          cleaning_fee: formData.cleaning_fee,
          security_deposit: formData.security_deposit,
          extra_guest_fee: formData.extra_guest_fee
        },
        qr_integration: formData.developer_qr_code ? {
          developer_qr_code: formData.developer_qr_code,
          developer_name: formData.developer_name,
          tourism_permit_number: formData.tourism_permit_number
        } : undefined,
        amenities: {
          has_wifi: formData.has_wifi,
          has_ac: formData.has_ac,
          has_heating: formData.has_heating,
          has_kitchen: formData.has_kitchen,
          has_washing_machine: formData.has_washing_machine,
          has_tv: formData.has_tv,
          has_satellite_tv: formData.has_satellite_tv,
          has_balcony: formData.has_balcony,
          has_sea_view: formData.has_sea_view,
          has_nile_view: formData.has_nile_view,
          has_elevator: formData.has_elevator,
          has_swimming_pool: formData.has_swimming_pool,
          has_gym: formData.has_gym,
          has_spa: formData.has_spa,
          has_concierge: formData.has_concierge,
          has_security_guard: formData.has_security_guard,
          has_cctv: formData.has_cctv,
          has_safe: formData.has_safe,
          has_parking: formData.has_parking
        }
      });

      if (result.success && result.listing) {
        toast.success('Rental listing created successfully! It will be reviewed for compliance.');
        onListingCreated?.(result.listing);
      } else {
        toast.error(result.error || 'Failed to create rental listing');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while creating the listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {['property', 'pricing', 'rules', 'amenities', 'compliance', 'review'].map((step, index) => {
        const isActive = currentStep === step;
        const isCompleted = ['property', 'pricing', 'rules', 'amenities', 'compliance'].indexOf(currentStep) > index;
        
        return (
          <div key={step} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
            `}>
              {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
            </div>
            {index < 5 && (
              <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderPropertySelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Home className="h-5 w-5 text-blue-600" />
          Select Property
        </h3>
        <p className="text-gray-600 mb-6">Choose which property you want to list for rent</p>
      </div>

      <div className="space-y-4">
        <Label>Property</Label>
        <Select value={formData.property_id} onValueChange={(value) => updateFormData('property_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a property to list for rent" />
          </SelectTrigger>
          <SelectContent>
            {availableProperties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.title} - {property.address}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {propertyId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Property pre-selected. You can change this selection if needed.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-4">
        <Label>Rental Type</Label>
        <Select value={formData.rental_type} onValueChange={(value) => updateFormData('rental_type', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short_term">Short-term (Vacation Rental)</SelectItem>
            <SelectItem value="long_term">Long-term (Monthly/Yearly)</SelectItem>
            <SelectItem value="both">Both Short & Long-term</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Pricing & Rates
        </h3>
        <p className="text-gray-600 mb-6">Set your rental rates in Egyptian Pounds (EGP)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(formData.rental_type === 'short_term' || formData.rental_type === 'both') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Short-term Rates</CardTitle>
              <CardDescription>For vacation and short stays</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nightly Rate (EGP) *</Label>
                <Input
                  type="number"
                  value={formData.nightly_rate}
                  onChange={(e) => updateFormData('nightly_rate', Number(e.target.value))}
                  placeholder="500"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {(formData.rental_type === 'long_term' || formData.rental_type === 'both') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Long-term Rates</CardTitle>
              <CardDescription>For monthly and yearly rentals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Monthly Rate (EGP)</Label>
                <Input
                  type="number"
                  value={formData.monthly_rate}
                  onChange={(e) => updateFormData('monthly_rate', Number(e.target.value))}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label>Yearly Rate (EGP)</Label>
                <Input
                  type="number"
                  value={formData.yearly_rate}
                  onChange={(e) => updateFormData('yearly_rate', Number(e.target.value))}
                  placeholder="100000"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Fees</CardTitle>
          <CardDescription>Optional fees to cover services and deposits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Cleaning Fee (EGP)</Label>
              <Input
                type="number"
                value={formData.cleaning_fee}
                onChange={(e) => updateFormData('cleaning_fee', Number(e.target.value))}
                placeholder="200"
              />
            </div>
            <div>
              <Label>Security Deposit (EGP)</Label>
              <Input
                type="number"
                value={formData.security_deposit}
                onChange={(e) => updateFormData('security_deposit', Number(e.target.value))}
                placeholder="1000"
              />
            </div>
            <div>
              <Label>Extra Guest Fee (EGP/night)</Label>
              <Input
                type="number"
                value={formData.extra_guest_fee}
                onChange={(e) => updateFormData('extra_guest_fee', Number(e.target.value))}
                placeholder="50"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRules = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-600" />
          Booking Rules & Policies
        </h3>
        <p className="text-gray-600 mb-6">Set your check-in rules and house policies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stay Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Minimum Stay (nights) *</Label>
              <Input
                type="number"
                value={formData.minimum_stay_nights}
                onChange={(e) => updateFormData('minimum_stay_nights', Number(e.target.value))}
                min="1"
              />
            </div>
            <div>
              <Label>Maximum Stay (nights)</Label>
              <Input
                type="number"
                value={formData.maximum_stay_nights}
                onChange={(e) => updateFormData('maximum_stay_nights', Number(e.target.value))}
                min="1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Check-in/Check-out</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Check-in Time</Label>
              <Input
                type="time"
                value={formData.check_in_time}
                onChange={(e) => updateFormData('check_in_time', e.target.value)}
              />
            </div>
            <div>
              <Label>Check-out Time</Label>
              <Input
                type="time"
                value={formData.check_out_time}
                onChange={(e) => updateFormData('check_out_time', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">House Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <Label>Smoking Allowed</Label>
              <Switch
                checked={formData.smoking_allowed}
                onCheckedChange={(checked) => updateFormData('smoking_allowed', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Pets Allowed</Label>
              <Switch
                checked={formData.pets_allowed}
                onCheckedChange={(checked) => updateFormData('pets_allowed', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Parties Allowed</Label>
              <Switch
                checked={formData.parties_allowed}
                onCheckedChange={(checked) => updateFormData('parties_allowed', checked)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Quiet Hours Start</Label>
              <Input
                type="time"
                value={formData.quiet_hours_start}
                onChange={(e) => updateFormData('quiet_hours_start', e.target.value)}
              />
            </div>
            <div>
              <Label>Quiet Hours End</Label>
              <Input
                type="time"
                value={formData.quiet_hours_end}
                onChange={(e) => updateFormData('quiet_hours_end', e.target.value)}
              />
            </div>
            <div>
              <Label>Maximum Occupancy</Label>
              <Input
                type="number"
                value={formData.maximum_occupancy}
                onChange={(e) => updateFormData('maximum_occupancy', Number(e.target.value))}
                min="1"
              />
            </div>
          </div>

          <div>
            <Label>Additional Rules</Label>
            <Textarea
              value={formData.additional_rules}
              onChange={(e) => updateFormData('additional_rules', e.target.value)}
              placeholder="Enter each rule on a new line..."
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <Label>Cancellation Policy</Label>
            <Select value={formData.cancellation_policy} onValueChange={(value) => updateFormData('cancellation_policy', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flexible">Flexible - Full refund 1 day before</SelectItem>
                <SelectItem value="moderate">Moderate - Full refund 5 days before</SelectItem>
                <SelectItem value="strict">Strict - 50% refund 7 days before</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center justify-between">
              <Label>Instant Book</Label>
              <Switch
                checked={formData.instant_book}
                onCheckedChange={(checked) => updateFormData('instant_book', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAmenities = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-600" />
          Property Amenities
        </h3>
        <p className="text-gray-600 mb-6">Select all amenities available at your property</p>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="local">Egyptian Features</TabsTrigger>
          <TabsTrigger value="luxury">Luxury</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Essential Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'has_wifi', label: 'WiFi', icon: Wifi },
                  { key: 'has_ac', label: 'Air Conditioning', icon: Wind },
                  { key: 'has_heating', label: 'Heating', icon: Wind },
                  { key: 'has_kitchen', label: 'Kitchen', icon: Utensils },
                  { key: 'has_washing_machine', label: 'Washing Machine', icon: Settings },
                  { key: 'has_tv', label: 'TV', icon: Tv },
                  { key: 'has_parking', label: 'Parking', icon: Car }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-600" />
                      <Label className="text-sm">{label}</Label>
                    </div>
                    <Switch
                      checked={formData[key as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) => updateFormData(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Egyptian-Specific Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'has_satellite_tv', label: 'Satellite TV', icon: Tv },
                  { key: 'has_balcony', label: 'Balcony', icon: Building },
                  { key: 'has_sea_view', label: 'Sea View', icon: Waves },
                  { key: 'has_nile_view', label: 'Nile View', icon: Waves },
                  { key: 'has_elevator', label: 'Elevator', icon: Building }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-600" />
                      <Label className="text-sm">{label}</Label>
                    </div>
                    <Switch
                      checked={formData[key as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) => updateFormData(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="luxury" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Luxury Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'has_swimming_pool', label: 'Swimming Pool', icon: Waves },
                  { key: 'has_gym', label: 'Gym', icon: Users },
                  { key: 'has_spa', label: 'Spa', icon: Sparkles },
                  { key: 'has_concierge', label: 'Concierge', icon: Users }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-600" />
                      <Label className="text-sm">{label}</Label>
                    </div>
                    <Switch
                      checked={formData[key as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) => updateFormData(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Safety & Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'has_security_guard', label: 'Security Guard', icon: Shield },
                  { key: 'has_cctv', label: 'CCTV', icon: Shield },
                  { key: 'has_safe', label: 'Safe', icon: Shield }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-600" />
                      <Label className="text-sm">{label}</Label>
                    </div>
                    <Switch
                      checked={formData[key as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) => updateFormData(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <QrCode className="h-5 w-5 text-indigo-600" />
          QR Integration & Compliance
        </h3>
        <p className="text-gray-600 mb-6">Connect with real estate developers and ensure legal compliance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Developer QR Integration</CardTitle>
          <CardDescription>
            Many Egyptian properties have QR codes from developers like Emaar Misr, SODIC, Hyde Park
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Developer Name</Label>
            <Select value={formData.developer_name} onValueChange={(value) => updateFormData('developer_name', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select developer (if applicable)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emaar_misr">Emaar Misr</SelectItem>
                <SelectItem value="sodic">SODIC</SelectItem>
                <SelectItem value="hyde_park">Hyde Park</SelectItem>
                <SelectItem value="mountain_view">Mountain View</SelectItem>
                <SelectItem value="palmhills">Palm Hills</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Developer QR Code</Label>
            <Input
              value={formData.developer_qr_code}
              onChange={(e) => updateFormData('developer_qr_code', e.target.value)}
              placeholder="Enter QR code data from developer"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tourism Compliance</CardTitle>
          <CardDescription>
            Egyptian short-term rentals may require tourism permits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tourism Permit Number</Label>
            <Input
              value={formData.tourism_permit_number}
              onChange={(e) => updateFormData('tourism_permit_number', e.target.value)}
              placeholder="Enter permit number if available"
            />
          </div>
          
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your listing will be reviewed for compliance before going live. 
              Our team will help you obtain necessary permits if required.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Review & Submit
        </h3>
        <p className="text-gray-600 mb-6">Review all details before creating your rental listing</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Listing Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Rental Type</Label>
                <p className="font-medium capitalize">{formData.rental_type.replace('_', ' ')}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Minimum Stay</Label>
                <p className="font-medium">{formData.minimum_stay_nights} nights</p>
              </div>
              {formData.nightly_rate > 0 && (
                <div>
                  <Label className="text-sm text-gray-600">Nightly Rate</Label>
                  <p className="font-medium">{formData.nightly_rate} EGP</p>
                </div>
              )}
              {formData.monthly_rate > 0 && (
                <div>
                  <Label className="text-sm text-gray-600">Monthly Rate</Label>
                  <p className="font-medium">{formData.monthly_rate} EGP</p>
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm text-gray-600">Selected Amenities</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(formData)
                  .filter(([key, value]) => key.startsWith('has_') && value === true)
                  .map(([key]) => (
                    <Badge key={key} variant="secondary">
                      {key.replace('has_', '').replace('_', ' ')}
                    </Badge>
                  ))
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            After submission, your listing will be reviewed for compliance and quality. 
            This process typically takes 1-2 business days. You'll receive an email notification once approved.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-6 w-6 text-blue-600" />
          Create Rental Listing
        </CardTitle>
        <CardDescription>
          List your property for rent on our marketplace with full-service management
        </CardDescription>
      </CardHeader>

      <CardContent>
        {renderStepIndicator()}
        
        <div className="min-h-[600px]">
          {currentStep === 'property' && renderPropertySelection()}
          {currentStep === 'pricing' && renderPricing()}
          {currentStep === 'rules' && renderRules()}
          {currentStep === 'amenities' && renderAmenities()}
          {currentStep === 'compliance' && renderCompliance()}
          {currentStep === 'review' && renderReview()}
        </div>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 'property'}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep !== 'review' ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button
                onClick={submitRentalListing}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Creating...' : 'Create Rental Listing'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}