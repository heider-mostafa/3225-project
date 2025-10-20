'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  Eye,
  FileText,
  Camera,
  User,
  AlertTriangle,
  Download,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface VerificationStatusProps {
  appraiser_id: string;
  verificationData?: {
    overall_status: 'pending' | 'in_progress' | 'verified' | 'failed' | 'manual_review';
    valify_score?: number;
    document_verification?: any;
    selfie_verification?: any;
    face_match_result?: any;
    sanction_check?: any;
    completed_at?: string;
  };
  onRetryVerification?: () => void;
  onUpdateStatus?: () => void;
}

export function VerificationStatus({ 
  appraiser_id, 
  verificationData,
  onRetryVerification,
  onUpdateStatus
}: VerificationStatusProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'manual_review': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'manual_review': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'failed': return 'Failed';
      case 'manual_review': return 'Under Review';
      case 'in_progress': return 'In Progress';
      default: return 'Pending';
    }
  };

  const getOverallProgress = () => {
    if (!verificationData) return 0;
    
    let completedSteps = 0;
    const totalSteps = 4; // document, selfie, face_match, sanction_check

    if (verificationData.document_verification?.status === 'success') completedSteps++;
    if (verificationData.selfie_verification?.status === 'success') completedSteps++;
    if (verificationData.face_match_result?.status === 'success') completedSteps++;
    if (verificationData.sanction_check?.status === 'success') completedSteps++;

    return (completedSteps / totalSteps) * 100;
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call to refresh status
      await new Promise(resolve => setTimeout(resolve, 1000));
      onUpdateStatus?.();
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to refresh status');
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderVerificationStep = (
    title: string,
    icon: React.ReactNode,
    status: 'success' | 'failed' | 'pending' | 'in_progress',
    data?: any,
    description?: string
  ) => (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {icon}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{title}</h4>
              <Badge variant={
                status === 'success' ? 'default' : 
                status === 'failed' ? 'destructive' : 
                status === 'in_progress' ? 'secondary' : 'outline'
              }>
                {getStatusText(status)}
              </Badge>
            </div>
            
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}

            {/* Show detailed results for successful verifications */}
            {status === 'success' && data && (
              <div className="mt-3 p-3 bg-green-50 rounded-md space-y-1">
                {data.confidence_score && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-700">Confidence:</span>
                    <Badge variant="secondary" className="text-xs">{data.confidence_score}%</Badge>
                  </div>
                )}
                {data.match_score && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-700">Match Score:</span>
                    <Badge variant="secondary" className="text-xs">{data.match_score}%</Badge>
                  </div>
                )}
                {data.liveness_score && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-700">Liveness:</span>
                    <Badge variant="secondary" className="text-xs">{data.liveness_score}%</Badge>
                  </div>
                )}
                {data.extracted_data?.full_name && (
                  <p className="text-xs text-green-700">
                    <strong>Name:</strong> {data.extracted_data.full_name}
                  </p>
                )}
                {data.transaction_id && (
                  <p className="text-xs text-gray-500">
                    Transaction ID: {data.transaction_id}
                  </p>
                )}
              </div>
            )}

            {/* Show error details for failed verifications */}
            {status === 'failed' && data?.error_message && (
              <div className="mt-3 p-3 bg-red-50 rounded-md">
                <p className="text-xs text-red-700">{data.error_message}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!verificationData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            Verification Status
          </CardTitle>
          <CardDescription>
            No verification data found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Verification process has not been started yet.
            </AlertDescription>
          </Alert>
          {onRetryVerification && (
            <Button onClick={onRetryVerification} className="w-full mt-4">
              Start Verification
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>Verification Status</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
        <CardDescription>
          Track your identity verification progress
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <div className="text-center space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${getStatusColor(verificationData.overall_status)}`}>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              {getStatusIcon(verificationData.overall_status)}
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold">
              {getStatusText(verificationData.overall_status)}
            </h3>
            {verificationData.valify_score && (
              <p className="text-sm text-gray-600 mt-1">
                Overall Score: {verificationData.valify_score}%
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={getOverallProgress()} className="h-3" />
            <p className="text-sm text-gray-500">
              {Math.round(getOverallProgress())}% complete
            </p>
          </div>
        </div>

        {/* Verification Steps */}
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Verification Steps</h4>
          
          {/* Document Verification */}
          {renderVerificationStep(
            'Document Verification',
            <FileText className="h-5 w-5 text-blue-600" />,
            verificationData.document_verification?.status || 'pending',
            verificationData.document_verification,
            'Egyptian National ID or Passport verification'
          )}

          {/* Selfie Verification */}
          {renderVerificationStep(
            'Liveness Detection',
            <Camera className="h-5 w-5 text-purple-600" />,
            verificationData.selfie_verification?.status || 'pending',
            verificationData.selfie_verification,
            'Live selfie with liveness detection'
          )}

          {/* Face Matching */}
          {renderVerificationStep(
            'Face Matching',
            <User className="h-5 w-5 text-green-600" />,
            verificationData.face_match_result?.status || 'pending',
            verificationData.face_match_result,
            'Comparing selfie with document photo'
          )}

          {/* Sanction Screening */}
          {renderVerificationStep(
            'Background Check',
            <Shield className="h-5 w-5 text-orange-600" />,
            verificationData.sanction_check?.status || 'pending',
            verificationData.sanction_check,
            'AML and sanctions list screening'
          )}
        </div>

        {/* Action Buttons */}
        {verificationData.overall_status === 'failed' && onRetryVerification && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Verification failed. You can retry the verification process.
            </AlertDescription>
          </Alert>
        )}

        {verificationData.overall_status === 'manual_review' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your verification is under manual review. This process typically takes 24-48 hours.
              You will be notified once the review is complete.
            </AlertDescription>
          </Alert>
        )}

        {verificationData.overall_status === 'verified' && verificationData.completed_at && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Verification completed successfully on{' '}
              {new Date(verificationData.completed_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </AlertDescription>
          </Alert>
        )}

        {/* Retry Button */}
        {(verificationData.overall_status === 'failed' || verificationData.overall_status === 'pending') && 
         onRetryVerification && (
          <Button onClick={onRetryVerification} className="w-full">
            {verificationData.overall_status === 'failed' ? 'Retry Verification' : 'Start Verification'}
          </Button>
        )}

        {/* Help and Support */}
        <div className="border-t pt-4">
          <h5 className="font-medium mb-2">Need Help?</h5>
          <p className="text-sm text-gray-600 mb-3">
            If you're experiencing issues with verification, please contact our support team.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Guide
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}