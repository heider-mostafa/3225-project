'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Clock, 
  CreditCard, 
  Coins, 
  Zap, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import PaymobIntentionCheckout from './PaymobIntentionCheckout';
import { useAuth } from '@/components/providers';
import { ReportFilteringService, type ReportType } from '@/lib/services/report-filtering';

interface ReportPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appraisalId: string;
  appraiserName: string;
  propertyAddress: string;
  onSuccess?: (result: any) => void;
  simplified?: boolean; // For market intelligence purchases
}

interface PricingData {
  report_type: string;
  appraiser_tier: string;
  pricing: {
    base_fee: number;
    rush_fee: number;
    service_fees: number;
    total_fee: number;
  };
  available_services: Record<string, number>;
}

interface CreditsData {
  available: number;
  monthly_quota?: {
    available: number;
    total: number;
    expires_at: string;
  };
}

const ReportPaymentModal: React.FC<ReportPaymentModalProps> = ({
  isOpen,
  onClose,
  appraisalId,
  appraiserName,
  propertyAddress,
  onSuccess,
  simplified = false
}) => {
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<'configure' | 'payment'>('configure');
  const [reportType, setReportType] = useState<ReportType>('standard');
  const [rushDelivery, setRushDelivery] = useState(false);
  const [additionalServices, setAdditionalServices] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'credits' | 'paymob'>(simplified ? 'paymob' : 'credits');
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [creditsData, setCreditsData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('💳 Payment Modal opened:', {
        simplified,
        user: user ? { id: user.id, email: user.email } : null,
        authLoading,
        reportType
      });
      
      if (!simplified) {
        fetchCreditsData();
      }
      fetchPricingData();
    }
  }, [isOpen, reportType, rushDelivery, additionalServices, simplified]);

  // Debug auth state changes
  useEffect(() => {
    console.log('🔄 Payment Modal - Auth state changed:', {
      user: user ? { id: user.id, email: user.email } : null,
      authLoading,
      simplified
    });
  }, [user, authLoading, simplified]);

  const fetchCreditsData = async () => {
    try {
      const response = await fetch('/api/payments/credits');
      const data = await response.json();
      if (response.ok) {
        setCreditsData(data.credits);
        // Default to payment if no credits available
        if (data.credits.available === 0) {
          setPaymentMethod('paymob');
        }
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  const fetchPricingData = async () => {
    try {
      const params = new URLSearchParams({
        report_type: reportType,
        appraiser_tier: 'basic', // Most appraisers are basic tier based on database
        rush_delivery: rushDelivery.toString(),
        additional_services: additionalServices.join(',')
      });

      const response = await fetch(`/api/payments/reports/pricing?appraiser_tier=basic`);
      const data = await response.json();
      if (response.ok && data.success) {
        // Convert new pricing format to old format that the component expects
        const selectedTypeData = data.pricing[reportType];
        if (selectedTypeData) {
          const formattedData = {
            report_type: reportType,
            appraiser_tier: data.appraiser_tier || 'basic',
            pricing: {
              base_fee: selectedTypeData.base_fee,
              rush_fee: rushDelivery ? Math.round(selectedTypeData.base_fee * (selectedTypeData.rush_multiplier - 1)) : 0,
              service_fees: 0, // Calculate based on additional services if needed
              total_fee: selectedTypeData.base_fee + (rushDelivery ? Math.round(selectedTypeData.base_fee * (selectedTypeData.rush_multiplier - 1)) : 0)
            },
            available_services: selectedTypeData.additional_services || {},
            rush_delivery_multiplier: selectedTypeData.rush_multiplier || 1.5
          };
          setPricingData(formattedData);
        } else {
          throw new Error('Pricing data not found for report type');
        }
      } else {
        // Fallback pricing if API fails
        const fallbackPricing = {
          report_type: reportType,
          appraiser_tier: 'basic',
          pricing: {
            base_fee: reportType === 'comprehensive' ? 200 : reportType === 'detailed' ? 100 : 50,
            rush_fee: 0,
            service_fees: 0,
            total_fee: reportType === 'comprehensive' ? 200 : reportType === 'detailed' ? 100 : 50
          },
          available_services: {},
          rush_delivery_multiplier: 1.5
        };
        setPricingData(fallbackPricing);
        console.warn('Using fallback pricing due to API error:', data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      // Fallback pricing in case of network error
      const fallbackPricing = {
        report_type: reportType,
        appraiser_tier: 'basic',
        pricing: {
          base_fee: reportType === 'comprehensive' ? 200 : reportType === 'detailed' ? 100 : 50,
          rush_fee: 0,
          service_fees: 0,
          total_fee: reportType === 'comprehensive' ? 200 : reportType === 'detailed' ? 100 : 50
        },
        available_services: {
          digital_signature: 25,
          notarization: 50,
          translation: reportType === 'comprehensive' ? 200 : reportType === 'detailed' ? 150 : 100
        },
        rush_delivery_multiplier: 1.5
      };
      setPricingData(fallbackPricing);
    }
  };

  const handleServiceToggle = (service: string, checked: boolean) => {
    if (checked) {
      setAdditionalServices([...additionalServices, service]);
    } else {
      setAdditionalServices(additionalServices.filter(s => s !== service));
    }
  };

  // Helper function to clear corrupted cookies
  const clearCorruptedCookies = async () => {
    try {
      console.log('🧹 Attempting to clear corrupted cookies...');
      const response = await fetch('/api/debug/clear-cookies', { method: 'POST' });
      const result = await response.json();
      console.log('🧹 Cookie clearing result:', result);
      return result.success;
    } catch (error) {
      console.error('Failed to clear cookies:', error);
      return false;
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // Debug authentication state
      console.log('🔐 Payment Modal - Auth Debug:', {
        simplified,
        user: user ? { id: user.id, email: user.email } : null,
        authLoading,
        userAgent: navigator.userAgent,
        cookieCount: document.cookie.split(';').length
      });

      // For simplified mode (market intelligence), check authentication
      if (simplified && !user) {
        console.log('🚪 Redirecting unauthenticated user to login');
        // User not authenticated, redirect to login
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `/auth?redirect=${currentUrl}`;
        return;
      }

      const response = await fetch('/api/payments/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appraisal_id: appraisalId,
          report_type: reportType,
          rush_delivery: simplified ? false : rushDelivery, // Disable rush delivery for simplified mode
          additional_services: additionalServices,
          use_free_quota: false // Always use payment for market intelligence
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          console.log('❌ Payment API returned 401 - Authentication failed');
          
          // Check if this is a cookie parsing issue
          if (data.error?.includes('parse') || data.error?.includes('JSON')) {
            console.log('🧹 Detected cookie parsing issue - attempting to clear corrupted cookies');
            toast.error('Authentication session corrupted. Clearing and redirecting...');
            
            await clearCorruptedCookies();
            
            // Redirect to login after clearing cookies
            setTimeout(() => {
              const currentUrl = encodeURIComponent(window.location.href);
              window.location.href = `/auth?redirect=${currentUrl}`;
            }, 1500);
            return;
          }
          
          // Regular authentication error
          throw new Error('Authentication required');
        }
        
        if (response.status === 402) {
          // Insufficient credits
          toast.error(data.message || 'Insufficient credits for report generation');
          setPaymentMethod('paymob');
          return;
        }
        throw new Error(data.error || 'Failed to process report request');
      }

      if (simplified || paymentMethod === 'paymob') {
        // For simplified mode, handle Paymob payment directly
        if (data.success && data.paymob?.iframe_url) {
          // Open Paymob payment iframe
          const paymentWindow = window.open(
            data.paymob.iframe_url, 
            'paymob_payment',
            'width=800,height=600,scrollbars=yes,resizable=yes'
          );

          // Listen for payment completion
          const checkPaymentStatus = setInterval(async () => {
            try {
              if (paymentWindow?.closed) {
                clearInterval(checkPaymentStatus);
                
                // Check payment status
                const statusResponse = await fetch(`/api/payments/status?payment_id=${data.payment.id}`);
                if (statusResponse.ok) {
                  const statusData = await statusResponse.json();
                  if (statusData.status === 'completed') {
                    toast.success('Payment successful! Generating your report...');
                    onSuccess?.(statusData);
                    onClose();
                  } else {
                    toast.error('Payment was not completed. Please try again.');
                  }
                }
              }
            } catch (error) {
              console.error('Payment status check error:', error);
            }
          }, 2000);

          // Timeout after 10 minutes
          setTimeout(() => {
            clearInterval(checkPaymentStatus);
            if (paymentWindow && !paymentWindow.closed) {
              paymentWindow.close();
            }
          }, 600000);
        } else {
          throw new Error('Payment URL not received');
        }
      } else if (paymentMethod === 'credits') {
        // Report generation started with credits
        toast.success('Report generation started using credits!');
        onSuccess?.(data);
        onClose();
      } else {
        // Payment required - move to payment step
        setCurrentStep('payment');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get enhanced report type options with privacy information
  const reportTypePricing = ReportFilteringService.getReportTypePricing();
  
  const reportTypeOptions = [
    {
      value: 'standard' as ReportType,
      title: 'Standard Report',
      description: reportTypePricing.standard.description,
      features: reportTypePricing.standard.features,
      privacyLevel: reportTypePricing.standard.privacyLevel,
      basePrice: reportTypePricing.standard.basePrice,
      icon: <FileText className="w-5 h-5" />,
      deliveryTime: '2-3 business days',
      privacyIcon: <Shield className="w-4 h-4 text-green-600" />,
      privacyText: 'High Privacy Protection'
    },
    {
      value: 'detailed' as ReportType,
      title: 'Detailed Report', 
      description: reportTypePricing.detailed.description,
      features: reportTypePricing.detailed.features,
      privacyLevel: reportTypePricing.detailed.privacyLevel,
      basePrice: reportTypePricing.detailed.basePrice,
      icon: <FileText className="w-5 h-5" />,
      deliveryTime: '3-5 business days',
      privacyIcon: <Shield className="w-4 h-4 text-yellow-600" />,
      privacyText: 'Medium Privacy Protection'
    },
    {
      value: 'comprehensive' as ReportType,
      title: 'Comprehensive Report',
      description: reportTypePricing.comprehensive.description,
      features: reportTypePricing.comprehensive.features,
      privacyLevel: reportTypePricing.comprehensive.privacyLevel,
      basePrice: reportTypePricing.comprehensive.basePrice,
      icon: <FileText className="w-5 h-5" />,
      deliveryTime: '5-7 business days',
      privacyIcon: <Shield className="w-4 h-4 text-red-600" />,
      privacyText: 'Minimal Privacy Protection'
    }
  ];

  const getPaymentData = () => ({
    appraisal_id: appraisalId,
    payment_category: 'report_generation' as const,
    amount: pricingData?.pricing.total_fee || 0,
    customer_data: {
      first_name: appraiserName.split(' ')[0] || 'Appraiser',
      last_name: appraiserName.split(' ').slice(1).join(' ') || '',
      email: '', // Will be filled by API from appraiser data
      phone_number: '',
      street: 'N/A',
      city: 'Cairo',
      state: 'Cairo'
    },
    items: [{
      name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Appraisal Report`,
      description: `Professional property appraisal report${rushDelivery ? ' (Rush Delivery)' : ''}`,
      quantity: 1,
      amount: pricingData?.pricing.total_fee || 0
    }]
  });

  if (currentStep === 'payment' && pricingData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Payment for Report Generation</DialogTitle>
          </DialogHeader>
          <PaymobIntentionCheckout
            paymentData={getPaymentData()}
            onSuccess={(payment) => {
              toast.success('Payment completed! Report generation will begin shortly.');
              onSuccess?.({ payment, reportType, rushDelivery, additionalServices });
              onClose();
            }}
            onError={(error) => {
              toast.error(error);
              setCurrentStep('configure');
            }}
            onCancel={() => setCurrentStep('configure')}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Professional Appraisal Report</DialogTitle>
          <DialogDescription>
            Configure your report options and complete payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div><strong>Appraiser:</strong> {appraiserName}</div>
                <div><strong>Property:</strong> {propertyAddress}</div>
                <div><strong>Appraisal ID:</strong> {appraisalId}</div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="report" className="w-full">
            {!simplified && (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="report">Report Configuration</TabsTrigger>
                <TabsTrigger value="payment">Payment Method</TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="report" className="space-y-6">
              {/* Report Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Report Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <div className="space-y-4">
                      {reportTypeOptions.map((option) => (
                        <div key={option.value} className="flex items-start space-x-3">
                          <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                          <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between mb-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 font-medium text-lg">
                                    {option.icon}
                                    {option.title}
                                  </div>
                                  <div className="text-sm text-gray-600">{option.description}</div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="secondary" className="mb-1">
                                    {option.basePrice} EGP
                                  </Badge>
                                  <div className="flex items-center gap-1 text-sm text-blue-600">
                                    <Clock className="w-4 h-4" />
                                    {option.deliveryTime}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Privacy Level */}
                              <div className="flex items-center gap-2 mb-3">
                                {option.privacyIcon}
                                <span className="text-sm font-medium">{option.privacyText}</span>
                              </div>
                              
                              {/* Features List */}
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-700">Includes:</div>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {option.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              {/* Privacy Warning for Comprehensive */}
                              {option.value === 'comprehensive' && (
                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                      <strong>Note:</strong> This report includes sensitive information like client details and full methodologies.
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Rush Delivery - Hidden for simplified mode */}
              {!simplified && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rush"
                        checked={rushDelivery}
                        onCheckedChange={(checked) => setRushDelivery(checked === true)}
                      />
                      <Label htmlFor="rush" className="flex items-center gap-2 cursor-pointer">
                        <Zap className="w-4 h-4 text-orange-500" />
                        Rush Delivery (50% faster)
                        {rushDelivery && pricingData && (
                          <Badge variant="outline">+{pricingData.pricing.rush_fee} EGP</Badge>
                        )}
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 ml-6">
                      Get your report delivered in half the standard time
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Additional Services */}
              {pricingData?.available_services && Object.keys(pricingData.available_services).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(pricingData.available_services).map(([service, price]) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            id={service}
                            checked={additionalServices.includes(service)}
                            onCheckedChange={(checked) => handleServiceToggle(service, checked as boolean)}
                          />
                          <Label htmlFor={service} className="flex items-center justify-between w-full cursor-pointer">
                            <div>
                              <div className="font-medium">
                                {service.split('_').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
                              </div>
                              <div className="text-sm text-gray-600">
                                {getServiceDescription(service)}
                              </div>
                            </div>
                            <Badge variant="outline">+{price} EGP</Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Simplified Payment Button for Market Intelligence */}
              {simplified && pricingData && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Button 
                        onClick={handleGenerateReport} 
                        disabled={loading}
                        className="w-full"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Purchase Report
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {!simplified && (
              <TabsContent value="payment" className="space-y-6">
              {/* Credits Info */}
              {creditsData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-blue-600" />
                      Available Credits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Total Credits Available:</span>
                        <Badge variant={creditsData.available > 0 ? 'default' : 'secondary'}>
                          {creditsData.available} credits
                        </Badge>
                      </div>
                      
                      {creditsData.monthly_quota && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
                            <Info className="w-4 h-4" />
                            Monthly Quota
                          </div>
                          <div className="text-sm text-blue-700">
                            {creditsData.monthly_quota.available} of {creditsData.monthly_quota.total} credits remaining
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Expires: {new Date(creditsData.monthly_quota.expires_at).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={(value: any) => setPaymentMethod(value)}
                  >
                    <div className="space-y-4">
                      {/* Credits Option */}
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem 
                          value="credits" 
                          id="credits" 
                          disabled={!creditsData || creditsData.available === 0}
                          className="mt-1" 
                        />
                        <Label htmlFor="credits" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 font-medium">
                                <Coins className="w-4 h-4 text-blue-600" />
                                Use Credits
                                {creditsData?.available === 0 && (
                                  <Badge variant="outline" className="text-gray-500">
                                    No credits available
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                Use 1 credit from your available balance
                              </div>
                            </div>
                            {creditsData && creditsData.available > 0 && (
                              <Badge variant="secondary">FREE</Badge>
                            )}
                          </div>
                        </Label>
                      </div>

                      {/* Payment Option */}
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="paymob" id="paymob" className="mt-1" />
                        <Label htmlFor="paymob" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 font-medium">
                                <CreditCard className="w-4 h-4 text-green-600" />
                                Pay with Card/Wallet
                              </div>
                              <div className="text-sm text-gray-600">
                                Secure payment via Paymob
                              </div>
                            </div>
                            {pricingData && (
                              <Badge variant="outline">
                                {pricingData.pricing.total_fee} EGP
                              </Badge>
                            )}
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </TabsContent>
            )}
          </Tabs>

          {/* Pricing Summary */}
          {pricingData && (
            <Card>
              <CardHeader>
                <CardTitle>Pricing Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Base Fee ({reportType}):</span>
                    <span>{pricingData.pricing.base_fee} EGP</span>
                  </div>
                  {rushDelivery && pricingData.pricing.rush_fee > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Rush Delivery Fee:</span>
                      <span>+{pricingData.pricing.rush_fee} EGP</span>
                    </div>
                  )}
                  {pricingData.pricing.service_fees > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Additional Services:</span>
                      <span>+{pricingData.pricing.service_fees} EGP</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>
                      {paymentMethod === 'credits' && creditsData?.available && creditsData.available > 0 
                        ? 'FREE (1 Credit)'
                        : `${pricingData.pricing.total_fee} EGP`
                      }
                    </span>
                  </div>
                  {/* Show Paymob text for paid transactions */}
                  {(simplified || (paymentMethod === 'paymob' || (creditsData?.available === 0))) && (
                    <div className="pt-2 border-t">
                      <p className="text-center text-sm text-gray-500">
                        Secure payment powered by Paymob
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateReport}
              disabled={loading}
              className="min-w-[150px]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : paymentMethod === 'credits' && creditsData?.available && creditsData.available > 0 ? (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to get service descriptions
const getServiceDescription = (service: string): string => {
  const descriptions: Record<string, string> = {
    digital_signature: 'Add encrypted digital signature to the report',
    notarization: 'Official notarization by certified authority',
    translation: 'Professional English translation of Arabic report'
  };
  return descriptions[service] || 'Additional service';
};

export default ReportPaymentModal;