'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/config';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Mail,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

interface Broker {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  license_number?: string;
  is_active: boolean;
}

interface AvailabilitySlot {
  id: string;
  broker_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  is_blocked: boolean;
  created_at: string;
}

interface BookedViewing {
  id: string;
  broker_id: string;
  property_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  viewing_date: string;
  viewing_time: string;
  status: string;
  properties: {
    title: string;
    address: string;
  };
}

export default function BrokerAvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  // Using shared Supabase client
  const brokerId = params.id as string;

  const [broker, setBroker] = useState<Broker | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [bookedViewings, setBookedViewings] = useState<BookedViewing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);

  const [newSlot, setNewSlot] = useState({
    date: '',
    start_time: '',
    end_time: '',
    repeat_weekly: false
  });

  useEffect(() => {
    loadData();
  }, [brokerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadBroker(),
        loadAvailabilitySlots(),
        loadBookedViewings()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load availability data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBroker = async () => {
    try {
      console.log('🔍 Loading broker with ID:', brokerId);
      
      // Use API endpoint instead of direct Supabase client to avoid auth issues
      const response = await fetch(`/api/brokers/${brokerId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ API Error:', errorData);
        throw new Error(errorData.error || 'Failed to load broker');
      }
      
      const data = await response.json();
      console.log('🎯 Broker data from API:', data);
      
      setBroker(data.broker);
    } catch (error) {
      console.error('Error loading broker:', error);
      toast({
        title: "Error",
        description: "Broker not found.",
        variant: "destructive"
      });
    }
  };

  const loadAvailabilitySlots = async () => {
    try {
      const response = await fetch(`/api/broker/availability?broker_id=${brokerId}`);
      
      if (!response.ok) {
        console.log('Error loading availability slots');
        setAvailabilitySlots([]);
        return;
      }
      
      const data = await response.json();
      setAvailabilitySlots(data.availability || []);
    } catch (error) {
      console.error('Error loading availability slots:', error);
      setAvailabilitySlots([]);
    }
  };

  const loadBookedViewings = async () => {
    try {
      const response = await fetch(`/api/broker/viewings?broker_id=${brokerId}`);
      
      if (!response.ok) {
        console.log('Error loading booked viewings');
        setBookedViewings([]);
        return;
      }
      
      const data = await response.json();
      setBookedViewings(data.viewings || []);
    } catch (error) {
      console.error('Error loading booked viewings:', error);
      setBookedViewings([]);
    }
  };

  const addAvailabilitySlot = async () => {
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/broker/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker_id: brokerId,
          date: newSlot.date,
          start_time: newSlot.start_time,
          end_time: newSlot.end_time
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add availability slot');
      }

      toast({
        title: "Success",
        description: "Availability slot added successfully."
      });

      setShowAddSlotModal(false);
      setNewSlot({
        date: '',
        start_time: '',
        end_time: '',
        repeat_weekly: false
      });

      loadAvailabilitySlots();
    } catch (error) {
      console.error('Error adding availability slot:', error);
      toast({
        title: "Error",
        description: "Failed to add availability slot.",
        variant: "destructive"
      });
    }
  };

  const toggleSlotBlock = async (slotId: string, isBlocked: boolean) => {
    try {
      const response = await fetch(`/api/broker/availability/${slotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_blocked: !isBlocked
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update slot');
      }

      toast({
        title: "Success",
        description: `Slot ${!isBlocked ? 'blocked' : 'unblocked'} successfully.`
      });

      loadAvailabilitySlots();
    } catch (error) {
      console.error('Error toggling slot block:', error);
      toast({
        title: "Error",
        description: "Failed to update slot.",
        variant: "destructive"
      });
    }
  };

  const deleteAvailabilitySlot = async (slotId: string) => {
    try {
      const response = await fetch(`/api/broker/availability/${slotId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete slot');
      }

      toast({
        title: "Success",
        description: "Availability slot deleted successfully."
      });

      loadAvailabilitySlots();
    } catch (error) {
      console.error('Error deleting availability slot:', error);
      toast({
        title: "Error",
        description: "Failed to delete slot.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Broker Not Found</h2>
            <p className="text-gray-600 mb-4">The requested broker could not be found.</p>
            <Button onClick={() => router.push('/admin/brokers')}>
              Back to Brokers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Availability Management</h1>
            <p className="text-gray-600">Manage {broker.full_name}'s availability and bookings</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/admin/brokers')}>
              Back to Brokers
            </Button>
            <Dialog open={showAddSlotModal} onOpenChange={setShowAddSlotModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Availability
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Availability Slot</DialogTitle>
                  <DialogDescription>
                    Set when {broker.full_name} is available for property viewings.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newSlot.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={newSlot.start_time}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={newSlot.end_time}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setShowAddSlotModal(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={addAvailabilitySlot} className="flex-1">
                      Add Slot
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Broker Info */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{broker.full_name}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {broker.email}
                  </div>
                  {broker.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {broker.phone}
                    </div>
                  )}
                  {broker.license_number && (
                    <Badge variant="outline">
                      License: {broker.license_number}
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant={broker.is_active ? "default" : "secondary"}>
                {broker.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Availability Slots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Availability Slots
                </div>
                <Badge variant="outline">
                  {availabilitySlots.length} slots
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availabilitySlots.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No availability slots set.</p>
                  <p className="text-sm text-gray-500 mt-2">Add some availability slots to allow bookings.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availabilitySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`border rounded-lg p-4 ${
                        slot.is_blocked
                          ? 'bg-red-50 border-red-200'
                          : slot.is_booked
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(slot.date)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              slot.is_blocked
                                ? "destructive"
                                : slot.is_booked
                                ? "secondary"
                                : "default"
                            }
                          >
                            {slot.is_blocked
                              ? "Blocked"
                              : slot.is_booked
                              ? "Booked"
                              : "Available"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleSlotBlock(slot.id, slot.is_blocked)}
                            disabled={slot.is_booked}
                          >
                            {slot.is_blocked ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteAvailabilitySlot(slot.id)}
                            disabled={slot.is_booked}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booked Viewings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Upcoming Viewings
                </div>
                <Badge variant="outline">
                  {bookedViewings.length} bookings
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookedViewings.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming viewings.</p>
                  <p className="text-sm text-gray-500 mt-2">Booked viewings will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookedViewings.map((viewing) => (
                    <div key={viewing.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {viewing.properties?.title || 'Unknown Property'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {viewing.properties?.address}
                          </p>
                        </div>
                        <Badge
                          variant={viewing.status === 'confirmed' ? 'default' : 'secondary'}
                        >
                          {viewing.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {formatDate(viewing.viewing_date)}
                          </p>
                          <p className="text-gray-600">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {formatTime(viewing.viewing_time)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">
                            <User className="w-4 h-4 inline mr-1" />
                            {viewing.visitor_name}
                            {viewing.party_size && viewing.party_size > 1 && (
                              <span className="text-gray-500"> ({viewing.party_size} people)</span>
                            )}
                          </p>
                          <p className="text-gray-600">
                            <Mail className="w-4 h-4 inline mr-1" />
                            {viewing.visitor_email}
                          </p>
                          {viewing.visitor_phone && (
                            <p className="text-gray-600">
                              <Phone className="w-4 h-4 inline mr-1" />
                              {viewing.visitor_phone}
                            </p>
                          )}
                        </div>
                      </div>
                      {viewing.special_requests && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>Special Requests:</strong> {viewing.special_requests}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 