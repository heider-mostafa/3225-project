'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  DollarSign,
  Mail,
  Phone,
  QrCode,
  Download,
  Star,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';

interface RentalBookingDetails {
  id: string;
  rental_listing_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  number_of_nights: number;
  total_amount: number;
  guest_phone: string;
  guest_email: string;
  booking_status: string;
  payment_status: string;
  special_requests?: string;
  rental_listings: {
    properties: {
      title: string;
      address: string;
      city: string;
    };
    check_in_time: string;
    check_out_time: string;
    house_rules?: any;
  };
}

export default function RentalPaymentSuccessPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [booking, setBooking] = useState<RentalBookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = searchParams.get('booking_id');
  const transactionId = searchParams.get('transaction_id');
  const success = searchParams.get('success');

  useEffect(() => {
    if (success !== 'true' || !bookingId) {
      setError('Invalid payment confirmation parameters');
      setLoading(false);
      return;
    }

    fetchBookingDetails();
  }, [bookingId, success]);

  const fetchBookingDetails = async () => {
    try {
      const supabase = createClient();
      
      const { data: bookingData, error: bookingError } = await supabase
        .from('rental_bookings')
        .select(`
          *,
          rental_listings!inner(
            check_in_time,
            check_out_time,
            house_rules,
            properties!inner(
              title,
              address,
              city
            )
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError || !bookingData) {
        throw new Error('Booking not found');
      }

      setBooking(bookingData);
    } catch (err: any) {
      setError(err.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!booking) return;
    
    try {
      const response = await fetch(`/api/bookings/${booking.id}/receipt`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rental-receipt-${booking.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download receipt');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('paymentSuccess.loadingBookingDetails')}</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">{t('paymentSuccess.errorTitle')}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/rentals')} 
              className="w-full"
            >
              {t('paymentSuccess.backToRentals')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            {t('paymentSuccess.rentalTitle')}
          </h1>
          <p className="text-gray-600 text-lg">
            {t('paymentSuccess.rentalSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  {t('paymentSuccess.propertyDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{booking.rental_listings.properties.title}</h3>
                    <p className="text-gray-600 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {booking.rental_listings.properties.address}, {booking.rental_listings.properties.city}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500">{t('paymentSuccess.checkIn')}</p>
                      <p className="font-semibold">
                        {format(new Date(booking.check_in_date), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('paymentSuccess.after')} {booking.rental_listings.check_in_time}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('paymentSuccess.checkOut')}</p>
                      <p className="font-semibold">
                        {format(new Date(booking.check_out_date), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('paymentSuccess.before')} {booking.rental_listings.check_out_time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{booking.number_of_guests} {t('paymentSuccess.guests')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{booking.number_of_nights} {t('paymentSuccess.nights')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  {t('paymentSuccess.paymentSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>{t('paymentSuccess.bookingId')}</span>
                    <span className="font-mono text-sm">{booking.id}</span>
                  </div>
                  {transactionId && (
                    <div className="flex justify-between">
                      <span>{t('paymentSuccess.transactionId')}</span>
                      <span className="font-mono text-sm">{transactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t('paymentSuccess.paymentStatus')}</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {t('paymentSuccess.paid')}
                    </Badge>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-3 border-t">
                    <span>{t('paymentSuccess.totalPaid')}</span>
                    <span>{booking.total_amount.toLocaleString()} {t('paymentSuccess.egp')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Requests */}
            {booking.special_requests && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('paymentSuccess.specialRequests')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{booking.special_requests}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Next Steps */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  {t('paymentSuccess.contactInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{booking.guest_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{booking.guest_phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  {t('paymentSuccess.nextSteps')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium">{t('paymentSuccess.step1Title')}</p>
                      <p className="text-sm text-gray-600">{t('paymentSuccess.step1Desc')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">2</span>
                    </div>
                    <div>
                      <p className="font-medium">{t('paymentSuccess.step2Title')}</p>
                      <p className="text-sm text-gray-600">{t('paymentSuccess.step2Desc')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">3</span>
                    </div>
                    <div>
                      <p className="font-medium">{t('paymentSuccess.step3Title')}</p>
                      <p className="text-sm text-gray-600">{t('paymentSuccess.step3Desc')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-green-600" />
                  {t('paymentSuccess.digitalAccess')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">{t('paymentSuccess.qrCodeDesc')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleDownloadReceipt}
                variant="outline" 
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('paymentSuccess.downloadReceipt')}
              </Button>
              
              <Button 
                onClick={() => router.push('/rentals')}
                className="w-full"
              >
                {t('paymentSuccess.browseMoreRentals')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <Alert className="mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{t('paymentSuccess.importantNote')}</strong> {t('paymentSuccess.importantDesc')}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}