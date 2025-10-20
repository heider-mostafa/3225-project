'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, User, Clock, CreditCard, Shield } from 'lucide-react';
import PaymobIntentionCheckout from './PaymobIntentionCheckout';

interface BookingPaymentProps {
  bookingData: {
    id: string;
    confirmation_number: string;
    scheduled_datetime: string;
    estimated_cost: number;
    deposit_amount: number;
    status: string;
    payment_status: string;
  };
  appraiserDetails: {
    name: string;
    email?: string;
    rating?: number;
  };
  clientDetails: {
    name: string;
    email: string;
    phone?: string;
  };
  appointmentDetails: {
    type: string;
    property_address: string;
    duration_hours: number;
    special_instructions?: string;
  };
  onSuccess?: (payment: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const BookingPayment: React.FC<BookingPaymentProps> = ({
  bookingData,
  appraiserDetails,
  clientDetails,
  appointmentDetails,
  onSuccess,
  onError,
  onCancel
}) => {
  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const { date, time } = formatDateTime(bookingData.scheduled_datetime);

  const paymentData = {
    booking_id: bookingData.id,
    payment_category: 'booking' as const,
    amount: bookingData.deposit_amount,
    customer_data: {
      first_name: clientDetails.name.split(' ')[0] || 'Client',
      last_name: clientDetails.name.split(' ').slice(1).join(' ') || '',
      email: clientDetails.email,
      phone_number: clientDetails.phone || '',
      street: appointmentDetails.property_address.split(',')[0] || 'N/A',
      city: 'Cairo', // Default for Egypt
      state: 'Cairo'
    },
    items: [{
      name: `${appointmentDetails.type.charAt(0).toUpperCase() + appointmentDetails.type.slice(1)} Appointment`,
      description: `Deposit payment for ${appointmentDetails.type} with ${appraiserDetails.name}`,
      quantity: 1,
      amount: bookingData.deposit_amount
    }]
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Booking Summary - Left Column */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Booking Summary
              </CardTitle>
              <CardDescription>
                Confirmation #{bookingData.confirmation_number}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Appointment Details */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarDays className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">{date}</div>
                    <div className="text-sm text-gray-600">{time}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">{appraiserDetails.name}</div>
                    <div className="text-sm text-gray-600">Professional Appraiser</div>
                    {appraiserDetails.rating && (
                      <div className="text-sm text-yellow-600">
                        ★ {appraiserDetails.rating.toFixed(1)} rating
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Property Location</div>
                    <div className="text-sm text-gray-600">{appointmentDetails.property_address}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Duration</div>
                    <div className="text-sm text-gray-600">{appointmentDetails.duration_hours} hours</div>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {appointmentDetails.special_instructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="font-medium text-yellow-800 mb-1">Special Instructions</div>
                  <div className="text-sm text-yellow-700">
                    {appointmentDetails.special_instructions}
                  </div>
                </div>
              )}

              {/* Cost Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Service Cost:</span>
                  <span>{bookingData.estimated_cost} EGP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Deposit Required (30%):</span>
                  <span className="font-medium">{bookingData.deposit_amount} EGP</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 pt-2 border-t">
                  <span>Remaining Balance:</span>
                  <span>{bookingData.estimated_cost - bookingData.deposit_amount} EGP (Due after service)</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  {bookingData.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-red-600 border-red-600">
                  {bookingData.payment_status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* What happens next */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What happens next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-semibold mt-0.5">1</div>
                  <span>Complete your deposit payment to confirm the booking</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center font-semibold mt-0.5">2</div>
                  <span>You'll receive booking confirmation via email</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center font-semibold mt-0.5">3</div>
                  <span>The appraiser will contact you 24 hours before the appointment</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center font-semibold mt-0.5">4</div>
                  <span>Pay the remaining balance after the service is completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Section - Right Column */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Complete Your Payment
              </CardTitle>
              <CardDescription>
                Pay {bookingData.deposit_amount} EGP deposit to confirm your booking
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Payment Component */}
          <div className="mt-4">
            <PaymobIntentionCheckout
              paymentData={paymentData}
              onSuccess={onSuccess}
              onError={onError}
              onCancel={onCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPayment;