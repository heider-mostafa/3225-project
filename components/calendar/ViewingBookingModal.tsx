'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, User, MapPin, Star, Phone, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ViewingBookingModalProps, BookingFormData } from '@/types/broker';

export default function ViewingBookingModal({
  isOpen,
  onClose,
  property,
  broker,
  selectedDate,
  selectedTime,
  onConfirm,
  isLoading = false
}: ViewingBookingModalProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    visitor_name: '',
    visitor_email: '',
    visitor_phone: '',
    party_size: 1,
    viewing_type: 'in_person',
    special_requests: ''
  });
  
  const [errors, setErrors] = useState<Partial<BookingFormData>>({});
  const [submitting, setSubmitting] = useState(false);

  // Format date and time for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<BookingFormData> = {};

    if (!formData.visitor_name.trim()) {
      newErrors.visitor_name = 'Name is required';
    }

    if (!formData.visitor_email.trim()) {
      newErrors.visitor_email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.visitor_email)) {
        newErrors.visitor_email = 'Please enter a valid email address';
      }
    }

    if (formData.visitor_phone && formData.visitor_phone.trim()) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(formData.visitor_phone.trim())) {
        newErrors.visitor_phone = 'Please enter a valid phone number';
      }
    }

    if (formData.party_size < 1 || formData.party_size > 10) {
      newErrors.party_size = 1; // Just to indicate error, we'll show a specific message
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(formData);
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof BookingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Book Your Viewing</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Property Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  {property.property_photos?.[0]?.url ? (
                    <img
                      src={property.property_photos[0].url}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{property.title}</h3>
                  <p className="text-sm text-gray-600">{property.address}</p>
                  <p className="text-lg font-semibold text-green-600 mt-1">
                    ${property.price.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Broker Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {broker.photo_url ? (
                    <img
                      src={broker.photo_url}
                      alt={broker.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{broker.full_name}</span>
                    <Badge variant="secondary" className="text-xs">Licensed Agent</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{broker.rating ? broker.rating.toFixed(1) : '0.0'} ({broker.total_reviews || 0} reviews)</span>
                    <span className="mx-1">•</span>
                    <span>{broker.years_experience || 0}+ years</span>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Date</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Time</p>
                    <p className="text-sm text-gray-900">{formatTime(selectedTime)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div>
                  <Label htmlFor="visitor_name">Full Name *</Label>
                  <Input
                    id="visitor_name"
                    type="text"
                    value={formData.visitor_name}
                    onChange={(e) => handleInputChange('visitor_name', e.target.value)}
                    placeholder="Enter your full name"
                    className={cn(errors.visitor_name && "border-red-500")}
                    disabled={submitting}
                  />
                  {errors.visitor_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.visitor_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="visitor_email">Email Address *</Label>
                  <Input
                    id="visitor_email"
                    type="email"
                    value={formData.visitor_email}
                    onChange={(e) => handleInputChange('visitor_email', e.target.value)}
                    placeholder="your.email@example.com"
                    className={cn(errors.visitor_email && "border-red-500")}
                    disabled={submitting}
                  />
                  {errors.visitor_email && (
                    <p className="text-sm text-red-600 mt-1">{errors.visitor_email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="visitor_phone">Phone Number (Optional)</Label>
                  <Input
                    id="visitor_phone"
                    type="tel"
                    value={formData.visitor_phone}
                    onChange={(e) => handleInputChange('visitor_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={cn(errors.visitor_phone && "border-red-500")}
                    disabled={submitting}
                  />
                  {errors.visitor_phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.visitor_phone}</p>
                  )}
                </div>

                {/* Party Size & Viewing Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="party_size">Party Size</Label>
                    <Select
                      value={formData.party_size.toString()}
                      onValueChange={(value) => handleInputChange('party_size', parseInt(value))}
                      disabled={submitting}
                    >
                      <SelectTrigger className={cn(errors.party_size && "border-red-500")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'person' : 'people'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.party_size && (
                      <p className="text-sm text-red-600 mt-1">Please select 1-10 people</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="viewing_type">Viewing Type</Label>
                    <Select
                      value={formData.viewing_type}
                      onValueChange={(value: 'in_person' | 'virtual' | 'self_guided') => 
                        handleInputChange('viewing_type', value)
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_person">In-Person Tour</SelectItem>
                        <SelectItem value="virtual">Virtual Tour</SelectItem>
                        <SelectItem value="self_guided">Self-Guided Tour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <Label htmlFor="special_requests">Special Requests (Optional)</Label>
                  <Textarea
                    id="special_requests"
                    value={formData.special_requests}
                    onChange={(e) => handleInputChange('special_requests', e.target.value)}
                    placeholder="Any specific areas you'd like to focus on, accessibility needs, or other requests..."
                    rows={3}
                    disabled={submitting}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Please arrive 5 minutes before your scheduled time</li>
                <li>• Bring a valid ID for security purposes</li>
                <li>• You will receive a confirmation email with the broker's contact details</li>
                <li>• If you need to reschedule, please contact us at least 2 hours in advance</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || isLoading}
                className="flex-1"
              >
                {submitting || isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Booking...
                  </div>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 