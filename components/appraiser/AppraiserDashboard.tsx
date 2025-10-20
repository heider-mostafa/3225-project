'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Calculator, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
  Download,
  Building,
  Shield,
  CreditCard,
  Settings,
  RefreshCw,
  X,
  MapPin,
  User,
  Calendar,
  DollarSign,
  CalendarDays,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Clock3,
  MessageCircle,
  Send,
  Camera,
  Check,
  Upload
} from 'lucide-react';
import { SmartAppraisalForm } from './SmartAppraisalForm';
import { AppraisalReportGenerator } from './AppraisalReportGenerator';
import { ReviewResponseSystem } from './ReviewResponseSystem';
import { ProfileAvailabilityTab } from './ProfileAvailabilityTab';
import { ProfessionalProfilePhotoCapture } from './ProfessionalProfilePhotoCapture';
import { GeminiDocumentUploader } from './GeminiDocumentUploader';
import { toast } from 'sonner';
import { GeminiExtractionResult } from '@/lib/services/gemini-document-extractor';
import { SmartAppraisalFormData } from '@/types/document-processor';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  property_type: string;
}

interface Broker {
  id: string;
  full_name: string;
  email: string;
  appraiser_license_number?: string;
}

interface Appraisal {
  id: string;
  property_id: string;
  appraiser_id: string;
  client_name: string;
  form_data: any;
  market_value_estimate: number | null;
  confidence_level: number | null;
  calculation_results: any;
  status: 'draft' | 'in_review' | 'completed' | 'approved' | 'archived';
  appraisal_date: string;
  appraisal_reference_number?: string;
  created_at: string;
  properties?: Property;
  brokers?: Broker;
}

interface DashboardStats {
  total_appraisals: number;
  completed_appraisals: number;
  pending_appraisals: number;
  total_value_appraised: number;
  avg_confidence_level: number;
}

interface ProfileEditData {
  full_name?: string;
  email?: string;
  phone?: string;
  appraiser_license_number?: string;
  appraiser_certification_authority?: string;
  bio?: string;
  specialties?: string[];
  languages?: string[];
  years_experience?: number;
  property_specialties?: string[];
  max_property_value_limit?: number;
  professional_headshot_url?: string;
  profile_headline?: string;
  profile_summary?: string;
  service_areas?: string[];
  average_rating?: number;
  total_reviews?: number;
  response_time_hours?: number;
  certifications?: any[];
  pricing_info?: any;
}

interface Booking {
  id: string;
  confirmation_number: string;
  booking_type: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  scheduled_datetime: string;
  estimated_duration_hours: number;
  estimated_cost: number;
  deposit_amount: number;
  status: 'pending_confirmation' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  property_details: {
    property_type: string;
    address: string;
    square_meters?: number;
    estimated_value?: number;
    access_instructions?: string;
  };
  special_instructions?: string;
  created_at: string;
}

interface AppraiserDashboardProps {
  appraiserData?: any;
  isEmbedded?: boolean;
}

