'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Smartphone, Banknote, Clock, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  name: string;
  logo_url: string;
  type: 'card' | 'wallet' | 'installments' | 'bnpl' | 'bank_transfer';
  fees: {
    percentage: number;
    fixed: number;
  };
  processing_time: string;
  minimum_amount: number;
  maximum_amount: number;
}

interface PaymentIntention {
  id: string;
  merchant_order_id: string;
  amount: number;
  currency: string;
  status: string;
  expires_at: string;
}

interface PaymobCheckoutProps {
  paymentData: {
    booking_id?: string;
    appraisal_id?: string;
    payment_category: 'booking' | 'report_generation';
    amount: number;
    customer_data: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      street: string;
      city: string;
      state: string;
    };
    items: {
      name: string;
      description: string;
      quantity: number;
      amount: number;
    }[];
  };
  onSuccess?: (payment: PaymentIntention) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const PaymobIntentionCheckout: React.FC<PaymobCheckoutProps> = ({
  paymentData,
  onSuccess,
  onError,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentIntention, setPaymentIntention] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, [paymentData.amount]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(
        `/api/payments/methods?amount=${paymentData.amount}&category=${paymentData.payment_category}`
      );
      const data = await response.json();
      
      if (data.payment_methods) {
        setPaymentMethods(data.payment_methods);
        // Auto-select recommended method
        const recommended = data.recommendations?.find((r: any) => r.type === 'recommended');
        if (recommended) {
          setSelectedMethod(recommended.method);
        } else if (data.payment_methods.length > 0) {
          setSelectedMethod(data.payment_methods[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      toast.error('Failed to load payment methods');
    }
  };

  const createPaymentIntention = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments/intention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentData,
          payment_methods: [selectedMethod.id],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      if (data.success) {
        setPaymentIntention(data);
        const expiresAt = new Date(data.payment.expires_at);
        const now = new Date();
        const secondsUntilExpiry = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        setCountdown(secondsUntilExpiry);
        setShowIframe(true);
      } else {
        throw new Error(data.error || 'Payment creation failed');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateFee = (method: PaymentMethod): number => {
    return method.fees.percentage * paymentData.amount / 100 + method.fees.fixed;
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      case 'wallet':
        return <Smartphone className="w-5 h-5" />;
      case 'bank_transfer':
      case 'instapay':
        return <Banknote className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  if (showIframe && paymentIntention) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Secure Payment
                </CardTitle>
                <CardDescription>
                  Complete your payment of {paymentData.amount} EGP
                </CardDescription>
              </div>
              {countdown > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Expires in {formatTime(countdown)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Shield className="w-4 h-4" />
                  Your payment is secured by Paymob with 256-bit SSL encryption
                </div>
              </div>

              <div 
                className="w-full border rounded-lg overflow-hidden"
                style={{ height: '600px' }}
              >
                <iframe
                  src={paymentIntention.paymob.iframe_url}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  title="Payment Gateway"
                  onLoad={() => {
                    // Start polling for payment status
                    pollPaymentStatus();
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600">
                <div>Order ID: {paymentIntention.payment.merchant_order_id}</div>
                <Button variant="outline" onClick={onCancel}>
                  Cancel Payment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pollPaymentStatus = () => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/payments/intention?merchant_order_id=${paymentIntention.payment.merchant_order_id}`
        );
        const data = await response.json();
        
        if (data.payment?.status === 'paid') {
          toast.success('Payment completed successfully!');
          onSuccess?.(data.payment);
        } else if (data.payment?.status === 'failed') {
          toast.error('Payment failed. Please try again.');
          onError?.('Payment failed');
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    };

    // Poll every 3 seconds for 5 minutes
    const pollInterval = setInterval(checkStatus, 3000);
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            {paymentData.payment_category === 'booking' 
              ? 'Complete your booking payment'
              : 'Pay for report generation'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            {paymentData.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{item.amount} EGP</div>
                  <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                </div>
              </div>
            ))}
            <div className="border-t mt-3 pt-3">
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span>{paymentData.amount} EGP</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="font-semibold mb-3">Select Payment Method</h3>
            <div className="grid gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMethod?.id === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMethod(method)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getMethodIcon(method.type)}
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-gray-600">
                          {method.processing_time} • Fee: {calculateFee(method).toFixed(2)} EGP
                        </div>
                      </div>
                    </div>
                    {selectedMethod?.id === method.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={createPaymentIntention}
            disabled={loading || !selectedMethod}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Payment...
              </>
            ) : (
              `Pay ${paymentData.amount} EGP with ${selectedMethod?.name || 'Selected Method'}`
            )}
          </Button>

          {/* Security Notice */}
          <div className="text-center text-xs text-gray-500">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Shield className="w-3 h-3" />
              Secured by Paymob
            </div>
            Your payment information is encrypted and secure
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymobIntentionCheckout;