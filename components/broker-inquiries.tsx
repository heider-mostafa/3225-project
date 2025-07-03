'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  MessageCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'new' | 'pending' | 'responded' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  admin_notes?: string;
  properties?: {
    id: string;
    title: string;
    address: string;
    city: string;
    price: number;
    property_photos: Array<{
      url: string;
      is_primary: boolean;
    }>;
  } | null;
}

interface BrokerInquiriesProps {
  brokerId?: string;
}

export default function BrokerInquiries({ brokerId }: BrokerInquiriesProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { toast } = useToast();

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      });

      console.log('BrokerInquiries - fetching with params:', {
        brokerId,
        paramsString: params.toString(),
        fullUrl: `/api/broker/inquiries?${params}`
      });

      const response = await fetch(`/api/broker/inquiries?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch inquiries');
      }

      const data = await response.json();
      
      setInquiries(data.inquiries || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inquiries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [currentPage, search, statusFilter, priorityFilter]);

  const handleStatusUpdate = async (inquiryId: string, newStatus: string) => {
    try {
      setResponding(true);
      const response = await fetch('/api/broker/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_update_status',
          inquiryIds: [inquiryId],
          updateData: { 
            status: newStatus,
            admin_notes: responseText || undefined
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      toast({
        title: 'Success',
        description: 'Inquiry status updated successfully',
      });

      setSelectedInquiry(null);
      setResponseText('');
      fetchInquiries();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update inquiry status',
        variant: 'destructive',
      });
    } finally {
      setResponding(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'responded': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading && inquiries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search inquiries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter || undefined} onValueChange={(value) => setStatusFilter(value || '')}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={priorityFilter || undefined} onValueChange={(value) => setPriorityFilter(value || '')}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inquiries List */}
      <div className="space-y-4">
        {inquiries.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
            <p className="text-gray-600">
              {search || statusFilter || priorityFilter 
                ? 'Try adjusting your filters to see more results.' 
                : 'No inquiries have been received for your properties yet.'
              }
            </p>
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{inquiry.name}</h3>
                      <Badge className={getPriorityColor(inquiry.priority)}>
                        {inquiry.priority}
                      </Badge>
                      <Badge className={getStatusColor(inquiry.status)}>
                        {inquiry.status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {inquiry.email}
                      </div>
                      {inquiry.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {inquiry.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(inquiry.created_at))} ago
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-gray-700 line-clamp-2">{inquiry.message}</p>
                    </div>
                    
                    {inquiry.properties && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">{inquiry.properties.title}</span>
                        <span>•</span>
                        <span>{inquiry.properties.address}, {inquiry.properties.city}</span>
                      </div>
                    )}
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedInquiry(inquiry)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View & Respond
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Inquiry Details</DialogTitle>
                      </DialogHeader>
                      
                      {selectedInquiry && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Name</label>
                              <p className="text-sm">{selectedInquiry.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Email</label>
                              <p className="text-sm">{selectedInquiry.email}</p>
                            </div>
                            {selectedInquiry.phone && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Phone</label>
                                <p className="text-sm">{selectedInquiry.phone}</p>
                              </div>
                            )}
                            {selectedInquiry.properties && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Property</label>
                                <p className="text-sm">{selectedInquiry.properties.title}</p>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-700">Message</label>
                            <p className="text-sm bg-gray-50 p-3 rounded mt-1">{selectedInquiry.message}</p>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-700">Response Notes</label>
                            <Textarea
                              placeholder="Add your response or notes..."
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleStatusUpdate(selectedInquiry.id, 'responded')}
                              disabled={responding}
                              className="flex-1"
                            >
                              {responding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Mark as Responded
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleStatusUpdate(selectedInquiry.id, 'closed')}
                              disabled={responding}
                              className="flex-1"
                            >
                              Close Inquiry
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
} 