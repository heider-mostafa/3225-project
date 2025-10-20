'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/config';
import {
  Plus,
  Edit,
  Trash2,
  User,
  Star,
  Mail,
  Phone,
  Badge as BadgeIcon,
  Shield,
  CheckCircle,
  XCircle,
  UserCheck,
  Building2,
  Calendar,
  Search,
  Users,
  AlertCircle,
  MousePointer,
  Calculator,
  FileText,
  Eye,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ProfessionalProfilePhotoCapture } from '@/components/appraiser/ProfessionalProfilePhotoCapture';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
  user_metadata: any;
  created_at: string;
  user_roles?: Array<{
    role: string;
    is_active: boolean;
  }>;
}

interface Appraiser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  license_number?: string;
  appraiser_license_number?: string;
  appraiser_certification_authority?: string;
  bio?: string;
  specialties: string[];
  languages: string[];
  years_experience: number;
  property_specialties: string[];
  max_property_value_limit?: number;
  professional_headshot_url?: string;
  heygen_avatar_id?: string;
  linkedin_profile_url?: string;
  rating?: number;
  total_reviews?: number;
  commission_rate?: number;
  is_active: boolean;
  photo_url?: string;
  created_at: string;
  valify_verification_id?: string;
  valify_status?: string;
  valify_score?: number;
  valify_completed_at?: string;
  profile_headline?: string;
  profile_summary?: string;
  service_areas?: string[];
}

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  property_type: string;
  status: string;
  description?: string;
  photos?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    order_index: number;
  }>;
}

interface Assignment {
  id: string;
  property_id: string;
  appraiser_id: string;
  is_primary: boolean;
  brokers: {
    full_name: string;
    email: string;
    phone: string;
    appraiser_license_number?: string;
    appraiser_certification_authority?: string;
  };
  properties: {
    title: string;
    address: string;
    photos?: Array<{
      id: string;
      url: string;
      is_primary: boolean;
      order_index: number;
    }>;
  };
}

interface NewAppraiserData {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  appraiser_license_number?: string;
  appraiser_certification_authority?: string;
  bio?: string;
  specialties: string[];
  languages: string[];
  years_experience: number;
  property_specialties: string[];
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

export default function AdminAppraisersPage() {
  const [appraisers, setAppraisers] = useState<Appraiser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAppraiser, setEditingAppraiser] = useState<Appraiser | null>(null);
  const [newAppraiserData, setNewAppraiserData] = useState<NewAppraiserData>({
    user_id: '',
    full_name: '',
    email: '',
    phone: '',
    appraiser_license_number: '',
    appraiser_certification_authority: 'Egyptian General Authority for Urban Planning & Housing',
    bio: '',
    specialties: [],
    languages: [],
    years_experience: 0,
    property_specialties: [],
    max_property_value_limit: undefined,
    professional_headshot_url: '',
    profile_headline: '',
    profile_summary: ''
  });

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [currentEditingAppraiser, setCurrentEditingAppraiser] = useState<string>('');
  const [formData, setFormData] = useState({
    property_id: '',
    appraiser_id: '',
    is_primary: false
  });

