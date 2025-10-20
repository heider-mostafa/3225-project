// Download Tracking Service
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface DownloadRecord {
  id: string;
  appraisal_id: string;
  user_id: string;
  report_type: 'standard' | 'detailed' | 'comprehensive';
  payment_amount: number;
  payment_method: string;
  payment_reference?: string;
  downloaded_at: string;
  report_options: any;
  user_email?: string;
}

export interface DownloadAnalytics {
  appraisal_id: string;
  download_count: number;
  total_revenue: number;
  recent_downloads: Array<{
    user_email: string;
    download_date: string;
    amount_paid: number;
    report_type: string;
  }>;
}

export class DownloadTrackingService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Manually track a download (for admin downloads or special cases)
   */
  async trackDownload(params: {
    appraisalId: string;
    userId: string;
    reportType: 'standard' | 'detailed' | 'comprehensive';
    paymentAmount: number;
    paymentMethod: string;
    paymentReference?: string;
    reportOptions?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ success: boolean; downloadId?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('report_downloads')
        .insert({
          appraisal_id: params.appraisalId,
          user_id: params.userId,
          report_type: params.reportType,
          payment_amount: params.paymentAmount,
          payment_method: params.paymentMethod,
          payment_reference: params.paymentReference,
          report_options: params.reportOptions || {},
          ip_address: params.ipAddress,
          user_agent: params.userAgent
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error tracking download:', error);
        return { success: false, error: error.message };
      }

      return { success: true, downloadId: data.id };
    } catch (error) {
      console.error('Exception in trackDownload:', error);
      return { success: false, error: 'Failed to track download' };
    }
  }

  /**
   * Get download analytics for a single appraisal
   */
  async getAppraisalDownloadAnalytics(appraisalId: string): Promise<DownloadAnalytics | null> {
    try {
      const { data: downloads, error } = await this.supabase
        .from('report_downloads')
        .select(`
          id,
          appraisal_id,
          user_id,
          report_type,
          payment_amount,
          downloaded_at,
          auth.users!inner(email)
        `)
        .eq('appraisal_id', appraisalId)
        .order('downloaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching download analytics:', error);
        return null;
      }

      if (!downloads || downloads.length === 0) {
        return {
          appraisal_id: appraisalId,
          download_count: 0,
          total_revenue: 0,
          recent_downloads: []
        };
      }

      const downloadCount = downloads.length;
      const totalRevenue = downloads.reduce((sum, download) => sum + download.payment_amount, 0);
      const recentDownloads = downloads.slice(0, 5).map(download => ({
        user_email: download.auth?.users?.email || 'Unknown',
        download_date: download.downloaded_at,
        amount_paid: download.payment_amount,
        report_type: download.report_type
      }));

      return {
        appraisal_id: appraisalId,
        download_count: downloadCount,
        total_revenue: totalRevenue,
        recent_downloads: recentDownloads
      };
    } catch (error) {
      console.error('Exception in getAppraisalDownloadAnalytics:', error);
      return null;
    }
  }

  /**
   * Get download analytics for multiple appraisals (bulk)
   */
  async getBulkDownloadAnalytics(appraisalIds: string[]): Promise<{ [key: string]: DownloadAnalytics }> {
    try {
      if (appraisalIds.length === 0) {
        return {};
      }

      const { data, error } = await this.supabase
        .rpc('get_download_analytics', { appraisal_ids: appraisalIds });

      if (error) {
        console.error('Error fetching bulk download analytics:', error);
        return {};
      }

      // Convert array result to object keyed by appraisal_id
      const analytics: { [key: string]: DownloadAnalytics } = {};
      
      data?.forEach((item: any) => {
        analytics[item.appraisal_id] = {
          appraisal_id: item.appraisal_id,
          download_count: parseInt(item.download_count) || 0,
          total_revenue: parseFloat(item.total_revenue) || 0,
          recent_downloads: item.recent_downloads || []
        };
      });

      // Ensure all requested appraisal IDs have entries (even if no downloads)
      appraisalIds.forEach(id => {
        if (!analytics[id]) {
          analytics[id] = {
            appraisal_id: id,
            download_count: 0,
            total_revenue: 0,
            recent_downloads: []
          };
        }
      });

      return analytics;
    } catch (error) {
      console.error('Exception in getBulkDownloadAnalytics:', error);
      return {};
    }
  }

  /**
   * Track admin access to reports
   */
  async trackAdminAccess(params: {
    adminUserId: string;
    appraisalId: string;
    actionType: 'preview' | 'download' | 'view_analytics' | 'bulk_export';
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('admin_report_access')
        .insert({
          admin_user_id: params.adminUserId,
          appraisal_id: params.appraisalId,
          action_type: params.actionType,
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
          metadata: params.metadata || {}
        });

      if (error) {
        console.error('Error tracking admin access:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception in trackAdminAccess:', error);
      return { success: false, error: 'Failed to track admin access' };
    }
  }

  /**
   * Get download statistics summary
   */
  async getDownloadStatsSummary(): Promise<{
    totalDownloads: number;
    totalRevenue: number;
    popularReportType: string;
    avgRevenuePerDownload: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('report_downloads')
        .select('report_type, payment_amount');

      if (error || !data) {
        return {
          totalDownloads: 0,
          totalRevenue: 0,
          popularReportType: 'standard',
          avgRevenuePerDownload: 0
        };
      }

      const totalDownloads = data.length;
      const totalRevenue = data.reduce((sum, download) => sum + download.payment_amount, 0);
      
      // Find most popular report type
      const reportTypeCounts = data.reduce((acc, download) => {
        acc[download.report_type] = (acc[download.report_type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const popularReportType = Object.entries(reportTypeCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'standard';

      const avgRevenuePerDownload = totalDownloads > 0 ? totalRevenue / totalDownloads : 0;

      return {
        totalDownloads,
        totalRevenue,
        popularReportType,
        avgRevenuePerDownload
      };
    } catch (error) {
      console.error('Exception in getDownloadStatsSummary:', error);
      return {
        totalDownloads: 0,
        totalRevenue: 0,
        popularReportType: 'standard',
        avgRevenuePerDownload: 0
      };
    }
  }

  /**
   * Get user download history
   */
  async getUserDownloadHistory(userId: string, limit: number = 10): Promise<DownloadRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('report_downloads')
        .select(`
          *,
          property_appraisals!inner(
            appraisal_reference_number,
            property_type,
            area
          )
        `)
        .eq('user_id', userId)
        .order('downloaded_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user download history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getUserDownloadHistory:', error);
      return [];
    }
  }
}

/**
 * Create a download tracking service instance
 */
export async function createDownloadTrackingService() {
  const supabase = await createServerSupabaseClient();
  return new DownloadTrackingService(supabase);
}

/**
 * Utility function to extract client IP and user agent from request
 */
export function extractClientInfo(request: Request): { ipAddress?: string; userAgent?: string } {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;
  
  return { ipAddress, userAgent };
}