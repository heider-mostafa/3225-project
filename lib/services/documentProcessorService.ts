/**UNUSED
 * Document Processor Service
 * Handles communication with the Python FastAPI Document Processing backend
 * Issue #8: Smart Document Import for Egyptian Appraisal Documents
 */

import { 
  DocumentProcessingResult,
  DocumentUploadRequest,
  FormPopulationRequest,
  FormPopulationResponse,
  DocumentProcessorError,
  FileValidation,
  SmartAppraisalFormData
} from '@/types/document-processor';

class DocumentProcessorService {
  private baseUrl: string;
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_DOCUMENT_PROCESSOR_URL || 'http://localhost:8001';
    this.maxFileSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '52428800'); // 50MB
    this.allowedTypes = (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'pdf,xlsx,docx,jpg,png').split(',');
  }

  /**
   * Validate uploaded file before processing
   */
  validateFile(file: File): FileValidation {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!this.allowedTypes.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Unsupported file type. Allowed: ${this.allowedTypes.join(', ')}`,
        fileType: fileExtension
      };
    }

    // Check file size (50MB limit)
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `File too large. Maximum size: ${(this.maxFileSize / 1024 / 1024).toFixed(0)}MB`,
        fileSize: file.size
      };
    }

    return {
      isValid: true,
      fileType: fileExtension,
      fileSize: file.size
    };
  }

  /**
   * Process uploaded Egyptian appraisal document
   * Connects to existing Python API with full Arabic document processing
   */
  async processDocument(
    file: File, 
    appraiser_id: string,
    onProgress?: (progress: number) => void
  ): Promise<DocumentProcessingResult> {
    
    // Validate file first
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('appraiser_id', appraiser_id);

    try {
      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              onProgress(Math.min(progress, 90)); // Reserve 10% for processing
            }
          });
        }

        xhr.addEventListener('load', () => {
          if (onProgress) onProgress(100);
          
          console.log('🔥 Document processing response received:', {
            status: xhr.status,
            statusText: xhr.statusText,
            responseLength: xhr.responseText?.length || 0
          });
          
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              console.log('✅ Document processing SUCCESS:', {
                import_id: result.import_id,
                fields_extracted: result.fields_extracted,
                images_count: result.images_count,
                processing_time: result.processing_time_seconds,
                ai_service: result.ai_service_used,
                status: result.processing_status
              });
              console.log('📊 Full processing result:', result);
              resolve(result);
            } catch (parseError) {
              console.error('❌ JSON Parse Error:', parseError);
              console.error('Raw response text:', xhr.responseText);
              reject(new Error('Invalid response format from document processor'));
            }
          } else {
            console.error('❌ HTTP Error Status:', xhr.status);
            console.error('Response text:', xhr.responseText);
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(`Document processing failed: ${error.detail || xhr.statusText}`));
            } catch {
              reject(new Error(`Document processing failed: ${xhr.statusText}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error: Unable to connect to document processor'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Request timeout: Document processing took too long'));
        });

        // Open request to Python API
        xhr.open('POST', `${this.baseUrl}/process-document`);
        xhr.timeout = 120000; // 2 minutes timeout for large PDFs
        xhr.send(formData);
      });

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during document processing');
    }
  }

  /**
   * Populate SmartAppraisalForm with extracted data
   * Handles field mapping from Python API to NextJS form structure
   */
  async populateForm(
    import_id: string, 
    corrections: Record<string, any> = {}
  ): Promise<FormPopulationResponse> {
    
    try {
      const response = await fetch(`${this.baseUrl}/populate-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          import_id,
          corrections
        }),
      });

      if (!response.ok) {
        const error: DocumentProcessorError = await response.json().catch(() => ({
          error: 'Unknown error',
          details: response.statusText
        }));
        throw new Error(`Form population failed: ${error.details || error.error}`);
      }

      const result: FormPopulationResponse = await response.json();
      return result;

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during form population');
    }
  }

  /**
   * Map extracted data directly to SmartAppraisalForm format
   * Handles the critical fields identified in the Python analysis
   */
  async mapExtractedDataToFormData(processingResult: DocumentProcessingResult): Promise<SmartAppraisalFormData> {
    console.log('🔄 Starting data mapping:', {
      extracted_fields_count: processingResult.extracted_fields?.length || 0,
      import_id: processingResult.import_id
    });
    
    const formData: SmartAppraisalFormData = {};
    
    // Map extracted fields to form fields
    processingResult.extracted_fields?.forEach((field, index) => {
      const { field_name, extracted_value, confidence } = field;
      
      // Log first 10 fields for debugging
      if (index < 10) {
        console.log(`📊 Field ${index + 1}:`, {
          field_name,
          extracted_value,
          confidence,
          type: typeof extracted_value
        });
      }
      
      // Only use high-confidence extractions (>0.7) for critical fields
      const isHighConfidence = confidence > 0.7;
      const isCriticalField = [
        'land_area_sqm',
        'unit_land_share', 
        'building_age_years',
        'final_reconciled_value',
        'unit_area_sqm',
        'client_name',
        'appraiser_name'
      ].includes(field_name);
      
      // Use field if high confidence OR not critical
      if (isHighConfidence || !isCriticalField) {
        // Type conversion for known mismatches
        let processedValue = extracted_value;
        
        // Convert string numbers to actual numbers for specific fields that expect numbers
        const numericFields = [
          'unit_land_share', 'floor_number', 'building_age_years', 'year_built', 
          'total_floors', 'bedrooms', 'bathrooms', 'reception_rooms', 'kitchens', 
          'parking_spaces', 'land_area_sqm', 'built_area_sqm', 'unit_area_sqm',
          'balcony_area_sqm', 'garage_area_sqm', 'economic_life_years', 
          'overall_condition_rating', 'neighborhood_quality_rating', 
          'accessibility_rating', 'street_width_meters', 'comparable_sale_1_age',
          'comparable_sale_2_age', 'comparable_sale_3_age', 'comparable_sale_1_area',
          'comparable_sale_2_area', 'comparable_sale_3_area', 'comparable_sale_1_floor',
          'comparable_sale_2_floor', 'comparable_sale_3_floor'
        ];
        
        if (numericFields.includes(field_name)) {
          if (typeof extracted_value === 'string' && extracted_value.trim() && !isNaN(Number(extracted_value))) {
            processedValue = Number(extracted_value);
            console.log(`🔄 Converted ${field_name} from string "${extracted_value}" to number ${processedValue}`);
          } else if (typeof extracted_value === 'number') {
            processedValue = extracted_value; // Already a number
          }
        }
        
        // Convert string values to record format for fields that expect z.record(z.string())
        if (['wall_finishes', 'floor_materials'].includes(field_name)) {
          if (typeof extracted_value === 'string' && extracted_value.trim()) {
            processedValue = { general: extracted_value };
            console.log(`🔄 Converted ${field_name} from string "${extracted_value}" to record:`, processedValue);
          } else if (typeof extracted_value === 'object' && extracted_value !== null) {
            // Already in correct format
            processedValue = extracted_value;
          }
        }
        
        // Handle built_area_sqm mapping to unit_area_sqm if needed
        if (field_name === 'unit_area_sqm' && typeof extracted_value === 'number') {
          processedValue = extracted_value;
        }
        
        // Clean up text fields that might contain line breaks or concatenated content
        if (typeof processedValue === 'string' && ['client_name', 'appraiser_name', 'property_address_arabic', 'property_address_english'].includes(field_name)) {
          // Remove line breaks and clean up the text
          processedValue = processedValue.replace(/\n/g, ' ').trim();
          
          // For client_name, try to extract the first meaningful part if it's concatenated
          if (field_name === 'client_name') {
            // Split by common delimiters and take the first non-empty meaningful part
            const parts = processedValue.split(/[،,\n\t]/).map(p => p.trim()).filter(p => p.length > 2);
            if (parts.length > 0) {
              processedValue = parts[0];
            }
          }
          
          console.log(`🧹 Cleaned ${field_name} from "${extracted_value}" to "${processedValue}"`);
        }
        
        formData[field_name as keyof SmartAppraisalFormData] = processedValue;
        
        // Log successful mappings for critical fields
        if (isCriticalField) {
          console.log(`✅ CRITICAL field mapped: ${field_name} = ${processedValue} (confidence: ${confidence})`);
        }
      } else {
        console.log(`⚠️  Skipped ${field_name} due to low confidence: ${confidence}`);
      }
    });

    // Handle missing required fields with reasonable defaults
    if (!formData.requested_by) {
      formData.requested_by = formData.client_name || 'Property Owner';
      console.log('🔧 Added default requested_by:', formData.requested_by);
    }
    
    if (!formData.property_address_english && formData.property_address_arabic) {
      formData.property_address_english = `${formData.city_name || 'Unknown City'}, ${formData.governorate || 'Egypt'}`;
      console.log('🔧 Added default property_address_english:', formData.property_address_english);
    }
    
    if (!formData.built_area_sqm && formData.unit_area_sqm) {
      formData.built_area_sqm = formData.unit_area_sqm;
      console.log('🔧 Set built_area_sqm from unit_area_sqm:', formData.built_area_sqm);
    }
    
    if (!formData.construction_type) {
      formData.construction_type = 'concrete'; // Most common in Egypt
      console.log('🔧 Added default construction_type: concrete');
    }
    
    if (!formData.property_type) {
      formData.property_type = 'apartment'; // Most common type
      console.log('🔧 Added default property_type: apartment');
    }
    
    // Handle required condition rating (1-10)
    if (!formData.overall_condition_rating) {
      formData.overall_condition_rating = 8; // Good condition default
      console.log('🔧 Added default overall_condition_rating: 8');
    }
    
    // Handle required condition enums
    if (!formData.structural_condition) {
      formData.structural_condition = 'good';
      console.log('🔧 Added default structural_condition: good');
    }
    
    if (!formData.mechanical_systems_condition) {
      formData.mechanical_systems_condition = 'good';
      console.log('🔧 Added default mechanical_systems_condition: good');
    }
    
    if (!formData.exterior_condition) {
      formData.exterior_condition = 'good';
      console.log('🔧 Added default exterior_condition: good');
    }
    
    if (!formData.interior_condition) {
      formData.interior_condition = 'good';
      console.log('🔧 Added default interior_condition: good');
    }
    
    // Handle required boolean utility fields - use extracted data or defaults
    if (formData.electricity_available === undefined) {
      formData.electricity_available = true; // Default true for Egyptian properties
    }
    if (formData.water_supply_available === undefined) {
      formData.water_supply_available = true;
    }
    if (formData.sewage_system_available === undefined) {
      formData.sewage_system_available = true;
    }
    if (formData.gas_supply_available === undefined) {
      formData.gas_supply_available = true;
    }
    
    // Handle Land Valuation (Egyptian Standards) field mappings
    if (formData.land_value && formData.land_area_sqm) {
      // Calculate land value per sqm if not already extracted
      if (!formData.land_value_per_sqm) {
        formData.land_value_per_sqm = Math.round(formData.land_value / formData.land_area_sqm);
        console.log('🔧 Calculated land_value_per_sqm:', formData.land_value_per_sqm);
      }
    }
    
    if (formData.land_area_sqm && !formData.total_building_land_area) {
      formData.total_building_land_area = formData.land_area_sqm;
      console.log('🔧 Set total_building_land_area from land_area_sqm:', formData.total_building_land_area);
    }
    
    if (formData.unit_land_share && !formData.unit_land_share_sqm) {
      // Convert unit_land_share (string "62.00") to unit_land_share_sqm (number)
      const shareValue = typeof formData.unit_land_share === 'string' 
        ? parseFloat(formData.unit_land_share) 
        : formData.unit_land_share;
      formData.unit_land_share_sqm = shareValue;
      console.log('🔧 Set unit_land_share_sqm:', formData.unit_land_share_sqm);
    }
    
    if (!formData.land_use_classification) {
      // Determine from property_type or set default
      if (formData.property_type) {
        const landUseMap: Record<string, string> = {
          'apartment': 'Residential (سكني)',
          'villa': 'Residential (سكني)',
          'townhouse': 'Residential (سكني)',
          'duplex': 'Residential (سكني)',
          'commercial': 'Commercial (تجاري)',
          'industrial': 'Industrial (صناعي)'
        };
        formData.land_use_classification = landUseMap[formData.property_type] || 'Residential (سكني)';
        console.log('🔧 Set land_use_classification:', formData.land_use_classification);
      }
    }

    // Handle Egyptian Legal Standards mapping
    console.log('🏛️ Processing Egyptian Legal Standards...');
    
    // Import and use the legal standards template
    const { DEFAULT_EGYPTIAN_LEGAL_STANDARDS } = await import('@/lib/constants/egyptian-legal-standards');
    
    formData.egyptian_legal_standards = {
      ...DEFAULT_EGYPTIAN_LEGAL_STANDARDS,
      
      // Auto-populate from extracted data
      property_address_arabic: formData.property_address_arabic || "",
      property_address_english: formData.property_address_english || "",
      building_number: formData.building_number?.toString() || "",
      unit_number: formData.unit_number || "",
      floor_number: formData.floor_number?.toString() || "",
      
      // Property type mapping
      property_type_arabic: formData.property_type ? (() => {
        const typeMap: Record<string, string> = {
          'duplex': 'دوبلكس',
          'apartment': 'شقة',
          'villa': 'فيلا', 
          'townhouse': 'تاون هاوس',
          'penthouse': 'بنت هاوس',
          'studio': 'استوديو',
          'commercial': 'تجاري',
          'industrial': 'صناعي'
        };
        return typeMap[formData.property_type] || formData.property_type;
      })() : "",
      property_type_english: formData.property_type || "",
      
      // Client information (clean up any line breaks)
      client_name_arabic: (formData.client_name || "").replace(/\n/g, ' ').trim(),
      client_name_english: "",
      requesting_entity_arabic: (formData.requested_by || "").replace(/\n/g, ' ').trim(),
      requesting_entity_english: "",
      
      // Appraiser information (clean up any line breaks)  
      appraiser_name_arabic: (formData.appraiser_name || "").replace(/\n/g, ' ').trim(),
      appraiser_name_english: "",
      appraiser_license_number: formData.appraiser_license_number || "",
      
      // Report dates
      inspection_date: formData.appraisal_date || new Date().toISOString().split('T')[0],
      report_issue_date: new Date().toISOString().split('T')[0],
      signature_date: new Date().toISOString().split('T')[0],
      
      // Set report validity from existing field or default
      report_validity_period_months: formData.report_validity_months || 12
    };
    
    console.log('✅ Egyptian Legal Standards populated:', {
      property_type_arabic: formData.egyptian_legal_standards.property_type_arabic,
      client_name_arabic: formData.egyptian_legal_standards.client_name_arabic,
      appraiser_name_arabic: formData.egyptian_legal_standards.appraiser_name_arabic,
      building_info: `Building ${formData.egyptian_legal_standards.building_number}, Unit ${formData.egyptian_legal_standards.unit_number}, Floor ${formData.egyptian_legal_standards.floor_number}`
    });

    // Add processing metadata for tracking
    (formData as any).processing_metadata = {
      import_id: processingResult.import_id,
      ai_service_used: processingResult.ai_service_used,
      fields_extracted: processingResult.fields_extracted,
      processing_time_seconds: processingResult.processing_time_seconds,
      confidence_scores: processingResult.confidence_scores,
      images_count: processingResult.images_count
    };

    console.log('✅ Data mapping complete:', {
      mapped_fields_count: Object.keys(formData).length,
      sample_fields: {
        client_name: formData.client_name,
        land_area_sqm: formData.land_area_sqm,
        final_reconciled_value: formData.final_reconciled_value
      }
    });

    return formData;
  }

  /**
   * Health check for Python API availability
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      } as RequestInit);
      
      if (response.ok) {
        const result = await response.json();
        return result.status === 'healthy';
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get processing statistics (if available from Python API)
   */
  async getProcessingStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Cancel ongoing processing (if supported)
   */
  cancelProcessing(import_id: string): void {
    // Implementation depends on Python API support for cancellation
    console.log(`Cancelling processing for import_id: ${import_id}`);
  }

  /**
   * Get allowed file types for UI display
   */
  getAllowedFileTypes(): string[] {
    return this.allowedTypes;
  }

  /**
   * Get max file size for UI validation
   */
  getMaxFileSize(): number {
    return this.maxFileSize;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const documentProcessorService = new DocumentProcessorService();
export default documentProcessorService;