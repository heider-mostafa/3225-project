'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  AlertTriangle,
  Eye
} from 'lucide-react';
import { EnhancedVerificationWorkflow } from './EnhancedVerificationWorkflow';

interface VerificationButtonProps {
  appraiser_id: string;
  current_status?: 'pending' | 'in_progress' | 'verified' | 'failed' | 'manual_review';
  onVerificationComplete?: (data: any) => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
}

export function VerificationButton({ 
  appraiser_id, 
  current_status = 'pending',
  onVerificationComplete,
  size = 'default',
  variant = 'default'
}: VerificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusIcon = () => {
    switch (current_status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'manual_review':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (current_status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'manual_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const getButtonText = () => {
    switch (current_status) {
      case 'verified':
        return 'View Verification';
      case 'failed':
        return 'Retry Verification';
      case 'manual_review':
        return 'Check Status';
      case 'in_progress':
        return 'Continue Verification';
      default:
        return 'Start Verification';
    }
  };

  const handleVerificationComplete = (data: any) => {
    setIsOpen(false);
    onVerificationComplete?.(data);
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size} className="flex items-center gap-2">
            {current_status === 'verified' ? <Eye className="h-4 w-4" /> : getStatusIcon()}
            {getButtonText()}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Identity Verification
            </DialogTitle>
          </DialogHeader>
          
          <EnhancedVerificationWorkflow
            appraiser_id={appraiser_id}
            initialStep={
              current_status === 'verified' ? 'status' :
              current_status === 'in_progress' ? 'selfie' : 
              'phone_otp'
            }
            onComplete={handleVerificationComplete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}