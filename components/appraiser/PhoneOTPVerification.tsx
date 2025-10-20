'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, CheckCircle, AlertCircle } from 'lucide-react';

interface PhoneOTPVerificationProps {
  appraiserId: string;
  onVerificationComplete: (verified: boolean) => void;
  initialPhoneNumber?: string;
}

export default function PhoneOTPVerification({ 
  appraiserId, 
  onVerificationComplete,
  initialPhoneNumber = ''
}: PhoneOTPVerificationProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [otp, setOTP] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trialsRemaining, setTrialsRemaining] = useState(5);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validatePhoneNumber = (phone: string): boolean => {
    // Egyptian phone number validation
    const egyptianPhoneRegex = /^(\+20|0020|20)?1[0-9]{9}$/;
    return egyptianPhoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Add +20 prefix if not present
    if (cleaned.startsWith('1') && cleaned.length === 10) {
      return `+20${cleaned}`;
    } else if (cleaned.startsWith('20') && cleaned.length === 12) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0020') && cleaned.length === 14) {
      return `+${cleaned.substring(2)}`;
    }
    
    return phone;
  };

  const sendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!validatePhoneNumber(formattedPhone)) {
      setError('Please enter a valid Egyptian phone number (e.g., +201234567890)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verification/send-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          appraiser_id: appraiserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setTransactionId(data.transaction_id);
      setTrialsRemaining(data.trials_remaining);
      setStep('otp');
      setCountdown(60); // 60 second countdown
      setSuccess('OTP sent successfully to your phone number');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verification/verify-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: otp,
          transaction_id: transactionId,
          appraiser_id: appraiserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      if (data.verified) {
        setSuccess('Phone number verified successfully!');
        onVerificationComplete(true);
      } else {
        setError('Invalid OTP code. Please try again.');
        setOTP('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
      setOTP('');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    if (countdown > 0) return;
    
    setOTP('');
    setError('');
    setSuccess('');
    await sendOTP();
  };

  if (step === 'phone') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Phone className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Phone Verification</CardTitle>
          <CardDescription>
            Enter your Egyptian mobile phone number to receive an OTP code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+201234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              Please enter your Egyptian mobile number with country code (+20)
            </p>
          </div>

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

          <Button 
            onClick={sendOTP} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Phone className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle>Enter OTP Code</CardTitle>
        <CardDescription>
          We sent a 6-digit code to {phoneNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Verification Code</Label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOTP}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

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

        <div className="space-y-2">
          <Button 
            onClick={verifyOTP} 
            disabled={isLoading || otp.length !== 6}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={resendOTP}
              disabled={countdown > 0 || isLoading}
              className="text-sm"
            >
              {countdown > 0 
                ? `Resend OTP in ${countdown}s` 
                : 'Resend OTP'
              }
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            {trialsRemaining} attempts remaining
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setStep('phone');
            setOTP('');
            setError('');
            setSuccess('');
          }}
          disabled={isLoading}
          className="w-full"
        >
          Change Phone Number
        </Button>
      </CardContent>
    </Card>
  );
}