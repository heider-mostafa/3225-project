'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Award, 
  Settings, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Calendar,
  Star,
  DollarSign
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface AppraiserProfile {
  id: string;
  full_name: string;
  profile_headline?: string;
  profile_summary?: string;
  languages?: string[];
  service_areas?: string[];
  years_of_experience?: number;
  appraiser_license_number?: string;
}

interface Certification {
  id: string;
  certification_name: string;
  issuing_authority: string;
  certification_number?: string;
  issue_date?: string;
  expiry_date?: string;
  verification_status: string;
  is_active: boolean;
  description?: string;
}

interface Service {
  id: string;
  service_name: string;
  service_description: string;
  property_types: string[];
  price_range?: {
    min: number;
    max: number;
    currency: string;
  };
  typical_timeframe_days?: number;
  included_features: string[];
  is_active: boolean;
}

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  break_start_time?: string;
  break_end_time?: string;
  notes?: string;
}

export default function AppraiserProfileEditPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile data
  const [profile, setProfile] = useState<AppraiserProfile | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);

  // Form states
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    profile_headline: '',
    profile_summary: '',
    languages: [] as string[],
    service_areas: [] as string[],
    years_of_experience: 0,
    professional_headshot_url: ''
  });

  const [imageGenerating, setImageGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');

  const [newCertification, setNewCertification] = useState({
    certification_name: '',
    issuing_authority: '',
    certification_number: '',
    issue_date: '',
    expiry_date: '',
    description: ''
  });

  const [newService, setNewService] = useState({
    service_name: '',
    service_description: '',
    property_types: [] as string[],
    price_range: { min: 0, max: 0, currency: 'EGP' },
    typical_timeframe_days: 7,
    included_features: [] as string[]
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const propertyTypes = ['residential', 'commercial', 'industrial', 'land', 'agricultural'];
  const languages = ['Arabic', 'English', 'French', 'German', 'Spanish'];
  const egyptianCities = ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Hurghada', 'Sharm El Sheikh'];

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Load profile info
      const profileResponse = await fetch('/api/user/profile');
      const profileData = await profileResponse.json();
      
      if (!profileData.success || !profileData.data?.broker_id) {
        toast.error('Appraiser profile not found');
        router.push('/appraiser/dashboard');
        return;
      }

      const appraiserId = profileData.data.broker_id;
      
      // Load appraiser details
      const appraiserResponse = await fetch(`/api/appraisers/${appraiserId}`);
      const appraiserData = await appraiserResponse.json();
      
      if (appraiserData.success) {
        setProfile(appraiserData.appraiser);
        setProfileForm({
          full_name: appraiserData.appraiser.full_name || '',
          profile_headline: appraiserData.appraiser.profile_headline || '',
          profile_summary: appraiserData.appraiser.profile_summary || '',
          languages: appraiserData.appraiser.languages || [],
          service_areas: appraiserData.appraiser.service_areas || [],
          years_of_experience: appraiserData.appraiser.years_of_experience || 0,
          professional_headshot_url: appraiserData.appraiser.professional_headshot_url || ''
        });
      }

      // Load certifications
      const certResponse = await fetch(`/api/appraisers/certifications?appraiser_id=${appraiserId}`);
      const certData = await certResponse.json();
      if (certData.success) {
        setCertifications(certData.data.certifications);
      }

      // Load services
      const servicesResponse = await fetch(`/api/appraisers/services?appraiser_id=${appraiserId}`);
      const servicesData = await servicesResponse.json();
      if (servicesData.success) {
        setServices(servicesData.data.services);
      }

      // Load availability
      const availabilityResponse = await fetch(`/api/appraisers/availability?appraiser_id=${appraiserId}`);
      const availabilityData = await availabilityResponse.json();
      if (availabilityData.success) {
        setAvailability(availabilityData.data.availability);
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/appraisers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Profile updated successfully');
        loadProfileData();
      } else {
        toast.error('Failed to update profile: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addCertification = async () => {
    try {
      if (!newCertification.certification_name || !newCertification.issuing_authority) {
        toast.error('Please fill in certification name and issuing authority');
        return;
      }

      const response = await fetch('/api/appraisers/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCertification)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(t('appraiserDashboard.certificationAddedSuccessfully'));
        setNewCertification({
          certification_name: '',
          issuing_authority: '',
          certification_number: '',
          issue_date: '',
          expiry_date: '',
          description: ''
        });
        loadProfileData();
      } else {
        toast.error('Failed to add certification: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding certification:', error);
      toast.error('Failed to add certification');
    }
  };

  const addService = async () => {
    try {
      if (!newService.service_name || !newService.service_description) {
        toast.error('Please fill in service name and description');
        return;
      }

      const response = await fetch('/api/appraisers/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Service added successfully');
        setNewService({
          service_name: '',
          service_description: '',
          property_types: [],
          price_range: { min: 0, max: 0, currency: 'EGP' },
          typical_timeframe_days: 7,
          included_features: []
        });
        loadProfileData();
      } else {
        toast.error('Failed to add service: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    }
  };

  const generateProfileImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Please enter a description for your profile image');
      return;
    }

    try {
      setImageGenerating(true);
      
      const response = await fetch('/api/headshots/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          style: 'professional'
        })
      });

      const result = await response.json();
      
      if (result.success && result.data?.imageUrl) {
        setProfileForm({
          ...profileForm,
          professional_headshot_url: result.data.imageUrl
        });
        toast.success('Professional headshot generated successfully!');
        setImagePrompt('');
      } else {
        toast.error('Failed to generate image: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate profile image');
    } finally {
      setImageGenerating(false);
    }
  };

  const updateAvailability = async (dayOfWeek: number, data: any) => {
    try {
      const existingSlot = availability.find(a => a.day_of_week === dayOfWeek);
      
      const response = await fetch('/api/appraisers/availability', {
        method: existingSlot ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(existingSlot ? { availability_id: existingSlot.id } : {}),
          day_of_week: dayOfWeek,
          ...data
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Availability updated successfully');
        loadProfileData();
      } else {
        toast.error('Failed to update availability: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const getVerificationStatusBadge = (status: string) => {
    const config = {
      verified: { variant: 'default' as const, label: 'Verified', icon: CheckCircle },
      pending: { variant: 'secondary' as const, label: 'Pending', icon: Clock },
      expired: { variant: 'destructive' as const, label: 'Expired', icon: AlertCircle }
    };
    
    const { variant, label, icon: Icon } = config[status as keyof typeof config] || config.pending;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('appraiserDashboard.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('appraiserDashboard.profileManagement')}</h1>
                <p className="text-gray-600">{t('appraiserDashboard.profileManagementDescription')}</p>
              </div>
            </div>
            <Button onClick={saveProfile} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? t('appraiserDashboard.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('navigation.profile')}
            </TabsTrigger>
            <TabsTrigger value="certifications" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              {t('appraiserDashboard.certificationsTab')}
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('appraiserDashboard.servicesTab')}
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Availability
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile Image Section */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Headshot</CardTitle>
                <CardDescription>
                  Upload or generate a professional headshot for your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                      {profileForm.professional_headshot_url ? (
                        <img 
                          src={profileForm.professional_headshot_url} 
                          alt="Profile headshot"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setProfileForm({...profileForm, professional_headshot_url: ''})}
                      disabled={!profileForm.professional_headshot_url}
                    >
                      Remove Image
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <Label htmlFor="image_prompt">Generate Professional Headshot with AI</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="image_prompt"
                          placeholder="e.g., Professional Egyptian appraiser, confident, business attire, clean background"
                          value={imagePrompt}
                          onChange={(e) => setImagePrompt(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={generateProfileImage} 
                          disabled={imageGenerating || !imagePrompt.trim()}
                        >
                          {imageGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Describe how you want to look in your professional headshot. Our AI will generate a high-quality image for you.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="image_url">Or paste image URL</Label>
                      <Input
                        id="image_url"
                        placeholder="https://example.com/your-image.jpg"
                        value={profileForm.professional_headshot_url}
                        onChange={(e) => setProfileForm({...profileForm, professional_headshot_url: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update your professional profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="years_of_experience">{t('appraiserDashboard.yearsOfExperience')}</Label>
                    <Input
                      id="years_of_experience"
                      type="number"
                      value={profileForm.years_of_experience}
                      onChange={(e) => setProfileForm({...profileForm, years_of_experience: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="profile_headline">Professional Headline</Label>
                  <Input
                    id="profile_headline"
                    placeholder="e.g., Certified Property Appraiser specializing in Residential & Commercial Properties"
                    value={profileForm.profile_headline}
                    onChange={(e) => setProfileForm({...profileForm, profile_headline: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="profile_summary">Professional Summary</Label>
                  <Textarea
                    id="profile_summary"
                    placeholder="Describe your experience, specializations, and what makes you unique..."
                    rows={4}
                    value={profileForm.profile_summary}
                    onChange={(e) => setProfileForm({...profileForm, profile_summary: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('appraiserDashboard.languagesSpoken')}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {languages.map(language => (
                        <Badge
                          key={language}
                          variant={profileForm.languages.includes(language) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const newLanguages = profileForm.languages.includes(language)
                              ? profileForm.languages.filter(l => l !== language)
                              : [...profileForm.languages, language];
                            setProfileForm({...profileForm, languages: newLanguages});
                          }}
                        >
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>{t('appraiserDashboard.serviceAreas')}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {egyptianCities.map(city => (
                        <Badge
                          key={city}
                          variant={profileForm.service_areas.includes(city) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const newAreas = profileForm.service_areas.includes(city)
                              ? profileForm.service_areas.filter(a => a !== city)
                              : [...profileForm.service_areas, city];
                            setProfileForm({...profileForm, service_areas: newAreas});
                          }}
                        >
                          {city}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="space-y-6">
            {/* Add New Certification */}
            <Card>
              <CardHeader>
                <CardTitle>{t('appraiserDashboard.addNewCertification')}</CardTitle>
                <CardDescription>
                  Add professional certifications to enhance your credibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cert_name">{t('appraiserDashboard.certificationName')}</Label>
                    <Input
                      id="cert_name"
                      placeholder="e.g., Certified Residential Appraiser"
                      value={newCertification.certification_name}
                      onChange={(e) => setNewCertification({...newCertification, certification_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="issuing_authority">{t('appraiserDashboard.issuingAuthority')}</Label>
                    <Input
                      id="issuing_authority"
                      placeholder="e.g., Egyptian Real Estate Authority"
                      value={newCertification.issuing_authority}
                      onChange={(e) => setNewCertification({...newCertification, issuing_authority: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cert_number">Certificate Number</Label>
                    <Input
                      id="cert_number"
                      value={newCertification.certification_number}
                      onChange={(e) => setNewCertification({...newCertification, certification_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="issue_date">{t('appraiserDashboard.issueDate')}</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={newCertification.issue_date}
                      onChange={(e) => setNewCertification({...newCertification, issue_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry_date">{t('appraiserDashboard.expiryDate')}</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={newCertification.expiry_date}
                      onChange={(e) => setNewCertification({...newCertification, expiry_date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cert_description">Description</Label>
                  <Textarea
                    id="cert_description"
                    placeholder="Brief description of the certification..."
                    value={newCertification.description}
                    onChange={(e) => setNewCertification({...newCertification, description: e.target.value})}
                  />
                </div>

                <Button onClick={addCertification} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('appraiserDashboard.addCertification')}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Certifications */}
            <Card>
              <CardHeader>
                <CardTitle>{t('appraiserDashboard.yourCertifications')}</CardTitle>
              </CardHeader>
              <CardContent>
                {certifications.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No certifications added yet</p>
                ) : (
                  <div className="space-y-4">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium">{cert.certification_name}</h4>
                              {getVerificationStatusBadge(cert.verification_status)}
                            </div>
                            <p className="text-gray-600 text-sm">{cert.issuing_authority}</p>
                            {cert.certification_number && (
                              <p className="text-gray-500 text-sm">Certificate #{cert.certification_number}</p>
                            )}
                            {cert.description && (
                              <p className="text-gray-600 text-sm mt-2">{cert.description}</p>
                            )}
                            <div className="flex gap-4 text-xs text-gray-500 mt-2">
                              {cert.issue_date && <span>Issued: {cert.issue_date}</span>}
                              {cert.expiry_date && <span>Expires: {cert.expiry_date}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            {/* Add New Service */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Service</CardTitle>
                <CardDescription>
                  Define the appraisal services you offer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="service_name">Service Name</Label>
                  <Input
                    id="service_name"
                    placeholder="e.g., Residential Property Appraisal"
                    value={newService.service_name}
                    onChange={(e) => setNewService({...newService, service_name: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="service_description">Description</Label>
                  <Textarea
                    id="service_description"
                    placeholder="Detailed description of the service..."
                    value={newService.service_description}
                    onChange={(e) => setNewService({...newService, service_description: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Property Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {propertyTypes.map(type => (
                      <Badge
                        key={type}
                        variant={newService.property_types.includes(type) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => {
                          const newTypes = newService.property_types.includes(type)
                            ? newService.property_types.filter(t => t !== type)
                            : [...newService.property_types, type];
                          setNewService({...newService, property_types: newTypes});
                        }}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price_min">Minimum Price (EGP)</Label>
                    <Input
                      id="price_min"
                      type="number"
                      value={newService.price_range.min}
                      onChange={(e) => setNewService({
                        ...newService, 
                        price_range: {...newService.price_range, min: parseInt(e.target.value) || 0}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_max">Maximum Price (EGP)</Label>
                    <Input
                      id="price_max"
                      type="number"
                      value={newService.price_range.max}
                      onChange={(e) => setNewService({
                        ...newService, 
                        price_range: {...newService.price_range, max: parseInt(e.target.value) || 0}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeframe">Typical Timeframe (Days)</Label>
                    <Input
                      id="timeframe"
                      type="number"
                      value={newService.typical_timeframe_days}
                      onChange={(e) => setNewService({...newService, typical_timeframe_days: parseInt(e.target.value) || 7})}
                    />
                  </div>
                </div>

                <Button onClick={addService} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </CardContent>
            </Card>

            {/* Existing Services */}
            <Card>
              <CardHeader>
                <CardTitle>Your Services</CardTitle>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No services added yet</p>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium mb-2">{service.service_name}</h4>
                            <p className="text-gray-600 text-sm mb-3">{service.service_description}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-2">
                              {service.property_types.map(type => (
                                <Badge key={type} variant="secondary" className="capitalize">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex gap-4 text-sm text-gray-600">
                              {service.price_range && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {service.price_range.min.toLocaleString()} - {service.price_range.max.toLocaleString()} EGP
                                </span>
                              )}
                              {service.typical_timeframe_days && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {service.typical_timeframe_days} days
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
                <CardDescription>
                  Set your weekly schedule for client appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dayNames.map((dayName, dayIndex) => {
                    const daySlot = availability.find(a => a.day_of_week === dayIndex);
                    
                    return (
                      <div key={dayIndex} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-medium w-24">{dayName}</span>
                            <input
                              type="checkbox"
                              checked={daySlot?.is_available || false}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateAvailability(dayIndex, {
                                    start_time: '09:00',
                                    end_time: '17:00',
                                    is_available: true
                                  });
                                } else {
                                  updateAvailability(dayIndex, {
                                    is_available: false
                                  });
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-600">Available</span>
                          </div>
                          
                          {daySlot?.is_available && (
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="time"
                                  value={daySlot.start_time}
                                  onChange={(e) => updateAvailability(dayIndex, {
                                    ...daySlot,
                                    start_time: e.target.value
                                  })}
                                  className="w-24"
                                />
                                <span>to</span>
                                <Input
                                  type="time"
                                  value={daySlot.end_time}
                                  onChange={(e) => updateAvailability(dayIndex, {
                                    ...daySlot,
                                    end_time: e.target.value
                                  })}
                                  className="w-24"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {daySlot?.is_available && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label>Break Time (Optional)</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="time"
                                  placeholder="Start"
                                  value={daySlot.break_start_time || ''}
                                  onChange={(e) => updateAvailability(dayIndex, {
                                    ...daySlot,
                                    break_start_time: e.target.value
                                  })}
                                  className="w-24"
                                />
                                <span>to</span>
                                <Input
                                  type="time"
                                  placeholder="End"
                                  value={daySlot.break_end_time || ''}
                                  onChange={(e) => updateAvailability(dayIndex, {
                                    ...daySlot,
                                    break_end_time: e.target.value
                                  })}
                                  className="w-24"
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Notes</Label>
                              <Input
                                placeholder="e.g., Emergency calls only"
                                value={daySlot.notes || ''}
                                onChange={(e) => updateAvailability(dayIndex, {
                                  ...daySlot,
                                  notes: e.target.value
                                })}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}