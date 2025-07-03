import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

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
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.set('Authorization', `Bearer ${token}`);
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
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    // Navigation to login screen would be handled by auth context
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
      return { success: true, data: response.data.properties || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getProperty(id: string): Promise<ApiResponse<Property>> {
    try {
      const response = await this.client.get(`/api/properties/${id}`);
      return { success: true, data: response.data.property };
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
      return { success: true, data: response.data.properties || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Brokers API
  async getBrokers(): Promise<ApiResponse<Broker[]>> {
    try {
      const response = await this.client.get('/api/brokers');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getBroker(id: string): Promise<ApiResponse<Broker>> {
    try {
      const response = await this.client.get(`/api/brokers/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getPropertyBrokers(propertyId: string): Promise<ApiResponse<Broker[]>> {
    try {
      const response = await this.client.get(`/api/properties/${propertyId}/brokers`);
      return { success: true, data: response.data.brokers };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Authentication API
  async login(email: string, password: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/auth/login', { email, password });
      
      if (response.data.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async register(userData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove(['auth_token', 'user_data']);
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

  // Favorites API
  async getSavedProperties(): Promise<ApiResponse<Property[]>> {
    try {
      const response = await this.client.get('/api/profile/saved-properties');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async saveProperty(propertyId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/profile/save-property', { propertyId });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async unsaveProperty(propertyId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.delete(`/api/profile/save-property/${propertyId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
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
    : 'https://pupqcchcdwawgyxbcbeb.supabase.co', // Use Supabase URL for production
  timeout: 15000, // 15 seconds
  retries: 3,
  cacheEnabled: true,
};

// Export singleton instance
export const apiClient = new ApiClient(apiConfig);
export default apiClient; 