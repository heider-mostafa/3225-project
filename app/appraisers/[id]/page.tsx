'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Share2,
  BookmarkPlus,
  Bookmark,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { PublicProfileHeader } from '@/components/appraiser/PublicProfileHeader';
import { ProfileAboutTab } from '@/components/appraiser/ProfileAboutTab';
import { ProfilePortfolioTab } from '@/components/appraiser/ProfilePortfolioTab';
import { ProfileReviewsTab } from '@/components/appraiser/ProfileReviewsTab';
import { ProfileAvailabilityTab } from '@/components/appraiser/ProfileAvailabilityTab';
import { ProfileContactForm } from '@/components/appraiser/ProfileContactForm';
import { toast } from 'sonner';

interface AppraiserProfile {
  appraiser: {
    id: string;
    full_name: string;
    profile_headline?: string;
    profile_summary?: string;
    professional_headshot_url?: string;
    valify_status: string;
    average_rating?: number;
    total_reviews?: number;
    years_of_experience?: number;
    appraiser_license_number?: string;
    languages?: string[];
    service_areas?: string[];
    response_time_hours?: number;
    total_appraisals?: number;
    social_media_links?: Record<string, string>;
    certifications?: Array<{
      name: string;
      authority: string;
      verified: boolean;
    }>;
    is_available_today: boolean;
    emergency_available: boolean;
    booking_advance_days: number;
    contact_preferences: {
      phone: boolean;
      email: boolean;
      whatsapp: boolean;
    };
  };
  property_statistics: Array<{
    property_type: string;
    properties_appraised: number;
    total_value_appraised: number;
    average_accuracy_percentage: number;
  }>;
  portfolio_items: Array<{
    id: string;
    title: string;
    description: string;
    property_type: string;
    property_value: number;
    property_location: string;
    appraisal_challenges?: string;
    completion_date: string;
    images: string[];
    is_featured: boolean;
    client_testimonial?: string;
    tags: string[];
  }>;
  reviews: Array<{
    id: string;
    client_name: string;
    rating: number;
    review_text: string;
    review_title?: string;
    property_type?: string;
    property_value?: number;
    is_verified: boolean;
    is_featured: boolean;
    helpful_votes: number;
    response_from_appraiser?: string;
    response_date?: string;
    created_at: string;
  }>;
  rating_breakdown: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  recent_reviews_count: number;
  availability_schedule: Array<{
    id: string;
    appraiser_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
    timezone: string;
    break_start_time?: string;
    break_end_time?: string;
    notes?: string;
  }>;
  timezone: string;
}

