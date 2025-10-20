'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Smartphone, CheckCircle, AlertCircle, Phone, CreditCard } from 'lucide-react';

interface NTRAValidationProps {
  appraiserId: string;
  onValidationComplete: (validated: boolean) => void;
  phoneNumber?: string;
  nationalId?: string;
}

export default function NTRAValidation({ 
  appraiserId, 
  onValidationComplete,
  phoneNumber,
  nationalId 
}: NTRAValidationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [trialsRemaining, setTrialsRemaining] = useState(10);

  const validateWithNTRA = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/verification/validate-ntra', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appraiser_id: appraiserId,
          phone_number: phoneNumber,
          nid: nationalId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate with NTRA');
      }

      setValidationResult(data);
      setTrialsRemaining(data.trials_remaining);

      if (data.success) {
        setSuccess('Phone number validated successfully with NTRA (National Telecommunications Regulatory Authority)');
        onValidationComplete(true);
      } else {
        setError(`NTRA validation failed: ${data.message || 'Phone number does not match National ID'}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate with NTRA');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <Smartphone className="h-6 w-6 text-orange-600" />
        </div>
        <CardTitle>NTRA Validation</CardTitle>
        <CardDescription>
          Validate that your phone number is registered under your National ID
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(phoneNumber || nationalId) && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Validation Information</span>
            </div>
            
            {phoneNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phone Number:</span>
                <span className="font-medium">{phoneNumber}</span>
              </div>
            )}
            
            {nationalId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">National ID:</span>
                <span className="font-medium">{nationalId}</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {validationResult && !success && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="text-sm font-medium text-gray-700">Validation Result</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant={validationResult.result.isMatched ? "default" : "destructive"}>
                  {validationResult.result.isMatched ? 'Matched' : 'Not Matched'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Transaction ID:</span>
                <span className="font-mono text-xs">{validationResult.transaction_id}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={validateWithNTRA} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating with NTRA...
              </>
            ) : (
              'Validate with NTRA'
            )}
          </Button>

          <div className="text-center text-sm text-gray-500">
            {trialsRemaining} validation attempts remaining
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm text-orange-800">
            <div className="font-medium mb-1">About NTRA Validation</div>
            <p className="text-xs">
              The National Telecommunications Regulatory Authority (NTRA) validation 
              confirms that your phone number is officially registered under your 
              National ID with Egyptian telecom providers.
            </p>
          </div>
        </div>

        {!phoneNumber && !nationalId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Complete phone verification and document upload first to enable NTRA validation.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}