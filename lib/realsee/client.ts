// lib/realsee/client.ts
// RealSee API Integration Client

export interface RealSeeProperty {
  id: string;
  tourId: string;
  images: string[];
  virtualTourUrl: string;
  modelUrl: string;
  floorPlanUrl: string;
  metadata: {
    roomCount: number;
    totalArea: number;
    captureDate: string;
    quality: 'HD' | '4K' | '8K';
  };
}

export interface RealSeeResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class RealSeeClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.REALSEE_API_KEY || '';
    this.baseUrl = process.env.REALSEE_API_URL || 'https://api.realsee.com/v1';
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<RealSeeResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`RealSee API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('RealSee API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown RealSee API error'
      };
    }
  }

  // Download property images from RealSee
  async downloadPropertyImages(propertyId: string): Promise<RealSeeResponse<string[]>> {
    const response = await this.makeRequest<{ images: string[] }>(`/properties/${propertyId}/images`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.images
      };
    }
    
    return { success: false, error: response.error };
  }

  // Get virtual tour URL
  async getVirtualTourUrl(propertyId: string): Promise<RealSeeResponse<string>> {
    const response = await this.makeRequest<{ tourUrl: string }>(`/properties/${propertyId}/tour`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.tourUrl
      };
    }
    
    return { success: false, error: response.error };
  }

  // Get 3D model URL
  async get3DModelUrl(propertyId: string): Promise<RealSeeResponse<string>> {
    const response = await this.makeRequest<{ modelUrl: string }>(`/properties/${propertyId}/model`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.modelUrl
      };
    }
    
    return { success: false, error: response.error };
  }

  // Get floor plan URL
  async getFloorPlanUrl(propertyId: string): Promise<RealSeeResponse<string>> {
    const response = await this.makeRequest<{ floorPlanUrl: string }>(`/properties/${propertyId}/floorplan`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.floorPlanUrl
      };
    }
    
    return { success: false, error: response.error };
  }

  // Get complete property data from RealSee
  async getPropertyData(propertyId: string): Promise<RealSeeResponse<RealSeeProperty>> {
    const response = await this.makeRequest<RealSeeProperty>(`/properties/${propertyId}`);
    return response;
  }

  // Create a new virtual tour for a property
  async createVirtualTour(propertyData: {
    propertyId: string;
    address: string;
    title: string;
    description?: string;
  }): Promise<RealSeeResponse<{ tourId: string }>> {
    const response = await this.makeRequest<{ tourId: string }>('/tours/create', {
      method: 'POST',
      body: JSON.stringify(propertyData)
    });
    
    return response;
  }

  // Update property data in RealSee
  async updateProperty(propertyId: string, data: Partial<RealSeeProperty>): Promise<RealSeeResponse<RealSeeProperty>> {
    const response = await this.makeRequest<RealSeeProperty>(`/properties/${propertyId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    return response;
  }

  // Delete property from RealSee
  async deleteProperty(propertyId: string): Promise<RealSeeResponse<boolean>> {
    const response = await this.makeRequest<boolean>(`/properties/${propertyId}`, {
      method: 'DELETE'
    });
    
    return response;
  }

  // Get tour analytics
  async getTourAnalytics(tourId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<RealSeeResponse<{
    views: number;
    uniqueVisitors: number;
    averageDuration: number;
    roomsVisited: Record<string, number>;
    deviceBreakdown: Record<string, number>;
  }>> {
    const response = await this.makeRequest<{
      views: number;
      uniqueVisitors: number;
      averageDuration: number;
      roomsVisited: Record<string, number>;
      deviceBreakdown: Record<string, number>;
    }>(`/tours/${tourId}/analytics?period=${period}`);
    return response;
  }

  // Batch update multiple properties
  async batchUpdateProperties(properties: Array<{
    propertyId: string;
    realSeeId?: string;
    tourId?: string;
  }>): Promise<RealSeeResponse<Array<{ propertyId: string; success: boolean; error?: string }>>> {
    const response = await this.makeRequest<Array<{ propertyId: string; success: boolean; error?: string }>>('/properties/batch', {
      method: 'POST',
      body: JSON.stringify({ properties })
    });
    
    return response;
  }
}

// Singleton instance
export const realSeeClient = new RealSeeClient();

// Utility functions for RealSee integration
export const RealSeeUtils = {
  // Check if RealSee is properly configured
  isConfigured(): boolean {
    return !!(process.env.REALSEE_API_KEY && process.env.REALSEE_API_URL);
  },

  // Generate RealSee embed URL
  generateEmbedUrl(tourId: string, options: {
    autoPlay?: boolean;
    controls?: boolean;
    fullscreen?: boolean;
    width?: number;
    height?: number;
  } = {}): string {
    const params = new URLSearchParams();
    
    if (options.autoPlay) params.set('autoplay', '1');
    if (options.controls === false) params.set('controls', '0');
    if (options.fullscreen === false) params.set('fullscreen', '0');
    if (options.width) params.set('width', options.width.toString());
    if (options.height) params.set('height', options.height.toString());
    
    const queryString = params.toString();
    return `https://my.realsee.com/tour/${tourId}${queryString ? `?${queryString}` : ''}`;
  },

  // Extract tour ID from RealSee URL
  extractTourId(url: string): string | null {
    const match = url.match(/\/tour\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  },

  // Validate RealSee tour URL format
  isValidTourUrl(url: string): boolean {
    const tourIdPattern = /https?:\/\/my\.realsee\.com\/tour\/[a-zA-Z0-9-_]+/;
    return tourIdPattern.test(url);
  }
}; 