'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Camera,
  Star,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  AlertCircle,
  MousePointer,
  Clock,
  User,
  Building2,
  Image as ImageIcon,
  Award
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

interface Photographer {
  id: string;
  email: string;
  name: string;
  phone: string;
  preferred_areas: string[];
  equipment: string | null;
  rating: number;
  total_shoots: number;
  is_active: boolean;
  google_calendar_id: string | null;
  pricing: any;
  availability: any;
  skills: string[];
  languages: string[];
  created_at: string;
  updated_at: string;
}

interface Lead {
  id: string;
  lead_id: string;
  name: string;
  whatsapp_number: string;
  location: string;
  property_type: string;
  status: string;
  photographer_id?: string;
  price_range?: string;
  timeline?: string;
}

interface Assignment {
  id: string;
  lead_id: string;
  photographer_id: string;
  assignment_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: 'assigned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  google_calendar_event_id: string | null;
  preparation_notes: string | null;
  completion_notes: string | null;
  client_rating: number | null;
  photographer_rating: number | null;
  travel_distance_km: number | null;
  actual_duration_minutes: number | null;
  photos_count: number;
  created_at: string;
  updated_at: string;
  photographer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    rating: number;
  };
  lead?: Lead;
}

interface NewPhotographerData {
  email: string;
  name: string;
  phone: string;
  preferred_areas: string[];
  equipment: string;
  skills: string[];
  languages: string[];
  pricing: any;
}

