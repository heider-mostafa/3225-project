'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { createClient } from '@/utils/supabase/client';
import { 
  CalendarDays, 
  Users, 
  CreditCard, 
  Shield, 
  QrCode,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { addDays, format, differenceInDays } from 'date-fns';
import rentalMarketplaceService from '@/lib/services/rental-marketplace-service';
import { useTranslation } from 'react-i18next';

interface RentalBookingFlowProps {
  listingId: string;
  listing: any;
  onBookingComplete?: (booking: any) => void;
  onBookingCancel?: () => void;
}

type BookingStep = 'dates' | 'guests' | 'details' | 'payment' | 'confirmation';

export function RentalBookingFlow({ 
  listingId, 
  listing, 
  onBookingComplete, 
  onBookingCancel 
}: RentalBookingFlowProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState<BookingStep>('dates');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const [bookingData, setBookingData] = useState({
    // Guest information
    number_of_guests: 1,
    guest_phone: '',
    guest_email: '',
    special_requests: '',
    
    // Contact preferences
    preferred_language: 'ar',
    whatsapp_notifications: true,
    
    // Arrival information
    estimated_arrival_time: '15:00',
    transportation_method: '',
    
    // Emergency contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [pricing, setPricing] = useState({
    numberOfNights: 0,
    nightlyRate: 0,
    totalNightsCost: 0,
    cleaningFee: 0,
    platformFee: 0,
    totalAmount: 0
  });

  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([]);

  const [availability, setAvailability] = useState<{
    available: boolean;
    blocked_dates: string[];
  }>({ available: true, blocked_dates: [] });

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedDates.from && selectedDates.to) {
      calculatePricing();
      checkAvailability();
    }
  }, [selectedDates]);

  const updateBookingData = (field: string, value: any) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const calculatePricing = () => {
    if (!selectedDates.from || !selectedDates.to) return;

    const numberOfNights = differenceInDays(selectedDates.to, selectedDates.from);
    const nightlyRate = listing.nightly_rate || 0;
    const totalNightsCost = nightlyRate * numberOfNights;
    const cleaningFee = listing.cleaning_fee || 0;
    const platformFee = totalNightsCost * 0.12; // 12% platform commission
    const totalAmount = totalNightsCost + cleaningFee + platformFee;

    setPricing({
      numberOfNights,
      nightlyRate,
      totalNightsCost,
      cleaningFee,
      platformFee,
      totalAmount
    });
  };

  const checkAvailability = async () => {
    if (!selectedDates.from || !selectedDates.to) return;

    const checkIn = format(selectedDates.from, 'yyyy-MM-dd');
    const checkOut = format(selectedDates.to, 'yyyy-MM-dd');

    const result = await rentalMarketplaceService.checkAvailability(listingId, checkIn, checkOut);
    if (result.success) {
      setAvailability({
        available: result.available || false,
        blocked_dates: result.blocked_dates || []
      });
    }
  };

  const nextStep = async () => {
    const steps: BookingStep[] = ['dates', 'guests', 'details', 'payment', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      const nextStepName = steps[currentIndex + 1];
      
      // If moving to payment step, fetch available payment methods
      if (nextStepName === 'payment') {
        await fetchPaymentMethods();
      }
      
      setCurrentStep(nextStepName);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      console.log('🔍 Fetching payment methods for amount:', pricing.totalAmount);
      const response = await fetch(`/api/payments/methods?amount=${pricing.totalAmount}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Available payment methods:', data.payment_methods);
        setAvailablePaymentMethods(data.payment_methods || []);
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch payment methods:', error);
      // Set default payment methods (comprehensive Egyptian market)
      setAvailablePaymentMethods([
        { id: 'card', name: 'Credit/Debit Cards', type: 'card' },
        { id: 'apple_pay', name: 'Apple Pay', type: 'wallet' },
        { id: 'google_pay', name: 'Google Pay', type: 'wallet' },
        { id: 'vodafone_cash', name: 'Vodafone Cash', type: 'wallet' },
        { id: 'orange_cash', name: 'Orange Cash', type: 'wallet' },
        { id: 'etisalat_cash', name: 'Etisalat Cash', type: 'wallet' },
        { id: 'instapay', name: 'InstaPay', type: 'bank_transfer' },
        { id: 'fawry', name: 'Fawry', type: 'wallet' },
        { id: 'valu', name: 'valU', type: 'bnpl' },
        { id: 'souhoola', name: 'Souhoola', type: 'bnpl' },
        { id: 'shahry', name: 'Shahry', type: 'bnpl' }
      ]);
    }
  };

  const prevStep = () => {
    const steps: BookingStep[] = ['dates', 'guests', 'details', 'payment', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const submitBooking = async (isRetry: boolean = false) => {
    if (!selectedDates.from || !selectedDates.to) return;

    setIsProcessing(true);
    if (!isRetry) {
      setRetryCount(0);
      setLastError(null);
    }
    
    try {
      // Check if user is authenticated
      if (!currentUser) {
        const errorMsg = 'Please sign in to complete your booking';
        setLastError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      console.log('👤 Current user:', {
        id: currentUser.id,
        email: currentUser.email,
        isAuthenticated: !!currentUser,
        retryAttempt: retryCount + 1
      });

      // Get session to debug auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 Session check:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        sessionError: sessionError
      });

      // Validate required fields before API call
      if (!bookingData.guest_phone || !bookingData.guest_email) {
        const errorMsg = 'Please fill in all required contact information';
        setLastError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Create booking and payment in one API call using the correct endpoint
      console.log('📝 Creating booking with payment via /api/rentals/[id]/book');
      const bookingRequestBody = {
        check_in_date: format(selectedDates.from, 'yyyy-MM-dd'),
        check_out_date: format(selectedDates.to, 'yyyy-MM-dd'),
        number_of_guests: bookingData.number_of_guests,
        guest_phone: bookingData.guest_phone,
        guest_email: bookingData.guest_email,
        special_requests: bookingData.special_requests
      };

      console.log('📋 Booking request body:', JSON.stringify(bookingRequestBody, null, 2));

      const bookingResponse = await fetch(`/api/rentals/${listingId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bookingRequestBody)
      });

      console.log('📡 Booking API Response status:', bookingResponse.status);
      
      if (!bookingResponse.ok) {
        const errorText = await bookingResponse.text();
        console.error('❌ Booking API Error Response:', errorText);
        
        let errorMessage = `Booking failed: ${bookingResponse.status} ${bookingResponse.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.warn('Could not parse error response as JSON');
        }

        // Handle specific error cases
        if (bookingResponse.status === 400) {
          if (errorMessage.includes('dates are not available')) {
            errorMessage = 'Selected dates are no longer available. Please choose different dates.';
            // Reset to dates step to allow user to select new dates
            setCurrentStep('dates');
          } else if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
            errorMessage = 'Session expired. Please sign in again.';
            // Could trigger re-authentication here
          }
        } else if (bookingResponse.status === 500) {
          errorMessage = 'Server error occurred. Please try again in a few moments.';
        } else if (bookingResponse.status >= 502 && bookingResponse.status <= 504) {
          errorMessage = 'Service temporarily unavailable. Please try again.';
        }

        setLastError(errorMessage);
        
        // Show retry option for retryable errors
        if (isRetryableError(bookingResponse.status) && retryCount < 2) {
          toast.error(`${errorMessage} (Attempt ${retryCount + 1}/3)`);
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      const bookingResult = await bookingResponse.json();
      console.log('✅ Booking and Payment API Success Response:', JSON.stringify(bookingResult, null, 2));

      if (!bookingResult.success || !bookingResult.booking) {
        const errorMessage = bookingResult.error || 'Failed to create booking';
        console.error('❌ Booking creation failed:', errorMessage);
        setLastError(errorMessage);
        
        // Show retry option for server-side failures
        if (retryCount < 2) {
          toast.error(`${errorMessage} (Attempt ${retryCount + 1}/3)`);
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      console.log('✅ Booking and payment created successfully:', bookingResult.booking.id);
      
      // Reset error state on success
      setLastError(null);
      setRetryCount(0);
      
      // Get payment URLs from the unified response
      const iframeUrl = bookingResult.iframe_url;
      const redirectUrl = bookingResult.payment_url;
      
      console.log('🔗 iframe_url:', iframeUrl);
      console.log('🔗 redirect_url:', redirectUrl);
      
      if (iframeUrl) {
        console.log('🚀 Opening payment iframe:', iframeUrl);
        // Open payment iframe in new window
        const paymentWindow = window.open(
          iframeUrl, 
          'paymob-payment', 
          'width=800,height=600,scrollbars=yes,resizable=yes,location=yes,menubar=no,toolbar=no'
        );
        
        if (paymentWindow) {
          toast.success('Payment window opened. Complete your payment to confirm booking.');
          
          // Monitor payment window for completion
          const checkPaymentWindow = setInterval(() => {
            if (paymentWindow.closed) {
              clearInterval(checkPaymentWindow);
              // Optional: Check payment status after window closes
              setTimeout(() => {
                checkPaymentStatus(bookingResult.booking.id);
              }, 2000);
            }
          }, 1000);
          
        } else {
          const errorMsg = 'Popup blocked. Please allow popups and try again.';
          setLastError(errorMsg);
          toast.error(errorMsg);
        }
      } else if (redirectUrl) {
        console.log('🔄 Redirecting to payment URL:', redirectUrl);
        window.location.href = redirectUrl;
      } else {
        const errorMsg = 'Payment initialization failed - no payment URL provided';
        console.error('❌ No payment URL found in response');
        setLastError(errorMsg);
        toast.error(errorMsg);
      }
      
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'An error occurred while processing payment';
      setLastError(errorMessage);
      
      // Network or unexpected errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = 'Network connection failed. Please check your internet connection.';
        setLastError(networkError);
        toast.error(networkError);
      } else if (retryCount < 2) {
        toast.error(`${errorMessage} (Attempt ${retryCount + 1}/3)`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if an error is retryable
  const isRetryableError = (status: number): boolean => {
    return status >= 500 || status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
  };

  // Retry booking with exponential backoff
  const retryBooking = async () => {
    if (retryCount >= 2) {
      toast.error('Maximum retry attempts reached. Please try again later.');
      return;
    }

    const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
    setRetryCount(prev => prev + 1);
    
    toast.info(`Retrying in ${delay / 1000} seconds... (Attempt ${retryCount + 2}/3)`);
    
    setTimeout(() => {
      submitBooking(true);
    }, delay);
  };

  // Check payment status after payment window closes
  const checkPaymentStatus = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const statusData = await response.json();
        if (statusData.payment_status === 'paid') {
          toast.success('Payment successful! Your booking is confirmed.');
          setCurrentStep('confirmation');
          onBookingComplete?.(statusData.booking);
        } else if (statusData.payment_status === 'failed') {
          toast.error('Payment failed. You can try booking again.');
        }
        // If still pending, don't show anything - user might still be paying
      }
    } catch (error) {
      console.warn('Could not check payment status:', error);
      // Don't show error to user, this is just a convenience check
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {['dates', 'guests', 'details', 'payment', 'confirmation'].map((step, index) => {
        const isActive = currentStep === step;
        const isCompleted = ['dates', 'guests', 'details', 'payment'].indexOf(currentStep) > index;
        
        return (
          <div key={step} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
            `}>
              {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
            </div>
            <div className="ml-2 text-sm font-medium text-gray-600 capitalize">
              {step}
            </div>
            {index < 4 && (
              <div className={`w-8 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderDateSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          Select Your Dates
        </h3>
        <p className="text-gray-600">Choose your check-in and check-out dates</p>
      </div>

      <div className="flex justify-center">
        <Calendar
          mode="range"
          selected={selectedDates}
          onSelect={(range) => setSelectedDates({
            from: range?.from,
            to: range?.to
          })}
          disabled={(date) => 
            date < new Date() || 
            availability.blocked_dates.includes(format(date, 'yyyy-MM-dd'))
          }
          numberOfMonths={2}
          className="rounded-md border"
        />
      </div>

      {selectedDates.from && selectedDates.to && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <Label className="text-sm text-gray-600">Check-in</Label>
                <p className="font-semibold">{format(selectedDates.from, 'MMM dd, yyyy')}</p>
                <p className="text-sm text-gray-500">After {listing.check_in_time}</p>
              </div>
              <div className="text-right">
                <Label className="text-sm text-gray-600">Check-out</Label>
                <p className="font-semibold">{format(selectedDates.to, 'MMM dd, yyyy')}</p>
                <p className="text-sm text-gray-500">Before {listing.check_out_time}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{pricing.numberOfNights} nights</span>
                <span className="font-semibold text-lg">{pricing.totalAmount.toLocaleString()} EGP</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!availability.available && selectedDates.from && selectedDates.to && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some dates in your selection are not available. Please choose different dates.
          </AlertDescription>
        </Alert>
      )}

      {selectedDates.from && selectedDates.to && pricing.numberOfNights < listing.minimum_stay_nights && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Minimum stay is {listing.minimum_stay_nights} nights. Please extend your dates.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderGuestSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          {t('rentals.guestInformation')}
        </h3>
        <p className="text-gray-600">How many guests will be staying?</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label>{t('rentals.numberOfGuests')}</Label>
              <div className="flex items-center gap-4 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateBookingData('number_of_guests', Math.max(1, bookingData.number_of_guests - 1))}
                  disabled={bookingData.number_of_guests <= 1}
                >
                  -
                </Button>
                <span className="text-lg font-semibold w-12 text-center">{bookingData.number_of_guests}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateBookingData('number_of_guests', Math.min(listing.maximum_occupancy || 10, bookingData.number_of_guests + 1))}
                  disabled={bookingData.number_of_guests >= (listing.maximum_occupancy || 10)}
                >
                  +
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Maximum occupancy: {listing.maximum_occupancy || 10} guests
              </p>
            </div>

            {bookingData.number_of_guests > (listing.properties?.bedrooms * 2 || 4) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Additional guest fees may apply for more than {listing.properties?.bedrooms * 2 || 4} guests.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">House Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {listing.house_rules && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${listing.house_rules.smoking_allowed ? 'bg-green-500' : 'bg-red-500'}`} />
                  {listing.house_rules.smoking_allowed ? 'Smoking allowed' : 'No smoking'}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${listing.house_rules.pets_allowed ? 'bg-green-500' : 'bg-red-500'}`} />
                  {listing.house_rules.pets_allowed ? 'Pets allowed' : 'No pets'}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${listing.house_rules.parties_allowed ? 'bg-green-500' : 'bg-red-500'}`} />
                  {listing.house_rules.parties_allowed ? 'Parties allowed' : 'No parties'}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-gray-500" />
                  Quiet hours: {listing.house_rules.quiet_hours || '22:00-08:00'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGuestDetails = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          Contact Details
        </h3>
        <p className="text-gray-600">We need your contact information for booking confirmation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Primary Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Phone Number *</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                  +20
                </span>
                <Input
                  value={bookingData.guest_phone}
                  onChange={(e) => updateBookingData('guest_phone', e.target.value)}
                  placeholder="1234567890"
                  className="rounded-l-none"
                />
              </div>
            </div>
            <div>
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={bookingData.guest_email}
                onChange={(e) => updateBookingData('guest_email', e.target.value)}
                placeholder="guest@example.com"
              />
            </div>
          </div>

          <div>
            <Label>Estimated Arrival Time</Label>
            <Input
              type="time"
              value={bookingData.estimated_arrival_time}
              onChange={(e) => updateBookingData('estimated_arrival_time', e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Check-in available after {listing.check_in_time}
            </p>
          </div>

          <div>
            <Label>Transportation Method (Optional)</Label>
            <Input
              value={bookingData.transportation_method}
              onChange={(e) => updateBookingData('transportation_method', e.target.value)}
              placeholder="Car, taxi, airport transfer, etc."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Emergency Contact Name</Label>
              <Input
                value={bookingData.emergency_contact_name}
                onChange={(e) => updateBookingData('emergency_contact_name', e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Emergency Contact Phone</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                  +20
                </span>
                <Input
                  value={bookingData.emergency_contact_phone}
                  onChange={(e) => updateBookingData('emergency_contact_phone', e.target.value)}
                  placeholder="1234567890"
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Special Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={bookingData.special_requests}
            onChange={(e) => updateBookingData('special_requests', e.target.value)}
            placeholder="Any special requirements or requests? (early check-in, late check-out, accessibility needs, etc.)"
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
          <CreditCard className="h-5 w-5 text-indigo-600" />
          {t('rentals.paymentConfirmation')}
        </h3>
        <p className="text-gray-600">Review your booking and proceed to payment</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('rentals.bookingSummary')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <div>
              <p className="font-medium">{listing.properties?.title}</p>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {listing.properties?.address}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Check-in:</span>
              <span>{selectedDates.from && format(selectedDates.from, 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-out:</span>
              <span>{selectedDates.to && format(selectedDates.to, 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('rentals.guests')}:</span>
              <span>{bookingData.number_of_guests}</span>
            </div>
            <div className="flex justify-between">
              <span>Nights:</span>
              <span>{pricing.numberOfNights}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>{pricing.nightlyRate} EGP × {pricing.numberOfNights} nights</span>
            <span>{pricing.totalNightsCost.toLocaleString()} EGP</span>
          </div>
          
          {pricing.cleaningFee > 0 && (
            <div className="flex justify-between">
              <span>Cleaning fee</span>
              <span>{pricing.cleaningFee.toLocaleString()} EGP</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Platform service fee</span>
            <span>{pricing.platformFee.toLocaleString()} EGP</span>
          </div>
          
          <div className="border-t pt-3 flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{pricing.totalAmount.toLocaleString()} EGP</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('rentals.availablePaymentMethods')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-blue-50">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">Paymob Secure Payment</p>
                <p className="text-sm text-gray-600">
                  Choose your preferred payment method in the next step
                </p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                Secure
              </Badge>
            </div>
            
            {availablePaymentMethods.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {availablePaymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    {method.id === 'apple_pay' && <span className="text-lg">🍎</span>}
                    {method.id === 'google_pay' && <span className="text-lg">📱</span>}
                    {method.id === 'card' && <CreditCard className="h-4 w-4" />}
                    {method.id === 'vodafone_cash' && <span className="text-lg">📞</span>}
                    {method.id === 'orange_cash' && <span className="text-lg">🟠</span>}
                    {method.id === 'etisalat_cash' && <span className="text-lg">💚</span>}
                    {method.id === 'instapay' && <span className="text-lg">⚡</span>}
                    {method.id === 'fawry' && <span className="text-lg">🏪</span>}
                    {method.id === 'valu' && <span className="text-lg">💳</span>}
                    {method.id === 'souhoola' && <span className="text-lg">📊</span>}
                    {method.id === 'shahry' && <span className="text-lg">🗓️</span>}
                    <span className="text-sm font-medium">{method.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              * Final payment method selection will be available in the payment popup
            </p>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your payment is protected. You won't be charged until your booking is confirmed by the host.
          Cancellation policy: {listing.cancellation_policy}
        </AlertDescription>
      </Alert>

      {/* Error handling and retry section */}
      {lastError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-3">
              <p><strong>Booking Error:</strong> {lastError}</p>
              {retryCount < 2 && isRetryableError(500) && ( // Show retry for recoverable errors
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryBooking}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      'Retry Booking'
                    )}
                  </Button>
                  <span className="text-sm text-gray-600 flex items-center">
                    Attempt {retryCount + 1}/3
                  </span>
                </div>
              )}
              {retryCount >= 2 && (
                <p className="text-sm text-red-600">
                  Maximum retry attempts reached. Please check your information and try again later.
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderConfirmation = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-2xl font-semibold text-green-600 mb-2">{t('rentals.bookingConfirmed')}!</h3>
        <p className="text-gray-600">
          Your rental booking has been confirmed. You'll receive confirmation details via email and SMS.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <QrCode className="h-6 w-6 text-gray-600" />
              <div>
                <p className="font-medium">Check-in QR Code</p>
                <p className="text-sm text-gray-600">You'll receive your QR code 24 hours before check-in</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="h-6 w-6 text-gray-600" />
              <div>
                <p className="font-medium">Host Contact</p>
                <p className="text-sm text-gray-600">Property management team will contact you before arrival</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 'dates':
        return selectedDates.from && selectedDates.to && availability.available && 
               pricing.numberOfNights >= listing.minimum_stay_nights;
      case 'guests':
        return bookingData.number_of_guests >= 1;
      case 'details':
        return bookingData.guest_phone && bookingData.guest_email;
      case 'payment':
        return true;
      default:
        return true;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('rentals.bookYourStay')}</CardTitle>
        <CardDescription>Complete your rental booking in a few simple steps</CardDescription>
      </CardHeader>

      <CardContent>
        {renderStepIndicator()}

        <div className="min-h-[600px]">
          {currentStep === 'dates' && renderDateSelection()}
          {currentStep === 'guests' && renderGuestSelection()}
          {currentStep === 'details' && renderGuestDetails()}
          {currentStep === 'payment' && renderPayment()}
          {currentStep === 'confirmation' && renderConfirmation()}
        </div>

        {currentStep !== 'confirmation' && (
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={currentStep === 'dates' ? onBookingCancel : prevStep}
            >
              {currentStep === 'dates' ? t('common.cancel') : t('common.back')}
            </Button>

            <Button
              onClick={currentStep === 'payment' ? submitBooking : nextStep}
              disabled={!canProceed() || isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : currentStep === 'payment' ? (
                t('rentals.confirmPay')
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}