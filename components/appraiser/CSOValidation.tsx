'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface CSOValidationProps {
  appraiserId: string;
  onValidationComplete: (validated: boolean) => void;
  documentData?: {
    nid?: string;
    first_name?: string;
    full_name?: string;
    serial_number?: string;
    expiration?: string;
  };
}

export default function CSOValidation({ 
  appraiserId, 
  onValidationComplete,
  documentData 
}: CSOValidationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [trialsRemaining, setTrialsRemaining] = useState(10);

  const validateWithCSO = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/verification/validate-cso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appraiser_id: appraiserId,
          ...documentData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate with CSO');
      }

      setValidationResult(data);
      setTrialsRemaining(data.trials_remaining);

      if (data.success) {
        setSuccess('National ID validated successfully with CSO (Civil Society Organization)');
        onValidationComplete(true);
      } else {
        setError(`CSO validation failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate with CSO');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-purple-600" />
        </div>
        <CardTitle>CSO Validation</CardTitle>
        <CardDescription>
          Validate your National ID against Civil Society Organization records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {documentData && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Document Information</span>
            </div>
            
            {documentData.full_name && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Full Name:</span>
                <span className="font-medium">{documentData.full_name}</span>
              </div>
            )}
            
            {documentData.nid && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">National ID:</span>
                <span className="font-medium">{documentData.nid}</span>
              </div>
            )}
            
            {documentData.serial_number && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Serial Number:</span>
                <span className="font-medium">{documentData.serial_number}</span>
              </div>
            )}
            
            {documentData.expiration && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expiration:</span>
                <span className="font-medium">{documentData.expiration}</span>
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
            <div className="text-sm font-medium text-gray-700">Validation Details</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant={validationResult.result.isValid ? "default" : "destructive"}>
                  {validationResult.result.isValid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Error Code:</span>
                <span className="font-mono">{validationResult.result.errorCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Error Key:</span>
                <span className="font-mono">{validationResult.result.errorKey}</span>
              </div>
              {validationResult.result.errorMessage && (
                <div className="text-sm">
                  <span className="text-gray-600">Message:</span>
                  <p className="text-red-600 mt-1">{validationResult.result.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={validateWithCSO} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating with CSO...
              </>
            ) : (
              'Validate with CSO'
            )}
          </Button>

          <div className="text-center text-sm text-gray-500">
            {trialsRemaining} validation attempts remaining
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">About CSO Validation</div>
            <p className="text-xs">
              The Civil Society Organization (CSO) validation verifies your National ID 
              against official government records to ensure document authenticity and 
              prevent identity fraud.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}