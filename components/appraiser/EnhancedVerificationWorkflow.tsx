'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle,
  FileText,
  Camera,
  User,
  Trophy,
  Image as ImageIcon,
  Phone,
  Mail,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { ValifyDocumentUpload } from './ValifyDocumentUpload';
import { ValifySelfieCapture } from './ValifySelfieCapture';
import { VerificationStatus } from './VerificationStatus';
import { HeadshotGeneration } from './HeadshotGeneration';
import PhoneOTPVerification from './PhoneOTPVerification';
import EmailOTPVerification from './EmailOTPVerification';
import CSOValidation from './CSOValidation';
import NTRAValidation from './NTRAValidation';

interface EnhancedVerificationWorkflowProps {
  appraiser_id: string;
  initialStep?: WorkflowStep;
  onComplete?: (verificationData: any) => void;
}

type WorkflowStep = 'phone_otp' | 'email_otp' | 'document' | 'selfie' | 'cso_validation' | 'ntra_validation' | 'headshot' | 'status' | 'complete';

export function EnhancedVerificationWorkflow({ 
  appraiser_id, 
  initialStep = 'phone_otp',
  onComplete 
}: EnhancedVerificationWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [phoneOTPData, setPhoneOTPData] = useState<any>(null);
  const [emailOTPData, setEmailOTPData] = useState<any>(null);
  const [documentData, setDocumentData] = useState<any>(null);
  const [selfieData, setSelfieData] = useState<any>(null);
  const [csoData, setCsoData] = useState<any>(null);
  const [ntraData, setNtraData] = useState<any>(null);
  const [headshotData, setHeadshotData] = useState<any>(null);

  const steps = [
    { id: 'phone_otp', title: 'Phone Verification', icon: Phone, description: 'Verify your Egyptian mobile number with OTP' },
    { id: 'email_otp', title: 'Email Verification', icon: Mail, description: 'Verify your email address with OTP' },
    { id: 'document', title: 'Document Upload', icon: FileText, description: 'Upload your Egyptian National ID or Passport' },
    { id: 'selfie', title: 'Selfie Verification', icon: Camera, description: 'Take a live selfie for verification' },
    { id: 'cso_validation', title: 'CSO Validation', icon: ShieldCheck, description: 'Validate National ID with Civil Society Organization' },
    { id: 'ntra_validation', title: 'NTRA Validation', icon: Smartphone, description: 'Validate phone number with NTRA' },
    { id: 'headshot', title: 'Professional Headshot', icon: ImageIcon, description: 'Generate AI professional headshot' },
    { id: 'status', title: 'Verification Status', icon: User, description: 'Review your verification results' },
    { id: 'complete', title: 'Complete', icon: Trophy, description: 'Verification completed successfully' },
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const getProgress = () => {
    const stepIndex = getCurrentStepIndex();
    return ((stepIndex + 1) / steps.length) * 100;
  };

  // Initialize verification session on component mount
  useEffect(() => {
    initializeVerificationSession();
  }, [appraiser_id]);

  const initializeVerificationSession = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/verification/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appraiser_id }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize verification session');
      }

      const result = await response.json();
      console.log('Verification session initialized:', result);

      // Check if verification is already completed
      if (result.appraiser?.current_status === 'verified') {
        setCurrentStep('complete');
        setVerificationData(result);
      }

    } catch (error: any) {
      console.error('Initialization error:', error);
      toast.error(error.message || 'Failed to initialize verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneOTPComplete = (verified: boolean) => {
    if (verified) {
      setPhoneOTPData({ verified: true, completed_at: new Date().toISOString() });
      toast.success('Phone number verified successfully!');
      setCurrentStep('email_otp');
    }
  };

  const handleEmailOTPComplete = (verified: boolean) => {
    if (verified) {
      setEmailOTPData({ verified: true, completed_at: new Date().toISOString() });
      toast.success('Email address verified successfully!');
      setCurrentStep('document');
    }
  };

  const handleDocumentUploadComplete = async (result: any) => {
    try {
      console.log('Document upload completed:', result);
      setDocumentData(result);
      
      if (result.ocrResponse?.status === 'success') {
        toast.success('Document verified successfully!');
        setCurrentStep('selfie');
      } else {
        toast.error('Document verification failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Document upload error:', error);
      toast.error(error.message || 'Document upload failed');
    }
  };

  const handleDocumentUploadError = (error: string) => {
    console.error('Document upload error:', error);
    toast.error(error);
  };

  const handleSelfieComplete = async (result: any) => {
    try {
      console.log('Selfie verification completed:', result);
      setSelfieData(result);
      
      if (result.verification_result?.status === 'verified') {
        toast.success('Selfie verification completed successfully!');
        setCurrentStep('cso_validation');
      } else if (result.verification_result?.status === 'manual_review') {
        toast.warning('Your verification is under manual review.');
        setCurrentStep('cso_validation');
      } else {
        toast.error('Selfie verification failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Selfie verification error:', error);
      toast.error(error.message || 'Selfie verification failed');
    }
  };

  const handleSelfieError = (error: string) => {
    console.error('Selfie error:', error);
    toast.error(error);
  };

  const handleCSOValidationComplete = (validated: boolean) => {
    if (validated) {
      setCsoData({ validated: true, completed_at: new Date().toISOString() });
      toast.success('CSO validation completed successfully!');
      setCurrentStep('ntra_validation');
    }
  };

  const handleNTRAValidationComplete = (validated: boolean) => {
    if (validated) {
      setNtraData({ validated: true, completed_at: new Date().toISOString() });
      toast.success('NTRA validation completed successfully!');
      setCurrentStep('headshot');
    }
  };

  const handleHeadshotGenerated = async (headshotUrl: string, metadata: any) => {
    try {
      console.log('Headshot generated:', headshotUrl, metadata);
      setHeadshotData({ headshotUrl, metadata });
      
      toast.success('Professional headshot generated successfully!');
      setCurrentStep('status');
      
      // Check final verification status
      await checkFinalVerificationStatus();
      
    } catch (error: any) {
      console.error('Headshot completion error:', error);
      toast.error(error.message || 'Failed to complete headshot generation');
    }
  };

  const handleHeadshotError = (error: string) => {
    console.error('Headshot generation error:', error);
    toast.error(error);
  };

  const checkFinalVerificationStatus = async () => {
    try {
      const response = await fetch(`/api/verification/status/${appraiser_id}`);
      if (response.ok) {
        const result = await response.json();
        
        // Check if all steps are completed
        const allStepsCompleted = phoneOTPData && emailOTPData && documentData && selfieData && csoData && ntraData && headshotData;
        
        if (allStepsCompleted) {
          const finalVerificationData = {
            overall_status: 'verified',
            phone_verification: phoneOTPData,
            email_verification: emailOTPData,
            document_verification: documentData?.ocrResponse,
            selfie_verification: selfieData?.verification_result,
            cso_validation: csoData,
            ntra_validation: ntraData,
            headshot_data: headshotData,
            completed_at: new Date().toISOString(),
          };
          
          setVerificationData(finalVerificationData);
          setCurrentStep('complete');
          onComplete?.(finalVerificationData);
        }
      }
    } catch (error) {
      console.error('Failed to check final status:', error);
    }
  };

  const handleRetryVerification = () => {
    setCurrentStep('phone_otp');
    setPhoneOTPData(null);
    setEmailOTPData(null);
    setDocumentData(null);
    setSelfieData(null);
    setCsoData(null);
    setNtraData(null);
    setHeadshotData(null);
    setVerificationData(null);
    initializeVerificationSession();
  };

  const handleUpdateStatus = async () => {
    try {
      const response = await fetch(`/api/verification/status/${appraiser_id}`);
      if (response.ok) {
        const result = await response.json();
        setVerificationData(result.verification_details);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const goToNextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as WorkflowStep);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as WorkflowStep);
    }
  };

  const isStepCompleted = (stepId: string) => {
    switch (stepId) {
      case 'phone_otp': return phoneOTPData?.verified;
      case 'email_otp': return emailOTPData?.verified;
      case 'document': return documentData?.ocrResponse?.status === 'success';
      case 'selfie': return selfieData?.verification_result?.status === 'verified';
      case 'cso_validation': return csoData?.validated;
      case 'ntra_validation': return ntraData?.validated;
      case 'headshot': return headshotData?.headshotUrl;
      case 'status': return verificationData?.overall_status === 'verified';
      default: return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="grid grid-cols-3 md:grid-cols-9 gap-2 mb-4">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = isStepCompleted(step.id);
          
          const StepIcon = step.icon;
          
          return (
            <div key={step.id} className="flex flex-col items-center relative">
              {/* Step Circle */}
              <div className={`relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 ${
                isCompleted ? 'bg-green-500 border-green-500 text-white' :
                isActive ? 'bg-blue-500 border-blue-500 text-white' :
                'bg-white border-gray-300 text-gray-400'
              }`}>
                {isCompleted ? <CheckCircle className="h-4 w-4 md:h-6 md:w-6" /> : <StepIcon className="h-4 w-4 md:h-6 md:w-6" />}
              </div>
              
              {/* Step Label */}
              <div className="mt-2 text-center">
                <p className={`text-xs md:text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={getProgress()} className="h-2" />
        <p className="text-sm text-gray-500 text-center">
          Step {getCurrentStepIndex() + 1} of {steps.length}: {steps[getCurrentStepIndex()]?.description}
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600">Initializing enhanced verification...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Complete Identity Verification (Valify FRA Flow)
          </CardTitle>
          <CardDescription>
            Complete all verification steps including OTP verification, document validation, 
            CSO and NTRA checks as required by Egyptian financial regulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 'phone_otp' && (
        <PhoneOTPVerification
          appraiserId={appraiser_id}
          onVerificationComplete={handlePhoneOTPComplete}
        />
      )}

      {currentStep === 'email_otp' && (
        <EmailOTPVerification
          appraiserId={appraiser_id}
          onVerificationComplete={handleEmailOTPComplete}
        />
      )}

      {currentStep === 'document' && (
        <ValifyDocumentUpload
          appraiser_id={appraiser_id}
          onUploadComplete={handleDocumentUploadComplete}
          onUploadError={handleDocumentUploadError}
        />
      )}

      {currentStep === 'selfie' && (
        <ValifySelfieCapture
          appraiser_id={appraiser_id}
          idPhotoFile={documentData?.uploadResult ? undefined : undefined}
          onCaptureComplete={handleSelfieComplete}
          onCaptureError={handleSelfieError}
        />
      )}

      {currentStep === 'cso_validation' && (
        <CSOValidation
          appraiserId={appraiser_id}
          onValidationComplete={handleCSOValidationComplete}
          documentData={documentData?.ocrResponse?.extracted_data}
        />
      )}

      {currentStep === 'ntra_validation' && (
        <NTRAValidation
          appraiserId={appraiser_id}
          onValidationComplete={handleNTRAValidationComplete}
          phoneNumber={phoneOTPData?.phone_number}
          nationalId={documentData?.ocrResponse?.extracted_data?.national_id}
        />
      )}

      {currentStep === 'headshot' && selfieData && (
        <HeadshotGeneration
          appraiser_id={appraiser_id}
          originalSelfieUrl={selfieData.upload_result?.public_url || ''}
          onHeadshotGenerated={handleHeadshotGenerated}
          onGenerationError={handleHeadshotError}
        />
      )}

      {currentStep === 'status' && (
        <VerificationStatus
          appraiser_id={appraiser_id}
          verificationData={verificationData}
          onRetryVerification={handleRetryVerification}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {currentStep === 'complete' && (
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <Trophy className="h-12 w-12 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-green-600">Complete FRA Verification Achieved!</h3>
              <p className="text-gray-600 mt-2">
                Congratulations! You have successfully completed all required verification steps 
                according to Egyptian Financial Regulatory Authority (FRA) standards.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-green-800 font-medium">Phone Verified</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-green-800 font-medium">Email Verified</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-green-800 font-medium">CSO Validated</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-green-800 font-medium">NTRA Validated</p>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You are now a fully verified appraiser with FRA compliance. You can access all 
                professional features and accept property appraisal requests throughout Egypt.
              </AlertDescription>
            </Alert>

            <Button onClick={() => window.location.reload()} className="w-full">
              Continue to Appraiser Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      {currentStep !== 'complete' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={goToPreviousStep}
                disabled={getCurrentStepIndex() === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button 
                onClick={goToNextStep}
                disabled={
                  getCurrentStepIndex() === steps.length - 1 ||
                  !isStepCompleted(currentStep)
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}