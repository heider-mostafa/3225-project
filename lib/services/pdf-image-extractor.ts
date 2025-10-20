/**
 * Enhanced PDF Image Extractor with Context Analysis
 * Extracts images from PDF documents with surrounding text for smart categorization
 */

import { loadPDFJS } from '@/lib/config/pdfjs-config';

export interface ImagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  imageData: ExtractedImageData;
}

export interface ExtractedImageData {
  base64: string;
  mimeType: string;
  filename: string;
  page: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ImageWithContext {
  image: ExtractedImageData;
  surroundingText: {
    above: string[];
    below: string[];
    nearby: string[];
  };
  classification: ImageCategory;
  confidence: number;
  description: string;
}

export type ImageCategory = 
  | 'property_photo'
  | 'floor_plan' 
  | 'building_exterior'
  | 'document_scan'
  | 'comparison_photo'
  | 'location_map'
  | 'signature'
  | 'logo'
  | 'unknown';

interface ClassificationPatterns {
  [key: string]: {
    arabic: string[];
    english: string[];
  };
}

const APPRAISAL_IMAGE_PATTERNS: ClassificationPatterns = {
  property_photos: {
    arabic: [
      'صور العقار', 'صور الوحدة', 'صور المبنى', 'صور داخلية', 'صور الشقة',
      'غرفة النوم', 'الحمام', 'المطبخ', 'الصالة', 'المعيشة', 'الاستقبال',
      'الشرفة', 'البلكونة', 'التراس', 'غرفة الطعام', 'المكتب', 'المخزن'
    ],
    english: [
      'property photos', 'unit photos', 'interior photos', 'apartment photos',
      'bedroom', 'bathroom', 'kitchen', 'living room', 'reception', 'balcony',
      'terrace', 'dining room', 'office', 'storage', 'interior view', 'room'
    ]
  },
  floor_plans: {
    arabic: [
      'مخطط الوحدة', 'رسم هندسي', 'مخطط الطابق', 'مسقط أفقي', 'مخطط',
      'التصميم الداخلي', 'مخطط المبنى', 'الرسم المعماري', 'التخطيط',
      'مساحات', 'توزيع الغرف', 'المسقط الأفقي'
    ],
    english: [
      'floor plan', 'unit plan', 'architectural plan', 'layout', 'blueprint',
      'building plan', 'site plan', 'design', 'architectural drawing',
      'room layout', 'space planning', 'unit layout'
    ]
  },
  building_exterior: {
    arabic: [
      'الواجهة', 'واجهة المبنى', 'المنظر الخارجي', 'صور خارجية',
      'المدخل الرئيسي', 'الشارع', 'المنظر العام', 'الخارج', 'البناء',
      'الواجهة الأمامية', 'الواجهة الخلفية', 'المبنى من الخارج'
    ],
    english: [
      'facade', 'building exterior', 'front view', 'main entrance', 'exterior',
      'street view', 'external view', 'building front', 'building back',
      'outdoor view', 'building facade', 'exterior shot'
    ]
  },
  comparison_photos: {
    arabic: [
      'صور مقارنة', 'مبيعات مماثلة', 'عقارات مقارنة', 'مقارنات',
      'أمثلة مشابهة', 'صور مرجعية', 'نماذج مقارنة'
    ],
    english: [
      'comparable sales', 'comparison photos', 'similar properties', 'comparables',
      'reference photos', 'comp photos', 'comparison examples', 'market comparisons'
    ]
  },
  location_map: {
    arabic: [
      'خريطة الموقع', 'الخريطة', 'الموقع', 'المنطقة', 'الحي',
      'خريطة المنطقة', 'موقع العقار', 'الموقع الجغرافي'
    ],
    english: [
      'location map', 'site map', 'area map', 'neighborhood map', 'location',
      'property location', 'geographical location', 'map', 'vicinity map'
    ]
  }
};

export class PDFImageExtractor {
  
