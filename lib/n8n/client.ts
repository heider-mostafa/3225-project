const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL!;
const n8nApiKey = process.env.N8N_API_KEY!;

// Enhanced N8N client for VirtualEstate automation workflows
class N8nClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async triggerWorkflow(workflowId: string, data: any) {
    try {
      const response = await fetch(`${this.baseUrl}/webhook/${workflowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('N8N webhook trigger failed:', response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error triggering N8N workflow:', error);
      return null;
    }
  }
}

export const n8nClient = new N8nClient({
  baseUrl: n8nUrl,
  apiKey: n8nApiKey,
});

// WORKFLOW 1: Lead Capture & Initial Processing
export async function triggerLeadCaptureWorkflow(leadData: {
  whatsapp_number: string;
  location: string;
  price_range: string;
  property_type: string;
  timeline: string;
  name: string;
  email?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}) {
  return n8nClient.triggerWorkflow('lead-capture-workflow', {
    data: leadData,
    timestamp: new Date().toISOString(),
    source: 'website'
  });
}

// WORKFLOW 2: AI Voice Qualification System
export async function triggerAIQualificationWorkflow(data: {
  lead_id: string;
  trigger_type: 'qualification_call';
}) {
  return n8nClient.triggerWorkflow('ai-qualification-workflow', {
    data,
    timestamp: new Date().toISOString()
  });
}

// WORKFLOW 3: Automatic Booking Engine
export async function triggerBookingWorkflow(data: {
  lead_id: string;
  final_score: number;
  recommendation: 'auto_book' | 'manual_review';
  property_data: any;
}) {
  return n8nClient.triggerWorkflow('auto-booking-workflow', {
    data,
    timestamp: new Date().toISOString()
  });
}

// WORKFLOW 4: Post-Shoot Processing
export async function triggerPostShootWorkflow(data: {
  lead_id: string;
  photographer_id: string;
  shoot_completed_at: string;
  photos_count: number;
  completion_notes?: string;
}) {
  return n8nClient.triggerWorkflow('post-shoot-workflow', {
    data,
    timestamp: new Date().toISOString()
  });
}

// WORKFLOW 5: Follow-up & Nurturing
export async function triggerFollowupWorkflow(data: {
  lead_id: string;
  followup_type: 'tour_ready' | 'analytics_report' | 'broker_introduction' | 'market_insights' | 'performance_review';
  tour_analytics?: {
    views: number;
    unique_visitors: number;
    avg_duration: number;
    broker_inquiries: number;
    viewing_requests: number;
  };
}) {
  return n8nClient.triggerWorkflow('followup-nurturing-workflow', {
    data,
    timestamp: new Date().toISOString()
  });
}

// WORKFLOW 5A: Rejection Handling
export async function triggerRejectionWorkflow(data: {
  lead_id: string;
  rejection_reason: string;
  initial_score: number;
}) {
  return n8nClient.triggerWorkflow('rejection-handling-workflow', {
    data,
    timestamp: new Date().toISOString()
  });
}

// WORKFLOW 5B: Broker Network Management
export async function triggerBrokerNetworkWorkflow(data: {
  lead_id: string;
  property_type: string;
  location: string;
  price_range: string;
  urgency_level: 'high' | 'medium' | 'low';
}) {
  return n8nClient.triggerWorkflow('broker-network-workflow', {
    data,
    timestamp: new Date().toISOString()
  });
}

// WORKFLOW 6: Error Handling & Monitoring
export async function triggerErrorHandlingWorkflow(data: {
  error_type: string;
  error_message: string;
  workflow_name: string;
  lead_id?: string;
  stack_trace?: string;
}) {
  return n8nClient.triggerWorkflow('error-handling-workflow', {
    data,
    timestamp: new Date().toISOString(),
    severity: 'high'
  });
}

// WORKFLOW 7: Analytics & Reporting
export async function triggerAnalyticsWorkflow(data: {
  report_type: 'daily' | 'weekly' | 'monthly';
  date_range: {
    start: string;
    end: string;
  };
}) {
  return n8nClient.triggerWorkflow('analytics-reporting-workflow', {
    data,
    timestamp: new Date().toISOString()
  });
}

// WORKFLOW 8: Security & Compliance
export async function triggerComplianceWorkflow(data: {
  compliance_type: 'gdpr_review' | 'data_retention' | 'consent_update';
  user_id?: string;
  retention_date?: string;
}) {
  return n8nClient.triggerWorkflow('security-compliance-workflow', {
    data,
    timestamp: new Date().toISOString()
  });
}

// WORKFLOW 9: Real-time Notifications
export async function triggerNotificationWorkflow(data: {
  notification_type: 'lead_status_change' | 'booking_confirmation' | 'tour_completion' | 'property_sale';
  lead_id?: string;
  property_id?: string;
  recipient_type: 'admin' | 'client' | 'photographer' | 'broker';
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}) {
  return n8nClient.triggerWorkflow('realtime-notifications-workflow', {
    data,
    timestamp: new Date().toISOString()
  });
}

// Utility function for batch workflow triggers
export async function triggerBatchWorkflows(workflows: Array<{
  workflowId: string;
  data: any;
}>) {
  const promises = workflows.map(({ workflowId, data }) => 
    n8nClient.triggerWorkflow(workflowId, data)
  );
  
  try {
    const results = await Promise.allSettled(promises);
    return results.map((result, index) => ({
      workflowId: workflows[index].workflowId,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  } catch (error) {
    console.error('Error in batch workflow execution:', error);
    return [];
  }
}

// Legacy functions for backward compatibility
export async function triggerInquiryWorkflow(inquiryData: {
  propertyId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  return n8nClient.triggerWorkflow('inquiry-handler', {
    data: inquiryData,
  });
}

export async function triggerPropertyUpdateWorkflow(propertyId: string, updateType: string) {
  return n8nClient.triggerWorkflow('property-update-handler', {
    data: {
      propertyId,
      updateType,
    },
  });
} 