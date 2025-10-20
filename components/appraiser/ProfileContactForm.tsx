'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  MapPin,
  Home,
  Building,
  DollarSign,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ContactFormData {
  client_name: string;
  client_email: string;
  client_phone: string;
  contact_preference: 'email' | 'phone' | 'whatsapp';
  appraisal_type: 'purchase' | 'sale' | 'refinance' | 'insurance' | 'legal' | 'investment';
  property_type: 'residential' | 'commercial' | 'villa' | 'land' | 'industrial';
  property_address: string;
  property_size: string;
  estimated_value: string;
  urgency: 'standard' | 'urgent' | 'flexible';
  preferred_date: string;
  additional_requirements: string;
  message: string;
}

interface ProfileContactFormProps {
  appraiser_id: string;
  appraiser_name: string;
  contact_preferences: {
    phone: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  response_time_hours: number;
  service_areas: string[];
  pricing_info?: {
    base_fee: number;
    rush_fee: number;
    currency: string;
  };
}

export function ProfileContactForm({
  appraiser_id,
  appraiser_name,
  contact_preferences,
  response_time_hours,
  service_areas,
  pricing_info
}: ProfileContactFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ContactFormData>({
    client_name: '',
    client_email: '',
    client_phone: '',
    contact_preference: 'email',
    appraisal_type: 'purchase',
    property_type: 'residential',
    property_address: '',
    property_size: '',
    estimated_value: '',
    urgency: 'standard',
    preferred_date: '',
    additional_requirements: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  const updateFormData = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Calculate estimated cost when relevant fields change
    if (['property_type', 'urgency'].includes(field) && pricing_info) {
      calculateEstimatedCost({
        ...formData,
        [field]: value
      });
    }
  };

  const calculateEstimatedCost = (data: ContactFormData) => {
    if (!pricing_info) return;
    
    let baseCost = pricing_info.base_fee;
    
    // Property type multipliers
    const propertyMultipliers = {
      'residential': 1.0,
      'villa': 1.2,
      'commercial': 1.5,
      'industrial': 1.8,
      'land': 0.8
    };
    
    baseCost *= propertyMultipliers[data.property_type] || 1.0;
    
    // Add rush fee if urgent
    if (data.urgency === 'urgent') {
      baseCost += pricing_info.rush_fee;
    }
    
    setEstimatedCost(Math.round(baseCost));
  };

  const validateForm = (): boolean => {
    const requiredFields = ['client_name', 'client_email', 'property_address', 'message'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof ContactFormData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.client_email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/appraisers/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appraiser_id,
          ...formData,
          estimated_cost: estimatedCost
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const result = await response.json();
      
      setIsSubmitted(true);
      toast.success('Message sent successfully! You will receive a response soon.');
      
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent Successfully!</h3>
          <p className="text-gray-600 mb-4">
            Your appraisal request has been sent to {appraiser_name}. 
            You can expect a response within {response_time_hours} hours.
          </p>
          <p className="text-sm text-gray-500">
            A confirmation email has been sent to {formData.client_email}
          </p>
          <Button 
            onClick={() => setIsSubmitted(false)} 
            variant="outline" 
            className="mt-4"
          >
            Send Another Message
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Contact {appraiser_name}
        </CardTitle>
        <CardDescription>
          Request a property appraisal or ask questions about services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Contact Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Full Name *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => updateFormData('client_name', e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="client_email">Email Address *</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => updateFormData('client_email', e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_phone">Phone Number</Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => updateFormData('client_phone', e.target.value)}
                  placeholder="+20 10 xxxx xxxx"
                />
              </div>
              
              <div>
                <Label htmlFor="contact_preference">{t('appraiserDashboard.preferredContactMethod')}</Label>
                <Select 
                  value={formData.contact_preference} 
                  onValueChange={(value) => updateFormData('contact_preference', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contact_preferences.email && (
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </SelectItem>
                    )}
                    {contact_preferences.phone && (
                      <SelectItem value="phone">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Call
                        </div>
                      </SelectItem>
                    )}
                    {contact_preferences.whatsapp && (
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          WhatsApp
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Appraisal Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Appraisal Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appraisal_type">Appraisal Purpose</Label>
                <Select 
                  value={formData.appraisal_type} 
                  onValueChange={(value) => updateFormData('appraisal_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Property Purchase</SelectItem>
                    <SelectItem value="sale">Property Sale</SelectItem>
                    <SelectItem value="refinance">Mortgage Refinancing</SelectItem>
                    <SelectItem value="insurance">Insurance Purposes</SelectItem>
                    <SelectItem value="legal">Legal/Estate Settlement</SelectItem>
                    <SelectItem value="investment">Investment Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="property_type">Property Type</Label>
                <Select 
                  value={formData.property_type} 
                  onValueChange={(value) => updateFormData('property_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential Apartment</SelectItem>
                    <SelectItem value="villa">Villa/House</SelectItem>
                    <SelectItem value="commercial">Commercial Property</SelectItem>
                    <SelectItem value="land">Land/Plot</SelectItem>
                    <SelectItem value="industrial">Industrial Property</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="property_address">Property Address *</Label>
              <Input
                id="property_address"
                value={formData.property_address}
                onChange={(e) => updateFormData('property_address', e.target.value)}
                placeholder="Full property address"
                required
              />
              {service_areas.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Service areas:</p>
                  <div className="flex flex-wrap gap-1">
                    {service_areas.map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property_size">Property Size</Label>
                <Input
                  id="property_size"
                  value={formData.property_size}
                  onChange={(e) => updateFormData('property_size', e.target.value)}
                  placeholder="e.g., 120 sqm"
                />
              </div>
              
              <div>
                <Label htmlFor="estimated_value">Estimated Value</Label>
                <Input
                  id="estimated_value"
                  value={formData.estimated_value}
                  onChange={(e) => updateFormData('estimated_value', e.target.value)}
                  placeholder="e.g., 2,500,000 EGP"
                />
              </div>
            </div>
          </div>

          {/* Timing and Urgency */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Timing Requirements</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select 
                  value={formData.urgency} 
                  onValueChange={(value) => updateFormData('urgency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flexible">Flexible Timing</SelectItem>
                    <SelectItem value="standard">Standard (3-5 days)</SelectItem>
                    <SelectItem value="urgent">Urgent (24-48 hours)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="preferred_date">Preferred Date</Label>
                <Input
                  id="preferred_date"
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => updateFormData('preferred_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Additional Requirements */}
          <div>
            <Label htmlFor="additional_requirements">Additional Requirements</Label>
            <Textarea
              id="additional_requirements"
              value={formData.additional_requirements}
              onChange={(e) => updateFormData('additional_requirements', e.target.value)}
              placeholder="Any specific requirements, access instructions, or special considerations..."
              rows={3}
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => updateFormData('message', e.target.value)}
              placeholder="Please provide details about your appraisal needs..."
              rows={4}
              required
            />
          </div>

          {/* Estimated Cost */}
          {estimatedCost && pricing_info && (
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                <strong>Estimated Cost:</strong> {formatCurrency(estimatedCost)}
                {formData.urgency === 'urgent' && (
                  <span className="text-orange-600"> (includes rush fee)</span>
                )}
                <br />
                <span className="text-sm text-gray-600">
                  Final pricing will be confirmed by the appraiser based on specific requirements.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Response Time Info */}
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Expected Response Time:</strong> {response_time_hours} hours
              <br />
              <span className="text-sm text-gray-600">
                {appraiser_name} typically responds to inquiries within {response_time_hours} hours during business days.
              </span>
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Message...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Appraisal Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}