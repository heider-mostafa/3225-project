'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppraiserDashboard } from '@/components/appraiser/AppraiserDashboard';
import { supabase } from '@/lib/supabase/config';
import { Shield, X } from 'lucide-react';

export default function AppraiserDashboardPage() {
  const params = useParams();
  const appraiserId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [appraiser, setAppraiser] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadAppraiserData();
  }, [appraiserId]);

  const loadAppraiserData = async () => {
    try {
      setLoading(true);
      
      // Use API route instead of direct Supabase call to avoid auth issues
      const response = await fetch(`/api/brokers/${appraiserId}`);
      const result = await response.json();
      
      if (!response.ok) {
        setError('Appraiser not found or access denied');
        return;
      }

      // Verify this is actually an appraiser
      const roleResponse = await fetch(`/api/user_roles?user_id=${result.broker.user_id}`);
      const roleResult = await roleResponse.json();
      
      const hasAppraiserRole = roleResult.user_roles?.some((role: any) => 
        role.role === 'appraiser' && role.is_active
      );
      
      if (!hasAppraiserRole) {
        setError('This user is not an active appraiser');
        return;
      }

      setAppraiser(result.broker);
    } catch (error) {
      console.error('Error loading appraiser:', error);
      setError('Failed to load appraiser data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appraiser dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Access Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!appraiser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-xl mb-4">👤 Appraiser Not Found</div>
          <p className="text-gray-600">The requested appraiser could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {appraiser.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{appraiser.full_name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Licensed Appraiser</span>
                  {appraiser.appraiser_license_number && (
                    <>
                      <span>•</span>
                      <span>License: {appraiser.appraiser_license_number}</span>
                    </>
                  )}
                  {appraiser.years_of_experience && (
                    <>
                      <span>•</span>
                      <span>{appraiser.years_of_experience} years experience</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {/* Verification Status Badge */}
              {appraiser.valify_status === 'verified' ? (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-2">
                  ✅ Verified Appraiser
                </div>
              ) : (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 mb-2">
                  ⏳ Verification Pending
                </div>
              )}
              
              {appraiser.appraiser_certification_authority && (
                <p className="text-xs text-gray-500 mt-1">
                  Certified by {appraiser.appraiser_certification_authority}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Verification Alert for Unverified Users */}
        {appraiser.valify_status !== 'verified' && (
          <div className="mx-4 mb-6 mt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Complete your verification to appear in public listings
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      To be visible to clients searching for appraisers, you need to complete identity verification. 
                      This helps build trust and ensures professional standards.
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => window.location.href = `/appraiser/verify/${appraiser.id}`}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Complete Verification
                    </button>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <button
                    onClick={(e) => {
                      const alert = e.currentTarget.closest('.bg-yellow-50');
                      if (alert) alert.remove();
                    }}
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <AppraiserDashboard appraiserData={appraiser} isEmbedded={true} />
      </div>
    </div>
  );
}