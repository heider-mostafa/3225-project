'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { EnhancedVerificationWorkflow } from '@/components/appraiser/EnhancedVerificationWorkflow';

interface AppraiserData {
  id: string;
  full_name: string;
  email: string;
  valify_status: string | null;
  public_profile_active: boolean;
}

export default function AppraiserVerificationPage() {
  const router = useRouter();
  const params = useParams();
  const appraiserId = params.id as string;
  
  const [appraiser, setAppraiser] = useState<AppraiserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Debug environment variables (client-safe only)
        console.log('🔍 Env check on verification page:', {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        });

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth');
          return;
        }
        setCurrentUser(user);

        // Get appraiser data
        const { data: broker, error: brokerError } = await supabase
          .from('brokers')
          .select('id, full_name, email, valify_status, public_profile_active, user_id')
          .eq('id', appraiserId)
          .single();

        if (brokerError) {
          setError('Appraiser not found');
          setLoading(false);
          return;
        }

        // Verify user owns this appraiser record
        if (broker.user_id !== user.id) {
          // Check if user is admin
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('is_active', true);

          const isAdmin = userRoles?.some(ur => ur.role === 'admin' || ur.role === 'super_admin');
          
          if (!isAdmin) {
            setError('Unauthorized to view this verification');
            setLoading(false);
            return;
          }
        }

        setAppraiser(broker);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load verification data');
        setLoading(false);
      }
    };

    fetchData();
  }, [appraiserId, router]);

  const handleVerificationComplete = async (verificationData: any) => {
    try {
      // Update appraiser profile to active
      await supabase
        .from('brokers')
        .update({
          public_profile_active: true,
          valify_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', appraiserId);

      // Redirect to dashboard
      router.push(`/appraiser/${appraiserId}/dashboard`);
    } catch (error) {
      console.error('Error completing verification:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Verification Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Identity Verification</h1>
                <p className="text-slate-600">Complete your professional appraiser verification</p>
              </div>
            </div>
            
            {/* Skip for now option */}
            <Button 
              variant="outline"
              onClick={() => router.push(`/appraiser/${appraiserId}/dashboard`)}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Skip for now
            </Button>
          </div>

          {appraiser && (
            <Alert className="bg-blue-50 border-blue-200">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Welcome, {appraiser.full_name}!</strong> To start receiving appraisal requests, 
                you need to verify your identity using Egyptian KYC standards. This process typically takes 5-10 minutes.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Verification Workflow */}
        {appraiser && (
          <EnhancedVerificationWorkflow
            appraiser_id={appraiser.id}
            onComplete={handleVerificationComplete}
          />
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Having trouble with the verification process?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 space-y-2">
              <p>• Have your Egyptian mobile phone ready for OTP verification</p>
              <p>• Make sure your email address is accessible for OTP codes</p>
              <p>• Ensure your Egyptian National ID or Passport is clear and readable</p>
              <p>• Ensure good lighting when taking your selfie</p>
              <p>• Use a device with a working camera</p>
              <p>• Contact support if you encounter technical issues</p>
            </div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.open('mailto:support@virtualestate.com')}
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}