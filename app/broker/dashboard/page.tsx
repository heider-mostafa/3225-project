'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/config';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Star,
  TrendingUp,
  Eye,
  Settings,
  Plus,
  Edit,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import type { Broker, PropertyViewing, BrokerStats } from '@/types/broker';

export default function BrokerDashboard() {
  const router = useRouter();
  // Using shared Supabase client to avoid multiple instances
  
  const [user, setUser] = useState<any>(null);
  const [broker, setBroker] = useState<Broker | null>(null);
  const [stats, setStats] = useState<BrokerStats | null>(null);
  const [upcomingViewings, setUpcomingViewings] = useState<PropertyViewing[]>([]);
  const [recentViewings, setRecentViewings] = useState<PropertyViewing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication and broker status
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
        return;
      }

      setUser(session.user);

      // Check if user is a broker or admin (admins can view broker dashboards)
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .in('role', ['broker', 'admin', 'super_admin']);

      if (!userRoles || userRoles.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have broker or admin permissions.",
          variant: "destructive"
        });
        router.push('/');
        return;
      }

      const hasAdminAccess = userRoles.some(role => ['admin', 'super_admin'].includes(role.role));
      const hasBrokerRole = userRoles.some(role => role.role === 'broker');

      // Get broker profile
      let brokerData = null;
      
      if (hasBrokerRole) {
        // User has broker role - get their broker profile
        const { data: userBrokerData, error: brokerError } = await supabase
          .from('brokers')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single();

        if (brokerError || !userBrokerData) {
          setError('Broker profile not found. Please contact admin.');
          return;
        }
        brokerData = userBrokerData;
      } else if (hasAdminAccess) {
        // Admin user - get any active broker for demo purposes or first broker
        const { data: firstBroker, error: firstBrokerError } = await supabase
          .from('brokers')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (firstBrokerError || !firstBroker) {
          setError('No broker profiles found. Create a broker first.');
          return;
        }
        brokerData = firstBroker;
        
        // Show info that this is an admin view
        toast({
          title: "Admin View",
          description: `Viewing ${firstBroker.full_name}'s broker dashboard as admin.`,
          variant: "default"
        });
      }

      setBroker(brokerData);
      loadDashboardData(brokerData.id);

    } catch (err) {
      console.error('Auth error:', err);
      setError('Authentication failed. Please try again.');
    }
  };

  const loadDashboardData = async (brokerId: string) => {
    try {
      setLoading(true);

      // Load upcoming viewings
      const { data: upcoming } = await supabase
        .from('property_viewings')
        .select(`
          *,
          properties (
            id,
            title,
            address,
            city,
            price
          )
        `)
        .eq('broker_id', brokerId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('viewing_date', new Date().toISOString().split('T')[0])
        .order('viewing_date', { ascending: true })
        .order('viewing_time', { ascending: true })
        .limit(5);

      setUpcomingViewings(upcoming || []);

      // Load recent viewings
      const { data: recent } = await supabase
        .from('property_viewings')
        .select(`
          *,
          properties (
            id,
            title,
            address,
            city,
            price
          )
        `)
        .eq('broker_id', brokerId)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentViewings(recent || []);

      // Calculate stats
      const totalViewings = recent?.length || 0;
      const completedViewings = recent?.filter((v: any) => v.status === 'completed').length || 0;
      const pendingViewings = upcoming?.length || 0;
      const conversionRate = totalViewings > 0 ? (completedViewings / totalViewings) * 100 : 0;

      setStats({
        total_viewings: totalViewings,
        completed_viewings: completedViewings,
        pending_viewings: pendingViewings,
        conversion_rate: conversionRate,
        average_rating: broker?.rating || 0,
        this_month_bookings: upcoming?.filter((v: any) => 
          new Date(v.viewing_date).getMonth() === new Date().getMonth()
        ).length || 0
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const updateViewingStatus = async (viewingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('property_viewings')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', viewingId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Viewing status changed to ${status}.`
      });

      // Reload data
      if (broker) {
        loadDashboardData(broker.id);
      }

    } catch (err) {
      console.error('Error updating status:', err);
      toast({
        title: "Update Failed",
        description: "Could not update viewing status.",
        variant: "destructive"
      });
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (!broker) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Broker Dashboard</h1>
            <p className="text-gray-600">Welcome back, {broker.full_name}</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/profile')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button onClick={() => router.push('/properties')}>
              <Eye className="w-4 h-4 mr-2" />
              View Properties
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Viewings</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_viewings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed_viewings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending_viewings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.average_rating ? stats.average_rating.toFixed(1) : '0.0'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="viewings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="viewings">Upcoming Viewings</TabsTrigger>
            <TabsTrigger value="calendar">My Calendar</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Upcoming Viewings Tab */}
          <TabsContent value="viewings">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Viewings</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingViewings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No upcoming viewings scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingViewings.map((viewing: any) => (
                      <div key={viewing.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-medium text-gray-900">
                                {viewing.properties?.title || 'Property Viewing'}
                              </h3>
                              <Badge variant={
                                viewing.status === 'confirmed' ? 'default' : 
                                viewing.status === 'scheduled' ? 'secondary' : 'destructive'
                              }>
                                {viewing.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                {formatDateTime(viewing.viewing_date, viewing.viewing_time)}
                              </div>
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                {viewing.visitor_name} ({viewing.party_size} {viewing.party_size === 1 ? 'person' : 'people'})
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2" />
                                {viewing.properties?.address}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {viewing.status === 'scheduled' && (
                              <Button
                                size="sm"
                                onClick={() => updateViewingStatus(viewing.id, 'confirmed')}
                              >
                                Confirm
                              </Button>
                            )}
                            {(viewing.status === 'scheduled' || viewing.status === 'confirmed') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateViewingStatus(viewing.id, 'completed')}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                        {viewing.special_requests && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-md">
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
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Manage Your Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Calendar management coming soon!</p>
                  <p className="text-sm text-gray-500">
                    You'll be able to set your availability, block time slots, and manage your schedule here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Broker Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                      {broker.photo_url ? (
                        <img 
                          src={broker.photo_url} 
                          alt={broker.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{broker.full_name}</h3>
                      <p className="text-gray-600">{broker.email}</p>
                      <div className="flex items-center mt-1">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-600">
                          {broker.rating ? broker.rating.toFixed(1) : '0.0'} ({broker.total_reviews || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {broker.phone || 'Not provided'}
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {broker.email}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Professional Details</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>License:</strong> {broker.license_number || 'Not provided'}</p>
                        <p><strong>Experience:</strong> {broker.years_experience || 0}+ years</p>
                        <p><strong>Specialties:</strong> {broker.specialties ? broker.specialties.join(', ') : 'General'}</p>
                        <p><strong>Languages:</strong> {broker.languages ? broker.languages.join(', ') : 'English'}</p>
                      </div>
                    </div>
                  </div>

                  {broker.bio && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                      <p className="text-gray-600 text-sm">{broker.bio}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 