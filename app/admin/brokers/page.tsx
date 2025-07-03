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
  MousePointer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import type { Broker } from '@/types/broker';

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
  broker_id: string;
  is_primary: boolean;
  brokers: {
    full_name: string;
    email: string;
    phone: string;
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

interface NewBrokerData {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  license_number?: string;
  bio?: string;
  specialties: string[];
  languages: string[];
  years_experience: number;
}

export default function AdminBrokersPage() {
  // Using shared Supabase client
  
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [newBrokerData, setNewBrokerData] = useState<NewBrokerData>({
    user_id: '',
    full_name: '',
    email: '',
    phone: '',
    license_number: '',
    bio: '',
    specialties: [],
    languages: [],
    years_experience: 0
  });

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    property_id: '',
    broker_id: '',
    is_primary: false
  });

  // New state for interactive assignment
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showAssignmentConfirm, setShowAssignmentConfirm] = useState(false);

  useEffect(() => {
    loadData();
    loadAssignments();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all brokers
      await loadBrokers();
      
      // Load all users 
      await loadUsers();
      
      // Load properties
      await loadProperties();

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load brokers data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBrokers = async () => {
    try {
      const response = await fetch('/api/brokers?include_inactive=true');
      
      if (!response.ok) {
        console.error('Error loading brokers:', response.statusText);
        setBrokers([]);
        return;
      }
      
      const data = await response.json();
      setBrokers(data.brokers || []);
    } catch (error) {
      console.error('Error in loadBrokers:', error);
      setBrokers([]);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('🔍 Starting loadUsers...');
      
      // Try RPC function first (most reliable)
      const { data: rpcUsers, error: rpcError } = await supabase
        .rpc('get_all_users_for_admin');

      console.log('📡 RPC result:', { rpcUsers, rpcError });

      if (!rpcError && rpcUsers && rpcUsers.length > 0) {
        const transformedUsers = rpcUsers.map((user: any) => ({
          id: user.id,
          email: user.email || '',
          user_metadata: { full_name: user.full_name },
          created_at: user.created_at,
          user_roles: user.user_roles || []
        }));
        
        console.log('✅ Users loaded via RPC:', transformedUsers);
        setUsers(transformedUsers);
        return;
      }

      console.log('⚠️ Complex RPC failed, trying simple RPC...');
      
      // Try simple RPC function
      const { data: simpleUsers, error: simpleError } = await supabase
        .rpc('get_users_simple');

      console.log('📡 Simple RPC result:', { simpleUsers, simpleError });

      if (!simpleError && simpleUsers && simpleUsers.length > 0) {
        const transformedUsers = simpleUsers.map((user: any) => ({
          id: user.user_id,
          email: user.user_email || '',
          user_metadata: { full_name: user.user_name },
          created_at: user.user_created,
          user_roles: []
        }));
        
        console.log('✅ Users loaded via simple RPC:', transformedUsers);
        setUsers(transformedUsers);
        return;
      }

      console.log('⚠️ RPC functions failed, trying profiles table...');
      
      // Try to load from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          email,
          created_at,
          user_roles (
            role,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      console.log('📋 Profiles result:', { profilesData, profilesError });

      if (profilesError || !profilesData || profilesData.length === 0) {
        console.log('⚠️ Profiles table empty or error, creating test user...');
        
        // Create a test user for development
        const testUser = {
          id: 'test-user-123',
          email: 'test.broker@example.com',
          user_metadata: { full_name: 'Test Broker User' },
          created_at: new Date().toISOString(),
          user_roles: []
        };

        console.log('🔧 Created test user for development:', [testUser]);
        setUsers([testUser]);
        return;
      }
      
      // Transform profiles data to match User interface
      const transformedUsers = profilesData?.map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        user_metadata: { full_name: profile.full_name },
        created_at: profile.created_at,
        user_roles: profile.user_roles || []
      })) || [];

      console.log('✅ Users loaded via profiles:', transformedUsers);
      setUsers(transformedUsers);
    } catch (error) {
      console.error('💥 Error in loadUsers:', error);
      
      // Final fallback: create a test user so we can test the interface
      const fallbackUser = {
        id: 'fallback-user-456',
        email: 'fallback.broker@example.com',
        user_metadata: { full_name: 'Fallback Test User' },
        created_at: new Date().toISOString(),
        user_roles: []
      };
      
      console.log('🆘 Using fallback test user:', [fallbackUser]);
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
      
      // Transform the data to match our interface
      const transformedProperties = propertiesData?.map(property => ({
        ...property,
        photos: property.property_photos || []
      })) || [];
      
      setProperties(transformedProperties);
    } catch (error) {
      console.error('Error in loadProperties:', error);
      setProperties([]);
    }
  };

  const assignBrokerRole = async (userId: string) => {
    try {
      const response = await fetch('/api/user_roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          role: 'broker'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign broker role');
      }

      toast({
        title: "Success",
        description: "Broker role assigned successfully."
      });

      loadData();

    } catch (error) {
      console.error('Error assigning broker role:', error);
      toast({
        title: "Error",
        description: "Failed to assign broker role.",
        variant: "destructive"
      });
    }
  };

  const createBroker = async () => {
    try {
      // Use the new unified broker creation API that handles both broker creation and role assignment
      const response = await fetch('/api/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: newBrokerData.user_id,
          full_name: newBrokerData.full_name,
          email: newBrokerData.email,
          phone: newBrokerData.phone,
          license_number: newBrokerData.license_number,
          bio: newBrokerData.bio,
          specialties: newBrokerData.specialties,
          languages: newBrokerData.languages,
          years_experience: newBrokerData.years_experience,
          commission_rate: 2.5
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create broker');
      }

      toast({
        title: "Success",
        description: "Broker created successfully."
      });

      setShowCreateModal(false);
      setNewBrokerData({
        user_id: '',
        full_name: '',
        email: '',
        phone: '',
        license_number: '',
        bio: '',
        specialties: [],
        languages: [],
        years_experience: 0
      });

      loadData();

    } catch (error) {
      console.error('Error creating broker:', error);
      toast({
        title: "Error",
        description: "Failed to create broker.",
        variant: "destructive"
      });
    }
  };

  const updateBrokerStatus = async (brokerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/brokers/${brokerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: isActive
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update broker status');
      }

      toast({
        title: "Success",
        description: `Broker ${isActive ? 'activated' : 'deactivated'} successfully.`
      });

      loadData();

    } catch (error) {
      console.error('Error updating broker status:', error);
      toast({
        title: "Error",
        description: "Failed to update broker status.",
        variant: "destructive"
      });
    }
  };

  const editBroker = async () => {
    if (!editingBroker) return;

    try {
      const response = await fetch(`/api/brokers/${editingBroker.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newBrokerData.full_name,
          email: newBrokerData.email,
          phone: newBrokerData.phone,
          license_number: newBrokerData.license_number,
          bio: newBrokerData.bio,
          specialties: newBrokerData.specialties,
          languages: newBrokerData.languages,
          years_experience: newBrokerData.years_experience
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update broker');
      }

      toast({
        title: "Success",
        description: "Broker updated successfully."
      });

      setEditingBroker(null);
      setNewBrokerData({
        user_id: '',
        full_name: '',
        email: '',
        phone: '',
        license_number: '',
        bio: '',
        specialties: [],
        languages: [],
        years_experience: 0
      });

      loadData();

    } catch (error) {
      console.error('Error updating broker:', error);
      toast({
        title: "Error",
        description: "Failed to update broker.",
        variant: "destructive"
      });
    }
  };

  const handleEditBroker = (broker: Broker) => {
    setEditingBroker(broker);
    setNewBrokerData({
      user_id: broker.user_id || '',
      full_name: broker.full_name || '',
      email: broker.email || '',
      phone: broker.phone || '',
      license_number: broker.license_number || '',
      bio: broker.bio || '',
      specialties: broker.specialties || [],
      languages: broker.languages || [],
      years_experience: broker.years_experience || 0
    });
  };

  const availableUsers = users.filter(user => 
    !user.user_roles?.some(role => role.role === 'broker' && role.is_active) &&
    !brokers.some(broker => broker.user_id === user.id)
  );

  // Debug logging
  React.useEffect(() => {
    console.log('🏠 Debug Info:');
    console.log('📊 Total users:', users.length);
    console.log('👥 All users:', users);
    console.log('🏢 Total brokers:', brokers.length);
    console.log('🏢 All brokers:', brokers);
    console.log('✅ Available users for broker creation:', availableUsers.length);
    console.log('✅ Available users list:', availableUsers);
  }, [users, brokers, availableUsers]);

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/admin/assign-broker')
      
      if (!response.ok) {
        console.error('Error loading assignments:', response.statusText);
        setAssignments([]);
        return;
      }
      
      const data = await response.json()
      if (data.assignments) {
        // Transform the data to match our interface
        const transformedAssignments = data.assignments.map((assignment: any) => ({
          ...assignment,
          properties: {
            ...assignment.properties,
            photos: assignment.properties?.property_photos || []
          }
        }));
        setAssignments(transformedAssignments);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
      setAssignments([]);
    }
  }

  const assignBroker = async () => {
    if (!formData.property_id || !formData.broker_id) {
      toast({
        title: "Error",
        description: "Please fill in both Property ID and Broker ID",
        variant: "destructive"
      });
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/assign-broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Broker assigned successfully!"
        });
        setFormData({ property_id: '', broker_id: '', is_primary: false })
        loadAssignments()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to assign broker",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning broker:', error)
      toast({
        title: "Error",
        description: "Failed to assign broker.",
        variant: "destructive"
      });
    } finally {
      setLoading(false)
    }
  }

  // New functions for interactive assignment
  const handleBrokerSelect = (broker: Broker) => {
    setSelectedBroker(broker);
    if (selectedProperty) {
      setShowAssignmentConfirm(true);
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    if (selectedBroker) {
      setShowAssignmentConfirm(true);
    }
  };

  const confirmAssignment = async (isPrimary: boolean = false) => {
    if (!selectedBroker || !selectedProperty) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/assign-broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: selectedProperty.id,
          broker_id: selectedBroker.id,
          is_primary: isPrimary
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `${selectedBroker.full_name} assigned to ${selectedProperty.title}${isPrimary ? ' as primary broker' : ''}!`
        });
        setSelectedBroker(null);
        setSelectedProperty(null);
        setShowAssignmentConfirm(false);
        loadAssignments();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to assign broker",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning broker:', error);
      toast({
        title: "Error",
        description: "Failed to assign broker.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedBroker(null);
    setSelectedProperty(null);
    setShowAssignmentConfirm(false);
  };

  const filteredAssignments = assignments.filter((assignment) =>
    assignment.properties?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.brokers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.property_id.includes(searchTerm) ||
    assignment.broker_id.includes(searchTerm)
  )

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
            <h1 className="text-3xl font-bold text-gray-900">Broker Management</h1>
            <p className="text-gray-600">Manage broker accounts and permissions</p>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Broker
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Broker</DialogTitle>
                <DialogDescription>
                  Create a new broker account by selecting a user and filling in their professional details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="user_select">Select User</Label>
                  <Select
                    value={newBrokerData.user_id}
                    onValueChange={(value) => {
                      const selectedUser = availableUsers.find(u => u.id === value);
                      setNewBrokerData(prev => ({
                        ...prev,
                        user_id: value,
                        full_name: selectedUser?.user_metadata?.full_name || '',
                        email: selectedUser?.email || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user to make broker" />
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
                      value={newBrokerData.full_name}
                      onChange={(e) => setNewBrokerData(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newBrokerData.email}
                      onChange={(e) => setNewBrokerData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newBrokerData.phone}
                      onChange={(e) => setNewBrokerData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      value={newBrokerData.license_number}
                      onChange={(e) => setNewBrokerData(prev => ({ ...prev, license_number: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="years_experience">Years of Experience</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    min="0"
                    value={newBrokerData.years_experience}
                    onChange={(e) => setNewBrokerData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                  <Input
                    id="specialties"
                    placeholder="residential, luxury, commercial"
                    value={newBrokerData.specialties.join(', ')}
                    onChange={(e) => setNewBrokerData(prev => ({ 
                      ...prev, 
                      specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="languages">Languages (comma-separated)</Label>
                  <Input
                    id="languages"
                    placeholder="english, arabic, french"
                    value={newBrokerData.languages.join(', ')}
                    onChange={(e) => setNewBrokerData(prev => ({ 
                      ...prev, 
                      languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={newBrokerData.bio}
                    onChange={(e) => setNewBrokerData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={createBroker} 
                    className="flex-1"
                    disabled={!newBrokerData.user_id || !newBrokerData.full_name || !newBrokerData.email}
                  >
                    Create Broker
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Broker Modal */}
        <Dialog open={!!editingBroker} onOpenChange={(open) => !open && setEditingBroker(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Broker Details</DialogTitle>
              <DialogDescription>
                Update {editingBroker?.full_name}'s professional information and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_full_name">Full Name</Label>
                  <Input
                    id="edit_full_name"
                    value={newBrokerData.full_name}
                    onChange={(e) => setNewBrokerData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={newBrokerData.email}
                    onChange={(e) => setNewBrokerData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_phone">Phone</Label>
                  <Input
                    id="edit_phone"
                    value={newBrokerData.phone}
                    onChange={(e) => setNewBrokerData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_license_number">License Number</Label>
                  <Input
                    id="edit_license_number"
                    value={newBrokerData.license_number}
                    onChange={(e) => setNewBrokerData(prev => ({ ...prev, license_number: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_years_experience">Years of Experience</Label>
                <Input
                  id="edit_years_experience"
                  type="number"
                  min="0"
                  value={newBrokerData.years_experience}
                  onChange={(e) => setNewBrokerData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="edit_specialties">Specialties (comma-separated)</Label>
                <Input
                  id="edit_specialties"
                  placeholder="residential, luxury, commercial"
                  value={newBrokerData.specialties.join(', ')}
                  onChange={(e) => setNewBrokerData(prev => ({ 
                    ...prev, 
                    specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="edit_languages">Languages (comma-separated)</Label>
                <Input
                  id="edit_languages"
                  placeholder="english, arabic, french"
                  value={newBrokerData.languages.join(', ')}
                  onChange={(e) => setNewBrokerData(prev => ({ 
                    ...prev, 
                    languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="edit_bio">Bio</Label>
                <Textarea
                  id="edit_bio"
                  rows={3}
                  value={newBrokerData.bio}
                  onChange={(e) => setNewBrokerData(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setEditingBroker(null)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={editBroker} 
                  className="flex-1"
                  disabled={!newBrokerData.full_name || !newBrokerData.email}
                >
                  Update Broker
                </Button>
              </div>

              {editingBroker && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">Quick Actions</h3>
                      <p className="text-sm text-gray-600">Additional broker management options</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBroker(null);
                          // TODO: Navigate to broker availability management
                          window.open(`/broker/${editingBroker.id}/availability`, '_blank');
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Manage Availability
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBroker(null);
                          // TODO: Navigate to broker dashboard
                          window.open(`/broker/dashboard`, '_blank');
                        }}
                      >
                        <User className="w-4 h-4 mr-2" />
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
                <User className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Brokers</p>
                  <p className="text-2xl font-bold text-gray-900">{brokers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Brokers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {brokers.filter(b => b.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Properties</p>
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

        {/* Data Status Messages */}
        {brokers.length === 0 && properties.length === 0 && users.length === 0 && (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
              <p className="text-gray-600 mb-4">
                No brokers, properties, or users found. This might be due to:
              </p>
              <ul className="text-sm text-gray-500 text-left max-w-md mx-auto">
                <li>• Missing environment variables (check .env.local)</li>
                <li>• Database tables not created yet</li>
                <li>• No sample data inserted</li>
                <li>• Supabase configuration issues</li>
              </ul>
              <p className="text-sm text-gray-500 mt-4">
                Please check the ENVIRONMENT_SETUP.md guide for detailed setup instructions.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Brokers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Brokers</span>
              {selectedBroker && (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  <User className="w-3 h-3 mr-1" />
                  Selected: {selectedBroker.full_name}
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Click on a broker to select them for property assignment
            </p>
          </CardHeader>
          <CardContent>
            {brokers.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No brokers found.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Users: {users.length} | Properties: {properties.length}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {brokers.map((broker) => (
                  <div 
                    key={broker.id} 
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      selectedBroker?.id === broker.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'hover:bg-gray-50 hover:shadow-sm'
                    } ${!broker.is_active ? 'opacity-60' : ''}`}
                    onClick={() => broker.is_active && handleBrokerSelect(broker)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative">
                          {broker.photo_url ? (
                            <img 
                              src={broker.photo_url} 
                              alt={broker.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          {selectedBroker?.id === broker.id && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{broker.full_name}</h3>
                            <Badge variant={broker.is_active ? "default" : "secondary"}>
                              {broker.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {selectedBroker?.id === broker.id && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                <MousePointer className="w-3 h-3 mr-1" />
                                Selected
                              </Badge>
                            )}
                            {broker.license_number && (
                              <Badge variant="outline" className="text-xs">
                                <BadgeIcon className="w-3 h-3 mr-1" />
                                {broker.license_number}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              {broker.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              {broker.phone || 'No phone'}
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-2" />
                              {broker.rating ? broker.rating.toFixed(1) : '0.0'} ({broker.total_reviews || 0} reviews)
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p><strong>Experience:</strong> {broker.years_experience || 0}+ years</p>
                            <p><strong>Specialties:</strong> {broker.specialties ? broker.specialties.join(', ') : 'General'}</p>
                            <p><strong>Languages:</strong> {broker.languages ? broker.languages.join(', ') : 'English'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateBrokerStatus(broker.id, !broker.is_active);
                          }}
                        >
                          {broker.is_active ? (
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
                            handleEditBroker(broker);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
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
              Click on a property to select it for broker assignment
            </p>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No properties found.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Create some properties first to assign brokers
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => {
                  // Get the primary photo or first photo
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
                      {/* Property Image */}
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
                        
                        {/* Selection indicator overlay */}
                        {selectedProperty?.id === property.id && (
                          <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                            <div className="bg-white rounded-full p-2">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                          </div>
                        )}
                        
                        {/* Photo count indicator */}
                        {property.photos && property.photos.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            {property.photos.length} photos
                          </div>
                        )}
                      </div>
                      
                      {/* Property Details */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1 truncate">{property.title}</h3>
                            <p className="text-sm text-gray-600 mb-2 truncate">{property.address}</p>
                            
                            {/* Description */}
                            {property.description && (
                              <p className="text-sm text-gray-500 mb-2 text-ellipsis overflow-hidden" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {property.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {property.property_type}
                              </Badge>
                              <Badge variant={property.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {property.status}
                              </Badge>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              ${property.price.toLocaleString()}
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
                        <div className="text-xs text-gray-400 border-t pt-2">
                          ID: {property.id}
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
        {(selectedBroker || selectedProperty) && (
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
                  <Label className="text-blue-700">Selected Broker:</Label>
                  {selectedBroker ? (
                    <div className="p-3 bg-white rounded border border-blue-200">
                      <p className="font-medium">{selectedBroker.full_name}</p>
                      <p className="text-sm text-gray-600">{selectedBroker.email}</p>
                      <p className="text-xs text-gray-400">ID: {selectedBroker.id}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded border border-dashed border-blue-300 text-center text-blue-600">
                      Click on a broker above to select
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-700">Selected Property:</Label>
                  {selectedProperty ? (
                    <div className="p-3 bg-white rounded border border-blue-200">
                      <div className="flex gap-3">
                        {/* Property thumbnail */}
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
                        
                        {/* Property details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{selectedProperty.title}</p>
                          <p className="text-sm text-gray-600 truncate">{selectedProperty.address}</p>
                          <p className="text-sm font-semibold text-gray-900">${selectedProperty.price.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">ID: {selectedProperty.id}</p>
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
              
              {selectedBroker && selectedProperty && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => confirmAssignment(false)} 
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? 'Assigning...' : 'Assign as Regular Broker'}
                    </Button>
                    <Button 
                      onClick={() => confirmAssignment(true)} 
                      disabled={loading}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      {loading ? 'Assigning...' : 'Assign as Primary Broker'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assignment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Manual Assignment (Alternative Method)</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              You can also assign brokers manually by entering IDs directly
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
                <p className="text-sm text-gray-500 mt-1">
                  Available properties: {properties.length} found
                </p>
              </div>

              <div>
                <Label htmlFor="broker_id">Broker ID</Label>
                <Input
                  id="broker_id"
                  value={formData.broker_id}
                  onChange={(e) => setFormData({...formData, broker_id: e.target.value})}
                  placeholder="Enter broker ID"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available brokers: {brokers.filter(b => b.is_active).length} active
                </p>
              </div>

            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="is_primary">Set as Primary Broker</Label>
            </div>

            <Button onClick={assignBroker} disabled={loading} className="w-full md:w-auto">
              {loading ? 'Assigning...' : 'Assign Broker'}
            </Button>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Current Broker Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by property, broker, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No broker assignments found</p>
                {searchTerm && (
                  <p className="text-sm mt-1">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                  // Get the primary photo or first photo for the property
                  const primaryPhoto = assignment.properties?.photos?.find(photo => photo.is_primary) || assignment.properties?.photos?.[0];
                  
                  return (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <h3 className="font-semibold text-gray-900">Property</h3>
                          </div>
                          
                          {/* Property info with thumbnail */}
                          <div className="flex gap-3">
                            {/* Property thumbnail */}
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
                            
                            {/* Property details */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{assignment.properties?.title || 'Unknown Property'}</p>
                              <p className="text-sm text-gray-600">{assignment.properties?.address}</p>
                              <p className="text-xs text-gray-400 mt-1">ID: {assignment.property_id}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <UserCheck className="w-4 h-4 text-gray-400" />
                            <h3 className="font-semibold text-gray-900">Broker</h3>
                            {assignment.is_primary && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="font-medium">{assignment.brokers?.full_name || 'Unknown Broker'}</p>
                          <p className="text-sm text-gray-600">{assignment.brokers?.email}</p>
                          <p className="text-xs text-gray-400 mt-1">ID: {assignment.broker_id}</p>
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
    </div>
  );
} 