export function AppraiserDashboard(props: AppraiserDashboardProps = {}) {
  const { appraiserData, isEmbedded = false } = props;
  const { t } = useTranslation();
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_appraisals: 0,
    completed_appraisals: 0,
    pending_appraisals: 0,
    total_value_appraised: 0,
    avg_confidence_level: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewAppraisalForm, setShowNewAppraisalForm] = useState(false);
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);
  const [showAppraisalOptionsModal, setShowAppraisalOptionsModal] = useState(false);
  const [importedFormData, setImportedFormData] = useState<any>(null);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [reportAppraisalId, setReportAppraisalId] = useState<string>('');
  const [syncingPortfolio, setSyncingPortfolio] = useState(false);
  const [completingAppraisal, setCompletingAppraisal] = useState<string | null>(null);
  const [viewingAppraisal, setViewingAppraisal] = useState<Appraisal | null>(null);
  const [appraiserProfile, setAppraiserProfile] = useState<{id: string} | null>(null);
  
  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  
  // Messaging state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<{name: string, email: string, phone?: string} | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [availableAppraisers, setAvailableAppraisers] = useState<Broker[]>([]);
  const [selectedAppraiserId, setSelectedAppraiserId] = useState<string>('');
  
  // Profile editing state
  const [currentAppraiserData, setCurrentAppraiserData] = useState<any>(null);
  const [profileEditData, setProfileEditData] = useState<ProfileEditData>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageGenerating, setImageGenerating] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    if (appraiserData && isEmbedded) {
      // Use provided appraiser data (for individual appraiser dashboard)
      setCurrentAppraiserData(appraiserData);
      setProfileEditData({
        full_name: appraiserData.full_name || '',
        email: appraiserData.email || '',
        phone: appraiserData.phone || '',
        appraiser_license_number: appraiserData.appraiser_license_number || '',
        appraiser_certification_authority: appraiserData.appraiser_certification_authority || 'Egyptian General Authority for Urban Planning & Housing',
        bio: appraiserData.bio || '',
        specialties: appraiserData.specialties || [],
        languages: appraiserData.languages || [],
        years_experience: appraiserData.years_experience || 0,
        property_specialties: appraiserData.property_specialties || [],
        max_property_value_limit: appraiserData.max_property_value_limit,
        professional_headshot_url: appraiserData.professional_headshot_url || '',
        profile_headline: appraiserData.profile_headline || '',
        profile_summary: appraiserData.profile_summary || '',
        service_areas: appraiserData.service_areas || [],
        average_rating: appraiserData.average_rating || 0,
        total_reviews: appraiserData.total_reviews || 0,
        response_time_hours: appraiserData.response_time_hours || 24,
        certifications: appraiserData.certifications || [],
        pricing_info: appraiserData.pricing_info || {}
      });
      setAppraiserProfile({ id: appraiserData.id });
      loadAppraisals();
    } else {
      // Admin mode - load profile data
      loadAppraiserProfile();
    }
    
    loadAppraisals();
    if (activeTab === 'bookings') {
      loadBookings();
    }
  }, [page, statusFilter, searchQuery, appraiserData, isEmbedded]);


  // Reload appraisals when selected appraiser changes (for admin)
  useEffect(() => {
    if (isAdmin && selectedAppraiserId) {
      loadAppraisals();
    }
  }, [selectedAppraiserId]);

  // Debounce data loading to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedAppraiserId || (!isAdmin && appraiserProfile?.id)) {
        loadAppraisals();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedAppraiserId, appraiserProfile?.id]);

  const loadAppraiserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const result = await response.json();
      
      if (result.success) {
        const userData = result.data;
        console.log('Dashboard - Processing user data:', userData);
        console.log('Dashboard - User roles array:', userData.roles);
        
        const isUserAdmin = userData.roles?.some((role: string) => 
          ['admin', 'super_admin'].includes(role)
        );
        
        console.log('Dashboard - Is user admin:', isUserAdmin);
        setIsAdmin(isUserAdmin);
        
        if (userData.broker_id) {
          // Regular appraiser - load their full data
          setAppraiserProfile({ id: userData.broker_id });
          await loadCurrentAppraiserData(userData.broker_id);
        } else if (isUserAdmin) {
          // Admin user - load all appraisers
          await loadAvailableAppraisers();
        }
      }
    } catch (error) {
      console.error('Error loading appraiser profile:', error);
    }
  };

  const loadCurrentAppraiserData = async (appraiserId: string) => {
    try {
      const response = await fetch(`/api/brokers/${appraiserId}`);
      const result = await response.json();
      
      if (response.ok && result.broker) {
        setCurrentAppraiserData(result.broker);
        setProfileEditData({
          full_name: result.broker.full_name || '',
          email: result.broker.email || '',
          phone: result.broker.phone || '',
          appraiser_license_number: result.broker.appraiser_license_number || '',
          appraiser_certification_authority: result.broker.appraiser_certification_authority || 'Egyptian General Authority for Urban Planning & Housing',
          bio: result.broker.bio || '',
          specialties: result.broker.specialties || [],
          languages: result.broker.languages || [],
          years_experience: result.broker.years_experience || 0,
          property_specialties: result.broker.property_specialties || [],
          max_property_value_limit: result.broker.max_property_value_limit,
          professional_headshot_url: result.broker.professional_headshot_url || '',
          profile_headline: result.broker.profile_headline || '',
          profile_summary: result.broker.profile_summary || '',
          service_areas: result.broker.service_areas || [],
          average_rating: result.broker.average_rating || 0,
          total_reviews: result.broker.total_reviews || 0,
          response_time_hours: result.broker.response_time_hours || 24,
          certifications: result.broker.certifications || [],
          pricing_info: result.broker.pricing_info || {}
        });
      }
    } catch (error) {
      console.error('Error loading current appraiser data:', error);
    }
  };

  const saveProfile = async () => {
    const targetAppraiser = appraiserData || currentAppraiserData;
    if (!targetAppraiser) return;
    
    try {
      setSavingProfile(true);
      
      const response = await fetch(`/api/brokers/${targetAppraiser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileEditData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      toast.success(t('appraiserDashboard.profileUpdatedSuccessfully'));
      
      // Reload data if not embedded, otherwise just update the current data
      if (isEmbedded && appraiserData) {
        // Update the appraiser data with the saved data
        setCurrentAppraiserData(result.broker);
      } else {
        await loadCurrentAppraiserData(targetAppraiser.id); // Reload data for admin mode
      }
      
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('appraiserDashboard.failedToSaveProfile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const generateProfileImage = async () => {
    if (!imagePrompt.trim()) return;
    
    try {
      setImageGenerating(true);
      
      const response = await fetch('/api/generate-headshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt })
      });

      const result = await response.json();
      
      if (result.success && result.image_url) {
        setProfileEditData((prev: ProfileEditData) => ({
          ...prev,
          professional_headshot_url: result.image_url
        }));
        toast.success(t('appraiserDashboard.headshotGeneratedSuccessfully'));
        setImagePrompt('');
      } else {
        toast.error(t('appraiserDashboard.failedToGenerateHeadshot') + ': ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating headshot:', error);
      toast.error(t('appraiserDashboard.failedToGenerateHeadshot'));
    } finally {
      setImageGenerating(false);
    }
  };

  const handleCameraPhotoUpdate = (photoUrl: string, metadata: any) => {
    setProfileEditData((prev: ProfileEditData) => ({
      ...prev,
      professional_headshot_url: photoUrl
    }));
    toast.success(t('appraiserDashboard.headshotCapturedSuccessfully'));
    setShowCameraCapture(false);
  };

  const loadAvailableAppraisers = async () => {
    try {
      console.log('Loading available appraisers...');
      const response = await fetch('/api/brokers');
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText);
        return;
      }
      
      const result = await response.json();
      console.log('Brokers API response:', result);
      console.log('Result type:', typeof result, 'Has brokers property:', !!result.brokers);
      
      // Handle different API response formats
      const appraisers = result.success ? result.data : result.brokers;
      console.log('Extracted appraisers:', appraisers);
      console.log('Appraisers count:', appraisers ? appraisers.length : 0);
      
      if (appraisers && appraisers.length > 0) {
        console.log('Found appraisers:', appraisers.map(a => ({ id: a.id, name: a.full_name })));
        setAvailableAppraisers(appraisers);
        
        // Auto-select first appraiser if available
        const firstAppraiser = appraisers[0];
        console.log('Auto-selecting first appraiser ID:', firstAppraiser.id);
        console.log('Auto-selecting first appraiser name:', firstAppraiser.full_name);
        setSelectedAppraiserId(firstAppraiser.id);
        setAppraiserProfile({ id: firstAppraiser.id });
        console.log('Selected appraiser ID set to:', firstAppraiser.id);
      } else {
        console.log('No appraisers found in response');
        console.log('Result structure:', Object.keys(result || {}));
        console.error('Failed to load appraisers:', result.error || 'No appraisers available');
        toast.error(t('appraiserDashboard.noAppraisersFoundSystem'));
      }
    } catch (error) {
      console.error('Error loading appraisers:', error);
      toast.error(t('appraiserDashboard.failedToLoadAppraisers'));
    }
  };

  const loadAppraisals = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      // Filter by appraiser ID
      if (isAdmin && selectedAppraiserId) {
        // Admin mode with selected appraiser
        params.append('appraiser_id', selectedAppraiserId);
      } else if (isEmbedded && appraiserData) {
        // Individual appraiser mode
        params.append('appraiser_id', appraiserData.id);
      } else if (!isAdmin && appraiserProfile?.id) {
        // Regular appraiser mode (not admin)
        params.append('appraiser_id', appraiserProfile.id);
      }

      const response = await fetch(`/api/appraisals?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setAppraisals(result.data);
        calculateStats(result.data);
      } else {
        toast.error(t('appraiserDashboard.failedToLoadAppraisals') + ': ' + result.error);
      }
    } catch (error) {
      console.error('Load appraisals error:', error);
      toast.error(t('appraiserDashboard.failedToLoadAppraisals'));
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appraisalsData: Appraisal[]) => {
    const totalAppraisals = appraisalsData.length;
    const completedAppraisals = appraisalsData.filter(a => a.status === 'completed' || a.status === 'approved').length;
    const pendingAppraisals = appraisalsData.filter(a => a.status === 'draft' || a.status === 'in_review').length;
    const totalValueAppraised = appraisalsData.reduce((sum, a) => sum + (a.market_value_estimate || 0), 0);
    const avgConfidenceLevel = appraisalsData.reduce((sum, a) => sum + (a.confidence_level || 0), 0) / totalAppraisals;

    setStats({
      total_appraisals: totalAppraisals,
      completed_appraisals: completedAppraisals,
      pending_appraisals: pendingAppraisals,
      total_value_appraised: totalValueAppraised,
      avg_confidence_level: avgConfidenceLevel || 0
    });
  };

  const handleSaveAppraisal = async (appraisalData: any) => {
    try {
      console.log('=== SAVE APPRAISAL DEBUG ===');
      console.log('Raw appraisal data received:', appraisalData);
      
      const method = selectedAppraisal ? 'PUT' : 'POST';
      const url = '/api/appraisals';
      
      // Extract key fields for API structure
      const {
        client_name,
        market_value_estimate,
        confidence_level,
        calculations,
        property_id,
        appraisal_date,
        status,
        ...formData
      } = appraisalData;

      console.log('Extracted fields:', {
        client_name,
        market_value_estimate,
        confidence_level,
        calculations,
        property_id,
        appraisal_date,
        status,
        formDataKeys: Object.keys(formData)
      });

      // Extract market value and confidence from calculations if not directly available
      // Also check for final_reconciled_value from imported documents
      const finalMarketValue = market_value_estimate || 
                               calculations?.market_value_estimate || 
                               formData.final_reconciled_value;
      const finalConfidenceLevel = confidence_level || 
                                   calculations?.confidence_level || 
                                   0.9; // Default high confidence for imported docs
      
      console.log('💰 Market Value Resolution:', {
        market_value_estimate,
        calculations_market_value: calculations?.market_value_estimate,
        final_reconciled_value: formData.final_reconciled_value,
        finalMarketValue,
        finalConfidenceLevel
      });

      // Validate required fields before saving
      if (!client_name) {
        toast.error(t('appraiserDashboard.clientNameRequired'));
        console.error('❌ Missing client_name');
        return;
      }
      
      if (!finalMarketValue || finalMarketValue <= 0) {
        toast.error(t('appraiserDashboard.marketValueRequired'));
        console.error('❌ Missing or invalid market value:', finalMarketValue);
        return;
      }

      console.log('✅ Validation passed, proceeding with save');

      // Determine the correct appraiser_id
      let targetAppraiserId = null;
      if (isAdmin && selectedAppraiserId) {
        // Admin mode with selected appraiser
        targetAppraiserId = selectedAppraiserId;
      } else if (isEmbedded && appraiserData) {
        // Individual appraiser mode
        targetAppraiserId = appraiserData.id;
      } else if (appraiserProfile?.id) {
        // Regular appraiser mode
        targetAppraiserId = appraiserProfile.id;
      }

      console.log('🎯 Appraiser ID for appraisal:', {
        isAdmin,
        selectedAppraiserId,
        isEmbedded,
        appraiserDataId: appraiserData?.id,
        appraiserProfileId: appraiserProfile?.id,
        targetAppraiserId
      });

      const payload = selectedAppraisal 
        ? { 
            id: selectedAppraisal.id, 
            client_name,
            market_value_estimate: finalMarketValue,
            confidence_level: finalConfidenceLevel,
            calculation_results: calculations,
            form_data: formData,
            status: status || 'draft',
            appraiser_id: targetAppraiserId
          }
        : {
            property_id,
            client_name,
            market_value_estimate: finalMarketValue,
            confidence_level: finalConfidenceLevel,
            calculation_results: calculations,
            form_data: formData,
            appraisal_date,
            status: status || 'draft',
            appraiser_id: targetAppraiserId
          };

      console.log('Final payload being sent:', payload);
      console.log('Request method:', method, 'URL:', url);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response result:', result);
      
      if (result.success) {
        toast.success(selectedAppraisal ? 'Appraisal updated successfully' : 'Appraisal created successfully');
        setShowNewAppraisalForm(false);
        setSelectedAppraisal(null);
        loadAppraisals();
      } else {
        console.error('API Error Details:', result);
        toast.error('Failed to save appraisal: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Save appraisal error:', error);
      toast.error('Failed to save appraisal');
    }
  };

  // Document Import Handlers for Issue #8
  const handleCreateNew = () => {
    setShowAppraisalOptionsModal(false);
    setImportedFormData(null);
    setSelectedAppraisal(null);
    setShowNewAppraisalForm(true);
  };

  const handleGeminiExtractionComplete = (result: GeminiExtractionResult) => {
    console.log('🎯 Gemini extraction complete:', {
      success: result.success,
      processingTime: result.processingTime,
      clientName: result.extractedData?.clientName,
      finalValue: result.extractedData?.finalReconciledValue
    });
    
    if (!result.success || !result.formData) {
      console.error('❌ Gemini extraction failed:', result.error);
      toast.error(`Extraction failed: ${result.error}`);
      return;
    }
    
    // Transform extracted images to match SmartAppraisalForm format
    const formattedImages = result.extractedImages?.map((img, index) => ({
      data: img.base64,
      format: img.mimeType.replace('image/', ''),
      page_number: img.page || index + 1,
      category: img.category || 'property_photo',
      description: img.description || `Extracted image ${index + 1}`,
      filename: img.filename || `extracted_image_${index + 1}`,
      confidence: img.confidence || 0.8
    })) || [];

    // Transform Gemini result to match save function expectations
    const transformedFormData = {
      ...result.formData,
      // Map final_reconciled_value to market_value_estimate for save compatibility
      market_value_estimate: result.formData.final_reconciled_value,
      // Set high confidence for Gemini AI processing
      confidence_level: 0.95,
      // Include extracted images for the form to display
      extracted_images: formattedImages,
      // Create calculations object for save compatibility
      calculations: {
        market_value_estimate: result.formData.final_reconciled_value,
        confidence_level: 0.95,
        calculation_date: new Date().toISOString(),
        method_used: 'openbeit_ai_extraction',
        processing_metadata: {
          ai_service_used: 'OpenBeit AI',
          processing_time_ms: result.processingTime,
          extraction_success: result.success
        }
      }
    };
    
    console.log('🔧 Transformed Gemini data for save compatibility:', {
      has_market_value_estimate: !!transformedFormData.market_value_estimate,
      has_confidence_level: !!transformedFormData.confidence_level,
      has_calculations: !!transformedFormData.calculations,
      extracted_images_count: formattedImages.length,
      market_value: transformedFormData.market_value_estimate,
      client_name: transformedFormData.client_name
    });

    console.log('🖼️ Extracted images ready for form:', {
      count: formattedImages.length,
      categories: formattedImages.map(img => img.category),
      pages: formattedImages.map(img => img.page_number)
    });
    
    setImportedFormData(transformedFormData);
    setShowAppraisalOptionsModal(false);
    setSelectedAppraisal(null);
    setShowNewAppraisalForm(true);
    toast.success(`Document processed with OpenBeit AI! Processing time: ${result.processingTime}ms`);
  };

  const handleGeminiExtractionError = (error: string) => {
    console.error('❌ OpenBeit AI extraction error:', error);
    toast.error(`OpenBeit AI extraction failed: ${error}`);
  };

  const handleSyncPortfolio = async (targetAppraiserId?: string) => {
    try {
      setSyncingPortfolio(true);
      console.log('=== DASHBOARD PORTFOLIO SYNC START ===');
      
      // Determine the dashboard owner's appraiser ID
      const dashboardOwnerId = appraiserData?.id || currentAppraiserData?.id;
      console.log('Dashboard owner appraiser ID:', dashboardOwnerId);
      console.log('AppraiserData passed to dashboard:', appraiserData);
      console.log('Current appraiser data:', currentAppraiserData);
      
      // Get current user's roles for debugging
      console.log('Fetching user profile for role verification...');
      const response = await fetch('/api/user/profile');
      const profileResult = await response.json();
      console.log('User profile response:', profileResult);
      
      if (!profileResult.success) {
        console.error('Failed to fetch user profile');
        toast.error('Unable to fetch user profile');
        return;
      }

      const userData = profileResult.data;
      const isUserAdmin = userData.roles?.some((role: string) => 
        ['admin', 'super_admin'].includes(role)
      );
      
      console.log('User is admin:', isUserAdmin);
      console.log('User broker ID:', userData.broker_id);

      // Determine which appraiser ID to use - ALWAYS prefer dashboard owner
      let appraiserId: string;
      
      if (dashboardOwnerId) {
        // Use the dashboard owner's ID (most accurate approach)
        appraiserId = dashboardOwnerId;
        console.log('✅ Using dashboard owner appraiser ID:', appraiserId);
      } else if (userData.broker_id) {
        // Fallback: Use logged-in user's broker ID (for direct appraiser usage)
        appraiserId = userData.broker_id;
        console.log('⚠️ Fallback: Using user broker ID:', appraiserId);
      } else {
        console.error('❌ No dashboard owner ID or user broker ID found');
        toast.error('Unable to determine appraiser profile for portfolio sync');
        return;
      }

      // Trigger portfolio sync
      console.log('Triggering portfolio sync for appraiser:', appraiserId);
      const syncResponse = await fetch('/api/appraisers/sync-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appraiser_id: appraiserId })
      });

      const result = await syncResponse.json();
      console.log('Portfolio sync API response:', result);
      
      if (result.success) {
        toast.success('Portfolio synced successfully! Public profile has been updated with completed appraisals.');
        loadAppraisals(); // Refresh data
      } else {
        console.error('Portfolio sync failed:', result.error);
        toast.error('Failed to sync portfolio: ' + result.error);
      }
    } catch (error) {
      console.error('Portfolio sync error:', error);
      toast.error('Failed to sync portfolio');
    } finally {
      setSyncingPortfolio(false);
    }
  };

  const handleCompleteAppraisal = async (appraisalId: string) => {
    try {
      setCompletingAppraisal(appraisalId);
      
      const response = await fetch(`/api/appraisals/${appraisalId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete appraisal');
      }

      // Success! Refresh the appraisals list
      await loadAppraisals();
      
      toast.success(`Appraisal completed successfully! Portfolio automatically updated.`);

    } catch (error) {
      console.error('Complete appraisal error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete appraisal');
    } finally {
      setCompletingAppraisal(null);
    }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      
      const params = new URLSearchParams({
        limit: '20',
        offset: '0'
      });
      
      if (bookingStatusFilter !== 'all') {
        params.append('status', bookingStatusFilter);
      }

      // If admin with selected appraiser, filter by that appraiser
      if (isAdmin && selectedAppraiserId) {
        // Note: This assumes the bookings API supports appraiser_id filtering
        params.append('appraiser_id', selectedAppraiserId);
      }

      const response = await fetch(`/api/appraisers/bookings?${params}`);
      const result = await response.json();
      
      if (response.ok && result.bookings) {
        setBookings(result.bookings);
      } else {
        console.error('Failed to load bookings:', result.error);
        toast.error('Failed to load bookings');
        setBookings([]);
      }
    } catch (error) {
      console.error('Load bookings error:', error);
      toast.error('Failed to load bookings');
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'cancel' | 'complete' | 'reschedule', data?: any) => {
    try {
      const response = await fetch(`/api/appraisers/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Booking ${action}ed successfully`);
        loadBookings(); // Reload bookings
        setShowBookingDetails(false);
        setSelectedBooking(null);
      } else {
        toast.error(`Failed to ${action} booking: ${result.error}`);
      }
    } catch (error) {
      console.error(`Booking ${action} error:`, error);
      toast.error(`Failed to ${action} booking`);
    }
  };

  const handleStartAppraisalFromBooking = async (booking: any) => {
    try {
      // Create appraisal with pre-filled data from booking
      const appraisalData = {
        client_name: booking.client_name,
        client_email: booking.client_email,
        client_phone: booking.client_phone,
        property_id: booking.property_id,
        property_address: booking.property_details?.address,
        booking_id: booking.id,
        appraisal_date: new Date().toISOString().split('T')[0],
        form_data: {
          // Pre-fill basic client and property info
          client_name: booking.client_name,
          client_email: booking.client_email,
          client_phone: booking.client_phone,
          property_address_english: booking.property_details?.address,
          property_type: booking.property_details?.property_type,
          property_address_arabic: booking.property_details?.address,
          requested_by: booking.client_name,
          appraisal_date: new Date().toISOString().split('T')[0],
          appraisal_reference_number: `AR-${Date.now()}`,
        },
        status: 'draft'
      };

      const response = await fetch('/api/appraisals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appraisalData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`Appraisal started for ${booking.client_name}`);
        
        // Set the created appraisal as selected and open the form
        setSelectedAppraisal({
          ...result.data,
          client_name: booking.client_name,
          properties: { 
            title: booking.property_details?.address || 'Property from Booking',
            address: booking.property_details?.address,
            city: booking.property_details?.city
          }
        });
        
        // Pre-fill the form with booking data
        setImportedFormData(appraisalData.form_data);
        
        // Open the SmartAppraisalForm
        setShowNewAppraisalForm(true);
        
        // Update booking status to 'in_progress' by updating directly
        try {
          await fetch(`/api/appraisers/bookings/${booking.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'in_progress' })
          });
          loadBookings(); // Refresh bookings list
        } catch (error) {
          console.error('Failed to update booking status:', error);
        }
        
      } else {
        throw new Error(result.error || 'Failed to create appraisal');
      }
    } catch (error) {
      console.error('Start appraisal from booking error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start appraisal');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: t('appraiserDashboard.draft') },
      in_review: { variant: 'outline' as const, label: t('appraiserDashboard.inReview') },
      completed: { variant: 'default' as const, label: t('appraiserDashboard.completed') },
      approved: { variant: 'default' as const, label: t('appraiserDashboard.approved') },
      archived: { variant: 'destructive' as const, label: t('appraiserDashboard.archived') }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getBookingStatusBadge = (status: string) => {
    const statusConfig = {
      pending_confirmation: { variant: 'secondary' as const, label: t('appraiserDashboard.pending'), color: 'text-orange-600' },
      confirmed: { variant: 'default' as const, label: t('appraiserDashboard.confirmed'), color: 'text-blue-600' },
      in_progress: { variant: 'default' as const, label: t('appraiserDashboard.inProgress'), color: 'text-purple-600' },
      completed: { variant: 'default' as const, label: t('appraiserDashboard.completed'), color: 'text-green-600' },
      cancelled: { variant: 'destructive' as const, label: t('appraiserDashboard.cancelled'), color: 'text-red-600' },
      no_show: { variant: 'destructive' as const, label: t('appraiserDashboard.noShow'), color: 'text-red-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_confirmation;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: t('appraiserDashboard.pending') },
      partial: { variant: 'outline' as const, label: t('appraiserDashboard.partial') },
      paid: { variant: 'default' as const, label: t('appraiserDashboard.paid') },
      refunded: { variant: 'destructive' as const, label: t('appraiserDashboard.refunded') }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Messaging handlers
  const handleSendMessage = async () => {
    if (!messageRecipient || !messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSendingMessage(true);

    try {
      // For now, we'll use a simple email-based messaging system
      // In the future, this could be enhanced with a real messaging API
      
      const subject = `Message from ${appraiserProfile?.id ? 'Appraiser' : 'Property Appraiser'}`;
      const body = `
Hello ${messageRecipient.name},

${messageText}

Best regards,
Your Property Appraiser

---
This message was sent through our secure appraiser platform.
`;

      // Open email client with pre-filled message
      const mailtoLink = `mailto:${messageRecipient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);

      // For demonstration, we'll also show a success message
      // In production, you'd want to save the message to a database
      toast.success(`Message sent to ${messageRecipient.name}`);
      
      // Reset form
      setShowMessageModal(false);
      setMessageText('');
      setMessageRecipient(null);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const openQuickMessage = (recipient: {name: string, email: string, phone?: string}) => {
    setMessageRecipient(recipient);
    setMessageText('');
    setShowMessageModal(true);
  };

  const checkProfileCompletion = () => {
    const targetAppraiser = appraiserData || currentAppraiserData;
    if (!targetAppraiser) return { isComplete: false, missingItems: [] };

    const missingItems: string[] = [];

    // Check Valify verification
    if (targetAppraiser.valify_status !== 'verified') {
      missingItems.push(t('appraiserDashboard.completeValifyVerification'));
    }

    // Check basic profile information
    if (!targetAppraiser.profile_headline || !targetAppraiser.bio) {
      missingItems.push(t('appraiserDashboard.addProfileHeadlineBio'));
    }

    if (!targetAppraiser.years_experience || targetAppraiser.years_experience === 0) {
      missingItems.push(t('appraiserDashboard.addYearsExperience'));
    }

    if (!targetAppraiser.average_rating || targetAppraiser.average_rating === 0) {
      missingItems.push(t('appraiserDashboard.addRatingInfo'));
    }

    // Check certifications
    if (!targetAppraiser.certifications || targetAppraiser.certifications.length === 0) {
      missingItems.push(t('appraiserDashboard.addProfessionalCertifications'));
    }

    // Check professional headshot
    if (!targetAppraiser.professional_headshot_url) {
      missingItems.push(t('appraiserDashboard.addProfessionalHeadshot'));
    }

    // Check pricing
    if (!targetAppraiser.pricing_info || !targetAppraiser.pricing_info.base_fee) {
      missingItems.push(t('appraiserDashboard.setPricingInfo'));
    }

    // Check service areas
    if (!targetAppraiser.service_areas || targetAppraiser.service_areas.length === 0) {
      missingItems.push(t('appraiserDashboard.setServiceAreas'));
    }

    // Check response time
    if (!targetAppraiser.response_time_hours) {
      missingItems.push(t('appraiserDashboard.setResponseTime'));
    }

    return {
      isComplete: missingItems.length === 0,
      missingItems
    };
  };

  const filteredAppraisals = appraisals.filter(appraisal => {
    const matchesSearch = !searchQuery || 
      appraisal.properties?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appraisal.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appraisal.appraisal_reference_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const renderViewAppraisalModal = () => {
    if (!viewingAppraisal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-y-auto">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('appraiserDashboard.appraisalDetails')}</h2>
            <Button variant="ghost" size="sm" onClick={() => setViewingAppraisal(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Property Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Property Title:</span>
                    <p className="font-medium">{viewingAppraisal.properties?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Address:</span>
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {viewingAppraisal.properties?.address || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Property Type:</span>
                    <p className="capitalize">{viewingAppraisal.properties?.property_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">City:</span>
                    <p>{viewingAppraisal.properties?.city || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Appraisal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Client Name:</span>
                    <p className="font-medium">{viewingAppraisal.client_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Appraisal Date:</span>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {viewingAppraisal.appraisal_date}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Reference Number:</span>
                    <p>{viewingAppraisal.appraisal_reference_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <div className="mt-1">{getStatusBadge(viewingAppraisal.status)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Valuation Results */}
            {viewingAppraisal.market_value_estimate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Valuation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {viewingAppraisal.market_value_estimate.toLocaleString()} EGP
                      </div>
                      <div className="text-sm text-gray-600">Market Value Estimate</div>
                    </div>
                    {viewingAppraisal.confidence_level && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {viewingAppraisal.confidence_level}%
                        </div>
                        <div className="text-sm text-gray-600">Confidence Level</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {viewingAppraisal.properties?.price ? 
                          `${((viewingAppraisal.market_value_estimate / viewingAppraisal.properties.price - 1) * 100).toFixed(1)}%` : 
                          'N/A'
                        }
                      </div>
                      <div className="text-sm text-gray-600">vs Listed Price</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Data */}
            {viewingAppraisal.form_data && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Property Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {Object.entries(viewingAppraisal.form_data).map(([key, value]) => (
                      <div key={key} className="border-b pb-2">
                        <span className="font-medium text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <p className="mt-1">{String(value) || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calculation Results */}
            {viewingAppraisal.calculation_results && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Calculation Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                    {JSON.stringify(viewingAppraisal.calculation_results, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="p-6 border-t flex justify-end gap-3">
            <Button 
              variant="outline"
              onClick={() => {
                setViewingAppraisal(null);
                setSelectedAppraisal(viewingAppraisal);
                setShowNewAppraisalForm(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Appraisal
            </Button>
            <Button 
              onClick={() => {
                setViewingAppraisal(null);
                setReportAppraisalId(viewingAppraisal.id);
                setShowReportGenerator(true);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('appraiserDashboard.generateReport')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (showNewAppraisalForm) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {selectedAppraisal ? 'Edit Appraisal' : 'New Property Appraisal'}
          </h1>
          <Button variant="outline" onClick={() => {
            setShowNewAppraisalForm(false);
            setSelectedAppraisal(null);
            setImportedFormData(null);
          }}>
{t('appraiserDashboard.backToDashboard')}
          </Button>
        </div>
        <SmartAppraisalForm 
          propertyId={selectedAppraisal?.property_id}
          onSave={handleSaveAppraisal}
          initialData={importedFormData || selectedAppraisal}
        />
      </div>
    );
  }

  if (showReportGenerator) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('appraiserDashboard.generateAppraisalReport')}</h1>
          <Button variant="outline" onClick={() => {
            setShowReportGenerator(false);
            setReportAppraisalId('');
          }}>
{t('appraiserDashboard.backToDashboard')}
          </Button>
        </div>
        <AppraisalReportGenerator 
          appraisalId={reportAppraisalId}
          onReportGenerated={(data) => {
            console.log('Report generated:', data);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* View Appraisal Modal */}
      {renderViewAppraisalModal()}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? t('appraiserDashboard.adminTitle') : t('appraiserDashboard.userTitle')}
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin ? t('appraiserDashboard.adminDescription') : t('appraiserDashboard.userDescription')}
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && availableAppraisers.length > 0 && (
            <Select value={selectedAppraiserId} onValueChange={(value) => {
              setSelectedAppraiserId(value);
              setAppraiserProfile({ id: value });
            }}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Appraiser" />
              </SelectTrigger>
              <SelectContent>
                {availableAppraisers.map((appraiser) => (
                  <SelectItem key={appraiser.id} value={appraiser.id}>
                    {appraiser.full_name} ({appraiser.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button 
            variant="outline" 
            onClick={() => {
              if (isAdmin) {
                window.open('/admin/appraisers', '_blank');
              } else {
                window.open('/appraiser/profile/edit', '_blank');
              }
            }}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {isAdmin ? 'Manage Appraiser' : 'Manage Profile'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSyncPortfolio()}
            disabled={syncingPortfolio}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncingPortfolio ? 'animate-spin' : ''}`} />
            {syncingPortfolio ? 'Syncing...' : 'Sync Portfolio'}
          </Button>
          <Button onClick={() => setShowAppraisalOptionsModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Appraisal
          </Button>
        </div>
      </div>

      {/* Profile Completion Alert */}
      {(() => {
        const profileStatus = checkProfileCompletion();
        return !isAdmin && !profileStatus.isComplete && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-orange-900 mb-1">Complete Your Profile for Public Visibility</h3>
                  <p className="text-sm text-orange-800 mb-3">
                    To appear in public appraiser searches and receive client bookings, you still need to:
                  </p>
                  <ul className="text-sm text-orange-800 space-y-1 mb-4">
                    {profileStatus.missingItems.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('profile')}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    Complete Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('/find-appraisers', '_blank')}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    Preview Public Listing
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })()}

      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        if (tab === 'bookings') {
          loadBookings();
        }
      }}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">{t('appraiserDashboard.overview')}</TabsTrigger>
          <TabsTrigger value="profile">{t('appraiserDashboard.profile')}</TabsTrigger>
          <TabsTrigger value="appraisals">{t('appraiserDashboard.myAppraisals')}</TabsTrigger>
          <TabsTrigger value="bookings">{t('appraiserDashboard.bookings')}</TabsTrigger>
          <TabsTrigger value="availability">{t('appraiserDashboard.availability')}</TabsTrigger>
          <TabsTrigger value="reviews">{t('appraiserDashboard.reviews')}</TabsTrigger>
          <TabsTrigger value="reports">{t('appraiserDashboard.reports')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('appraiserDashboard.analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('appraiserDashboard.totalAppraisals')}</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_appraisals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('appraiserDashboard.completed')}</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed_appraisals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('appraiserDashboard.pending')}</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pending_appraisals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('appraiserDashboard.totalValue')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(stats.total_value_appraised / 1000000).toFixed(1)}M EGP
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('appraiserDashboard.avgConfidence')}</CardTitle>
                <Calculator className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.avg_confidence_level.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('appraiserDashboard.quickActions')}</CardTitle>
              <CardDescription>{t('appraiserDashboard.quickActionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isAdmin && selectedAppraiserId) {
                      window.open(`/admin/appraisers/${selectedAppraiserId}/profile`, '_blank');
                    } else if (isAdmin) {
                      window.open('/admin/appraisers', '_blank');
                    } else {
                      window.open('/appraiser/profile/edit', '_blank');
                    }
                  }}
                  className="flex items-center gap-2 h-auto p-4"
                >
                  <Settings className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{isAdmin ? 'Manage Appraiser' : 'Manage Profile'}</div>
                    <div className="text-xs text-gray-500">
                      {isAdmin ? 'Edit selected appraiser details' : 'Edit certifications, services & availability'}
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('reviews')}
                  className="flex items-center gap-2 h-auto p-4"
                >
                  <User className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Reviews</div>
                    <div className="text-xs text-gray-500">Respond to client feedback</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSyncPortfolio()}
                  disabled={syncingPortfolio}
                  className="flex items-center gap-2 h-auto p-4"
                >
                  <RefreshCw className={`h-5 w-5 ${syncingPortfolio ? 'animate-spin' : ''}`} />
                  <div className="text-left">
                    <div className="font-medium">Sync Portfolio</div>
                    <div className="text-xs text-gray-500">
                      {isAdmin ? 'Update selected appraiser profile' : 'Update public profile'}
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Appraisals */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Appraisals</CardTitle>
              <CardDescription>Your latest property appraisals</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {filteredAppraisals.slice(0, 5).map((appraisal) => (
                    <div key={appraisal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{appraisal.properties?.title}</h3>
                        <p className="text-sm text-gray-600">
                          {appraisal.client_name} • {appraisal.appraisal_date}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {appraisal.market_value_estimate && (
                          <div className="text-right">
                            <div className="font-medium">
                              {appraisal.market_value_estimate.toLocaleString()} EGP
                            </div>
                            {appraisal.confidence_level && (
                              <div className="text-sm text-gray-600">
                                {appraisal.confidence_level}% confidence
                              </div>
                            )}
                          </div>
                        )}
                        {getStatusBadge(appraisal.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Completion Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('appraiserDashboard.completeProfessionalProfile')}
              </CardTitle>
              <CardDescription>
                {t('appraiserDashboard.fillOutInformation')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(currentAppraiserData || appraiserData) ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('appraiserDashboard.fullName')}</label>
                      <Input
                        value={profileEditData.full_name || ''}
                        onChange={(e) => setProfileEditData((prev: ProfileEditData) => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('appraiserDashboard.email')}</label>
                      <Input
                        type="email"
                        value={profileEditData.email || ''}
                        onChange={(e) => setProfileEditData((prev: ProfileEditData) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('appraiserDashboard.phone')}</label>
                      <Input
                        value={profileEditData.phone || ''}
                        onChange={(e) => setProfileEditData((prev: ProfileEditData) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('appraiserDashboard.appraiserLicense')}</label>
                      <Input
                        value={profileEditData.appraiser_license_number || ''}
                        onChange={(e) => setProfileEditData((prev: ProfileEditData) => ({ ...prev, appraiser_license_number: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('appraiserDashboard.yearsOfExperience')}</label>
                    <Input
                      type="number"
                      min="0"
                      value={profileEditData.years_experience || ''}
                      onChange={(e) => setProfileEditData((prev: ProfileEditData) => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('appraiserDashboard.profileHeadline')}</label>
                    <Input
                      placeholder="e.g., Certified Property Appraiser specializing in Residential Properties"
                      value={profileEditData.profile_headline || ''}
                      onChange={(e) => setProfileEditData((prev: ProfileEditData) => ({ ...prev, profile_headline: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('appraiserDashboard.bioProfileSummary')}</label>
                    <Textarea
                      rows={3}
                      value={profileEditData.bio || ''}
                      onChange={(e) => setProfileEditData((prev: ProfileEditData) => ({ ...prev, bio: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('appraiserDashboard.serviceAreasLabel')}</label>
                    <Input
                      placeholder={t('appraiserDashboard.serviceAreasPlaceholder')}
                      value={profileEditData.service_areas?.join(', ') || ''}
                      onChange={(e) => setProfileEditData((prev: ProfileEditData) => ({ 
                        ...prev, 
                        service_areas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('appraiserDashboard.averageRating')}</label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={profileEditData.average_rating || ''}
                        onChange={(e) => setProfileEditData((prev: ProfileEditData) => ({ ...prev, average_rating: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('appraiserDashboard.totalReviews')}</label>
                      <Input
                        type="number"
                        min="0"
                        value={profileEditData.total_reviews || ''}
                        onChange={(e) => setProfileEditData((prev: ProfileEditData) => ({ ...prev, total_reviews: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('appraiserDashboard.responseTimeHours')}</label>
                    <Input
                      type="number"
                      min="1"
                      value={profileEditData.response_time_hours || ''}
                      onChange={(e) => setProfileEditData((prev: ProfileEditData) => ({ ...prev, response_time_hours: parseInt(e.target.value) || 24 }))}
                    />
                  </div>

                  {/* Professional Certifications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('appraiserDashboard.professionalCertifications')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'FRA Licensed', authority: 'Financial Regulatory Authority' },
                        { name: 'RICS Certified', authority: 'Royal Institution of Chartered Surveyors' },
                        { name: 'CRE Designation', authority: 'Counselors of Real Estate' },
                        { name: 'ASA Certified', authority: 'American Society of Appraisers' },
                        { name: 'IFVS Member', authority: 'International Federation of Valuers Societies' },
                        { name: 'TEGOVA Certified', authority: 'The European Group of Valuers Associations' }
                      ].map((cert) => {
                        const isSelected = profileEditData.certifications?.some(c => c.name === cert.name) || false;
                        return (
                          <label key={cert.name} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentCerts = profileEditData.certifications || [];
                                if (e.target.checked) {
                                  setProfileEditData((prev: ProfileEditData) => ({
                                    ...prev,
                                    certifications: [...currentCerts, { ...cert, verified: true }]
                                  }));
                                } else {
                                  setProfileEditData((prev: ProfileEditData) => ({
                                    ...prev,
                                    certifications: currentCerts.filter(c => c.name !== cert.name)
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            <div className="text-sm">
                              <div className="font-medium">{cert.name}</div>
                              <div className="text-gray-500 text-xs">{cert.authority}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('appraiserDashboard.pricingInformation')}</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t('appraiserDashboard.baseFeeEgp')}</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="2500"
                          value={profileEditData.pricing_info?.base_fee || ''}
                          onChange={(e) => {
                            const currentPricing = profileEditData.pricing_info || {};
                            setProfileEditData((prev: ProfileEditData) => ({
                              ...prev,
                              pricing_info: {
                                ...currentPricing,
                                base_fee: parseInt(e.target.value) || 0,
                                currency: 'EGP'
                              }
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t('appraiserDashboard.rushFeeEgp')}</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="4000"
                          value={profileEditData.pricing_info?.rush_fee || ''}
                          onChange={(e) => {
                            const currentPricing = profileEditData.pricing_info || {};
                            setProfileEditData((prev: ProfileEditData) => ({
                              ...prev,
                              pricing_info: {
                                ...currentPricing,
                                rush_fee: parseInt(e.target.value) || 0,
                                currency: 'EGP'
                              }
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t('appraiserDashboard.currency')}</label>
                        <Select 
                          value={profileEditData.pricing_info?.currency || 'EGP'}
                          onValueChange={(value) => {
                            const currentPricing = profileEditData.pricing_info || {};
                            setProfileEditData((prev: ProfileEditData) => ({
                              ...prev,
                              pricing_info: { ...currentPricing, currency: value }
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EGP">EGP</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Professional Headshot */}
                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">{t('appraiserDashboard.professionalHeadshot')}</label>
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-3">
                        <div 
                          className="w-24 h-24 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => setShowCameraCapture(true)}
                          title={t('appraiserDashboard.takePhoto')}
                        >
                          {profileEditData.professional_headshot_url ? (
                            <img 
                              src={profileEditData.professional_headshot_url} 
                              alt="Profile headshot"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center text-gray-400">
                              <Camera className="w-6 h-6" />
                              <span className="text-xs mt-1">{t('appraiserDashboard.takePhoto')}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowCameraCapture(true)}
                            className="flex items-center gap-2"
                          >
                            <Camera className="w-3 h-3" />
                            {t('appraiserDashboard.aiCamera')}
                          </Button>
                          {profileEditData.professional_headshot_url && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setProfileEditData((prev: ProfileEditData) => ({ ...prev, professional_headshot_url: '' }))}
                            >
                              {t('appraiserDashboard.remove')}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{t('appraiserDashboard.generateWithAi')}</label>
                          <div className="flex gap-2">
                            <Input
                              placeholder={t('appraiserDashboard.generatePlaceholder')}
                              value={imagePrompt}
                              onChange={(e) => setImagePrompt(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              onClick={generateProfileImage} 
                              disabled={imageGenerating || !imagePrompt.trim()}
                              size="sm"
                            >
                              {imageGenerating ? t('appraiserDashboard.generating') : t('appraiserDashboard.generate')}
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{t('appraiserDashboard.pasteImageUrl')}</label>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            value={profileEditData.professional_headshot_url || ''}
                            onChange={(e) => setProfileEditData((prev: ProfileEditData) => ({ ...prev, professional_headshot_url: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      onClick={saveProfile} 
                      disabled={savingProfile || !profileEditData.full_name || !profileEditData.email || !(currentAppraiserData || appraiserData)}
                      className="px-8"
                    >
                      {savingProfile ? t('appraiserDashboard.saving') : t('appraiserDashboard.saveProfile')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('appraiserDashboard.loadingProfileData')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appraisals" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={t('appraiserDashboard.searchAppraisals')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('appraiserDashboard.allStatuses')}</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appraisals List */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">{t('appraiserDashboard.loadingAppraisals')}</div>
            ) : filteredAppraisals.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('appraiserDashboard.noAppraisalsFound')}</h3>
                    <p className="text-gray-600 mb-4">{t('appraiserDashboard.getStartedAppraisal')}</p>
                    <Button onClick={() => setShowAppraisalOptionsModal(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Appraisal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredAppraisals.map((appraisal) => (
                <Card key={appraisal.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium">{appraisal.properties?.title}</h3>
                          {getStatusBadge(appraisal.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">{t('appraiserDashboard.client')}</span> {appraisal.client_name}
                          </div>
                          <div>
                            <span className="font-medium">{t('appraiserDashboard.date')}</span> {appraisal.appraisal_date}
                          </div>
                          <div>
                            <span className="font-medium">{t('appraiserDashboard.reference')}</span> {appraisal.appraisal_reference_number || t('appraiserDashboard.notAvailable')}
                          </div>
                          <div>
                            <span className="font-medium">{t('appraiserDashboard.location')}</span> {appraisal.properties?.city}
                          </div>
                        </div>
                        {appraisal.market_value_estimate && (
                          <div className="mt-3 flex items-center gap-6">
                            <div>
                              <span className="text-sm text-gray-600">{t('appraiserDashboard.marketValue')}</span>
                              <div className="text-xl font-bold text-green-600">
                                {appraisal.market_value_estimate.toLocaleString()} EGP
                              </div>
                            </div>
                            {appraisal.confidence_level && (
                              <div>
                                <span className="text-sm text-gray-600">{t('appraiserDashboard.confidenceLabel')}</span>
                                <div className="text-lg font-medium">
                                  {appraisal.confidence_level}%
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setViewingAppraisal(appraisal)}
                          title="View Appraisal"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {appraisal.status === 'draft' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleCompleteAppraisal(appraisal.id)}
                            disabled={completingAppraisal === appraisal.id}
                            title="Complete Appraisal and Add to Portfolio"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {completingAppraisal === appraisal.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedAppraisal(appraisal);
                            setShowNewAppraisalForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setReportAppraisalId(appraisal.id);
                            setShowReportGenerator(true);
                          }}
                          title={t('appraiserDashboard.generateReport')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          {/* Bookings Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={t('appraiserDashboard.searchBookings')}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={bookingStatusFilter} onValueChange={(value) => {
                  setBookingStatusFilter(value);
                  if (activeTab === 'bookings') loadBookings();
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('appraiserDashboard.allStatuses')}</SelectItem>
                    <SelectItem value="pending_confirmation">{t('appraiserDashboard.pending')}</SelectItem>
                    <SelectItem value="confirmed">{t('appraiserDashboard.confirmed')}</SelectItem>
                    <SelectItem value="in_progress">{t('appraiserDashboard.inProgress')}</SelectItem>
                    <SelectItem value="completed">{t('appraiserDashboard.completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('appraiserDashboard.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => loadBookings()} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${bookingsLoading ? 'animate-spin' : ''}`} />
                  {t('appraiserDashboard.refresh')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('appraiserDashboard.totalBookings')}</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookings.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('appraiserDashboard.pending')}</CardTitle>
                <Clock3 className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {bookings.filter(b => b.status === 'pending_confirmation').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('appraiserDashboard.confirmed')}</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('appraiserDashboard.thisMonthRevenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {bookings
                    .filter(b => b.status === 'completed' && new Date(b.scheduled_datetime).getMonth() === new Date().getMonth())
                    .reduce((sum, b) => sum + b.estimated_cost, 0)
                    .toLocaleString()} EGP
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="text-center py-8">{t('appraiserDashboard.loadingBookings')}</div>
            ) : bookings.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('appraiserDashboard.noBookingsFound')}</h3>
                    <p className="text-gray-600 mb-4">{t('appraiserDashboard.bookingRequestsAppear')}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium">{booking.booking_type.charAt(0).toUpperCase() + booking.booking_type.slice(1)}</h3>
                          {getBookingStatusBadge(booking.status)}
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">{t('appraiserDashboard.client')}</span>
                            <p className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {booking.client_name}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">{t('appraiserDashboard.dateTime')}</span>
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(booking.scheduled_datetime).toLocaleDateString('en-EG')} at {new Date(booking.scheduled_datetime).toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">{t('appraiserDashboard.property')}</span>
                            <p className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {booking.property_details.address}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">{t('appraiserDashboard.confirmation')}</span>
                            <p className="font-mono text-xs">{booking.confirmation_number}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                          <div>
                            <span className="text-sm text-gray-600">{t('appraiserDashboard.duration')}</span>
                            <div className="font-medium">{booking.estimated_duration_hours}h</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">{t('appraiserDashboard.totalCost')}</span>
                            <div className="text-lg font-bold text-green-600">
                              {booking.estimated_cost.toLocaleString()} EGP
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">{t('appraiserDashboard.deposit')}</span>
                            <div className="font-medium">{booking.deposit_amount.toLocaleString()} EGP</div>
                          </div>
                        </div>

                        {booking.special_instructions && (
                          <div className="bg-amber-50 p-3 rounded-lg">
                            <span className="text-sm font-medium text-amber-800">{t('appraiserDashboard.specialInstructions')}</span>
                            <p className="text-sm text-amber-700 mt-1">{booking.special_instructions}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBookingDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t('appraiserDashboard.viewDetails')}
                        </Button>
                        
                        {booking.status === 'pending_confirmation' && (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              onClick={() => handleBookingAction(booking.id, 'confirm')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              {t('appraiserDashboard.confirm')}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleBookingAction(booking.id, 'cancel')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {t('appraiserDashboard.decline')}
                            </Button>
                          </div>
                        )}

                        {booking.status === 'confirmed' && (
                          <div className="flex flex-col gap-1">
                            <Button 
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleStartAppraisalFromBooking(booking)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {t('appraiserDashboard.startAppraisal')}
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleBookingAction(booking.id, 'complete')}
                            >
                              {t('appraiserDashboard.markComplete')}
                            </Button>
                          </div>
                        )}

                        {(booking.client_phone || booking.client_email) && (
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openQuickMessage({
                                name: booking.client_name,
                                email: booking.client_email,
                                phone: booking.client_phone
                              })}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            {booking.client_phone && (
                              <Button variant="outline" size="sm" onClick={() => window.open(`tel:${booking.client_phone}`)}>
                                <Phone className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${booking.client_email}`)}>
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Booking Details Modal */}
          {showBookingDetails && selectedBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] w-full overflow-y-auto">
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{t('appraiserDashboard.bookingDetails')}</h2>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setShowBookingDetails(false);
                    setSelectedBooking(null);
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">{t('appraiserDashboard.bookingInformation')}</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">{t('appraiserDashboard.type')}</span> {selectedBooking.booking_type}</div>
                        <div><span className="font-medium">Confirmation:</span> {selectedBooking.confirmation_number}</div>
                        <div><span className="font-medium">Date:</span> {new Date(selectedBooking.scheduled_datetime).toLocaleString('en-EG')}</div>
                        <div><span className="font-medium">Duration:</span> {selectedBooking.estimated_duration_hours} hours</div>
                        <div><span className="font-medium">Status:</span> {getBookingStatusBadge(selectedBooking.status)}</div>
                        <div><span className="font-medium">Payment:</span> {getPaymentStatusBadge(selectedBooking.payment_status)}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">{t('appraiserDashboard.clientInformation')}</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">{t('appraiserDashboard.name')}</span> {selectedBooking.client_name}</div>
                        <div><span className="font-medium">Email:</span> {selectedBooking.client_email}</div>
                        <div><span className="font-medium">Phone:</span> {selectedBooking.client_phone || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Property Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Type:</span> {selectedBooking.property_details.property_type}</div>
                      <div><span className="font-medium">Address:</span> {selectedBooking.property_details.address}</div>
                      {selectedBooking.property_details.square_meters && (
                        <div><span className="font-medium">{t('appraiserDashboard.size')}</span> {selectedBooking.property_details.square_meters} m²</div>
                      )}
                      {selectedBooking.property_details.estimated_value && (
                        <div><span className="font-medium">{t('appraiserDashboard.estimatedValue')}</span> {selectedBooking.property_details.estimated_value.toLocaleString()} EGP</div>
                      )}
                      {selectedBooking.property_details.access_instructions && (
                        <div><span className="font-medium">{t('appraiserDashboard.accessInstructions')}</span> {selectedBooking.property_details.access_instructions}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">{t('appraiserDashboard.financialDetails')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-lg font-bold text-green-600">{selectedBooking.estimated_cost.toLocaleString()} EGP</div>
                        <div className="text-sm text-green-700">{t('appraiserDashboard.totalCostLabel')}</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-lg font-bold text-blue-600">{selectedBooking.deposit_amount.toLocaleString()} EGP</div>
                        <div className="text-sm text-blue-700">{t('appraiserDashboard.depositAmount')}</div>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.special_instructions && (
                    <div>
                      <h3 className="font-medium mb-3">Special Instructions</h3>
                      <div className="bg-amber-50 p-3 rounded-lg">
                        <p className="text-sm text-amber-800">{selectedBooking.special_instructions}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t flex justify-between">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => openQuickMessage({
                        name: selectedBooking.client_name,
                        email: selectedBooking.client_email,
                        phone: selectedBooking.client_phone
                      })}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {t('appraiserDashboard.quickMessage')}
                    </Button>
                    {selectedBooking.client_phone && (
                      <Button variant="outline" onClick={() => window.open(`tel:${selectedBooking.client_phone}`)}>
                        <Phone className="h-4 w-4 mr-2" />
                        {t('appraiserDashboard.callClient')}
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => window.open(`mailto:${selectedBooking.client_email}`)}>
                      <Mail className="h-4 w-4 mr-2" />
                      {t('appraiserDashboard.emailClient')}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    {selectedBooking.status === 'pending_confirmation' && (
                      <>
                        <Button onClick={() => handleBookingAction(selectedBooking.id, 'confirm')}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {t('appraiserDashboard.confirmBooking')}
                        </Button>
                        <Button variant="destructive" onClick={() => handleBookingAction(selectedBooking.id, 'cancel')}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </>
                    )}
                    {selectedBooking.status === 'confirmed' && (
                      <Button onClick={() => handleBookingAction(selectedBooking.id, 'complete')}>
                        {t('appraiserDashboard.markAsComplete')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('appraiserDashboard.reviewsManagement')}
              </CardTitle>
              <CardDescription>
                {t('appraiserDashboard.reviewsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appraiserProfile ? (
                <ReviewResponseSystem appraiser_id={appraiserProfile.id} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('appraiserDashboard.loadingAppraiserProfile')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {t('appraiserDashboard.availabilityManagement')}
              </CardTitle>
              <CardDescription>
                {t('appraiserDashboard.availabilityDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appraiserProfile ? (
                <ProfileAvailabilityTab
                  appraiser_id={appraiserProfile.id}
                  availability_schedule={[]} // This should be loaded from API in production
                  response_time_hours={24}
                  timezone="Africa/Cairo"
                  emergency_available={false}
                  booking_advance_days={2}
                  service_areas={['Cairo', 'Giza']}
                  contact_preferences={{
                    phone: true,
                    email: true,
                    whatsapp: false
                  }}
                  isManagementMode={true}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('appraiserDashboard.loadingAppraiserProfile')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Reports Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('appraiserDashboard.generateReport')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => setActiveTab('appraisals')}
                >
                  {t('appraiserDashboard.selectAppraisal')}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  {t('appraiserDashboard.generateReportsDescription')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t('appraiserDashboard.legalCompliance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.completed_appraisals}
                </div>
                <p className="text-xs text-gray-500">
                  {t('appraiserDashboard.appraisalsWithLegalAnalysis')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t('appraiserDashboard.mortgageAnalysis')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(stats.completed_appraisals * 0.7)}
                </div>
                <p className="text-xs text-gray-500">
                  {t('appraiserDashboard.appraisalsWithMortgageEligibility')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {t('appraiserDashboard.investmentReports')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.completed_appraisals * 0.8)}
                </div>
                <p className="text-xs text-gray-500">
                  {t('appraiserDashboard.appraisalsWithInvestmentAnalysis')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle>{t('appraiserDashboard.reportTemplates')}</CardTitle>
              <CardDescription>{t('appraiserDashboard.reportTemplatesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{t('appraiserDashboard.comprehensiveReport')}</h3>
                      <p className="text-sm text-gray-600">{t('appraiserDashboard.comprehensiveReportDescription')}</p>
                    </div>
                    <Badge variant="default">{t('appraiserDashboard.mostPopular')}</Badge>
                  </div>
                  <ul className="text-xs text-gray-500 space-y-1 mb-3">
                    <li>• Executive Summary</li>
                    <li>• Property & Market Analysis</li>
                    <li>• Legal & Mortgage Assessment</li>
                    <li>• Investment Projections</li>
                  </ul>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('appraiserDashboard.pages15')}</span>
                    <Badge variant="secondary">{t('appraiserDashboard.arabicEnglish')}</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{t('appraiserDashboard.executiveSummary')}</h3>
                      <p className="text-sm text-gray-600">{t('appraiserDashboard.executiveSummaryDescription')}</p>
                    </div>
                    <Badge variant="outline">{t('appraiserDashboard.quick')}</Badge>
                  </div>
                  <ul className="text-xs text-gray-500 space-y-1 mb-3">
                    <li>• {t('appraiserDashboard.keyFindings')}</li>
                    <li>• {t('appraiserDashboard.propertyOverview')}</li>
                    <li>• {t('appraiserDashboard.marketSummary')}</li>
                    <li>• {t('appraiserDashboard.recommendations')}</li>
                  </ul>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('appraiserDashboard.pages8')}</span>
                    <Badge variant="secondary">{t('appraiserDashboard.arabicEnglish')}</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{t('appraiserDashboard.investorReport')}</h3>
                      <p className="text-sm text-gray-600">{t('appraiserDashboard.investorReportDescription')}</p>
                    </div>
                    <Badge variant="outline">{t('appraiserDashboard.roiFocus')}</Badge>
                  </div>
                  <ul className="text-xs text-gray-500 space-y-1 mb-3">
                    <li>• {t('appraiserDashboard.investmentAnalysis')}</li>
                    <li>• {t('appraiserDashboard.rentalYieldCalculations')}</li>
                    <li>• {t('appraiserDashboard.marketComparables')}</li>
                    <li>• {t('appraiserDashboard.riskAssessment')}</li>
                  </ul>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('appraiserDashboard.pages12')}</span>
                    <Badge variant="secondary">{t('appraiserDashboard.arabicEnglish')}</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{t('appraiserDashboard.legalComplianceReport')}</h3>
                      <p className="text-sm text-gray-600">{t('appraiserDashboard.legalComplianceDescription')}</p>
                    </div>
                    <Badge variant="outline">{t('appraiserDashboard.legal')}</Badge>
                  </div>
                  <ul className="text-xs text-gray-500 space-y-1 mb-3">
                    <li>• {t('appraiserDashboard.legalStatusAnalysis')}</li>
                    <li>• {t('appraiserDashboard.complianceAssessment')}</li>
                    <li>• {t('appraiserDashboard.mortgageEligibility')}</li>
                    <li>• {t('appraiserDashboard.riskFactors')}</li>
                  </ul>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('appraiserDashboard.pages10')}</span>
                    <Badge variant="secondary">{t('appraiserDashboard.arabicEnglish')}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('appraiserDashboard.howToGenerateReports')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium mb-2">{t('appraiserDashboard.step1CompleteAppraisal')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('appraiserDashboard.step1Description')}
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Settings className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">{t('appraiserDashboard.step2ConfigureReport')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('appraiserDashboard.step2Description')}
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Download className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-2">{t('appraiserDashboard.step3GeneratePdf')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('appraiserDashboard.step3Description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('appraiserDashboard.performanceAnalytics')}</CardTitle>
              <CardDescription>{t('appraiserDashboard.analyticsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                {t('appraiserDashboard.analyticsComingSoon')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Message Modal */}
      {showMessageModal && messageRecipient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('appraiserDashboard.quickMessageTitle')}</h2>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowMessageModal(false);
                setMessageText('');
                setMessageRecipient(null);
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('appraiserDashboard.to')}: <strong>{messageRecipient.name}</strong></p>
                <p className="text-sm text-gray-500">{messageRecipient.email}</p>
                {messageRecipient.phone && (
                  <p className="text-sm text-gray-500">{messageRecipient.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('appraiserDashboard.message')}
                </label>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={6}
                  placeholder={t('appraiserDashboard.messageArea')}
                  className="w-full"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>{t('appraiserDashboard.quickTemplates')}</strong>
                </p>
                <div className="mt-2 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setMessageText("Thank you for booking an appraisal with us. I wanted to confirm our appointment and let you know I'll be in touch 24 hours before to confirm details.")}
                  >
                    {t('appraiserDashboard.confirmationTemplate')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setMessageText("I'm following up on your appraisal request. Please let me know if you have any questions or need to reschedule.")}
                  >
                    {t('appraiserDashboard.followUpTemplate')}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-between">
              <Button variant="outline" onClick={() => {
                setShowMessageModal(false);
                setMessageText('');
                setMessageRecipient(null);
              }}>
                {t('appraiserDashboard.cancel')}
              </Button>
              <Button onClick={handleSendMessage} disabled={sendingMessage || !messageText.trim()}>
                {sendingMessage ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('appraiserDashboard.sending')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t('appraiserDashboard.sendMessage')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Professional Photo Capture Modal */}
      <ProfessionalProfilePhotoCapture
        appraiser_id={(appraiserData || currentAppraiserData)?.id || ''}
        isOpen={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onPhotoUpdated={handleCameraPhotoUpdate}
        currentPhotoUrl={profileEditData.professional_headshot_url}
      />

      {/* New Appraisal Options Modal - Issue #8: Smart Document Import */}
      <Dialog open={showAppraisalOptionsModal} onOpenChange={setShowAppraisalOptionsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t('appraiserDashboard.newAppraisalTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('appraiserDashboard.chooseCreateMethod')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            
            {/* Create New Option */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300" 
              onClick={handleCreateNew}
            >
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-blue-100 rounded-full">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t('appraiserDashboard.createNewAppraisal')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t('appraiserDashboard.startFromScratch')}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{t('appraiserDashboard.traditionalMethod')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Import Document Option */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-300 bg-gradient-to-br from-green-50 to-blue-50">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-green-100 rounded-full">
                    <Upload className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                      {t('appraiserDashboard.importDocument')}
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        🤖 OpenBeit AI
                      </Badge>
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t('appraiserDashboard.uploadDocuments')}
                    </p>
                    
                    {/* Gemini Document Uploader */}
                    <GeminiDocumentUploader
                      onExtractionComplete={handleGeminiExtractionComplete}
                      onError={handleGeminiExtractionError}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Section */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('appraiserDashboard.openBeitAiBenefits')}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
              <div>• {t('appraiserDashboard.extractFieldsAi')}</div>
              <div>• {t('appraiserDashboard.advancedArabicText')}</div>
              <div>• {t('appraiserDashboard.processPdfExcelWord')}</div>
              <div>• {t('appraiserDashboard.intelligentDocAnalysis')}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}