  /**
   * Extract images with surrounding text context from PDF
   */
  async extractImagesWithContext(file: File): Promise<ImageWithContext[]> {
    console.log('🖼️ Starting enhanced PDF image extraction with context analysis...');
    
    try {
      // Load PDF.js using the new Next.js 14 compatible approach
      const pdfjsLib = await loadPDFJS();
      console.log('📄 PDF.js loaded successfully for Next.js 14');
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const results: ImageWithContext[] = [];
      
      console.log(`📄 Processing ${pdf.numPages} pages for images and text...`);
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`🔍 Analyzing page ${pageNum}/${pdf.numPages}...`);
        
        const page = await pdf.getPage(pageNum);
        
        // Try multiple extraction methods
        const [textContent, imagePositions, alternativeImages] = await Promise.all([
          page.getTextContent(),
          this.extractImagePositions(page, pageNum),
          this.extractImagesAlternativeMethod(page, pageNum)
        ]);
        
        // Combine results from different methods, avoiding duplicates
        const allImages = this.deduplicateImages([...imagePositions, ...alternativeImages]);
        
        console.log(`  📝 Found ${textContent.items.length} text items`);
        console.log(`  🖼️ Found ${imagePositions.length} images (method 1), ${alternativeImages.length} images (method 2)`);
        console.log(`  🔗 Combined to ${allImages.length} unique images`);
        
        // Match images with surrounding text
        const imagesWithContext = this.correlateImagesWithText(
          allImages, 
          textContent, 
          pageNum
        );
        
        results.push(...imagesWithContext);
        
        console.log(`  📊 PAGE ${pageNum} SUMMARY:`);
        console.log(`     🔍 Raw images detected: ${allImages.length}`);
        console.log(`     ✅ Final kept images: ${imagesWithContext.length}`);
        console.log(`     📉 Filtered out: ${allImages.length - imagesWithContext.length}`);
        if (imagesWithContext.length > 0) {
          console.log(`     🏷️ Classifications: ${imagesWithContext.map(img => img.classification).join(', ')}`);
        }
      }
      
      console.log(`🎯 Total extraction complete: ${results.length} images with context`);
      return results;
      
    } catch (error) {
      console.error('❌ Error in PDF image extraction:', error);
      
      // Try fallback with legacy PDF.js import
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('worker') || errorMessage.includes('Worker') || errorMessage.includes('import')) {
        console.log('🔄 Retrying PDF extraction with legacy PDF.js...');
        try {
          // Fallback to legacy import
          const legacyPdfjs = await import('pdfjs-dist');
          
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await legacyPdfjs.getDocument(arrayBuffer).promise;
          
          console.log(`📄 Fallback: Processing ${pdf.numPages} pages with alternative worker...`);
          
          // Simple fallback - just return document metadata without images
          return [{
            image: {
              base64: '',
              mimeType: 'application/pdf',
              filename: `${file.name}_fallback`,
              page: 1,
              position: { x: 0, y: 0, width: 0, height: 0 }
            },
            surroundingText: { above: [], below: [], nearby: [] },
            classification: 'document_scan',
            confidence: 0.3,
            description: `PDF Document (${pdf.numPages} pages) - Fallback mode`
          }];
          
        } catch (fallbackError) {
          console.error('❌ Fallback extraction also failed:', fallbackError);
          return [];
        }
      }
      
