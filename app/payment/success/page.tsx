'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Calendar, MapPin, User, DollarSign, Clock, ArrowLeft, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface BookingDetails {
  id: string;
  confirmation_number: string;
  booking_type: 'appraiser' | 'rental' | 'viewing';
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  
  // Property details
  property?: {
    id: string;
    title: string;
    address: string;
    city: string;
  };
  
  // Appraiser details (for appraiser bookings)
  appraiser?: {
    id: string;
    full_name: string;
    phone: string;
    email: string;
  };
  
  // Rental details (for rental bookings)
  rental?: {
    id: string;
    check_in_date: string;
    check_out_date: string;
    guests: number;
    nightly_rate: number;
    total_nights: number;
  };
}

export default function PaymentSuccessPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const bookingId = searchParams.get('booking_id');
  const paymentId = searchParams.get('payment_id');
  const type = searchParams.get('type') || 'appraiser';

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    } else {
      setError(t('payment.success.missingBookingId'));
      setLoading(false);
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      
      // Determine which API endpoint to use based on booking type
      const endpoint = type === 'rental' 
        ? `/api/rentals/${bookingId}/booking-details`
        : `/api/appraisers/bookings/${bookingId}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to load booking details');
      }
      
      const data = await response.json();
      setBooking(data.booking || data);
      
    } catch (err) {
      console.error('Error loading booking details:', err);
      setError(t('payment.success.failedToLoadBooking'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/receipt`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${booking?.confirmation_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download receipt');
      }
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('payment.success.failedToDownloadReceipt'),
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('payment.success.shareTitle'),
          text: t('payment.success.shareText', { confirmationNumber: booking?.confirmation_number }),
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: t('payment.success.linkCopied'),
        description: t('payment.success.linkCopiedDescription'),
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('payment.success.loadingBookingDetails')}</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">{t('common.error')}</CardTitle>
            <CardDescription>{error || t('payment.success.bookingNotFound')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.backToHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('payment.success.paymentSuccessful')}
          </h1>
          <p className="text-gray-600 text-lg">
            {t('payment.success.bookingConfirmed')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('payment.success.bookingDetails')}</CardTitle>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {t('payment.success.confirmed')}
                  </Badge>
                </div>
                <CardDescription>
                  {t('payment.success.confirmationNumber')}: <span className="font-semibold">{booking.confirmation_number}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Property Information */}
                {booking.property && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold">{booking.property.title}</p>
                      <p className="text-gray-600">{booking.property.address}, {booking.property.city}</p>
                    </div>
                  </div>
                )}

                {/* Date and Time */}
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-semibold">{t('payment.success.scheduledDate')}</p>
                    <p className="text-gray-600">
                      {formatDate(booking.scheduled_date)}
                      {booking.scheduled_time && ` ${t('common.at')} ${booking.scheduled_time}`}
                    </p>
                  </div>
                </div>

                {/* Appraiser Details (if applicable) */}
                {booking.appraiser && (
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t('payment.success.appraiser')}</p>
                      <p className="text-gray-600">{booking.appraiser.full_name}</p>
                      <div className="flex space-x-4 mt-1">
                        <a href={`tel:${booking.appraiser.phone}`} className="text-blue-600 hover:underline text-sm">
                          {booking.appraiser.phone}
                        </a>
                        <a href={`mailto:${booking.appraiser.email}`} className="text-blue-600 hover:underline text-sm">
                          {booking.appraiser.email}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rental Details (if applicable) */}
                {booking.rental && (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-semibold">{t('payment.success.stayPeriod')}</p>
                        <p className="text-gray-600">
                          {formatDate(booking.rental.check_in_date)} - {formatDate(booking.rental.check_out_date)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.rental.total_nights} {t('payment.success.nights')} • {booking.rental.guests} {t('payment.success.guests')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>{t('payment.success.nextSteps')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">1</span>
                    </div>
                    <p className="text-gray-700">{t('payment.success.step1')}</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">2</span>
                    </div>
                    <p className="text-gray-700">{t('payment.success.step2')}</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">3</span>
                    </div>
                    <p className="text-gray-700">{t('payment.success.step3')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Payment Summary & Actions */}
          <div className="space-y-6">
            
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t('payment.success.paymentSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('payment.success.totalAmount')}</span>
                  <span className="font-semibold">{formatPrice(booking.total_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('payment.success.paymentMethod')}</span>
                  <span className="text-sm">{booking.payment_method}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('payment.success.paidOn')}</span>
                  <span className="text-sm">{formatDate(booking.created_at)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>{t('payment.success.status')}</span>
                  <Badge className="bg-green-100 text-green-800">{t('payment.success.paid')}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>{t('payment.success.actions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleDownloadReceipt}
                  variant="outline" 
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('payment.success.downloadReceipt')}
                </Button>
                
                <Button 
                  onClick={handleShare}
                  variant="outline" 
                  className="w-full"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('payment.success.shareBooking')}
                </Button>
                
                <Separator />
                
                <Link href="/profile" className="block">
                  <Button variant="outline" className="w-full">
                    {t('payment.success.viewMyBookings')}
                  </Button>
                </Link>
                
                <Link href="/" className="block">
                  <Button className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common.backToHome')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>{t('payment.success.needHelp')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  {t('payment.success.supportDescription')}
                </p>
                <div className="space-y-2">
                  <a href="tel:+201000000000" className="block text-blue-600 hover:underline text-sm">
                    📞 {t('payment.success.callSupport')}
                  </a>
                  <a href="mailto:support@virtualestate.com" className="block text-blue-600 hover:underline text-sm">
                    ✉️ {t('payment.success.emailSupport')}
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}