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
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { ValifyDocumentUpload } from './ValifyDocumentUpload';
import { ValifySelfieCapture } from './ValifySelfieCapture';
import { VerificationStatus } from './VerificationStatus';
import { HeadshotGeneration } from './HeadshotGeneration';

interface VerificationWorkflowProps {
  appraiser_id: string;
  initialStep?: 'document' | 'selfie' | 'headshot' | 'status';
  onComplete?: (verificationData: any) => void;
}

type WorkflowStep = 'document' | 'selfie' | 'headshot' | 'status' | 'complete';

export function VerificationWorkflow({ 
  appraiser_id, 
  initialStep = 'document',
  onComplete 
}: VerificationWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [documentData, setDocumentData] = useState<any>(null);
  const [selfieData, setSelfieData] = useState<any>(null);
  const [headshotData, setHeadshotData] = useState<any>(null);

  const steps = [
    { id: 'document', title: 'Document Upload', icon: FileText, description: 'Upload your Egyptian National ID or Passport' },
    { id: 'selfie', title: 'Selfie Verification', icon: Camera, description: 'Take a live selfie for verification' },
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
      } else if (result.session?.current_step === 'selfie_capture') {
        setCurrentStep('selfie');
      } else if (result.session?.current_step === 'review') {
        setCurrentStep('status');
      }

    } catch (error: any) {
      console.error('Initialization error:', error);
      toast.error(error.message || 'Failed to initialize verification');
    } finally {
      setIsLoading(false);
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
        toast.success('Verification completed successfully!');
        setCurrentStep('headshot');
        setVerificationData({
          overall_status: 'verified',
          valify_score: result.verification_result.overall_score,
          document_verification: documentData?.ocrResponse,
          selfie_verification: result.verification_result.liveness_result,
          face_match_result: result.verification_result.face_match_result,
          sanction_check: result.verification_result.sanction_check_result,
          completed_at: new Date().toISOString(),
        });
        onComplete?.(result);
      } else if (result.verification_result?.status === 'manual_review') {
        toast.warning('Your verification is under manual review. We\'ll notify you once complete.');
        setCurrentStep('status');
      } else {
        toast.error('Verification failed. Please contact support.');
        setCurrentStep('status');
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

  const handleHeadshotGenerated = async (headshotUrl: string, metadata: any) => {
    try {
      console.log('Headshot generated:', headshotUrl, metadata);
      setHeadshotData({ headshotUrl, metadata });
      
      toast.success('Professional headshot generated successfully!');
      setCurrentStep('complete');
      
      // Complete the verification process
      const finalVerificationData = {
        ...verificationData,
        headshot_url: headshotUrl,
        headshot_metadata: metadata,
        completed_at: new Date().toISOString(),
      };
      
      setVerificationData(finalVerificationData);
      onComplete?.(finalVerificationData);
    } catch (error: any) {
      console.error('Headshot completion error:', error);
      toast.error(error.message || 'Failed to complete headshot generation');
    }
  };

  const handleHeadshotError = (error: string) => {
    console.error('Headshot generation error:', error);
    toast.error(error);
  };

  const handleRetryVerification = () => {
    setCurrentStep('document');
    setDocumentData(null);
    setSelfieData(null);
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

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = getCurrentStepIndex() > index || 
            (step.id === 'document' && documentData) ||
            (step.id === 'selfie' && selfieData) ||
            (step.id === 'headshot' && headshotData) ||
            (step.id === 'status' && verificationData?.overall_status === 'verified');
          
          const StepIcon = step.icon;
          
          return (
            <div key={step.id} className="flex flex-col items-center relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className={`absolute top-6 left-full w-full h-0.5 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                } z-0`} style={{ width: '100%' }} />
              )}
              
              {/* Step Circle */}
              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                isCompleted ? 'bg-green-500 border-green-500 text-white' :
                isActive ? 'bg-blue-500 border-blue-500 text-white' :
                'bg-white border-gray-300 text-gray-400'
              }`}>
                {isCompleted ? <CheckCircle className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
              </div>
              
              {/* Step Label */}
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${
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
          <p className="mt-4 text-gray-600">Initializing verification...</p>
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
            Identity Verification Workflow
          </CardTitle>
          <CardDescription>
            Complete your identity verification to become a verified appraiser
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
        </CardContent>
      </Card>

      {/* Step Content */}
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
          idPhotoFile={documentData?.uploadResult ? undefined : undefined} // Will be handled by the API
          onCaptureComplete={handleSelfieComplete}
          onCaptureError={handleSelfieError}
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
              <h3 className="text-2xl font-bold text-green-600">Verification Complete!</h3>
              <p className="text-gray-600 mt-2">
                Congratulations! Your identity has been successfully verified.
              </p>
            </div>

            {verificationData?.valify_score && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800">
                  <strong>Verification Score:</strong> {verificationData.valify_score}%
                </p>
              </div>
            )}

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You can now access all appraiser features and accept property appraisal requests.
                Your verified status will be displayed on your public profile.
              </AlertDescription>
            </Alert>

            <Button onClick={() => window.location.reload()} className="w-full">
              Continue to Dashboard
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
                  (currentStep === 'document' && !documentData) ||
                  (currentStep === 'selfie' && !selfieData) ||
                  (currentStep === 'headshot' && !headshotData)
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