export default function AppraiserProfilePage() {
  const { t } = useTranslation();
  const params = useParams();
  const appraiser_id = params.id as string;
  const supabase = createClientComponentClient();
  
  console.log('🔍 MAIN PAGE DEBUG - Component rendering');
  console.log('🔍 MAIN PAGE DEBUG - appraiser_id:', appraiser_id);
  console.log('🔍 MAIN PAGE DEBUG - params:', params);
  
  const [profile, setProfile] = useState<AppraiserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    property_address: '',
    property_type: '',
    preferred_date: '',
    preferred_time: '',
    estimated_value: '',
    special_instructions: '',
    urgency: 'standard' as 'standard' | 'urgent' | 'flexible',
    booking_type: 'appraisal' as 'appraisal' | 'consultation' | 'inspection'
  });

  useEffect(() => {
    if (appraiser_id) {
      fetchAppraiserProfile();
    }
  }, [appraiser_id]);

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user && appraiser_id) {
        checkFavoriteStatus();
      } else {
        setIsFavorited(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [appraiser_id]);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    if (user && appraiser_id) {
      checkFavoriteStatus();
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/appraisers/favorites/${appraiser_id}`);
      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.is_favorited);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const fetchAppraiserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/appraisers/${appraiser_id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Appraiser not found');
        } else {
          setError('Failed to load appraiser profile');
        }
        return;
      }

      const data = await response.json();
      console.log('🔍 PROFILE DEBUG - Raw API response:', data);
      console.log('🔍 PROFILE DEBUG - Portfolio items type:', typeof data.portfolio_items);
      console.log('🔍 PROFILE DEBUG - Portfolio items:', data.portfolio_items);
      
      if (data.portfolio_items) {
        console.log('🔍 PROFILE DEBUG - Portfolio items length:', data.portfolio_items.length);
        data.portfolio_items.forEach((item, index) => {
          console.log(`🔍 PROFILE DEBUG - Item ${index}:`, {
            id: item.id,
            title: item.title,
            images: item.images,
            images_type: typeof item.images,
            tags: item.tags,
            tags_type: typeof item.tags
          });
        });
      }
      
      setProfile(data);

      // Log profile view
      await fetch(`/api/appraisers/${appraiser_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view', source: 'direct_profile' })
      }).catch(err => console.log('Failed to log view:', err));

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load appraiser profile');
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = () => {
    if (!profile) return;
    
    // Create a simple contact modal with appraiser's contact information
    const contactMessage = `
Name: ${profile.appraiser.full_name}
${profile.appraiser.profile_headline ? `Title: ${profile.appraiser.profile_headline}` : ''}
${profile.appraiser.response_time_hours ? `Response Time: ${profile.appraiser.response_time_hours} hours` : ''}

Send them a message or call to discuss your appraisal needs.
    `.trim();
    
    // For now, copy contact info to clipboard or show in a more user-friendly way
    navigator.clipboard.writeText(contactMessage).then(() => {
      toast.success('Contact information copied to clipboard');
    }).catch(() => {
      toast.info('Click the "Request Appraisal" button to send a booking request');
    });
  };

  const handleBookingClick = () => {
    if (!profile) return;
    
    // Check for URL parameters to prefill booking form
    const urlParams = new URLSearchParams(window.location.search);
    const bookingIntent = urlParams.get('booking') === 'true';
    const propertyId = urlParams.get('property_id');
    
    if (bookingIntent) {
      // Show booking form with prefilled data if available
      setShowBookingModal(true);
      
      if (propertyId) {
        toast.success(`Ready to book appraisal for property ${propertyId}`);
      }
    } else {
      // Regular booking flow
      setShowBookingModal(true);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;
    
    // Validation
    if (!bookingForm.client_name || !bookingForm.client_email || !bookingForm.property_address || 
        !bookingForm.preferred_date || !bookingForm.preferred_time) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setBookingLoading(true);
    
    try {
      const bookingData = {
        appraiser_id: profile.appraiser.id,
        booking_type: bookingForm.booking_type,
        client_name: bookingForm.client_name,
        client_email: bookingForm.client_email,
        client_phone: bookingForm.client_phone,
        preferred_date: bookingForm.preferred_date,
        preferred_time: bookingForm.preferred_time,
        property_details: {
          property_type: bookingForm.property_type,
          address: bookingForm.property_address,
          estimated_value: bookingForm.estimated_value ? parseFloat(bookingForm.estimated_value) : undefined
        },
        service_requirements: {
          urgency: bookingForm.urgency,
          report_delivery: 'standard' as const
        },
        estimated_duration_hours: 2,
        estimated_cost: 2500, // Base price in EGP
        special_instructions: bookingForm.special_instructions
      };

      const response = await fetch('/api/appraisers/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Booking confirmed! Confirmation number: ${result.confirmation_number}`);
        setShowBookingModal(false);
        
        // Reset form
        setBookingForm({
          client_name: '',
          client_email: '',
          client_phone: '',
          property_address: '',
          property_type: '',
          preferred_date: '',
          preferred_time: '',
          estimated_value: '',
          special_instructions: '',
          urgency: 'standard',
          booking_type: 'appraisal'
        });
      } else {
        toast.error(result.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleShare = async () => {
    if (!profile) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.appraiser.full_name} - Property Appraiser`,
          text: `Check out ${profile.appraiser.full_name}'s profile - ${profile.appraiser.profile_headline}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Profile link copied to clipboard');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      toast.error('Failed to share profile');
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save favorites');
      return;
    }

    setFavoriteLoading(true);
    try {
      const response = await fetch('/api/appraisers/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appraiser_id: appraiser_id,
          notes: null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newFavoriteStatus = data.is_favorited;
        setIsFavorited(newFavoriteStatus);

        if (data.action === 'added') {
          toast.success(`${profile?.appraiser.full_name || 'Appraiser'} added to favorites`);
        } else {
          toast.success(`${profile?.appraiser.full_name || 'Appraiser'} removed from favorites`);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites. Please try again.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || t('common.error')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('appraisers.viewProfile')}
            </p>
            <Button asChild>
              <Link href="/appraisers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('appraisers.findAppraisers')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('🔍 MAIN PAGE DEBUG - About to render main page');
  console.log('🔍 MAIN PAGE DEBUG - profile state:', profile);
  
  try {
    return (
      <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/appraisers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back')}
              </Link>
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                {t('common.share')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBookmark}
                disabled={favoriteLoading || !isAuthenticated}
                className={isFavorited ? 'bg-red-50 text-red-600 border-red-200' : ''}
              >
                {favoriteLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isFavorited ? (
                  <Bookmark className="h-4 w-4 mr-2 fill-current" />
                ) : (
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                )}
                {isFavorited ? t('nav.saved') : t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          {(() => {
            console.log('🔍 HEADER DEBUG - Rendering profile header');
            console.log('🔍 HEADER DEBUG - appraiser data:', profile.appraiser);
            
            try {
              return (
                <PublicProfileHeader
                  appraiser={profile.appraiser}
                  onContactClick={handleContactClick}
                  onBookingClick={handleBookingClick}
                  isLoggedIn={false}
                />
              );
            } catch (error) {
              console.error('🔍 HEADER DEBUG - Error rendering header:', error);
              return <div>Error loading header: {error.message}</div>;
            }
          })()} 
        </div>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
            <TabsTrigger value="about">{t('nav.about')}</TabsTrigger>
            <TabsTrigger value="portfolio">{t('appraisers.portfolioSamples')}</TabsTrigger>
            <TabsTrigger value="reviews">{t('appraisers.reviewsRatings')}</TabsTrigger>
            <TabsTrigger value="availability">{t('appraisers.availability')}</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            {(() => {
              console.log('🔍 ABOUT TAB DEBUG - Rendering about tab');
              console.log('🔍 ABOUT TAB DEBUG - appraiser data:', {
                id: profile.appraiser.id,
                profile_summary: profile.appraiser.profile_summary,
                certifications: profile.appraiser.certifications,
                languages: profile.appraiser.languages,
                service_areas: profile.appraiser.service_areas
              });
              
              try {
                return (
                  <ProfileAboutTab
                    appraiser_id={profile.appraiser.id}
                    profile_summary={profile.appraiser.profile_summary}
                    certifications={profile.appraiser.certifications}
                    languages={profile.appraiser.languages}
                    service_areas={profile.appraiser.service_areas}
                    years_of_experience={profile.appraiser.years_of_experience}
                    property_statistics={profile.property_statistics}
                    pricing_info={profile.appraiser.pricing_info}
                    response_time_hours={profile.appraiser.response_time_hours}
                    total_appraisals={profile.appraiser.total_appraisals}
                    average_rating={profile.appraiser.average_rating}
                    total_reviews={profile.appraiser.total_reviews}
                  />
                );
              } catch (error) {
                console.error('🔍 ABOUT TAB DEBUG - Error rendering about tab:', error);
                return <div>Error loading about: {error.message}</div>;
              }
            })()} 
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            {(() => {
              console.log('🔍 PORTFOLIO TAB DEBUG - Rendering portfolio tab');
              console.log('🔍 PORTFOLIO TAB DEBUG - portfolio_items:', profile.portfolio_items);
              console.log('🔍 PORTFOLIO TAB DEBUG - property_statistics:', profile.property_statistics);
              
              try {
                return (
                  <ProfilePortfolioTab
                    appraiser_id={profile.appraiser.id}
                    portfolio_items={profile.portfolio_items}
                    property_statistics={profile.property_statistics}
                  />
                );
              } catch (error) {
                console.error('🔍 PORTFOLIO TAB DEBUG - Error rendering portfolio tab:', error);
                return <div>Error loading portfolio: {error.message}</div>;
              }
            })()} 
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <ProfileReviewsTab
              appraiser_id={profile.appraiser.id}
              reviews={profile.reviews}
              average_rating={profile.appraiser.average_rating || 0}
              total_reviews={profile.appraiser.total_reviews || 0}
              rating_breakdown={profile.rating_breakdown}
              recent_reviews_count={profile.recent_reviews_count}
            />
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <ProfileAvailabilityTab
              appraiser_id={profile.appraiser.id}
              availability_schedule={profile.availability_schedule}
              response_time_hours={profile.appraiser.response_time_hours || 24}
              timezone={profile.timezone}
              emergency_available={profile.appraiser.emergency_available}
              booking_advance_days={profile.appraiser.booking_advance_days}
              service_areas={profile.appraiser.service_areas || []}
              contact_preferences={profile.appraiser.contact_preferences}
              onBookAppraisal={handleBookingClick}
              onQuickMessage={handleContactClick}
              appraiserName={profile.appraiser.full_name}
            />
          </TabsContent>
        </Tabs>

        {/* Contact Form */}
        <div className="mt-12">
          <ProfileContactForm
            appraiser_id={profile.appraiser.id}
            appraiser_name={profile.appraiser.full_name}
            contact_preferences={profile.appraiser.contact_preferences}
            response_time_hours={profile.appraiser.response_time_hours || 24}
            service_areas={profile.appraiser.service_areas || []}
            pricing_info={profile.appraiser.pricing_info}
          />
        </div>

        {/* Trust & Safety Notice */}
        <Alert className="mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{t('appraisers.verifiedAppraisers')}:</strong> {t('appraisers.professionalCertification')}
          </AlertDescription>
        </Alert>

        {/* Related Appraisers (Mock for now) */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('appraisers.findAppraisers')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600">
                    {t('appraisers.verifiedAppraisers')} {profile.appraiser.service_areas?.[0] || t('appraisers.availability')}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href="/appraisers">
                      {t('appraisers.findAppraisers')}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('appraisers.bookAppraisal')} - {profile?.appraiser.full_name}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('booking.contactInformation')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name">{t('booking.fullName')} *</Label>
                  <Input
                    id="client_name"
                    value={bookingForm.client_name}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, client_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_email">{t('booking.emailAddress')} *</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={bookingForm.client_email}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, client_email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_phone">{t('booking.phoneNumber')}</Label>
                  <Input
                    id="client_phone"
                    type="tel"
                    value={bookingForm.client_phone}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, client_phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('booking.selectedProperty')}</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="property_address">{t('booking.propertyAccess')} *</Label>
                  <Textarea
                    id="property_address"
                    value={bookingForm.property_address}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, property_address: e.target.value }))}
                    required
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property_type">{t('search.apartment')}</Label>
                    <Select
                      value={bookingForm.property_type}
                      onValueChange={(value) => setBookingForm(prev => ({ ...prev, property_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('search.apartment')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">{t('search.apartment')}</SelectItem>
                        <SelectItem value="villa">{t('search.villa')}</SelectItem>
                        <SelectItem value="townhouse">{t('search.townhouse')}</SelectItem>
                        <SelectItem value="duplex">Duplex</SelectItem>
                        <SelectItem value="penthouse">{t('search.penthouse')}</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="estimated_value">{t('appraisers.propertyValuation')} (EGP)</Label>
                    <Input
                      id="estimated_value"
                      type="number"
                      value={bookingForm.estimated_value}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, estimated_value: e.target.value }))}
                      placeholder="e.g., 1500000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('booking.bookingDetails')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="preferred_date">{t('booking.bookingDate')} *</Label>
                  <Input
                    id="preferred_date"
                    type="date"
                    value={bookingForm.preferred_date}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, preferred_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preferred_time">{t('booking.bookingTime')} *</Label>
                  <Input
                    id="preferred_time"
                    type="time"
                    value={bookingForm.preferred_time}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, preferred_time: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="urgency">{t('booking.bookingStatus')}</Label>
                  <Select
                    value={bookingForm.urgency}
                    onValueChange={(value: 'standard' | 'urgent' | 'flexible') => 
                      setBookingForm(prev => ({ ...prev, urgency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flexible">Flexible</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="urgent">Urgent (+20% fee)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <Label htmlFor="special_instructions">{t('booking.specialRequests')}</Label>
              <Textarea
                id="special_instructions"
                value={bookingForm.special_instructions}
                onChange={(e) => setBookingForm(prev => ({ ...prev, special_instructions: e.target.value }))}
                rows={3}
                placeholder={t('booking.accessInstructions')}
              />
            </div>

            {/* Pricing Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">{t('booking.paymentSummary')}</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>{t('appraisers.serviceFee')}:</span>
                  <span>2,500 EGP</span>
                </div>
                {bookingForm.urgency === 'urgent' && (
                  <div className="flex justify-between">
                    <span>Urgent Fee (20%):</span>
                    <span>500 EGP</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>{t('booking.totalAmount')}:</span>
                  <span>{bookingForm.urgency === 'urgent' ? '3,000' : '2,500'} EGP</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t('booking.bookingConfirmation')}
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBookingModal(false)}
                disabled={bookingLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={bookingLoading}
                className="flex-1"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('appraisers.bookAppraisal')
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    );
  } catch (error) {
    console.error('🔍 MAIN PAGE DEBUG - Main render error:', error);
    return <div>Main page rendering error: {error.message}</div>;
  }
}