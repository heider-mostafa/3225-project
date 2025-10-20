import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase } from './supabase';

// Temporary types until shared types are available
interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_meters?: number;
  address: string;
  city: string;
  property_type: string;
  status: string;
  virtual_tour_url?: string;
  property_photos?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    order_index: number;
  }>;
}

interface Broker {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  avatar?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  cacheEnabled: boolean;
}

// Extended config with metadata
interface ExtendedConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;
  private isOnline: boolean = true;
  private requestQueue: Array<() => Promise<any>> = [];

  constructor(config: ApiConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EgyptianRealEstate-Mobile/1.0.0',
      },
    });

    this.setupInterceptors();
    this.setupNetworkMonitoring();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          // Get Supabase session token instead of AsyncStorage token
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.warn('⚠️ Auth session error:', error);
          } else if (session?.access_token) {
            config.headers.set('Authorization', `Bearer ${session.access_token}`);
            console.log('🔑 API request authenticated with Supabase session');
          } else {
            console.log('🔓 API request without authentication (no session)');
          }
        } catch (error) {
          console.error('❌ Error getting auth session for API request:', error);
        }
        
        // Add request timestamp for analytics
        (config as ExtendedConfig).metadata = { startTime: Date.now() };
        
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: any) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and caching
    this.client.interceptors.response.use(
      async (response: AxiosResponse) => {
        const config = response.config as ExtendedConfig;
        const duration = Date.now() - (config.metadata?.startTime || 0);
        console.log(`✅ API Response: ${config.url} (${duration}ms)`);
        
        // Cache successful responses if enabled
        if (this.config.cacheEnabled && config.method === 'get') {
          await this.cacheResponse(config.url!, response.data);
        }
        
        return response;
      },
      async (error: any) => {
        console.error('❌ Response Error:', error.response?.status, error.message);
        
        // Handle offline scenarios
        if (!this.isOnline && error.code === 'NETWORK_ERROR') {
          const cachedData = await this.getCachedResponse(error.config.url);
          if (cachedData) {
            console.log('📱 Using cached data for offline request');
            return { data: cachedData };
          }
        }
        
        // Handle token expiration
        if (error.response?.status === 401) {
          await this.handleTokenExpiration();
        }
        
        return Promise.reject(error);
      }
    );
  }

  private setupNetworkMonitoring() {
    NetInfo.addEventListener((state: NetInfoState) => {
      this.isOnline = state.isConnected ?? false;
      
      if (this.isOnline && this.requestQueue.length > 0) {
        console.log(`📡 Back online! Processing ${this.requestQueue.length} queued requests`);
        this.processQueuedRequests();
      }
    });
  }

  private async cacheResponse(url: string, data: any) {
    try {
      const cacheKey = `api_cache_${url}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000, // 5 minutes TTL
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('⚠️ Failed to cache response:', error);
    }
  }

  private async getCachedResponse(url: string): Promise<any | null> {
    try {
      const cacheKey = `api_cache_${url}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp, ttl } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          return data;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to get cached response:', error);
    }
    return null;
  }

  private async handleTokenExpiration() {
    console.log('🔄 Handling token expiration...');
    // Let Supabase handle token refresh automatically
    // If that fails, the auth state change listener will handle sign out
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Session is truly expired, sign out
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('❌ Error during token expiration handling:', error);
      await supabase.auth.signOut();
    }
  }

  private async processQueuedRequests() {
    const queue = [...this.requestQueue];
    this.requestQueue = [];
    
    for (const request of queue) {
      try {
        await request();
      } catch (error) {
        console.error('❌ Failed to process queued request:', error);
      }
    }
  }

  // Properties API
  async getProperties(filters?: any): Promise<ApiResponse<Property[]>> {
    try {
      const response = await this.client.get('/api/properties', { params: filters });
      // API returns {properties: [...], pagination: {...}}
      return { success: true, data: response.data.properties || response.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getProperty(id: string): Promise<ApiResponse<Property>> {
    try {
      const response = await this.client.get(`/api/properties/${id}`);
      return { success: true, data: response.data.property || response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async searchProperties(query: string, filters?: any): Promise<ApiResponse<Property[]>> {
    try {
      const response = await this.client.get('/api/properties/search', {
        params: { q: query, ...filters }
      });
      // API returns {properties: [...], pagination: {...}}
      return { success: true, data: response.data.properties || response.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Brokers API
  async getBrokers(): Promise<ApiResponse<Broker[]>> {
    try {
      const response = await this.client.get('/api/brokers');
      return { success: true, data: response.data.brokers || response.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getBroker(id: string): Promise<ApiResponse<Broker>> {
    try {
      const response = await this.client.get(`/api/brokers/${id}`);
      return { success: true, data: response.data.broker || response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getPropertyBrokers(propertyId: string): Promise<ApiResponse<Broker[]>> {
    try {
      const response = await this.client.get(`/api/properties/${propertyId}/brokers`);
      return { success: true, data: response.data.brokers || response.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Note: Authentication is now handled by AuthService using Supabase
  // These methods are kept for backward compatibility but should use Supabase auth
  async login(email: string, password: string): Promise<ApiResponse<any>> {
    console.warn('⚠️ Direct API login is deprecated. Use AuthService.signIn() instead.');
    return { success: false, error: 'Use AuthService for authentication' };
  }

  async register(userData: any): Promise<ApiResponse<any>> {
    console.warn('⚠️ Direct API register is deprecated. Use AuthService.signUp() instead.');
    return { success: false, error: 'Use AuthService for authentication' };
  }

  async logout(): Promise<void> {
    console.warn('⚠️ Direct API logout is deprecated. Use AuthService.signOut() instead.');
    // Don't remove user_data here as it's managed by AuthService
  }

  // Media Upload API
  async uploadPropertyImages(propertyId: string, images: any[]): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('property_id', propertyId);
      
      images.forEach((image, index) => {
        formData.append('files', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || `image_${index}.jpg`,
        } as any);
      });

      const response = await this.client.post('/api/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for image uploads
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Contact & Inquiries API
  async sendInquiry(inquiryData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/contact', inquiryData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Favorites API - Note: These endpoints may not exist, mobile app uses direct Supabase
  async getSavedProperties(): Promise<ApiResponse<Property[]>> {
    console.warn('⚠️ getSavedProperties via API is deprecated. Mobile app uses ProfileService with Supabase.');
    return { success: false, error: 'Use ProfileService.getSavedProperties() instead' };
  }

  async saveProperty(propertyId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post(`/api/properties/${propertyId}/save`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.warn('⚠️ API save failed, consider using ProfileService.toggleSaveProperty()');
      return { success: false, error: error.message };
    }
  }

  async unsaveProperty(propertyId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.delete(`/api/properties/${propertyId}/save`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.warn('⚠️ API unsave failed, consider using ProfileService.toggleSaveProperty()');
      return { success: false, error: error.message };
    }
  }

  // AI Assistant API
  async sendAIMessage(messageData: {
    message: string;
    propertyId?: string;
    currentRoom?: string;
    tourContext?: any;
    propertyData?: any;
  }): Promise<ApiResponse<{ response: string }>> {
    try {
      const response = await this.client.post('/api/chat/openai', messageData);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('❌ AI Chat API Error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Failed to get AI response'
      };
    }
  }
}

// Check if we're in development mode
const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

// API Client Configuration
const apiConfig: ApiConfig = {
  baseURL: isDevelopment 
    ? 'http://10.0.2.2:3000'  // Android emulator localhost (was http://localhost:3000)
    : 'https://your-deployed-domain.vercel.app', // Replace with actual production URL
  timeout: 15000, // 15 seconds
  retries: 3,
  cacheEnabled: true,
};

// Export singleton instance
export const apiClient = new ApiClient(apiConfig);
export default apiClient; 