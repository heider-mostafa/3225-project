/**
 * File Upload Service for Identity Verification
 * Handles secure upload of identity documents and selfies for Valify integration
 */

import { createClient } from '@supabase/supabase-js';

interface UploadResult {
  url: string;
  path: string;
  publicUrl: string;
}

interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileSize: number;
  fileType: string;
}

class FileUploadService {
  private supabase;

  constructor() {
    // Create client safely at runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required Supabase environment variables');
    }
    
    // Use anon key for client-side operations, service role should only be used server-side
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Validate file for identity verification
   */
  validateFile(file: File, type: 'document' | 'selfie'): FileValidationResult {
    const maxSize = type === 'document' ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for documents, 5MB for selfies
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload JPEG, PNG, or WebP images.',
        fileSize: file.size,
        fileType: file.type,
      };
    }

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${maxSizeMB}MB.`,
        fileSize: file.size,
        fileType: file.type,
      };
    }

    if (file.size < 1024) {
      return {
        isValid: false,
        error: 'File size too small. Please upload a valid image.',
        fileSize: file.size,
        fileType: file.type,
      };
    }

    return {
      isValid: true,
      fileSize: file.size,
      fileType: file.type,
    };
  }

  /**
   * Generate secure file path for identity documents
   */
  private generateSecureFilePath(
    appraiser_id: string,
    fileType: 'document' | 'selfie' | 'headshot',
    originalFileName: string
  ): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase() || 'jpg';
    
    return `verification/${appraiser_id}/${fileType}/${timestamp}_${randomString}.${fileExtension}`;
  }

  /**
   * Upload identity document (National ID, Passport, etc.)
   */
  async uploadIdentityDocument(
    file: File,
    appraiser_id: string,
    documentType: 'national_id' | 'passport' | 'license' | 'national_id_front' | 'national_id_back' = 'national_id'
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, 'document');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Generate secure file path
      const filePath = this.generateSecureFilePath(appraiser_id, 'document', file.name);

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('identity-verification')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            appraiser_id,
            document_type: documentType,
            upload_timestamp: new Date().toISOString(),
            file_size: file.size.toString(),
            mime_type: file.type,
          },
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('identity-verification')
        .getPublicUrl(filePath);

      // Log upload to database
      await this.logFileUpload(appraiser_id, 'document', documentType, filePath, file.size);

      return {
        url: data.path,
        path: filePath,
        publicUrl: urlData.publicUrl,
      };
    } catch (error) {
      console.error('Identity document upload error:', error);
      throw new Error('Failed to upload identity document');
    }
  }

  /**
   * Upload selfie for verification
   */
  async uploadSelfie(
    file: File,
    appraiser_id: string,
    selfieType: 'verification' | 'liveness' = 'verification'
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, 'selfie');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Generate secure file path
      const filePath = this.generateSecureFilePath(appraiser_id, 'selfie', file.name);

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('identity-verification')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            appraiser_id,
            selfie_type: selfieType,
            upload_timestamp: new Date().toISOString(),
            file_size: file.size.toString(),
            mime_type: file.type,
          },
        });

      if (error) {
        throw new Error(`Selfie upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('identity-verification')
        .getPublicUrl(filePath);

      // Log upload to database
      await this.logFileUpload(appraiser_id, 'selfie', selfieType, filePath, file.size);

      return {
        url: data.path,
        path: filePath,
        publicUrl: urlData.publicUrl,
      };
    } catch (error) {
      console.error('Selfie upload error:', error);
      throw new Error('Failed to upload selfie');
    }
  }

  /**
   * Upload standardized headshot (generated by AI)
   */
  async uploadStandardizedHeadshot(
    file: File,
    appraiser_id: string
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, 'selfie');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Generate secure file path
      const filePath = this.generateSecureFilePath(appraiser_id, 'headshot', file.name);

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('public-headshots')
        .upload(filePath, file, {
          cacheControl: '86400', // 24 hours cache for public headshots
          upsert: true, // Allow overwrite for headshot updates
          metadata: {
            appraiser_id,
            upload_timestamp: new Date().toISOString(),
            file_size: file.size.toString(),
            mime_type: file.type,
            is_standardized: 'true',
          },
        });

      if (error) {
        throw new Error(`Headshot upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('public-headshots')
        .getPublicUrl(filePath);

      // Update appraiser profile with new headshot URL
      await this.updateAppraiserHeadshot(appraiser_id, urlData.publicUrl);

      return {
        url: data.path,
        path: filePath,
        publicUrl: urlData.publicUrl,
      };
    } catch (error) {
      console.error('Headshot upload error:', error);
      throw new Error('Failed to upload standardized headshot');
    }
  }

  /**
   * Generate secure temporary URL for file access
   */
  async generateSecureUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from('identity-verification')
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Failed to generate secure URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Generate secure URL error:', error);
      throw new Error('Failed to generate secure file URL');
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string, bucket: 'identity-verification' | 'public-headshots' = 'identity-verification'): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete file error:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Get file from storage as Blob for Valify API
   */
  async getFileAsBlob(filePath: string): Promise<Blob> {
    try {
      const { data, error } = await this.supabase.storage
        .from('identity-verification')
        .download(filePath);

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Get file as blob error:', error);
      throw new Error('Failed to retrieve file');
    }
  }

  /**
   * Convert file path to File object for API calls
   */
  async getFileObject(filePath: string, fileName: string): Promise<File> {
    try {
      const blob = await this.getFileAsBlob(filePath);
      return new File([blob], fileName, { type: blob.type });
    } catch (error) {
      console.error('Get file object error:', error);
      throw new Error('Failed to convert file');
    }
  }

  /**
   * Log file upload to database
   */
  private async logFileUpload(
    appraiser_id: string,
    fileType: string,
    subType: string,
    filePath: string,
    fileSize: number
  ): Promise<void> {
    try {
      // This will be implemented with proper database logging
      console.log('File upload logged:', {
        appraiser_id,
        fileType,
        subType,
        filePath,
        fileSize,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log file upload:', error);
    }
  }

  /**
   * Update appraiser profile with headshot URL
   */
  private async updateAppraiserHeadshot(appraiser_id: string, headshotUrl: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('brokers')
        .update({ standardized_headshot_url: headshotUrl })
        .eq('id', appraiser_id);

      if (error) {
        throw new Error(`Failed to update headshot URL: ${error.message}`);
      }
    } catch (error) {
      console.error('Update headshot URL error:', error);
      throw new Error('Failed to update appraiser headshot');
    }
  }

  /**
   * Clean up old verification files (for maintenance)
   */
  async cleanupOldFiles(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // List files older than cutoff date
      const { data, error } = await this.supabase.storage
        .from('identity-verification')
        .list('verification/', {
          limit: 1000,
        });

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }

      // Filter and delete old files
      const oldFiles = data?.filter(file => {
        const fileDate = new Date(file.created_at);
        return fileDate < cutoffDate;
      });

      if (oldFiles && oldFiles.length > 0) {
        const filePaths = oldFiles.map(file => `verification/${file.name}`);
        await this.supabase.storage
          .from('identity-verification')
          .remove(filePaths);
        
        console.log(`Cleaned up ${oldFiles.length} old verification files`);
      }
    } catch (error) {
      console.error('Cleanup old files error:', error);
    }
  }
}

// Export singleton instance
// Export singleton instance only if environment variables are available
export const fileUploadService = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? new FileUploadService()
  : null;
export default fileUploadService;

// Export types
export type { UploadResult, FileValidationResult };