  // Interactive assignment state
  const [selectedAppraiser, setSelectedAppraiser] = useState<Appraiser | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showAssignmentConfirm, setShowAssignmentConfirm] = useState(false);
  
  // Image generation state
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');

  useEffect(() => {
    loadData();
    loadAssignments();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAppraisers(),
        loadUsers(),
        loadProperties()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load appraisers data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAppraisers = async () => {
    try {
      // First, get user IDs with appraiser role
      const { data: appraiserRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'appraiser')
        .eq('is_active', true);

      if (rolesError) {
        console.error('Error loading appraiser roles:', rolesError);
        setAppraisers([]);
        return;
      }

      if (!appraiserRoles || appraiserRoles.length === 0) {
        setAppraisers([]);
        return;
      }

      // Get broker data for users with appraiser roles
      const appraiserUserIds = appraiserRoles.map((role: any) => role.user_id).filter((id: any) => id);
      
      if (appraiserUserIds.length === 0) {
        setAppraisers([]);
        return;
      }

      const { data: appraisersData, error } = await supabase
        .from('brokers')
        .select('*')
        .in('user_id', appraiserUserIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading appraisers:', error);
        setAppraisers([]);
        return;
      }

      // Transform data to match Appraiser interface
      const transformedAppraisers = appraisersData?.map((appraiser: any) => ({
        ...appraiser,
        specialties: appraiser.specialties || [],
        languages: appraiser.languages || [],
        property_specialties: appraiser.property_specialties || []
      })) || [];

      setAppraisers(transformedAppraisers);
    } catch (error) {
      console.error('Error in loadAppraisers:', error);
      setAppraisers([]);
    }
  };

  const loadUsers = async () => {
    try {
      // Try RPC function first
      const { data: rpcUsers, error: rpcError } = await supabase
        .rpc('get_all_users_for_admin');

      if (!rpcError && rpcUsers && rpcUsers.length > 0) {
        const transformedUsers = rpcUsers.map((user: any) => ({
          id: user.id,
          email: user.email || '',
          user_metadata: { full_name: user.full_name },
          created_at: user.created_at,
          user_roles: user.user_roles || []
        }));
        setUsers(transformedUsers);
        return;
      }

      // Try simple RPC function
      const { data: simpleUsers, error: simpleError } = await supabase
        .rpc('get_users_simple');

      if (!simpleError && simpleUsers && simpleUsers.length > 0) {
        const transformedUsers = simpleUsers.map((user: any) => ({
          id: user.user_id,
          email: user.user_email || '',
          user_metadata: { full_name: user.user_name },
          created_at: user.user_created,
          user_roles: []
        }));
        setUsers(transformedUsers);
        return;
      }

      // Fallback: create test user
      const testUser = {
        id: 'test-appraiser-123',
        email: 'test.appraiser@example.com',
        user_metadata: { full_name: 'Test Appraiser User' },
        created_at: new Date().toISOString(),
        user_roles: []
      };
      setUsers([testUser]);
    } catch (error) {
      console.error('Error in loadUsers:', error);
      const fallbackUser = {
        id: 'fallback-appraiser-456',
        email: 'fallback.appraiser@example.com',
        user_metadata: { full_name: 'Fallback Test User' },
        created_at: new Date().toISOString(),
        user_roles: []
      };
      setUsers([fallbackUser]);
    }
  };

  const loadProperties = async () => {
    try {
      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select(`
          id, 
          title, 
          address, 
          price, 
          property_type, 
          status,
          description,
          property_photos (
            id,
            url,
            is_primary,
            order_index
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading properties:', error);
        setProperties([]);
        return;
      }
      
      const transformedProperties = propertiesData?.map((property: any) => ({
        ...property,
        photos: property.property_photos || []
      })) || [];
      
      setProperties(transformedProperties);
    } catch (error) {
      console.error('Error in loadProperties:', error);
      setProperties([]);
    }
  };

  const assignAppraiserRole = async (userId: string) => {
    try {
      const response = await fetch('/api/user_roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          role: 'appraiser'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign appraiser role');
      }

      toast({
        title: "Success",
        description: "Appraiser role assigned successfully."
      });

      loadData();
    } catch (error) {
      console.error('Error assigning appraiser role:', error);
      toast({
        title: "Error",
        description: "Failed to assign appraiser role.",
        variant: "destructive"
      });
    }
  };

  const createAppraiser = async (): Promise<{ id: string } | null> => {
    try {
      // Step 1: Create broker record first (this works)
      const response = await fetch('/api/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: newAppraiserData.user_id,
          full_name: newAppraiserData.full_name,
          email: newAppraiserData.email,
          phone: newAppraiserData.phone,
          license_number: newAppraiserData.appraiser_license_number,
          bio: newAppraiserData.bio,
          specialties: newAppraiserData.specialties,
          languages: newAppraiserData.languages,
          years_experience: newAppraiserData.years_experience,
          commission_rate: 3.0
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create broker record');
      }

      // Step 2: Update broker record with appraiser-specific fields
      const updateResponse = await fetch(`/api/brokers/${result.broker.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appraiser_license_number: newAppraiserData.appraiser_license_number,
          appraiser_certification_authority: newAppraiserData.appraiser_certification_authority,
          property_specialties: newAppraiserData.property_specialties,
          max_property_value_limit: newAppraiserData.max_property_value_limit
        })
      });

      if (!updateResponse.ok) {
        console.error('Failed to update appraiser fields, but broker created');
      }

      // Step 3: Add appraiser role (using fixed service role)
      const roleResponse = await fetch('/api/user_roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: newAppraiserData.user_id,
          role: 'appraiser'
        })
      });

      if (!roleResponse.ok) {
        console.error('Failed to assign appraiser role, but broker created');
      }

      toast({
        title: "Success",
        description: "Appraiser created successfully."
      });

      setShowCreateModal(false);
      setNewAppraiserData({
        user_id: '',
        full_name: '',
        email: '',
        phone: '',
        appraiser_license_number: '',
        appraiser_certification_authority: 'Egyptian General Authority for Urban Planning & Housing',
        bio: '',
        specialties: [],
        languages: [],
        years_experience: 0,
        property_specialties: [],
        max_property_value_limit: undefined,
        professional_headshot_url: '',
        profile_headline: '',
        profile_summary: '',
        service_areas: []
      });

      loadData();
      
      // Return the broker ID so camera can use real ID instead of "new"
      return { id: result.broker.id };
    } catch (error) {
      console.error('Error creating appraiser:', error);
      toast({
        title: "Error",
        description: "Failed to create appraiser.",
        variant: "destructive"
      });
      return null;
    }
  };

  const generateProfileImage = async () => {
    if (!imagePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description for the profile image.",
        variant: "destructive"
      });
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
        setNewAppraiserData(prev => ({
          ...prev,
          professional_headshot_url: result.data.imageUrl
        }));
        toast({
          title: "Success",
          description: "Professional headshot generated successfully!",
          variant: "default"
        });
        setImagePrompt('');
      } else {
        toast({
          title: "Error",
          description: "Failed to generate image: " + (result.error || 'Unknown error'),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate profile image.",
        variant: "destructive"
      });
    } finally {
      setImageGenerating(false);
    }
  };

  const handleCameraPhotoUpdate = (photoUrl: string, metadata: any) => {
    setNewAppraiserData(prev => ({
      ...prev,
      professional_headshot_url: photoUrl
    }));
    toast({
      title: "Success",
      description: "Professional headshot captured and applied!",
      variant: "default"
    });
    setShowCameraCapture(false);
  };

  const openCameraForAppraiser = async (appraiserId?: string) => {
    if (appraiserId) {
      // Existing appraiser - open camera directly
      setCurrentEditingAppraiser(appraiserId);
      setShowCameraCapture(true);
    } else {
      // New appraiser - need to create the record first
      if (!newAppraiserData.full_name || !newAppraiserData.email) {
        toast({
          title: "Missing Information",
          description: "Please fill in the appraiser's name and email before taking a photo.",
          variant: "destructive"
        });
        return;
      }

      try {
        toast({
          title: "Creating Appraiser Record",
          description: "Setting up the profile before photo capture..."
        });

        // Create the appraiser record first
        const tempAppraiser = await createAppraiser();
        if (tempAppraiser?.id) {
          setCurrentEditingAppraiser(tempAppraiser.id);
          setShowCameraCapture(true);
          setShowCreateModal(false); // Close the new appraiser modal
        }
      } catch (error) {
        console.error('Failed to create appraiser before photo capture:', error);
        toast({
          title: "Error",
          description: "Failed to create appraiser record. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const bypassValifyVerification = async (appraiserId: string) => {
    try {
      const { error } = await supabase
        .from('brokers')
        .update({
          valify_status: 'verified',
          valify_completed_at: new Date().toISOString(),
          valify_score: 100,
          public_profile_active: true
        })
        .eq('id', appraiserId);

      if (error) {
        console.error('Error bypassing Valify verification:', error);
        toast({
          title: "Error",
          description: "Failed to bypass Valify verification.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Appraiser manually verified and can now appear on public listings.",
        variant: "default"
      });

      // Reload appraisers to show updated status
      await loadAppraisers();
    } catch (error) {
      console.error('Error in bypassValifyVerification:', error);
      toast({
        title: "Error",
        description: "Failed to bypass verification.",
        variant: "destructive"
      });
    }
  };

  const updateAppraiserStatus = async (appraiserId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/brokers/${appraiserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: isActive
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update appraiser status');
      }

      toast({
        title: "Success",
        description: `Appraiser ${isActive ? 'activated' : 'deactivated'} successfully.`
      });

      loadData();
    } catch (error) {
      console.error('Error updating appraiser status:', error);
      toast({
        title: "Error",
        description: "Failed to update appraiser status.",
        variant: "destructive"
      });
    }
  };

  const editAppraiser = async () => {
    if (!editingAppraiser) return;

    try {
      const response = await fetch(`/api/brokers/${editingAppraiser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newAppraiserData.full_name,
          email: newAppraiserData.email,
          phone: newAppraiserData.phone,
          license_number: newAppraiserData.appraiser_license_number,
          appraiser_license_number: newAppraiserData.appraiser_license_number,
          appraiser_certification_authority: newAppraiserData.appraiser_certification_authority,
          bio: newAppraiserData.bio,
          specialties: newAppraiserData.specialties,
          languages: newAppraiserData.languages,
          years_experience: newAppraiserData.years_experience,
          property_specialties: newAppraiserData.property_specialties,
          max_property_value_limit: newAppraiserData.max_property_value_limit,
          professional_headshot_url: newAppraiserData.professional_headshot_url,
          profile_headline: newAppraiserData.profile_headline,
          profile_summary: newAppraiserData.profile_summary,
          service_areas: newAppraiserData.service_areas,
          average_rating: newAppraiserData.average_rating,
          total_reviews: newAppraiserData.total_reviews,
          response_time_hours: newAppraiserData.response_time_hours,
          certifications: newAppraiserData.certifications,
          pricing_info: newAppraiserData.pricing_info
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update appraiser');
      }

      toast({
        title: "Success",
        description: "Appraiser updated successfully."
      });

      setEditingAppraiser(null);
      setNewAppraiserData({
        user_id: '',
        full_name: '',
        email: '',
        phone: '',
        appraiser_license_number: '',
        appraiser_certification_authority: 'Egyptian General Authority for Urban Planning & Housing',
        bio: '',
        specialties: [],
        languages: [],
        years_experience: 0,
        property_specialties: [],
        max_property_value_limit: undefined,
        professional_headshot_url: '',
        profile_headline: '',
        profile_summary: '',
        service_areas: []
      });

      loadData();
    } catch (error) {
      console.error('Error updating appraiser:', error);
      toast({
        title: "Error",
        description: "Failed to update appraiser.",
        variant: "destructive"
      });
    }
  };

  const handleEditAppraiser = (appraiser: Appraiser) => {
    setEditingAppraiser(appraiser);
    setNewAppraiserData({
      user_id: appraiser.user_id || '',
      full_name: appraiser.full_name || '',
      email: appraiser.email || '',
      phone: appraiser.phone || '',
      appraiser_license_number: appraiser.appraiser_license_number || appraiser.license_number || '',
      appraiser_certification_authority: appraiser.appraiser_certification_authority || 'Egyptian General Authority for Urban Planning & Housing',
      bio: appraiser.bio || '',
      specialties: appraiser.specialties || [],
      languages: appraiser.languages || [],
      years_experience: appraiser.years_experience || 0,
      property_specialties: appraiser.property_specialties || [],
      max_property_value_limit: appraiser.max_property_value_limit,
      professional_headshot_url: appraiser.professional_headshot_url || '',
      profile_headline: appraiser.profile_headline || '',
      profile_summary: appraiser.profile_summary || appraiser.bio || '',
      service_areas: appraiser.service_areas || [],
      average_rating: (appraiser as any).average_rating || 0,
      total_reviews: (appraiser as any).total_reviews || 0,
      response_time_hours: (appraiser as any).response_time_hours || 24,
      certifications: (appraiser as any).certifications || [],
      pricing_info: (appraiser as any).pricing_info || null
    });
  };

  const availableUsers = users.filter(user => 
    !user.user_roles?.some(role => role.role === 'appraiser' && role.is_active) &&
    !appraisers.some(appraiser => appraiser.user_id === user.id)
  );

  const loadAssignments = async () => {
    try {
      // Load property appraisals with manual join to brokers table
      const { data: assignmentsData, error } = await supabase
        .from('property_appraisals')
        .select(`
          id,
          property_id,
          appraiser_id,
          properties:property_id (
            title,
            address,
            property_photos (
              id,
              url,
              is_primary,
              order_index
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading assignments:', error);
        setAssignments([]);
        return;
      }

      // Manually fetch broker info for each assignment
      const assignmentsWithBrokers = [];
      for (const assignment of assignmentsData || []) {
        const { data: brokerData } = await supabase
          .from('brokers')
          .select('full_name, email, phone, appraiser_license_number, appraiser_certification_authority')
          .eq('id', assignment.appraiser_id)
          .single();

        assignmentsWithBrokers.push({
          ...assignment,
          brokers: brokerData
        });
      }

      const transformedAssignments = assignmentsWithBrokers.map((assignment: any) => ({
        ...assignment,
        is_primary: true, // All appraisals are considered primary
        properties: {
          ...assignment.properties,
          photos: assignment.properties?.property_photos || []
        }
      }));

      setAssignments(transformedAssignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
    }
  };

  const assignAppraiser = async () => {
    if (!formData.property_id || !formData.appraiser_id) {
      toast({
        title: "Error",
        description: "Please fill in both Property ID and Appraiser ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create an appraisal record instead of assignment
      const response = await fetch('/api/appraisals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: formData.property_id,
          appraiser_id: formData.appraiser_id,
          client_name: 'Admin Assignment',
          status: 'draft'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Appraiser assigned successfully!"
        });
        setFormData({ property_id: '', appraiser_id: '', is_primary: false });
        loadAssignments();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to assign appraiser",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning appraiser:', error);
      toast({
        title: "Error",
        description: "Failed to assign appraiser.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Interactive assignment functions
  const handleAppraiserSelect = (appraiser: Appraiser) => {
    setSelectedAppraiser(appraiser);
    if (selectedProperty) {
      setShowAssignmentConfirm(true);
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    if (selectedAppraiser) {
      setShowAssignmentConfirm(true);
    }
  };

  const confirmAssignment = async (isPrimary: boolean = true) => {
    if (!selectedAppraiser || !selectedProperty) return;

    setLoading(true);
    try {
      const response = await fetch('/api/appraisals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: selectedProperty.id,
          appraiser_id: selectedAppraiser.id,
          client_name: 'Admin Assignment',
          status: 'draft'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `${selectedAppraiser.full_name} assigned to ${selectedProperty.title}!`
        });
        setSelectedAppraiser(null);
        setSelectedProperty(null);
        setShowAssignmentConfirm(false);
        loadAssignments();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to assign appraiser",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning appraiser:', error);
      toast({
        title: "Error",
        description: "Failed to assign appraiser.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedAppraiser(null);
    setSelectedProperty(null);
    setShowAssignmentConfirm(false);
  };

  const filteredAssignments = assignments.filter((assignment) =>
    assignment.properties?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.brokers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.property_id.includes(searchTerm) ||
    assignment.appraiser_id.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appraiser Management</h1>
            <p className="text-gray-600">Manage certified property appraisers and assignments</p>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Appraiser
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Appraiser</DialogTitle>
                <DialogDescription>
                  Create a certified property appraiser account with professional credentials.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="user_select">Select User</Label>
                  <Select
                    value={newAppraiserData.user_id}
                    onValueChange={(value) => {
                      const selectedUser = availableUsers.find(u => u.id === value);
                      setNewAppraiserData(prev => ({
                        ...prev,
                        user_id: value,
                        full_name: selectedUser?.user_metadata?.full_name || '',
                        email: selectedUser?.email || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user to make appraiser" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.length === 0 ? (
                        <SelectItem value="none" disabled>No available users found</SelectItem>
                      ) : (
                        availableUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.user_metadata?.full_name || user.email} ({user.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newAppraiserData.full_name}
                      onChange={(e) => setNewAppraiserData(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAppraiserData.email}
                      onChange={(e) => setNewAppraiserData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newAppraiserData.phone}
                      onChange={(e) => setNewAppraiserData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="appraiser_license_number">Appraiser License Number</Label>
                    <Input
                      id="appraiser_license_number"
                      value={newAppraiserData.appraiser_license_number}
                      onChange={(e) => setNewAppraiserData(prev => ({ ...prev, appraiser_license_number: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="appraiser_certification_authority">Certification Authority</Label>
                  <Input
                    id="appraiser_certification_authority"
                    value={newAppraiserData.appraiser_certification_authority}
                    onChange={(e) => setNewAppraiserData(prev => ({ ...prev, appraiser_certification_authority: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="years_experience">Years of Experience</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      min="0"
                      value={newAppraiserData.years_experience}
                      onChange={(e) => setNewAppraiserData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_property_value_limit">Max Property Value Limit (EGP)</Label>
                    <Input
                      id="max_property_value_limit"
                      type="number"
                      min="0"
                      value={newAppraiserData.max_property_value_limit || ''}
                      onChange={(e) => setNewAppraiserData(prev => ({ ...prev, max_property_value_limit: parseInt(e.target.value) || undefined }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="property_specialties">Property Specialties (comma-separated)</Label>
                  <Input
                    id="property_specialties"
                    placeholder="residential, commercial, villa, apartment"
                    value={newAppraiserData.property_specialties.join(', ')}
                    onChange={(e) => setNewAppraiserData(prev => ({ 
                      ...prev, 
                      property_specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="specialties">General Specialties (comma-separated)</Label>
                  <Input
                    id="specialties"
                    placeholder="valuation, market_analysis, legal_compliance"
                    value={newAppraiserData.specialties.join(', ')}
                    onChange={(e) => setNewAppraiserData(prev => ({ 
                      ...prev, 
                      specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="languages">Languages (comma-separated)</Label>
                  <Input
                    id="languages"
                    placeholder="arabic, english, french"
                    value={newAppraiserData.languages.join(', ')}
                    onChange={(e) => setNewAppraiserData(prev => ({ 
                      ...prev, 
                      languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={newAppraiserData.bio}
                    onChange={(e) => setNewAppraiserData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={createAppraiser} 
                    className="flex-1"
                    disabled={!newAppraiserData.user_id || !newAppraiserData.full_name || !newAppraiserData.email}
                  >
                    Create Appraiser
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Appraiser Modal */}
        <Dialog open={!!editingAppraiser} onOpenChange={(open) => !open && setEditingAppraiser(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Appraiser Details</DialogTitle>
              <DialogDescription>
                Update {editingAppraiser?.full_name}'s professional information and credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_full_name">Full Name</Label>
                  <Input
                    id="edit_full_name"
                    value={newAppraiserData.full_name}
                    onChange={(e) => setNewAppraiserData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={newAppraiserData.email}
                    onChange={(e) => setNewAppraiserData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_phone">Phone</Label>
                  <Input
                    id="edit_phone"
                    value={newAppraiserData.phone}
                    onChange={(e) => setNewAppraiserData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_appraiser_license_number">Appraiser License</Label>
                  <Input
                    id="edit_appraiser_license_number"
                    value={newAppraiserData.appraiser_license_number}
                    onChange={(e) => setNewAppraiserData(prev => ({ ...prev, appraiser_license_number: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_years_experience">Years of Experience</Label>
                <Input
                  id="edit_years_experience"
                  type="number"
                  min="0"
                  value={newAppraiserData.years_experience}
                  onChange={(e) => setNewAppraiserData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="edit_property_specialties">Property Specialties</Label>
                <Input
                  id="edit_property_specialties"
                  placeholder="residential, commercial, villa, apartment"
                  value={newAppraiserData.property_specialties.join(', ')}
                  onChange={(e) => setNewAppraiserData(prev => ({ 
                    ...prev, 
                    property_specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="edit_bio">Bio</Label>
                <Textarea
                  id="edit_bio"
                  rows={3}
                  value={newAppraiserData.bio}
                  onChange={(e) => setNewAppraiserData(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit_profile_headline">Profile Headline</Label>
                <Input
                  id="edit_profile_headline"
                  placeholder="e.g., Certified Property Appraiser specializing in Residential Properties"
                  value={newAppraiserData.profile_headline}
                  onChange={(e) => setNewAppraiserData(prev => ({ ...prev, profile_headline: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit_service_areas">Service Areas (comma-separated)</Label>
                <Input
                  id="edit_service_areas"
                  placeholder="Cairo, Giza, Alexandria"
                  value={newAppraiserData.service_areas?.join(', ') || ''}
                  onChange={(e) => setNewAppraiserData(prev => ({ 
                    ...prev, 
                    service_areas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_average_rating">Average Rating (0-5)</Label>
                  <Input
                    id="edit_average_rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={newAppraiserData.average_rating || ''}
                    onChange={(e) => setNewAppraiserData(prev => ({ ...prev, average_rating: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_total_reviews">Total Reviews</Label>
                  <Input
                    id="edit_total_reviews"
                    type="number"
                    min="0"
                    value={newAppraiserData.total_reviews || ''}
                    onChange={(e) => setNewAppraiserData(prev => ({ ...prev, total_reviews: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_response_time_hours">Response Time (hours)</Label>
                <Input
                  id="edit_response_time_hours"
                  type="number"
                  min="1"
                  value={newAppraiserData.response_time_hours || ''}
                  onChange={(e) => setNewAppraiserData(prev => ({ ...prev, response_time_hours: parseInt(e.target.value) || 24 }))}
                />
              </div>

              <div>
                <Label className="text-base font-medium">Professional Certifications</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { name: 'FRA Licensed', authority: 'Financial Regulatory Authority' },
                    { name: 'RICS Certified', authority: 'Royal Institution of Chartered Surveyors' },
                    { name: 'CRE Designation', authority: 'Counselors of Real Estate' },
                    { name: 'ASA Certified', authority: 'American Society of Appraisers' },
                    { name: 'IFVS Member', authority: 'International Federation of Valuers Societies' },
                    { name: 'TEGOVA Certified', authority: 'The European Group of Valuers Associations' }
                  ].map((cert) => {
                    const isSelected = newAppraiserData.certifications?.some(c => c.name === cert.name) || false;
                    return (
                      <label key={cert.name} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentCerts = newAppraiserData.certifications || [];
                            if (e.target.checked) {
                              setNewAppraiserData(prev => ({
                                ...prev,
                                certifications: [...currentCerts, { ...cert, verified: true }]
                              }));
                            } else {
                              setNewAppraiserData(prev => ({
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

              <div>
                <Label className="text-base font-medium">Pricing Information</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="base_fee">Base Fee (EGP)</Label>
                    <Input
                      id="base_fee"
                      type="number"
                      min="0"
                      placeholder="2500"
                      value={newAppraiserData.pricing_info?.base_fee || ''}
                      onChange={(e) => {
                        const currentPricing = newAppraiserData.pricing_info || {};
                        setNewAppraiserData(prev => ({
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
                    <Label htmlFor="rush_fee">Rush Fee (EGP)</Label>
                    <Input
                      id="rush_fee"
                      type="number"
                      min="0"
                      placeholder="4000"
                      value={newAppraiserData.pricing_info?.rush_fee || ''}
                      onChange={(e) => {
                        const currentPricing = newAppraiserData.pricing_info || {};
                        setNewAppraiserData(prev => ({
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
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={newAppraiserData.pricing_info?.currency || 'EGP'}
                      onValueChange={(value) => {
                        const currentPricing = newAppraiserData.pricing_info || {};
                        setNewAppraiserData(prev => ({
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

              {/* Professional Headshot Section */}
              <div className="border rounded-lg p-4">
                <Label className="text-base font-medium">Professional Headshot</Label>
                <div className="flex items-start gap-4 mt-3">
                  <div className="flex flex-col items-center gap-3">
                    <div 
                      className="w-24 h-24 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => openCameraForAppraiser(editingAppraiser?.id)}
                      title="Click to take professional photo with camera"
                    >
                      {newAppraiserData.professional_headshot_url ? (
                        <img 
                          src={newAppraiserData.professional_headshot_url} 
                          alt="Profile headshot"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <Camera className="w-6 h-6" />
                          <span className="text-xs mt-1">Take Photo</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openCameraForAppraiser(editingAppraiser?.id)}
                        className="flex items-center gap-2"
                      >
                        <Camera className="w-3 h-3" />
                        AI Camera
                      </Button>
                      {newAppraiserData.professional_headshot_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setNewAppraiserData(prev => ({ ...prev, professional_headshot_url: '' }))}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor="image_prompt">Generate with AI</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="image_prompt"
                          placeholder="e.g., Professional Egyptian appraiser, confident, business attire"
                          value={imagePrompt}
                          onChange={(e) => setImagePrompt(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={generateProfileImage} 
                          disabled={imageGenerating || !imagePrompt.trim()}
                          size="sm"
                        >
                          {imageGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="image_url">Or paste image URL</Label>
                      <Input
                        id="image_url"
                        placeholder="https://example.com/image.jpg"
                        value={newAppraiserData.professional_headshot_url}
                        onChange={(e) => setNewAppraiserData(prev => ({ ...prev, professional_headshot_url: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setEditingAppraiser(null)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={editAppraiser} 
                  className="flex-1"
                  disabled={!newAppraiserData.full_name || !newAppraiserData.email}
                >
                  Update Appraiser
                </Button>
              </div>

              {editingAppraiser && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">Quick Actions</h3>
                      <p className="text-sm text-gray-600">Additional appraiser management options</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const appraiserId = editingAppraiser?.id;
                          if (appraiserId) {
                            // Use broker availability route (working) for now
                            window.open(`/broker/${appraiserId}/availability`, '_blank');
                          }
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Manage Availability
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const appraiserId = editingAppraiser?.id;
                          if (appraiserId) {
                            // Keep appraiser dashboard route
                            window.open(`/appraiser/${appraiserId}/dashboard`, '_blank');
                          }
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Appraisers</p>
                  <p className="text-2xl font-bold text-gray-900">{appraisers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Appraisers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appraisers.filter(a => a.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Users</p>
                  <p className="text-2xl font-bold text-gray-900">{availableUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appraisers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Certified Appraisers</span>
              {selectedAppraiser && (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  <User className="w-3 h-3 mr-1" />
                  Selected: {selectedAppraiser.full_name}
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Click on an appraiser to select them for property assignment
            </p>
          </CardHeader>
          <CardContent>
            {appraisers.length === 0 ? (
              <div className="text-center py-8">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No appraisers found.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Create certified property appraisers to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appraisers.map((appraiser) => (
                  <div 
                    key={appraiser.id} 
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      selectedAppraiser?.id === appraiser.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'hover:bg-gray-50 hover:shadow-sm'
                    } ${!appraiser.is_active ? 'opacity-60' : ''}`}
                    onClick={() => appraiser.is_active && handleAppraiserSelect(appraiser)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative">
                          {appraiser.professional_headshot_url || appraiser.photo_url ? (
                            <img 
                              src={appraiser.professional_headshot_url || appraiser.photo_url} 
                              alt={appraiser.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Calculator className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          {selectedAppraiser?.id === appraiser.id && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{appraiser.full_name}</h3>
                            <Badge variant={appraiser.is_active ? "default" : "secondary"}>
                              {appraiser.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge 
                              variant={
                                appraiser.valify_status === 'verified' ? 'default' :
                                appraiser.valify_status === 'failed' ? 'destructive' :
                                appraiser.valify_status === 'in_progress' ? 'secondary' :
                                'outline'
                              }
                              className={
                                appraiser.valify_status === 'verified' ? 'bg-green-100 text-green-800 border-green-300' :
                                appraiser.valify_status === 'failed' ? 'bg-red-100 text-red-800 border-red-300' :
                                appraiser.valify_status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                'bg-gray-100 text-gray-600 border-gray-300'
                              }
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              Valify: {appraiser.valify_status || 'Pending'}
                              {appraiser.valify_score && ` (${appraiser.valify_score}%)`}
                            </Badge>
                            {selectedAppraiser?.id === appraiser.id && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                <MousePointer className="w-3 h-3 mr-1" />
                                Selected
                              </Badge>
                            )}
                            {appraiser.appraiser_license_number && (
                              <Badge variant="outline" className="text-xs">
                                <BadgeIcon className="w-3 h-3 mr-1" />
                                {appraiser.appraiser_license_number}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              {appraiser.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              {appraiser.phone || 'No phone'}
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-2" />
                              {appraiser.rating ? appraiser.rating.toFixed(1) : '0.0'} ({appraiser.total_reviews || 0} reviews)
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p><strong>Experience:</strong> {appraiser.years_experience || 0}+ years</p>
                            <p><strong>Property Types:</strong> {appraiser.property_specialties?.join(', ') || 'All types'}</p>
                            <p><strong>Max Value Limit:</strong> {appraiser.max_property_value_limit ? `${appraiser.max_property_value_limit.toLocaleString()} EGP` : 'No limit'}</p>
                            <p><strong>Authority:</strong> {appraiser.appraiser_certification_authority || 'Standard'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAppraiserStatus(appraiser.id, !appraiser.is_active);
                          }}
                        >
                          {appraiser.is_active ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAppraiser(appraiser);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        {appraiser.valify_status !== 'verified' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              bypassValifyVerification(appraiser.id);
                            }}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Verify Manually
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Properties List for Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Available Properties</span>
              {selectedProperty && (
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                  <Building2 className="w-3 h-3 mr-1" />
                  Selected: {selectedProperty.title}
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Click on a property to select it for appraiser assignment
            </p>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No properties found.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Create some properties first to assign appraisers
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => {
                  const primaryPhoto = property.photos?.find(photo => photo.is_primary) || property.photos?.[0];
                  
                  return (
                    <div
                      key={property.id}
                      className={`border rounded-lg overflow-hidden transition-all cursor-pointer ${
                        selectedProperty?.id === property.id
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'hover:bg-gray-50 hover:shadow-sm'
                      }`}
                      onClick={() => handlePropertySelect(property)}
                    >
                      <div className="relative h-48 bg-gray-200 overflow-hidden">
                        {primaryPhoto ? (
                          <img 
                            src={primaryPhoto.url} 
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        
                        {selectedProperty?.id === property.id && (
                          <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                            <div className="bg-white rounded-full p-2">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1 truncate">{property.title}</h3>
                            <p className="text-sm text-gray-600 mb-2 truncate">{property.address}</p>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {property.property_type}
                              </Badge>
                              <Badge variant={property.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {property.status}
                              </Badge>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              {property.price.toLocaleString()} EGP
                            </p>
                          </div>
                          
                          {selectedProperty?.id === property.id && (
                            <div className="flex flex-col items-center ml-2">
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                                Selected
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interactive Assignment Status */}
        {(selectedAppraiser || selectedProperty) && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-blue-800">
                <div className="flex items-center">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Assignment Selection
                </div>
                <Button variant="outline" size="sm" onClick={clearSelection} className="text-blue-600 border-blue-300 hover:bg-blue-100">
                  Clear Selection
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-blue-700">Selected Appraiser:</Label>
                  {selectedAppraiser ? (
                    <div className="p-3 bg-white rounded border border-blue-200">
                      <p className="font-medium">{selectedAppraiser.full_name}</p>
                      <p className="text-sm text-gray-600">{selectedAppraiser.email}</p>
                      <p className="text-xs text-gray-400">License: {selectedAppraiser.appraiser_license_number || 'N/A'}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded border border-dashed border-blue-300 text-center text-blue-600">
                      Click on an appraiser above to select
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-700">Selected Property:</Label>
                  {selectedProperty ? (
                    <div className="p-3 bg-white rounded border border-blue-200">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                          {(() => {
                            const primaryPhoto = selectedProperty.photos?.find(photo => photo.is_primary) || selectedProperty.photos?.[0];
                            return primaryPhoto ? (
                              <img 
                                src={primaryPhoto.url} 
                                alt={selectedProperty.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-gray-400" />
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{selectedProperty.title}</p>
                          <p className="text-sm text-gray-600 truncate">{selectedProperty.address}</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedProperty.price.toLocaleString()} EGP</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded border border-dashed border-blue-300 text-center text-blue-600">
                      Click on a property above to select
                    </div>
                  )}
                </div>
              </div>
              
              {selectedAppraiser && selectedProperty && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <Button 
                    onClick={() => confirmAssignment(true)} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Assigning...' : 'Assign for Property Appraisal'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Manual Assignment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Manual Assignment (Alternative Method)</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              You can also assign appraisers manually by entering IDs directly
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property_id">Property ID</Label>
                <Input
                  id="property_id"
                  value={formData.property_id}
                  onChange={(e) => setFormData({...formData, property_id: e.target.value})}
                  placeholder="Enter property ID"
                />
              </div>

              <div>
                <Label htmlFor="appraiser_id">Appraiser ID</Label>
                <Input
                  id="appraiser_id"
                  value={formData.appraiser_id}
                  onChange={(e) => setFormData({...formData, appraiser_id: e.target.value})}
                  placeholder="Enter appraiser ID"
                />
              </div>
            </div>

            <Button onClick={assignAppraiser} disabled={loading} className="w-full md:w-auto">
              {loading ? 'Assigning...' : 'Assign Appraiser'}
            </Button>
          </CardContent>
        </Card>

        {/* Current Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Current Appraiser Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by property, appraiser, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No appraiser assignments found</p>
                {searchTerm && (
                  <p className="text-sm mt-1">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                  const primaryPhoto = assignment.properties?.photos?.find(photo => photo.is_primary) || assignment.properties?.photos?.[0];
                  
                  return (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <h3 className="font-semibold text-gray-900">Property</h3>
                          </div>
                          
                          <div className="flex gap-3">
                            <div className="w-16 h-16 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                              {primaryPhoto ? (
                                <img 
                                  src={primaryPhoto.url} 
                                  alt={assignment.properties?.title || 'Property'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Building2 className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{assignment.properties?.title || 'Unknown Property'}</p>
                              <p className="text-sm text-gray-600">{assignment.properties?.address}</p>
                              <p className="text-xs text-gray-400 mt-1">ID: {assignment.property_id}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Calculator className="w-4 h-4 text-gray-400" />
                            <h3 className="font-semibold text-gray-900">Appraiser</h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Assigned
                            </span>
                          </div>
                          <p className="font-medium">{assignment.brokers?.full_name || 'Unknown Appraiser'}</p>
                          <p className="text-sm text-gray-600">{assignment.brokers?.email}</p>
                          <p className="text-xs text-gray-500">License: {assignment.brokers?.appraiser_license_number || 'N/A'}</p>
                          <p className="text-xs text-gray-400 mt-1">ID: {assignment.appraiser_id}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* AI Professional Photo Capture Modal */}
      <ProfessionalProfilePhotoCapture
        appraiser_id={currentEditingAppraiser}
        isOpen={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onPhotoUpdated={handleCameraPhotoUpdate}
        currentPhotoUrl={newAppraiserData.professional_headshot_url}
      />
    </div>
  );
}