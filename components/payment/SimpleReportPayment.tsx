'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Clock, 
  CreditCard, 
  Zap, 
  CheckCircle,
  AlertCircle,
  Info,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';
import PaymobIntentionCheckout from './PaymobIntentionCheckout';

interface SimpleReportPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  appraisalId: string;
  appraiserName: string;
  propertyAddress: string;
  onSuccess?: (result: any) => void;
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

interface QuotaData {
  monthly_quota: {
    total: number;
    used: number;
    available: number;
    expires_at: string;
  } | null;
  can_use_free: boolean;
}

const SimpleReportPayment: React.FC<SimpleReportPaymentProps> = ({
  isOpen,
  onClose,
  appraisalId,
  appraiserName,
  propertyAddress,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<'configure' | 'payment'>('configure');
  const [reportType, setReportType] = useState<'standard' | 'detailed' | 'comprehensive'>('standard');
  const [rushDelivery, setRushDelivery] = useState(false);
  const [additionalServices, setAdditionalServices] = useState<string[]>([]);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [usesFreeQuota, setUsesFreeQuota] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchQuotaData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchPricingData();
    }
  }, [reportType, rushDelivery, additionalServices]);

  const fetchQuotaData = async () => {
    try {
      // Check appraiser's monthly quota
      const response = await fetch('/api/appraisers/quota');
      const data = await response.json();
      if (response.ok) {
        setQuotaData(data);
        setUsesFreeQuota(data.can_use_free);
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error);
      // Continue without quota data
      setQuotaData({ monthly_quota: null, can_use_free: false });
    }
  };

  const fetchPricingData = async () => {
    try {
      const params = new URLSearchParams({
        report_type: reportType,
        rush_delivery: rushDelivery.toString(),
        additional_services: additionalServices.join(',')
      });

      const response = await fetch(`/api/payments/reports?${params}`);
      const data = await response.json();
      if (response.ok) {
        setPricingData(data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  };

  const handleServiceToggle = (service: string, checked: boolean) => {
    if (checked) {
      setAdditionalServices([...additionalServices, service]);
    } else {
      setAdditionalServices(additionalServices.filter(s => s !== service));
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appraisal_id: appraisalId,
          report_type: reportType,
          rush_delivery: rushDelivery,
          additional_services: additionalServices,
          use_free_quota: usesFreeQuota
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process report request');
      }

      if (usesFreeQuota && quotaData?.can_use_free) {
        // Report generation started using free quota
        toast.success('Report generation started using your monthly quota!');
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

  const reportTypeOptions = [
    {
      value: 'standard',
      title: 'Standard Report',
      description: 'Basic property appraisal with essential details',
      icon: <FileText className="w-5 h-5" />,
      deliveryTime: '2-3 business days'
    },
    {
      value: 'detailed',
      title: 'Detailed Report',
      description: 'Comprehensive analysis with market comparisons',
      icon: <FileText className="w-5 h-5" />,
      deliveryTime: '3-5 business days'
    },
    {
      value: 'comprehensive',
      title: 'Comprehensive Report',
      description: 'Full professional report with all methodologies',
      icon: <FileText className="w-5 h-5" />,
      deliveryTime: '5-7 business days'
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Professional Appraisal Report</DialogTitle>
          <DialogDescription>
            Configure your report options and proceed with generation
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

          {/* Monthly Quota Status */}
          {quotaData?.monthly_quota && (
            <Card className={quotaData.can_use_free ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  {quotaData.can_use_free ? (
                    <Gift className="w-5 h-5 text-green-600" />
                  ) : (
                    <Info className="w-5 h-5 text-orange-600" />
                  )}
                  <span className="font-medium">
                    Monthly Quota: {quotaData.monthly_quota.used} / {quotaData.monthly_quota.total} used
                  </span>
                </div>
                {quotaData.can_use_free ? (
                  <div className="text-sm text-green-700">
                    ✨ You can generate this report for FREE using your monthly quota!
                  </div>
                ) : (
                  <div className="text-sm text-orange-700">
                    Your monthly quota is exhausted. Payment required for additional reports.
                  </div>
                )}
                <div className="text-xs text-gray-600 mt-1">
                  Next quota reset: {new Date(quotaData.monthly_quota.expires_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          )}

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
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-medium">
                              {option.icon}
                              {option.title}
                            </div>
                            <div className="text-sm text-gray-600">{option.description}</div>
                            <div className="flex items-center gap-1 text-sm text-blue-600">
                              <Clock className="w-4 h-4" />
                              {option.deliveryTime}
                            </div>
                          </div>
                          {pricingData?.report_type === option.value && !usesFreeQuota && (
                            <Badge variant="secondary">
                              {pricingData.pricing.base_fee} EGP
                            </Badge>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Rush Delivery */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rush"
                  checked={rushDelivery}
                  onCheckedChange={setRushDelivery}
                />
                <Label htmlFor="rush" className="flex items-center gap-2 cursor-pointer">
                  <Zap className="w-4 h-4 text-orange-500" />
                  Rush Delivery (50% faster)
                  {rushDelivery && pricingData && !usesFreeQuota && (
                    <Badge variant="outline">+{pricingData.pricing.rush_fee} EGP</Badge>
                  )}
                </Label>
              </div>
              <p className="text-sm text-gray-600 mt-1 ml-6">
                Get your report delivered in half the standard time
              </p>
            </CardContent>
          </Card>

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
                        {!usesFreeQuota && (
                          <Badge variant="outline">+{price} EGP</Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {usesFreeQuota && quotaData?.can_use_free ? (
                <div className="text-center py-4">
                  <div className="text-3xl font-bold text-green-600 mb-2">FREE</div>
                  <div className="text-sm text-green-700">
                    Using your monthly quota • No payment required
                  </div>
                </div>
              ) : pricingData ? (
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
                    <span>{pricingData.pricing.total_fee} EGP</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">Loading pricing...</div>
              )}
            </CardContent>
          </Card>

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
              ) : usesFreeQuota && quotaData?.can_use_free ? (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Generate Report (Free)
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

export default SimpleReportPayment;