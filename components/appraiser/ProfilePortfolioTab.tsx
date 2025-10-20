'use client';

import React from 'react';
import { AppraiserCoverageHeatmap } from '@/components/appraiser/AppraiserCoverageHeatmap';

// Portfolio interface maintained for compatibility but no longer used in favor of coverage heatmap
interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  property_type: 'residential' | 'apartment' | 'villa' | 'townhouse' | 'duplex' | 'penthouse' | 'commercial' | 'industrial' | 'land' | 'agricultural';
  property_value: number;
  property_location: string;
  appraisal_challenges?: string;
  completion_date: string;
  images: string[] | null;
  is_featured: boolean;
  client_testimonial?: string;
  tags: string[] | null;
  source_appraisal_id?: string;
  auto_generated?: boolean;
}

interface ProfilePortfolioTabProps {
  appraiser_id: string;
  portfolio_items: PortfolioItem[];
  property_statistics: Array<{
    property_type: string;
    properties_appraised: number;
    total_value_appraised: number;
    average_accuracy_percentage: number;
  }>;
}

export function ProfilePortfolioTab({ 
  appraiser_id, 
  portfolio_items, 
  property_statistics 
}: ProfilePortfolioTabProps) {
  
  console.log('🔍 PORTFOLIO COMPONENT DEBUG - Component rendering with market intelligence approach');
  console.log('🔍 PORTFOLIO COMPONENT DEBUG - appraiser_id:', appraiser_id);
  console.log('🔍 PORTFOLIO COMPONENT DEBUG - property_statistics:', property_statistics);

  console.log('🔍 PORTFOLIO COMPONENT DEBUG - Rendering market intelligence coverage heatmap');
  
  try {
    return (
      <div className="space-y-6">
        {/* Market Intelligence Coverage Heatmap - Replaces individual property listings */}
        <AppraiserCoverageHeatmap 
          appraiser_id={appraiser_id}
          property_statistics={property_statistics}
        />
      </div>
    );
  } catch (error) {
    console.error('🔍 PORTFOLIO COMPONENT DEBUG - Render error:', error);
    return <div>Portfolio rendering error: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }
}