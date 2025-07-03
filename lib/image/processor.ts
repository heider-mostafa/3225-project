export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  type: string;
  name: string;
}

export class ImageProcessor {
  /**
   * Compress an image file to reduce size while maintaining quality
   */
  static async compressImage(
    file: File, 
    quality: number = 0.8,
    maxWidth: number = 1920,
    maxHeight: number = 1080
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate a thumbnail from an image file
   */
  static async generateThumbnail(
    file: File, 
    size: number = 300,
    quality: number = 0.7
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Create square thumbnail
        const minDimension = Math.min(img.width, img.height);
        const x = (img.width - minDimension) / 2;
        const y = (img.height - minDimension) / 2;

        canvas.width = size;
        canvas.height = size;

        ctx?.drawImage(
          img, 
          x, y, minDimension, minDimension,  // Source rectangle
          0, 0, size, size                   // Destination rectangle
        );
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const thumbnailFile = new File([blob], `thumb_${file.name}`, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(thumbnailFile);
            } else {
              reject(new Error('Thumbnail generation failed'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Resize an image to specific dimensions
   */
  static async resizeImage(
    file: File, 
    width: number, 
    height: number,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Image resizing failed'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Validate if a file is a valid image
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'File is not an image' };
    }

    // Check supported formats
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedFormats.includes(file.type)) {
      return { isValid: false, error: 'Unsupported image format. Please use JPEG, PNG, or WebP' };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'File too large. Maximum size is 10MB' };
    }

    // Check minimum dimensions if needed
    // This would require loading the image first, so we'll skip for now

    return { isValid: true };
  }

  /**
   * Extract metadata from an image file
   */
  static async extractMetadata(file: File): Promise<ImageMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const metadata: ImageMetadata = {
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type,
          name: file.name
        };
        resolve(metadata);
      };

      img.onerror = () => reject(new Error('Failed to extract image metadata'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convert image to different format
   */
  static async convertFormat(
    file: File, 
    newFormat: 'image/jpeg' | 'image/png' | 'image/webp',
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // For JPEG, fill with white background to avoid transparency issues
        if (newFormat === 'image/jpeg') {
          ctx!.fillStyle = 'white';
          ctx!.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const extension = newFormat.split('/')[1];
              const newFileName = file.name.replace(/\.[^/.]+$/, `.${extension}`);
              
              const convertedFile = new File([blob], newFileName, {
                type: newFormat,
                lastModified: Date.now()
              });
              resolve(convertedFile);
            } else {
              reject(new Error('Format conversion failed'));
            }
          },
          newFormat,
          quality
        );
      };

      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Create multiple sizes of an image for responsive display
   */
  static async createResponsiveSizes(
    file: File,
    sizes: number[] = [400, 800, 1200]
  ): Promise<{ size: number; file: File }[]> {
    const results = [];
    
    for (const size of sizes) {
      try {
        const resizedFile = await this.compressImage(file, 0.8, size, size);
        results.push({ size, file: resizedFile });
      } catch (error) {
        console.error(`Failed to create ${size}px version:`, error);
      }
    }
    
    return results;
  }
} 