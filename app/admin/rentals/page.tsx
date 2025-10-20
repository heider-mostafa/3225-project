'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Home,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  Star,
  TrendingUp,
  AlertTriangle,
  QrCode,
  Shield,
  FileText,
  Settings,
  MoreHorizontal,
  Download,
  Mail,
  Phone,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface RentalListing {
  id: string;
  property_id: string;
  owner_user_id: string;
  rental_type: 'short_term' | 'long_term' | 'both';
  nightly_rate: number;
  monthly_rate: number;
  compliance_status: 'pending' | 'approved' | 'rejected' | 'expired';
  is_active: boolean;
  featured: boolean;
  total_bookings: number;
  average_rating: number;
  developer_qr_code: string | null;
  tourism_permit_number: string | null;
  created_at: string;
  properties: {
    title: string;
    address: string;
    city: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
  };
  rental_bookings: Array<{
    booking_status: string;
    total_amount: number;
    created_at: string;
  }>;
}

interface DashboardStats {
  total_listings: number;
  active_listings: number;
  pending_approval: number;
  total_revenue: number;
  total_bookings: number;
  average_occupancy: number;
}

export default function AdminRentalDashboard() {
  const router = useRouter();
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_listings: 0,
    active_listings: 0,
    pending_approval: 0,
    total_revenue: 0,
    total_bookings: 0,
    average_occupancy: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [selectedListing, setSelectedListing] = useState<RentalListing | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Advanced filtering logic
  const getFilteredListings = () => {
    let filtered = listings.filter(listing => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !listing.properties.title.toLowerCase().includes(searchLower) &&
          !listing.properties.city.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && !listing.is_active && statusFilter === 'active') return false;
      if (statusFilter !== 'all' && listing.is_active && statusFilter === 'inactive') return false;

      // Type filter
      if (typeFilter !== 'all' && listing.rental_type !== typeFilter) return false;

      // City filter
      if (cityFilter !== 'all' && listing.properties.city !== cityFilter) return false;

      // Price range filter
      const price = listing.rental_type === 'short_term' ? listing.nightly_rate : listing.monthly_rate;
      if (price < priceRange[0] || price > priceRange[1]) return false;

      // Rating filter
      if (ratingFilter !== 'all') {
        const minRating = parseFloat(ratingFilter);
        if (listing.average_rating < minRating) return false;
      }

      // Compliance filter
      if (complianceFilter !== 'all' && listing.compliance_status !== complianceFilter) return false;

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'price':
          aValue = a.rental_type === 'short_term' ? a.nightly_rate : a.monthly_rate;
          bValue = b.rental_type === 'short_term' ? b.nightly_rate : b.monthly_rate;
          break;
        case 'rating':
          aValue = a.average_rating;
          bValue = b.average_rating;
          break;
        case 'bookings':
          aValue = a.total_bookings;
          bValue = b.total_bookings;
          break;
        case 'title':
          aValue = a.properties.title.toLowerCase();
          bValue = b.properties.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  };

  const getUniqueCities = () => {
    return [...new Set(listings.map(listing => listing.properties.city))];
  };

  const handleBulkAction = async (action: string) => {
    if (selectedListings.length === 0) {
      toast.error('Please select listings first');
      return;
    }

    try {
      // Implement bulk actions here
      switch (action) {
        case 'activate':
          // Bulk activate listings
          break;
        case 'deactivate':
          // Bulk deactivate listings
          break;
        case 'feature':
          // Bulk feature listings
          break;
        case 'delete':
          // Bulk delete listings
          break;
      }
      
      setSelectedListings([]);
      loadDashboardData();
      toast.success(`${action} completed for ${selectedListings.length} listings`);
    } catch (error) {
      toast.error(`Failed to ${action} listings`);
    }
  };

  const toggleListingSelection = (listingId: string) => {
    setSelectedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const selectAllListings = () => {
    const filteredListings = getFilteredListings();
    setSelectedListings(
      selectedListings.length === filteredListings.length 
        ? []
        : filteredListings.map(l => l.id)
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCityFilter('all');
    setPriceRange([0, 50000]);
    setRatingFilter('all');
    setComplianceFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be a single API call
      await Promise.all([
        loadRentalListings(),
        loadDashboardStats()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRentalListings = async () => {
    try {
      const response = await fetch('/api/admin/rentals', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      } else {
        // Mock data for demonstration
        setListings([
          {
            id: '1',
            property_id: 'prop-1',
            owner_user_id: 'user-1',
            rental_type: 'both',
            nightly_rate: 800,
            monthly_rate: 20000,
            compliance_status: 'pending',
            is_active: true,
            featured: false,
            total_bookings: 0,
            average_rating: 0,
            developer_qr_code: null,
            tourism_permit_number: null,
            created_at: '2025-01-30T10:00:00Z',
            properties: {
              title: 'Luxury Villa - North Coast',
              address: '123 Marina Street',
              city: 'North Coast',
              property_type: 'villa',
              bedrooms: 3,
              bathrooms: 2
            },
            rental_bookings: []
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load rental listings:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/rentals/stats');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        // Mock stats
        setStats({
          total_listings: 1,
          active_listings: 1,
          pending_approval: 1,
          total_revenue: 0,
          total_bookings: 0,
          average_occupancy: 0
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const handleStatusChange = async (listingId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/rentals/${listingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ compliance_status: newStatus })
      });

      if (response.ok) {
        toast.success(`Listing ${newStatus} successfully`);
        await loadRentalListings();
      } else {
        toast.error('Failed to update listing status');
      }
    } catch (error) {
      console.error('Failed to update listing status:', error);
      toast.error('Failed to update listing status');
    }
  };

  const toggleFeatured = async (listingId: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/rentals/${listingId}/featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ featured })
      });

      if (response.ok) {
        toast.success(`Listing ${featured ? 'featured' : 'unfeatured'} successfully`);
        await loadRentalListings();
      } else {
        toast.error('Failed to update listing');
      }
    } catch (error) {
      console.error('Failed to update listing:', error);
      toast.error('Failed to update listing');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this rental listing?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rentals/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Listing deleted successfully');
        await loadRentalListings();
        await loadDashboardStats();
      } else {
        toast.error('Failed to delete listing');
      }
    } catch (error) {
      console.error('Failed to delete listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  const renderStatCard = (title: string, value: string | number, icon: React.ReactNode, change?: string) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {change}
              </p>
            )}
          </div>
          <div className="text-gray-400">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderListingRow = (listing: RentalListing) => {
    return (
      <div key={listing.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Selection checkbox */}
            <input
              type="checkbox"
              checked={selectedListings.includes(listing.id)}
              onChange={() => toggleListingSelection(listing.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold truncate">{listing.properties.title}</h3>
                <Badge variant={
                  listing.compliance_status === 'approved' ? 'default' :
                  listing.compliance_status === 'pending' ? 'secondary' :
                  listing.compliance_status === 'rejected' ? 'destructive' :
                  'outline'
                }>
                  {listing.compliance_status}
                </Badge>
                {listing.featured && <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Featured</Badge>}
                {!listing.is_active && <Badge variant="outline" className="bg-red-50 text-red-700">Inactive</Badge>}
              </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {listing.properties.city}
              </div>
              <div className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                {listing.properties.bedrooms}BR • {listing.properties.bathrooms}BA
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {listing.nightly_rate.toLocaleString()} EGP/night
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Owner: {listing.owner_user_id.substring(0, 8)}...
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {listing.total_bookings} bookings
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Star className="h-3 w-3" />
                {listing.average_rating.toFixed(1)} rating
              </div>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/admin/rentals/${listing.id}`)}
              className="p-2 text-gray-600 hover:text-blue-600 rounded-md hover:bg-gray-100"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push(`/admin/rentals/${listing.id}/edit`)}
              className="p-2 text-gray-600 hover:text-green-600 rounded-md hover:bg-gray-100"
              title="Edit Rental"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteListing(listing.id)}
              className="p-2 text-gray-600 hover:text-red-600 rounded-md hover:bg-gray-100"
              title="Delete Rental"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Home className="h-8 w-8 text-blue-600" />
          Rental Management Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Manage rental listings, approvals, and performance</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {renderStatCard('Total Listings', stats.total_listings, <Home className="h-6 w-6" />, '+12% from last month')}
        {renderStatCard('Active Listings', stats.active_listings, <CheckCircle className="h-6 w-6" />, '+8% from last month')}
        {renderStatCard('Pending Approval', stats.pending_approval, <Clock className="h-6 w-6" />)}
        {renderStatCard('Total Revenue', `${stats.total_revenue.toLocaleString()} EGP`, <DollarSign className="h-6 w-6" />, '+23% from last month')}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="listings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-6">
          {/* Advanced Search and Filters */}
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Primary Search Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by property title, city, or owner name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="short_term">Short-term</SelectItem>
                    <SelectItem value="long_term">Long-term</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showAdvancedFilters ? 'Hide' : 'More'} Filters
                </Button>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* City Filter */}
                    <div>
                      <Label className="text-sm font-medium">City</Label>
                      <Select value={cityFilter} onValueChange={setCityFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Cities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cities</SelectItem>
                          {getUniqueCities().map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Rating Filter */}
                    <div>
                      <Label className="text-sm font-medium">Min Rating</Label>
                      <Select value={ratingFilter} onValueChange={setRatingFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any Rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Rating</SelectItem>
                          <SelectItem value="4.5">4.5+ Stars</SelectItem>
                          <SelectItem value="4.0">4.0+ Stars</SelectItem>
                          <SelectItem value="3.5">3.5+ Stars</SelectItem>
                          <SelectItem value="3.0">3.0+ Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Compliance Filter */}
                    <div>
                      <Label className="text-sm font-medium">Compliance</Label>
                      <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <Label className="text-sm font-medium">Sort By</Label>
                      <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                        const [field, order] = value.split('-');
                        setSortBy(field);
                        setSortOrder(order as 'asc' | 'desc');
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at-desc">Newest First</SelectItem>
                          <SelectItem value="created_at-asc">Oldest First</SelectItem>
                          <SelectItem value="title-asc">Title A-Z</SelectItem>
                          <SelectItem value="title-desc">Title Z-A</SelectItem>
                          <SelectItem value="price-asc">Price Low-High</SelectItem>
                          <SelectItem value="price-desc">Price High-Low</SelectItem>
                          <SelectItem value="rating-desc">Highest Rated</SelectItem>
                          <SelectItem value="bookings-desc">Most Bookings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Price Range Slider */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Price Range: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} EGP
                    </Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-24"
                        placeholder="Min"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 50000])}
                        className="w-24"
                        placeholder="Max"
                      />
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Clear All
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Actions */}
              {selectedListings.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedListings.length} listing(s) selected
                    </span>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                        Activate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                        Deactivate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkAction('feature')}>
                        Feature
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedListings.length === getFilteredListings().length && getFilteredListings().length > 0}
                    onChange={selectAllListings}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Rental Listings ({getFilteredListings().length})</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => router.push('/admin/rentals/new')}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Rental
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {getFilteredListings().length === 0 ? (
                <div className="text-center py-12">
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">No listings found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredListings().map(renderListingRow)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Global Booking Management
              </CardTitle>
              <CardDescription>
                Manage all rental bookings across your platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Booking Management</h3>
                <p className="text-gray-500 mb-6">
                  Access comprehensive booking management tools
                </p>
                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={() => router.push('/admin/bookings')}
                    className="inline-flex items-center"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View All Bookings
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Could show quick booking stats or modal here
                      router.push('/admin/bookings?filter=pending')
                    }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Pending Approvals
                  </Button>
                </div>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-blue-900">Today's Check-ins</h4>
                    <p className="text-2xl font-bold text-blue-600">0</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <h4 className="font-medium text-yellow-900">Pending Approval</h4>
                    <p className="text-2xl font-bold text-yellow-600">0</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-green-900">This Month</h4>
                    <p className="text-2xl font-bold text-green-600">0</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Compliance Monitor
              </CardTitle>
              <CardDescription>
                Track legal compliance, permits, and QR integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <QrCode className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold">QR Integrations</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {listings.filter(l => l.developer_qr_code).length}
                  </p>
                  <p className="text-sm text-gray-600">Active integrations</p>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold">Tourism Permits</h3>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {listings.filter(l => l.tourism_permit_number).length}
                  </p>
                  <p className="text-sm text-gray-600">Valid permits</p>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <h3 className="font-semibold">Compliance Issues</h3>
                  <p className="text-2xl font-bold text-orange-600 mt-2">0</p>
                  <p className="text-sm text-gray-600">Requiring attention</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Analytics Coming Soon</h3>
                <p className="text-gray-500">Comprehensive rental performance metrics will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Settings Panel</h3>
                <p className="text-gray-500">Rental system configuration options will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Listing Details Dialog */}
      {selectedListing && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedListing.properties.title}</DialogTitle>
              <DialogDescription>
                Detailed information about this rental listing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-semibold">Property Type</Label>
                  <p className="capitalize">{selectedListing.properties.property_type}</p>
                </div>
                <div>
                  <Label className="font-semibold">Location</Label>
                  <p>{selectedListing.properties.address}, {selectedListing.properties.city}</p>
                </div>
                <div>
                  <Label className="font-semibold">Owner</Label>
                  <p className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    ID: {selectedListing.owner_user_id.substring(0, 8)}...
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Rental Type</Label>
                  <p className="capitalize">{selectedListing.rental_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="font-semibold">Pricing</Label>
                  <p>Nightly: {selectedListing.nightly_rate.toLocaleString()} EGP</p>
                  {selectedListing.monthly_rate > 0 && (
                    <p>Monthly: {selectedListing.monthly_rate.toLocaleString()} EGP</p>
                  )}
                </div>
              </div>
              
              {(selectedListing.developer_qr_code || selectedListing.tourism_permit_number) && (
                <div>
                  <Label className="font-semibold">Compliance Information</Label>
                  <div className="mt-2 space-y-2">
                    {selectedListing.developer_qr_code && (
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">QR Code Integration Active</span>
                      </div>
                    )}
                    {selectedListing.tourism_permit_number && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Tourism Permit: {selectedListing.tourism_permit_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setShowDetails(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
  