export default function AdminPhotographersPage() {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPhotographer, setEditingPhotographer] = useState<Photographer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhotographer, setSelectedPhotographer] = useState<Photographer | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    scheduled_time: '',
    duration_minutes: 120,
    preparation_notes: ''
  });

  const [newPhotographerData, setNewPhotographerData] = useState<NewPhotographerData>({
    email: '',
    name: '',
    phone: '',
    preferred_areas: [],
    equipment: '',
    skills: [],
    languages: ['Arabic', 'English'],
    pricing: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPhotographers(),
        loadAssignments(),
        loadQualifiedLeads()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load photographers data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPhotographers = async () => {
    try {
      const response = await fetch('/api/admin/photographers');
      if (!response.ok) throw new Error('Failed to fetch photographers');
      
      const data = await response.json();
      setPhotographers(data.photographers || []);
    } catch (error) {
      console.error('Error loading photographers:', error);
      setPhotographers([]);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/admin/photographer-assignments');
      if (!response.ok) throw new Error('Failed to fetch assignments');
      
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
    }
  };

  const loadQualifiedLeads = async () => {
    try {
      // Load all leads that are ready for photographer assignment
      const response = await fetch('/api/admin/leads?limit=100');
      if (!response.ok) throw new Error('Failed to fetch leads');
      
      const data = await response.json();
      
      // Filter for leads that can be assigned to photographers
      const assignableLeads = data.leads?.filter((lead: any) => {
        // Include leads that are approved but not yet assigned
        if (lead.status === 'property_approved' && !lead.photographer_id) return true;
        
        // Include leads that are assigned but might need reassignment
        if (lead.status === 'photographer_assigned' && lead.photographer_id) return true;
        
        // Include other qualified leads as backup options
        if (['qualified', 'called'].includes(lead.status) && !lead.photographer_id) return true;
        
        return false;
      }) || [];

      // Sort by priority: property_approved first, then by created date
      assignableLeads.sort((a: any, b: any) => {
        if (a.status === 'property_approved' && b.status !== 'property_approved') return -1;
        if (b.status === 'property_approved' && a.status !== 'property_approved') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setLeads(assignableLeads);
    } catch (error) {
      console.error('Error loading qualified leads:', error);
      setLeads([]);
    }
  };

  const createPhotographer = async () => {
    try {
      const response = await fetch('/api/admin/photographers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhotographerData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create photographer');
      }

      toast({
        title: "Success",
        description: "Photographer created successfully."
      });

      setShowCreateModal(false);
      setNewPhotographerData({
        email: '',
        name: '',
        phone: '',
        preferred_areas: [],
        equipment: '',
        skills: [],
        languages: ['Arabic', 'English'],
        pricing: {}
      });

      loadData();
    } catch (error) {
      console.error('Error creating photographer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create photographer.",
        variant: "destructive"
      });
    }
  };

  const updatePhotographerStatus = async (photographerId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/photographers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          photographer_id: photographerId,
          is_active: isActive 
        })
      });

      if (!response.ok) throw new Error('Failed to update photographer status');

      toast({
        title: "Success",
        description: `Photographer ${isActive ? 'activated' : 'deactivated'} successfully.`
      });

      loadData();
    } catch (error) {
      console.error('Error updating photographer status:', error);
      toast({
        title: "Error",
        description: "Failed to update photographer status.",
        variant: "destructive"
      });
    }
  };

  const handleEditPhotographer = (photographer: Photographer) => {
    setEditingPhotographer(photographer);
    setNewPhotographerData({
      email: photographer.email,
      name: photographer.name,
      phone: photographer.phone,
      preferred_areas: photographer.preferred_areas,
      equipment: photographer.equipment || '',
      skills: photographer.skills,
      languages: photographer.languages,
      pricing: photographer.pricing || {}
    });
  };

  const editPhotographer = async () => {
    if (!editingPhotographer) return;

    try {
      const response = await fetch('/api/admin/photographers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photographer_id: editingPhotographer.id,
          name: newPhotographerData.name,
          email: newPhotographerData.email,
          phone: newPhotographerData.phone,
          preferred_areas: newPhotographerData.preferred_areas,
          equipment: newPhotographerData.equipment,
          skills: newPhotographerData.skills,
          languages: newPhotographerData.languages,
          pricing: newPhotographerData.pricing
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update photographer');
      }

      toast({
        title: "Success",
        description: "Photographer updated successfully."
      });

      setEditingPhotographer(null);
      setNewPhotographerData({
        email: '',
        name: '',
        phone: '',
        preferred_areas: [],
        equipment: '',
        skills: [],
        languages: ['Arabic', 'English'],
        pricing: {}
      });

      loadData();
    } catch (error) {
      console.error('Error updating photographer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update photographer.",
        variant: "destructive"
      });
    }
  };

  const handlePhotographerSelect = (photographer: Photographer) => {
    setSelectedPhotographer(photographer);
    if (selectedLead) {
      // Auto-assign if both are selected
      confirmInteractiveAssignment();
    }
  };

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    if (selectedPhotographer) {
      // Auto-assign if both are selected
      confirmInteractiveAssignment();
    }
  };

  const clearSelection = () => {
    setSelectedPhotographer(null);
    setSelectedLead(null);
  };

  const confirmInteractiveAssignment = async () => {
    if (!selectedPhotographer || !selectedLead) return;

    try {
      // Calculate default scheduled time (next business day at 10 AM)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const response = await fetch('/api/admin/photographer-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          photographer_id: selectedPhotographer.id,
          scheduled_time: tomorrow.toISOString(),
          duration_minutes: 120,
          preparation_notes: `Photography assignment for ${selectedLead.property_type} in ${selectedLead.location}. Client: ${selectedLead.name}`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `${selectedPhotographer.name} assigned to ${selectedLead.name}!`
        });
        
        setSelectedPhotographer(null);
        setSelectedLead(null);
        loadData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to assign photographer",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning photographer:', error);
      toast({
        title: "Error",
        description: "Failed to assign photographer.",
        variant: "destructive"
      });
    }
  };

  const createAssignment = async () => {
    if (!selectedPhotographer || !selectedLead) return;

    try {
      setAssignmentLoading(true);
      const response = await fetch('/api/admin/photographer-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          photographer_id: selectedPhotographer.id,
          scheduled_time: assignmentData.scheduled_time,
          duration_minutes: assignmentData.duration_minutes,
          preparation_notes: assignmentData.preparation_notes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create assignment');
      }

      toast({
        title: "Success",
        description: `Assignment created: ${selectedPhotographer.name} → ${selectedLead.name}`
      });

      setShowAssignmentModal(false);
      setSelectedPhotographer(null);
      setSelectedLead(null);
      setAssignmentData({
        scheduled_time: '',
        duration_minutes: 120,
        preparation_notes: ''
      });

      loadData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create assignment.",
        variant: "destructive"
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/photographer-assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          status,
          completion_notes: notes
        })
      });

      if (!response.ok) throw new Error('Failed to update assignment');

      toast({
        title: "Success",
        description: `Assignment status updated to ${status}.`
      });

      loadData();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to update assignment status.",
        variant: "destructive"
      });
    }
  };

  const filteredPhotographers = photographers.filter(photographer =>
    photographer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    photographer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    photographer.preferred_areas.some(area => area.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAssignments = assignments.filter(assignment =>
    assignment.lead?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.photographer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.lead?.location.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold text-gray-900">Photographer Management</h1>
            <p className="text-gray-600">Manage photographers and their property assignments</p>
          </div>
          <div className="flex gap-4">
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Photographer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Photographer</DialogTitle>
                  <DialogDescription>
                    Add a new photographer to the team with their details and preferences.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newPhotographerData.name}
                        onChange={(e) => setNewPhotographerData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newPhotographerData.email}
                        onChange={(e) => setNewPhotographerData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newPhotographerData.phone}
                        onChange={(e) => setNewPhotographerData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="equipment">Equipment</Label>
                      <Input
                        id="equipment"
                        placeholder="Insta360 X5, DSLR Camera Kit"
                        value={newPhotographerData.equipment}
                        onChange={(e) => setNewPhotographerData(prev => ({ ...prev, equipment: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="preferred_areas">Preferred Areas (comma-separated)</Label>
                    <Input
                      id="preferred_areas"
                      placeholder="New Cairo, Zamalek, Maadi"
                      value={newPhotographerData.preferred_areas.join(', ')}
                      onChange={(e) => setNewPhotographerData(prev => ({ 
                        ...prev, 
                        preferred_areas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="skills">Skills (comma-separated)</Label>
                    <Input
                      id="skills"
                      placeholder="residential, luxury, commercial, drone"
                      value={newPhotographerData.skills.join(', ')}
                      onChange={(e) => setNewPhotographerData(prev => ({ 
                        ...prev, 
                        skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="languages">Languages (comma-separated)</Label>
                    <Input
                      id="languages"
                      placeholder="Arabic, English, French"
                      value={newPhotographerData.languages.join(', ')}
                      onChange={(e) => setNewPhotographerData(prev => ({ 
                        ...prev, 
                        languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button 
                      onClick={createPhotographer} 
                      className="flex-1"
                      disabled={!newPhotographerData.name || !newPhotographerData.email || !newPhotographerData.phone}
                    >
                      Create Photographer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAssignmentModal} onOpenChange={setShowAssignmentModal}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                  <DialogDescription>
                    Assign a photographer to a qualified property lead.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Photographer</Label>
                    <Select
                      value={selectedPhotographer?.id || ''}
                      onValueChange={(value) => {
                        const photographer = photographers.find(p => p.id === value);
                        setSelectedPhotographer(photographer || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose photographer" />
                      </SelectTrigger>
                      <SelectContent>
                        {photographers.filter(p => p.is_active).map(photographer => (
                          <SelectItem key={photographer.id} value={photographer.id}>
                            {photographer.name} - {photographer.preferred_areas.join(', ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Select Lead</Label>
                    <Select
                      value={selectedLead?.id || ''}
                      onValueChange={(value) => {
                        const lead = leads.find(l => l.id === value);
                        setSelectedLead(lead || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose approved lead" />
                      </SelectTrigger>
                      <SelectContent>
                        {leads.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            No available leads for photographer assignment.
                            <br />
                            Leads must be qualified and not already assigned.
                          </div>
                        ) : (
                          leads.map(lead => (
                            <SelectItem key={lead.id} value={lead.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{lead.name}</span>
                                <span className="text-sm text-gray-500">
                                  {lead.property_type} in {lead.location}
                                  {lead.price_range && ` • ${lead.price_range}`}
                                  {lead.timeline && ` • ${lead.timeline}`}
                                </span>
                                <span className="text-xs text-blue-600">Status: {lead.status}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="scheduled_time">Scheduled Time</Label>
                    <Input
                      id="scheduled_time"
                      type="datetime-local"
                      value={assignmentData.scheduled_time}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="30"
                      max="480"
                      value={assignmentData.duration_minutes}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 120 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Preparation Notes</Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      value={assignmentData.preparation_notes}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, preparation_notes: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setShowAssignmentModal(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button 
                      onClick={createAssignment} 
                      className="flex-1"
                      disabled={!selectedPhotographer || !selectedLead || !assignmentData.scheduled_time || assignmentLoading}
                    >
                      {assignmentLoading ? 'Creating...' : 'Create Assignment'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Edit Photographer Modal */}
          <Dialog open={!!editingPhotographer} onOpenChange={(open) => !open && setEditingPhotographer(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Photographer Details</DialogTitle>
                <DialogDescription>
                  Update {editingPhotographer?.name}'s professional information and settings.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_name">Full Name</Label>
                    <Input
                      id="edit_name"
                      value={newPhotographerData.name}
                      onChange={(e) => setNewPhotographerData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_email">Email</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={newPhotographerData.email}
                      onChange={(e) => setNewPhotographerData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_phone">Phone</Label>
                    <Input
                      id="edit_phone"
                      value={newPhotographerData.phone}
                      onChange={(e) => setNewPhotographerData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_equipment">Equipment</Label>
                    <Input
                      id="edit_equipment"
                      placeholder="Insta360 X5, DSLR Camera Kit"
                      value={newPhotographerData.equipment}
                      onChange={(e) => setNewPhotographerData(prev => ({ ...prev, equipment: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit_preferred_areas">Preferred Areas (comma-separated)</Label>
                  <Input
                    id="edit_preferred_areas"
                    placeholder="New Cairo, Zamalek, Maadi"
                    value={newPhotographerData.preferred_areas.join(', ')}
                    onChange={(e) => setNewPhotographerData(prev => ({ 
                      ...prev, 
                      preferred_areas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edit_skills">Skills (comma-separated)</Label>
                  <Input
                    id="edit_skills"
                    placeholder="residential, luxury, commercial, drone"
                    value={newPhotographerData.skills.join(', ')}
                    onChange={(e) => setNewPhotographerData(prev => ({ 
                      ...prev, 
                      skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edit_languages">Languages (comma-separated)</Label>
                  <Input
                    id="edit_languages"
                    placeholder="Arabic, English, French"
                    value={newPhotographerData.languages.join(', ')}
                    onChange={(e) => setNewPhotographerData(prev => ({ 
                      ...prev, 
                      languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                  />
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setEditingPhotographer(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={editPhotographer} 
                    className="flex-1"
                    disabled={!newPhotographerData.name || !newPhotographerData.email}
                  >
                    Update Photographer
                  </Button>
                </div>

                {editingPhotographer && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">Quick Actions</h3>
                        <p className="text-sm text-gray-600">Additional photographer management options</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPhotographer(null);
                            // Navigate to photographer schedule management
                            window.open(`/photographer/schedule`, '_blank');
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          View Schedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPhotographer(null);
                            // Navigate to photographer dashboard
                            window.open(`/photographer`, '_blank');
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Camera className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Photographers</p>
                  <p className="text-2xl font-bold text-gray-900">{photographers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Photographers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {photographers.filter(p => p.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
                  <p className="text-xs text-gray-500">Ready for assignment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search photographers, assignments, or leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Available Properties Needing Photography */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Properties Ready for Photography Assignment</span>
              <div className="flex items-center gap-2">
                {leads.filter(l => l.status === 'property_approved' && !l.photographer_id).length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const approvedLeads = leads.filter(l => l.status === 'property_approved' && !l.photographer_id);
                      if (approvedLeads.length === 0) return;
                      
                      for (const lead of approvedLeads) {
                        try {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          tomorrow.setHours(10, 0, 0, 0);

                          await fetch('/api/admin/photographer-assignments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              lead_id: lead.id,
                              scheduled_time: tomorrow.toISOString(),
                              duration_minutes: 120,
                              auto_assign: true,
                              preparation_notes: `Auto-assigned approved property: ${lead.property_type} in ${lead.location}`
                            })
                          });
                        } catch (error) {
                          console.error(`Failed to auto-assign ${lead.name}:`, error);
                        }
                      }
                      
                      toast({
                        title: "Bulk Assignment",
                        description: `Attempting to auto-assign ${approvedLeads.length} approved properties`
                      });
                      
                      setTimeout(() => loadData(), 2000);
                    }}
                    className="text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Auto-Assign All ({leads.filter(l => l.status === 'property_approved' && !l.photographer_id).length})
                  </Button>
                )}
                {selectedLead && (
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    <Building2 className="w-3 h-3 mr-1" />
                    Selected: {selectedLead.name}
                  </Badge>
                )}
              </div>
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Click on a property to select it for photographer assignment
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
                  <span className="text-gray-600">Ready for Assignment</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div>
                  <span className="text-gray-600">Already Assigned</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No properties available for photographer assignment.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Properties will appear here after approval in the admin panel. Check the property approval section for leads awaiting review.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      selectedLead?.id === lead.id
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : lead.status === 'property_approved' 
                          ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:shadow-sm'
                          : 'hover:bg-gray-50 hover:shadow-sm'
                    }`}
                    onClick={() => handleLeadSelect(lead)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{lead.name}</h3>
                          <Badge 
                            variant={
                              lead.status === 'property_approved' ? 'default' :
                              lead.status === 'photographer_assigned' ? 'secondary' :
                              'outline'
                            }
                            className={
                              lead.status === 'property_approved' ? 'bg-blue-600 text-white' :
                              lead.status === 'photographer_assigned' ? 'bg-orange-100 text-orange-800' :
                              'text-gray-600'
                            }
                          >
                            {lead.status === 'property_approved' ? '🏠 Ready for Photography' :
                             lead.status === 'photographer_assigned' ? '📷 Photographer Assigned' :
                             lead.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {lead.location}
                          </div>
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2" />
                            {lead.property_type}
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {lead.whatsapp_number}
                          </div>
                          {lead.price_range && (
                            <div className="text-xs text-gray-500">
                              Budget: {lead.price_range}
                            </div>
                          )}
                          {lead.timeline && (
                            <div className="text-xs text-gray-500">
                              Timeline: {lead.timeline}
                            </div>
                          )}
                          {lead.photographer_id && (
                            <div className="text-xs text-orange-600 font-medium">
                              Currently assigned to photographer
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {lead.lead_id}
                          </Badge>
                          {lead.status === 'property_approved' && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              🎯 Priority
                            </Badge>
                          )}
                        </div>
                      </div>
                      {selectedLead?.id === lead.id && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interactive Assignment Status */}
        {(selectedPhotographer || selectedLead) && (
          <Card className="border-blue-200 bg-blue-50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-blue-800">
                <div className="flex items-center">
                  <MousePointer className="w-5 h-5 mr-2" />
                  Interactive Assignment
                </div>
                <Button variant="outline" size="sm" onClick={clearSelection} className="text-blue-600 border-blue-300 hover:bg-blue-100">
                  Clear Selection
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-blue-700">Selected Photographer:</Label>
                  {selectedPhotographer ? (
                    <div className="p-3 bg-white rounded border border-blue-200">
                      <p className="font-medium">{selectedPhotographer.name}</p>
                      <p className="text-sm text-gray-600">{selectedPhotographer.email}</p>
                      <p className="text-sm text-gray-600">Rating: {selectedPhotographer.rating?.toFixed(1) || '0.0'}</p>
                      <p className="text-xs text-gray-400">Areas: {selectedPhotographer.preferred_areas.join(', ')}</p>
                      <p className="text-xs text-gray-400">Equipment: {selectedPhotographer.equipment || 'Not specified'}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded border border-dashed border-blue-300 text-center text-blue-600">
                      Click on a photographer below to select
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-700">Selected Property:</Label>
                  {selectedLead ? (
                    <div className="p-3 bg-white rounded border border-blue-200">
                      <p className="font-medium">{selectedLead.name}</p>
                      <p className="text-sm text-gray-600">{selectedLead.location}</p>
                      <p className="text-sm text-gray-600">{selectedLead.property_type}</p>
                      <p className="text-xs text-gray-400">ID: {selectedLead.lead_id}</p>
                      <p className="text-xs text-gray-400">Status: {selectedLead.status}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded border border-dashed border-blue-300 text-center text-blue-600">
                      Click on a property above to select
                    </div>
                  )}
                </div>
              </div>
              
              {selectedPhotographer && selectedLead && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-center mb-4">
                    <p className="text-blue-800 mb-2">
                      Ready to assign <strong>{selectedPhotographer.name}</strong> to photograph <strong>{selectedLead.name}'s</strong> property!
                    </p>
                    <p className="text-sm text-blue-600">
                      Assignment will be scheduled for next business day at 10 AM (120 minutes duration)
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={confirmInteractiveAssignment} 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Quick Assign
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowAssignmentModal(true)}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Custom Time
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Photographers List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Available Photographers</span>
              {selectedPhotographer && (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  <Camera className="w-3 h-3 mr-1" />
                  Selected: {selectedPhotographer.name}
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Click on a photographer to select them for assignment
            </p>
          </CardHeader>
          <CardContent>
            {filteredPhotographers.length === 0 ? (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No photographers found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPhotographers.map((photographer) => {
                  const photographerAssignments = assignments.filter(a => a.photographer_id === photographer.id);
                  const completedAssignments = photographerAssignments.filter(a => a.status === 'completed');
                  const pendingAssignments = photographerAssignments.filter(a => 
                    a.status === 'assigned' || a.status === 'confirmed'
                  );

                  return (
                    <div 
                      key={photographer.id} 
                      className={`border rounded-lg p-4 transition-all cursor-pointer ${
                        selectedPhotographer?.id === photographer.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'hover:bg-gray-50 hover:shadow-sm'
                      } ${!photographer.is_active ? 'opacity-60' : ''}`}
                      onClick={() => photographer.is_active && handlePhotographerSelect(photographer)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative flex items-center justify-center">
                            <Camera className="w-6 h-6 text-gray-400" />
                            {selectedPhotographer?.id === photographer.id && (
                              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium text-gray-900">{photographer.name}</h3>
                              <Badge variant={photographer.is_active ? "default" : "secondary"}>
                                {photographer.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {selectedPhotographer?.id === photographer.id && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                  <MousePointer className="w-3 h-3 mr-1" />
                                  Selected
                                </Badge>
                              )}
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                <span className="text-sm font-medium">{photographer.rating.toFixed(1)}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                {photographer.email}
                              </div>
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-2" />
                                {photographer.phone}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2" />
                                {photographer.preferred_areas.join(', ')}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-900">Equipment:</span>
                                <p className="text-gray-600">{photographer.equipment || 'Not specified'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">Skills:</span>
                                <p className="text-gray-600">{photographer.skills.join(', ')}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">Total Shoots:</span>
                                <p className="text-gray-600">{photographer.total_shoots}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">Languages:</span>
                                <p className="text-gray-600">{photographer.languages.join(', ')}</p>
                              </div>
                            </div>
                            <div className="flex gap-4 mt-3 text-sm">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                                <span>{pendingAssignments.length} pending</span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                                <span>{completedAssignments.length} completed</span>
                              </div>
                              <div className="flex items-center">
                                <ImageIcon className="w-4 h-4 mr-1 text-purple-500" />
                                <span>
                                  {completedAssignments.reduce((sum, a) => sum + (a.photos_count || 0), 0)} photos taken
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPhotographer(photographer);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePhotographerStatus(photographer.id, !photographer.is_active);
                            }}
                          >
                            {photographer.is_active ? (
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignments List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No assignments found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.slice(0, 10).map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Camera className="w-4 h-4 text-gray-400" />
                          <h3 className="font-semibold text-gray-900">Photographer</h3>
                        </div>
                        <p className="font-medium">{assignment.photographer?.name}</p>
                        <p className="text-sm text-gray-600">{assignment.photographer?.email}</p>
                        <div className="flex items-center mt-1">
                          <Star className="w-3 h-3 text-yellow-500 mr-1" />
                          <span className="text-xs">{assignment.photographer?.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <h3 className="font-semibold text-gray-900">Client</h3>
                        </div>
                        <p className="font-medium">{assignment.lead?.name}</p>
                        <p className="text-sm text-gray-600">{assignment.lead?.property_type}</p>
                        <p className="text-sm text-gray-600">{assignment.lead?.location}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <h3 className="font-semibold text-gray-900">Schedule</h3>
                        </div>
                        <p className="text-sm">
                          {new Date(assignment.scheduled_time).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(assignment.scheduled_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">{assignment.duration_minutes}min</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Award className="w-4 h-4 text-gray-400" />
                          <h3 className="font-semibold text-gray-900">Status</h3>
                        </div>
                        <Badge 
                          variant={
                            assignment.status === 'completed' ? 'default' :
                            assignment.status === 'cancelled' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {assignment.status}
                        </Badge>
                        {assignment.status === 'completed' && assignment.photos_count && (
                          <p className="text-sm text-gray-600 mt-1">
                            {assignment.photos_count} photos taken
                          </p>
                        )}
                        {assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
                          <div className="flex gap-1 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAssignmentStatus(assignment.id, 'completed', 'Marked as completed from admin');
                              }}
                            >
                              Complete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}