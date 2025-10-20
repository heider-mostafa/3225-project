/**
 * Appraisal Image Uploader Service
 * Handles uploading extracted images from appraisal documents to property storage
 * Uses existing image upload infrastructure
 */

import { ExtractedImage } from './gemini-document-extractor';

export interface AppraisalImageUploadResult {
  success: boolean;
  uploadedImages: UploadedAppraisalImage[];
  errors: string[];
}

export interface UploadedAppraisalImage {
  id: string;
  url: string;
  filename: string;
  category: string;
  is_primary: boolean;
  order_index: number;
  original_category: string;
  source: 'appraisal_document';
  page?: number;
}

class AppraisalImageUploader {
  
  /**
   * Clear base64 image data from appraisal form_data after successful upload
   */
  async clearExtractedImagesFromFormData(
    appraisalId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🧹 Clearing extracted images from appraisal ${appraisalId} form_data`);
      
      const response = await fetch(`/api/appraisals/${appraisalId}/clear-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Successfully cleared extracted images from form_data');
        return { success: true };
      } else {
        console.error('❌ Failed to clear extracted images:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error clearing extracted images:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Convert base64 image to File object
   */
  private base64ToFile(base64: string, filename: string, mimeType: string): File {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    return new File([blob], filename, { type: mimeType });
  }

  /**
   * Map appraisal image categories to property image categories
   */
  private mapImageCategory(originalCategory?: string): string {
    const categoryMap: Record<string, string> = {
      'document_source': 'general',
      'document_page': 'general', 
      'property_image': 'general',
      'floor_plan': 'interior',
      'exterior_view': 'exterior',
      'interior_view': 'interior',
      'amenities': 'amenities'
    };

    return categoryMap[originalCategory || 'property_image'] || 'general';
  }

  /**
   * Upload extracted images to property storage using existing API
   */
  async uploadExtractedImages(
    propertyId: string,
    extractedImages: ExtractedImage[],
    appraisalId?: string
  ): Promise<AppraisalImageUploadResult> {
    
    if (!propertyId || extractedImages.length === 0) {
      return {
        success: true,
        uploadedImages: [],
        errors: []
      };
    }

    console.log(`🖼️ Starting upload of ${extractedImages.length} extracted images for property ${propertyId}`);
    
    const uploadedImages: UploadedAppraisalImage[] = [];
    const errors: string[] = [];

    try {
      // Filter out non-image files (like PDF documents)
      const imageFiles = extractedImages.filter(img => 
        img.mimeType.startsWith('image/') || 
        (img.category === 'document_source' && img.mimeType === 'application/pdf')
      );

      if (imageFiles.length === 0) {
        console.log('📄 No image files found to upload');
        return {
          success: true,
          uploadedImages: [],
          errors: []
        };
      }

      // Upload images in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < imageFiles.length; i += batchSize) {
        const batch = imageFiles.slice(i, i + batchSize);
        
        try {
          const formData = new FormData();
          
          // Convert base64 images to File objects and add to form data
          batch.forEach((image, index) => {
            // Skip PDF documents for now - they need special handling
            if (image.mimeType === 'application/pdf') {
              console.log('📄 Skipping PDF document upload (not an image)');
              return;
            }

            const file = this.base64ToFile(
              image.base64,
              image.filename || `appraisal_image_${i + index + 1}.png`,
              image.mimeType
            );
            
            console.log(`📎 Adding file to form data:`, {
              filename: file.name,
              size: file.size,
              type: file.type,
              base64Length: image.base64.length
            });
            
            formData.append('files', file);
          });

          // Skip if no actual image files in this batch
          if (!formData.has('files')) {
            continue;
          }

          // Add metadata including source tracking
          formData.append('property_id', propertyId);
          formData.append('category', 'general'); // Default category for appraisal images
          formData.append('is_primary', 'false'); // Extracted images are not primary by default
          formData.append('source', 'appraisal_extracted');
          if (appraisalId) {
            formData.append('appraisal_id', appraisalId);
          }
          
          // Add batch metadata for source tracking
          batch.forEach((image, index) => {
            if (image.mimeType.startsWith('image/')) {
              if (image.page !== undefined) {
                formData.append(`document_page_${index}`, image.page.toString());
              }
              if (image.category) {
                formData.append(`original_category_${index}`, image.category);
              }
              if (image.description || image.confidence !== undefined) {
                const metadata = {
                  description: image.description,
                  confidence: image.confidence,
                  extraction_timestamp: new Date().toISOString()
                };
                formData.append(`extraction_metadata_${index}`, JSON.stringify(metadata));
              }
            }
          });

          // Upload to existing property image API
          const response = await fetch('/api/upload/images', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (response.ok && result.uploaded) {
            // Map the response to our expected format
            const batchUploaded = result.uploaded.map((upload: any, idx: number) => {
              const originalImage = batch.filter(img => img.mimeType.startsWith('image/'))[idx];
              return {
                id: upload.id,
                url: upload.url,
                filename: upload.filename,
                category: upload.category,
                is_primary: upload.is_primary,
                order_index: upload.order_index,
                original_category: originalImage?.category || 'property_image',
                source: 'appraisal_document' as const,
                page: originalImage?.page
              };
            });

            uploadedImages.push(...batchUploaded);
            console.log(`✅ Successfully uploaded batch ${Math.floor(i/batchSize) + 1}: ${batchUploaded.length} images`);
          } else {
            const error = `Failed to upload batch ${Math.floor(i/batchSize) + 1}: ${result.error || 'Unknown error'}`;
            errors.push(error);
            console.error(error);
          }

        } catch (error) {
          const errorMsg = `Error uploading batch ${Math.floor(i/batchSize) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      const success = uploadedImages.length > 0 || errors.length === 0;
      
      console.log(`🎯 Upload completed: ${uploadedImages.length} successful, ${errors.length} errors`);
      
      // Clear base64 data from form_data if upload was successful and we have an appraisal ID
      if (success && uploadedImages.length > 0 && appraisalId) {
        console.log('🧹 Clearing base64 data from form_data after successful upload...');
        const clearResult = await this.clearExtractedImagesFromFormData(appraisalId);
        if (!clearResult.success) {
          console.warn('⚠️ Failed to clear base64 data, but upload was successful:', clearResult.error);
          // Don't fail the whole operation just because clearing failed
        }
      }
      
      return {
        success,
        uploadedImages,
        errors
      };

    } catch (error) {
      const errorMsg = `Fatal error during image upload: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      
      return {
        success: false,
        uploadedImages: [],
        errors: [errorMsg]
      };
    }
  }

  /**
   * Upload extracted images with progress tracking
   */
  async uploadExtractedImagesWithProgress(
    propertyId: string,
    extractedImages: ExtractedImage[],
    onProgress?: (progress: { completed: number; total: number; currentImage: string }) => void
  ): Promise<AppraisalImageUploadResult> {
    
    if (!propertyId || extractedImages.length === 0) {
      return {
        success: true,
        uploadedImages: [],
        errors: []
      };
    }

    // Filter for actual image files
    const imageFiles = extractedImages.filter(img => img.mimeType.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      console.log('📄 No image files found for progressive upload');
      return {
        success: true,
        uploadedImages: [],
        errors: []
      };
    }

    console.log(`🖼️ Starting progressive upload of ${imageFiles.length} extracted images`);
    
    const uploadedImages: UploadedAppraisalImage[] = [];
    const errors: string[] = [];
    let completed = 0;

    try {
      // Upload images one by one for progress tracking
      for (let i = 0; i < imageFiles.length; i++) {
        const image = imageFiles[i];
        
        // Report progress
        if (onProgress) {
          onProgress({
            completed,
            total: imageFiles.length,
            currentImage: image.filename || `Image ${i + 1}`
          });
        }

        try {
          const formData = new FormData();
          
          // Convert base64 to File
          const file = this.base64ToFile(
            image.base64,
            image.filename || `appraisal_image_${i + 1}.png`,
            image.mimeType
          );
          
          formData.append('files', file);
          formData.append('property_id', propertyId);
          formData.append('category', this.mapImageCategory(image.category));
          formData.append('is_primary', 'false');

          const response = await fetch('/api/upload/images', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (response.ok && result.uploaded && result.uploaded[0]) {
            const upload = result.uploaded[0];
            uploadedImages.push({
              id: upload.id,
              url: upload.url,
              filename: upload.filename,
              category: upload.category,
              is_primary: upload.is_primary,
              order_index: upload.order_index,
              original_category: image.category || 'property_image',
              source: 'appraisal_document',
              page: image.page
            });
            
            console.log(`✅ Uploaded: ${image.filename || `Image ${i + 1}`}`);
          } else {
            const error = `Failed to upload ${image.filename || `Image ${i + 1}`}: ${result.error || 'Unknown error'}`;
            errors.push(error);
            console.error(error);
          }

        } catch (error) {
          const errorMsg = `Error uploading ${image.filename || `Image ${i + 1}`}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }

        completed++;
      }

      // Final progress report
      if (onProgress) {
        onProgress({
          completed,
          total: imageFiles.length,
          currentImage: 'Upload complete'
        });
      }

      const success = uploadedImages.length > 0 || errors.length === 0;
      
      console.log(`🎯 Progressive upload completed: ${uploadedImages.length} successful, ${errors.length} errors`);
      
      return {
        success,
        uploadedImages,
        errors
      };

    } catch (error) {
      const errorMsg = `Fatal error during progressive upload: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      
      return {
        success: false,
        uploadedImages: [],
        errors: [errorMsg]
      };
    }
  }
}

// Export singleton instance
export const appraisalImageUploader = new AppraisalImageUploader();
export default appraisalImageUploader;