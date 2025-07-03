import { Platform } from 'react-native';

export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  type: string;
  name: string;
}

/**
 * Mobile-specific image processing utilities for React Native
 */
export class MobileImageProcessor {
  /**
   * Validate if a file/URI is a valid image
   */
  static validateImageFile(file: any): { isValid: boolean; error?: string } {
    // For React Native, we'll mainly validate by URI/file extension
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    // Check if it's a valid URI
    if (typeof file === 'string') {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const hasValidExtension = imageExtensions.some(ext => 
        file.toLowerCase().includes(ext)
      );
      
      if (!hasValidExtension) {
        return { isValid: false, error: 'Invalid image format' };
      }
    }

    // Check file object properties if available
    if (file.type && !file.type.startsWith('image/')) {
      return { isValid: false, error: 'File is not an image' };
    }

    // Check supported formats
    if (file.type) {
      const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!supportedFormats.includes(file.type)) {
        return { isValid: false, error: 'Unsupported image format. Please use JPEG, PNG, or WebP' };
      }
    }

    // Check file size if available (max 10MB)
    if (file.size) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return { isValid: false, error: 'File too large. Maximum size is 10MB' };
      }
    }

    return { isValid: true };
  }

  /**
   * Extract basic metadata from image info
   */
  static async extractMetadata(imageInfo: any): Promise<ImageMetadata> {
    return {
      width: imageInfo.width || 0,
      height: imageInfo.height || 0,
      size: imageInfo.fileSize || 0,
      type: imageInfo.type || 'image/jpeg',
      name: imageInfo.fileName || 'image.jpg'
    };
  }

  /**
   * Get image dimensions from URI (React Native specific)
   */
  static getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'web') {
        // For web platform, use Image API
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        img.src = uri;
      } else {
        // For native platforms, use Image.getSize
        const { Image } = require('react-native');
        Image.getSize(
          uri,
          (width: number, height: number) => {
            resolve({ width, height });
          },
          (error: any) => {
            reject(error);
          }
        );
      }
    });
  }

  /**
   * Create a FormData object for image upload (React Native compatible)
   */
  static createImageFormData(imageUri: string, additionalData: Record<string, any> = {}): FormData {
    const formData = new FormData();
    
    // Add the image
    const imageData = {
      uri: imageUri,
      type: 'image/jpeg', // Default to JPEG
      name: 'image.jpg',
    } as any;
    
    formData.append('files', imageData);
    
    // Add additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });
    
    return formData;
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if the current platform supports image processing
   */
  static get isImageProcessingSupported(): boolean {
    return Platform.OS === 'web';
  }

  /**
   * Log image processing operation
   */
  static logOperation(operation: string, success: boolean, details?: any): void {
    const status = success ? '✅' : '❌';
    console.log(`${status} Image Processing - ${operation}:`, details);
  }
}

export default MobileImageProcessor;