      return [];
    }
  }
  
  /**
   * Extract image positions and data from a PDF page
   */
  private async extractImagePositions(page: any, pageNum: number): Promise<ImagePosition[]> {
    const images: ImagePosition[] = [];
    
    try {
      // Load PDF.js for OPS constants
      const pdfjsLib = await loadPDFJS();
      
      // Get the page's operation list to find image operations
      const operatorList = await page.getOperatorList();
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Keep track of graphics state stack
      const transformStack: number[][] = [];
      let currentTransform = [1, 0, 0, 1, 0, 0]; // Identity matrix
      
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];
        const args = operatorList.argsArray[i];
        
        // Handle graphics state operations
        if (fn === pdfjsLib.OPS?.save) {
          // Save current graphics state
          transformStack.push([...currentTransform]);
        } else if (fn === pdfjsLib.OPS?.restore) {
          // Restore previous graphics state
          if (transformStack.length > 0) {
            currentTransform = transformStack.pop() || [1, 0, 0, 1, 0, 0];
          }
        } else if (fn === pdfjsLib.OPS?.transform) {
          // Apply transformation to current matrix
          currentTransform = this.multiplyMatrices(currentTransform, args);
        }
        
        // Look for ALL possible image painting operations
        const imageOperations = [
          pdfjsLib.OPS?.paintImageXObject,
          pdfjsLib.OPS?.paintInlineImageXObject,
          pdfjsLib.OPS?.paintImageMaskXObject,
          pdfjsLib.OPS?.paintFormXObjectBegin,
          pdfjsLib.OPS?.doFormXObject
        ].filter(Boolean); // Remove undefined values
        
        if (imageOperations.includes(fn)) {
          try {
            console.log(`    🔍 Found image operation: ${fn} with args:`, args?.length || 0, 'transform:', currentTransform);
            
            // Validate that this is actually a meaningful image transformation
            const position = this.calculateImagePosition(currentTransform, viewport);
            
            console.log(`    📐 Calculated position: (${Math.round(position.x)}, ${Math.round(position.y)}) size ${Math.round(position.width)}×${Math.round(position.height)}`);
            
            // Filter out invalid or too small images (likely artifacts)
            if (this.isValidImagePosition(position, viewport)) {
              const imageData = await this.extractImageData(page, args, pageNum, position);
              if (imageData) {
                images.push({
                  x: position.x,
                  y: position.y,
                  width: position.width,
                  height: position.height,
                  imageData
                });
                
                console.log(`    ✅ SUCCESSFULLY EXTRACTED IMAGE:`);
                console.log(`       📍 Position: (${Math.round(position.x)}, ${Math.round(position.y)})`);
                console.log(`       📏 Size: ${Math.round(position.width)}×${Math.round(position.height)}`);
                console.log(`       🔧 Operation: ${fn}`);
                console.log(`       🧮 Transform matrix: [${currentTransform.map(n => Math.round(n * 100) / 100).join(', ')}]`);
                console.log(`       📄 Page: ${pageNum}`);
              }
            } else {
              console.log(`    ❌ Filtered out invalid image position: (${Math.round(position.x)}, ${Math.round(position.y)}) size ${Math.round(position.width)}×${Math.round(position.height)}`);
            }
          } catch (imageError) {
            console.warn(`    ⚠️ Failed to extract image data:`, imageError);
          }
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ Error extracting images from page ${pageNum}:`, error);
    }
    
    return images;
  }

  /**
   * Alternative image extraction method using page resources
   */
  private async extractImagesAlternativeMethod(page: any, pageNum: number): Promise<ImagePosition[]> {
    const images: ImagePosition[] = [];
    
    try {
      // Try to get page resources directly
      const commonObjs = page.commonObjs;
      const objs = page.objs;
      const viewport = page.getViewport({ scale: 1.0 });
      
      console.log(`    🔍 Alternative method: checking page resources...`);
      
      // Get page dictionary to find XObject resources
      const pageDict = await page.getObject();
      const resources = pageDict.get('Resources');
      
      if (resources && resources.has('XObject')) {
        const xObjects = resources.get('XObject');
        const xObjectNames = xObjects.getKeys();
        
        console.log(`    📦 Found ${xObjectNames.length} XObjects on page ${pageNum}`);
        
        for (const name of xObjectNames) {
          try {
            const xObj = xObjects.get(name);
            const subtype = xObj.get('Subtype');
            
            // Check if it's an image XObject
            if (subtype && subtype.name === 'Image') {
              const width = xObj.get('Width') || 100;
              const height = xObj.get('Height') || 100;
              
              // Create a reasonable position estimate
              // Since we don't have exact placement, distribute across page
              const x = (images.length % 2) * (viewport.width / 2);
              const y = Math.floor(images.length / 2) * (height + 50);
              
              console.log(`    🖼️ Alternative method found image: ${name} (${width}×${height})`);
              
              const position = { x, y, width, height };
              
              if (this.isValidImagePosition(position, viewport)) {
                const imageData = await this.extractImageData(page, [], pageNum, position);
                if (imageData) {
                  images.push({
                    x: position.x,
                    y: position.y,
                    width: position.width,
                    height: position.height,
                    imageData
                  });
                }
              }
            }
          } catch (error) {
            console.warn(`    ⚠️ Error processing XObject ${name}:`, error);
          }
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ Alternative extraction method failed for page ${pageNum}:`, error);
    }
    
    return images;
  }

  /**
   * Remove duplicate images based on position and size
   */
  private deduplicateImages(images: ImagePosition[]): ImagePosition[] {
    const unique: ImagePosition[] = [];
    const threshold = 10; // pixels tolerance for position matching
    
    for (const image of images) {
      const isDuplicate = unique.some(existing => 
        Math.abs(existing.x - image.x) < threshold &&
        Math.abs(existing.y - image.y) < threshold &&
        Math.abs(existing.width - image.width) < threshold &&
        Math.abs(existing.height - image.height) < threshold
      );
      
      if (!isDuplicate) {
        unique.push(image);
      }
    }
    
    console.log(`    🔗 Deduplicated ${images.length} images to ${unique.length} unique images`);
    return unique;
  }
  
  /**
   * Extract actual image data from PDF page
   */
  private async extractImageData(page: any, args: any[], pageNum: number, position: { x: number, y: number, width: number, height: number }): Promise<ExtractedImageData | null> {
    try {
      // Create a smaller canvas focused on the image area
      const scale = 1.5; // Reduced scale for performance
      const viewport = page.getViewport({ scale });
      
      // Calculate the actual image region within the page
      const imageRegion = {
        x: Math.max(0, position.x * scale),
        y: Math.max(0, position.y * scale),
        width: Math.min(position.width * scale, viewport.width),
        height: Math.min(position.height * scale, viewport.height)
      };
      
      // Create canvas sized to the image region
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = Math.max(100, imageRegion.width); // Minimum 100px width
      canvas.height = Math.max(100, imageRegion.height); // Minimum 100px height
      
      if (!context) return null;
      
      // Render the full page to a temporary canvas first
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;
      
      if (!tempContext) return null;
      
      await page.render({
        canvasContext: tempContext,
        viewport: viewport
      }).promise;
      
      // Extract the image region from the full page
      const imageData = tempContext.getImageData(
        imageRegion.x,
        imageRegion.y,
        imageRegion.width,
        imageRegion.height
      );
      
      // Draw the extracted region to our final canvas
      context.putImageData(imageData, 0, 0);
      
      // Convert to base64
      const imageBase64 = canvas.toDataURL('image/png');
      
      return {
        base64: imageBase64.split(',')[1], // Remove data:image/png;base64, prefix
        mimeType: 'image/png',
        filename: `page_${pageNum}_image_${Math.round(position.x)}_${Math.round(position.y)}.png`,
        page: pageNum,
        position: {
          x: Math.round(position.x),
          y: Math.round(position.y),
          width: Math.round(position.width),
          height: Math.round(position.height)
        }
      };
      
    } catch (error) {
      console.warn('Failed to extract image data:', error);
      return null;
    }
  }
  
  /**
   * Calculate image position from transformation matrix
   */
  private calculateImagePosition(transform: number[], viewport: any): { x: number, y: number, width: number, height: number } {
    // Extract position and scale from transformation matrix
    // PDF transformation matrix: [scaleX, skewY, skewX, scaleY, translateX, translateY]
    const scaleX = Math.abs(transform[0]);
    const scaleY = Math.abs(transform[3]);
    const translateX = transform[4];
    const translateY = transform[5];
    
    // Convert PDF coordinates (bottom-left origin) to canvas coordinates (top-left origin)
    const x = translateX;
    const y = viewport.height - translateY - scaleY; // Flip Y and account for image height
    
    // Enhanced size calculation for different PDF encoding scenarios
    let width: number;
    let height: number;
    
    if (scaleX >= 1 && scaleX <= 10000) {
      // Normal scale values represent pixel dimensions
      width = scaleX;
    } else if (scaleX > 0 && scaleX < 1) {
      // Fractional scale might represent relative size, estimate actual size
      width = scaleX * viewport.width;
    } else {
      // Fallback for unusual scale values
      width = 150; // Reasonable default for property photos
    }
    
    if (scaleY >= 1 && scaleY <= 10000) {
      height = scaleY;
    } else if (scaleY > 0 && scaleY < 1) {
      height = scaleY * viewport.height;
    } else {
      height = 120; // Reasonable default maintaining aspect ratio
    }
    
    console.log(`      🧮 Transform details: scaleX=${scaleX}, scaleY=${scaleY}, translateX=${translateX}, translateY=${translateY}`);
    console.log(`      📐 Calculated: width=${width}, height=${height}, x=${x}, y=${y}`);
    
    return { x, y, width, height };
  }

  /**
   * Validate if an image position represents a real meaningful image
   */
  private isValidImagePosition(position: { x: number, y: number, width: number, height: number }, viewport: any): boolean {
    // Check for reasonable coordinate values
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y) || 
        !Number.isFinite(position.width) || !Number.isFinite(position.height)) {
      return false;
    }
    
    // Check for extremely large coordinates (likely calculation errors)
    if (Math.abs(position.x) > 100000 || Math.abs(position.y) > 100000) {
      return false;
    }
    
    // ADJUSTED SIZE FILTERING: Based on actual appraisal document analysis
    // From screenshots: property photos can be as small as ~150x120px 
    // Form checkboxes are typically 25x22px, so 80px minimum is safe
    if (position.width < 80 || position.height < 80) {
      console.log(`    ❌ Rejecting tiny image: ${Math.round(position.width)}×${Math.round(position.height)} (likely form element/icon)`);
      return false;
    }
    
    // Check for extremely large dimensions  
    if (position.width > 10000 || position.height > 10000) {
      return false;
    }
    
    // Check if image is within reasonable bounds of the page
    if (position.x < -1000 || position.y < -1000 || 
        position.x > viewport.width + 1000 || position.y > viewport.height + 1000) {
      return false;
    }
    
    // More permissive aspect ratio check for property photos
    // Building photos can be wide (panoramic) or tall (portrait)
    const aspectRatio = position.width / position.height;
    if (aspectRatio < 0.1 || aspectRatio > 10) {
      return false;
    }
    
    // Minimum area check - property photos should be at least 80x80 = 6400 pixels
    const area = position.width * position.height;
    if (area < 6400) {
      console.log(`    ❌ Rejecting small area image: ${Math.round(position.width)}×${Math.round(position.height)} (area: ${area})`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Multiply two transformation matrices
   */
  private multiplyMatrices(m1: number[], m2: number[]): number[] {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
    ];
  }
  
  /**
   * Correlate images with surrounding text for context analysis
   */
  private correlateImagesWithText(
    images: ImagePosition[], 
    textContent: any, 
    pageNum: number
  ): ImageWithContext[] {
    const filteredResults: ImageWithContext[] = [];
    
    for (const imgPos of images) {
      const surroundingText = this.extractSurroundingText(imgPos, textContent);
      const classification = this.classifyImageByContext(surroundingText, imgPos);
      const confidence = this.calculateContextConfidence(surroundingText, classification);
      const description = this.generateImageDescription(surroundingText, classification, pageNum);
      
      console.log(`    🏷️ Image classified as: ${classification} (confidence: ${confidence})`);
      console.log(`    📝 Context: ${description}`);
      
      // SIMPLIFIED FILTERING: Keep all detected images that passed size validation
      // Since size validation already filtered out tiny form elements (25x22px)
      // we can trust that remaining images are meaningful property content
      
      console.log(`    ✅ KEEPING IMAGE: ${classification} (confidence: ${confidence}) - Size validation passed`);
      
      // Optional: Only skip obvious utility signatures/stamps with very specific context
      if (classification === 'logo' && confidence < 0.5 && 
          (description.includes('ختم') || description.includes('توقيع'))) {
        console.log(`    ❌ Skipping obvious signature/stamp: ${description.substring(0, 50)}`);
        continue;
      }
      
      // Keep this image
      filteredResults.push({
        image: imgPos.imageData,
        surroundingText,
        classification,
        confidence,
        description
      });
      
      console.log(`    ✅ FINAL KEPT IMAGE:`);
      console.log(`       🏷️ Classification: ${classification} (confidence: ${confidence})`);
      console.log(`       📏 Size: ${Math.round(imgPos.width)}×${Math.round(imgPos.height)}`);
      console.log(`       📍 Position: (${Math.round(imgPos.x)}, ${Math.round(imgPos.y)})`);
      console.log(`       📝 Context text: "${description.substring(0, 100)}..."`);
      console.log(`       🔤 Arabic keywords found: ${surroundingText.above.concat(surroundingText.below, surroundingText.nearby).filter(t => /[\u0600-\u06FF]/.test(t)).slice(0, 3).join(', ')}`);
    }
    
    return filteredResults;
  }
  
  /**
   * Extract text that appears near an image
   */
  private extractSurroundingText(
    imagePos: ImagePosition, 
    textContent: any
  ): { above: string[], below: string[], nearby: string[] } {
    const proximityRadius = 100; // pixels - increased for better context capture
    const textItems = textContent.items;
    
    const above: string[] = [];
    const below: string[] = [];
    const nearby: string[] = [];
    
    for (const textItem of textItems) {
      const textY = textItem.transform[5];
      const textX = textItem.transform[4];
      const textStr = textItem.str?.trim();
      
      if (!textStr || textStr.length === 0) continue;
      
      // Check if text is above image (higher Y coordinate in PDF space)
      if (textY > imagePos.y && textY < imagePos.y + imagePos.height + proximityRadius &&
          textX >= imagePos.x - proximityRadius && textX <= imagePos.x + imagePos.width + proximityRadius) {
        above.push(textStr);
      }
      // Check if text is below image (lower Y coordinate in PDF space)
      else if (textY < imagePos.y && textY > imagePos.y - proximityRadius &&
               textX >= imagePos.x - proximityRadius && textX <= imagePos.x + imagePos.width + proximityRadius) {
        below.push(textStr);
      }
      // Check if text is nearby (within proximity radius)
      else if (this.isWithinProximity(textItem, imagePos, proximityRadius)) {
        nearby.push(textStr);
      }
    }
    
    return { above, below, nearby };
  }
  
  /**
   * Check if text item is within proximity of image
   */
  private isWithinProximity(textItem: any, imagePos: ImagePosition, radius: number): boolean {
    const textX = textItem.transform[4];
    const textY = textItem.transform[5];
    
    const centerX = imagePos.x + imagePos.width / 2;
    const centerY = imagePos.y + imagePos.height / 2;
    
    const distance = Math.sqrt(
      Math.pow(textX - centerX, 2) + Math.pow(textY - centerY, 2)
    );
    
    return distance <= radius;
  }
  
  /**
   * Classify image based on surrounding text context
   */
  private classifyImageByContext(
    surroundingText: { above: string[], below: string[], nearby: string[] },
    imagePos: ImagePosition
  ): ImageCategory {
    const allText = [
      ...surroundingText.above,
      ...surroundingText.below,
      ...surroundingText.nearby
    ].join(' ').toLowerCase();
    
    console.log(`    🔍 Analyzing text context: "${allText.substring(0, 100)}..."`);
    
    // Check for floor plan indicators first (most specific)
    if (this.matchesPatterns(allText, APPRAISAL_IMAGE_PATTERNS.floor_plans)) {
      return 'floor_plan';
    }
    
    // Check for comparison photos
    if (this.matchesPatterns(allText, APPRAISAL_IMAGE_PATTERNS.comparison_photos)) {
      return 'comparison_photo';
    }
    
    // Check for location maps
    if (this.matchesPatterns(allText, APPRAISAL_IMAGE_PATTERNS.location_map)) {
      return 'location_map';
    }
    
    // Check for exterior photos
    if (this.matchesPatterns(allText, APPRAISAL_IMAGE_PATTERNS.building_exterior)) {
      return 'building_exterior';
    }
    
    // Check for interior property photos
    if (this.matchesPatterns(allText, APPRAISAL_IMAGE_PATTERNS.property_photos)) {
      return 'property_photo';
    }
    
    // SIMPLIFIED: Only skip obvious signatures/stamps, keep everything else
    const signaturePatterns = ['توقيع', 'ختم', 'signature'];
    const hasSignatureText = signaturePatterns.some(pattern => allText.includes(pattern.toLowerCase()));
    if (hasSignatureText && allText.length < 100) {
      console.log(`    ⚠️ Potential signature/stamp detected: "${allText.substring(0, 50)}"`);
      return 'signature';
    }
    
    // Fallback to image characteristics-based classification
    return this.classifyByImageProperties(imagePos);
  }
  
  /**
   * Check if text matches classification patterns
   */
  private matchesPatterns(text: string, patterns: { arabic: string[], english: string[] }): boolean {
    const normalizedText = text.toLowerCase().trim();
    
    // Check Arabic patterns
    for (const pattern of patterns.arabic) {
      if (normalizedText.includes(pattern.toLowerCase())) {
        return true;
      }
    }
    
    // Check English patterns
    for (const pattern of patterns.english) {
      if (normalizedText.includes(pattern.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Classify image based on physical properties (fallback method)
   */
  private classifyByImageProperties(imagePos: ImagePosition): ImageCategory {
    const aspectRatio = imagePos.width / imagePos.height;
    const area = imagePos.width * imagePos.height;
    
    // Very small images are likely logos or signatures
    if (area < 5000) {
      return 'logo';
    }
    
    // Very wide images might be floor plans or panoramic views
    if (aspectRatio > 2.0) {
      return 'floor_plan';
    }
    
    // Square-ish images are likely property photos
    if (aspectRatio >= 0.7 && aspectRatio <= 1.3) {
      return 'property_photo';
    }
    
    // Tall images might be document scans
    if (aspectRatio < 0.7) {
      return 'document_scan';
    }
    
    return 'unknown';
  }
  
  /**
   * Calculate confidence score based on text context matching
   */
  private calculateContextConfidence(
    surroundingText: { above: string[], below: string[], nearby: string[] },
    classification: ImageCategory
  ): number {
    const allText = [
      ...surroundingText.above,
      ...surroundingText.below,
      ...surroundingText.nearby
    ].join(' ').toLowerCase();
    
    if (allText.length === 0) {
      return 0.3; // Low confidence without text context
    }
    
    // Higher confidence if we found specific pattern matches
    const patterns = APPRAISAL_IMAGE_PATTERNS[classification.replace('_', '_')] || 
                    APPRAISAL_IMAGE_PATTERNS[classification];
    
    if (patterns && this.matchesPatterns(allText, patterns)) {
      return 0.9; // High confidence with pattern match
    }
    
    // Medium confidence if we have text but no specific matches
    return 0.6;
  }
  
  /**
   * Generate descriptive text for the image
   */
  private generateImageDescription(
    surroundingText: { above: string[], below: string[], nearby: string[] },
    classification: ImageCategory,
    pageNum: number
  ): string {
    const contextText = [
      ...surroundingText.above,
      ...surroundingText.below
    ].filter(text => text.length > 2).join(' ').trim();
    
    if (contextText) {
      return `${contextText} (Page ${pageNum})`;
    }
    
    // Fallback descriptions based on classification
    const fallbackDescriptions: Record<ImageCategory, string> = {
      property_photo: `Property Interior Photo (Page ${pageNum})`,
      floor_plan: `Floor Plan or Layout (Page ${pageNum})`,
      building_exterior: `Building Exterior View (Page ${pageNum})`,
      comparison_photo: `Comparable Property Photo (Page ${pageNum})`,
      location_map: `Location Map (Page ${pageNum})`,
      document_scan: `Document or Text Image (Page ${pageNum})`,
      signature: `Signature (Page ${pageNum})`,
      logo: `Logo or Stamp (Page ${pageNum})`,
      unknown: `Image (Page ${pageNum})`
    };
    
    return fallbackDescriptions[classification];
  }
}

// Export singleton instance
export const pdfImageExtractor = new PDFImageExtractor();
export default pdfImageExtractor;