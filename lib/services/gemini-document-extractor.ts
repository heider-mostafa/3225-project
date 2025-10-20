/**
 * Gemini-based Document Extraction Service
 * Replaces Python document processing with Google Gemini AI
 */

import { SmartAppraisalFormData, EgyptianLegalStandardsData } from '@/types/document-processor';
import { DEFAULT_EGYPTIAN_LEGAL_STANDARDS } from '@/lib/constants/egyptian-legal-standards';
import { AppraisalDataMapper, ExtractedAppraisalData } from './appraisal-data-mapper';
import { roundPricePerSqm, roundMonetaryValue, roundAllMonetaryFields, roundAllPricePerSqmFields } from '@/lib/utils/price-rounding';
import { pdfImageExtractor, ImageWithContext } from './pdf-image-extractor';

// Dynamic import for Google GenAI from CDN
let GoogleGenAI: any = null;

// Load Google GenAI from CDN
const loadGoogleGenAI = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('Google GenAI CDN loading only works in browser environment');
  }

  if (GoogleGenAI) {
    return GoogleGenAI;
  }

  return new Promise((resolve, reject) => {
    // Use script injection to load the ES6 module and capture the export
    const globalVarName = `__googleGenAI_${Date.now()}`;
    
    // Create a module script that imports and assigns to window
    const captureScript = document.createElement('script');
    captureScript.type = 'module';
    captureScript.textContent = `
      try {
        const { GoogleGenAI } = await import('https://aistudiocdn.com/@google/genai@^1.19.0');
        window.${globalVarName} = GoogleGenAI;
        window.dispatchEvent(new CustomEvent('genai-loaded-${globalVarName}', { 
          detail: { success: true, exports: ['GoogleGenAI'] }
        }));
      } catch (error) {
        console.error('Failed to import GoogleGenAI:', error);
        window.dispatchEvent(new CustomEvent('genai-loaded-${globalVarName}', { 
          detail: { success: false, error: error.message }
        }));
      }
    `;
    
    // Listen for the load event
    const handleLoad = (event: any) => {
      const detail = event.detail;
      if (detail.success) {
        GoogleGenAI = (window as any)[globalVarName];
        if (GoogleGenAI) {
          resolve(GoogleGenAI);
        } else {
          reject(new Error('GoogleGenAI not found on window after successful import'));
        }
      } else {
        reject(new Error(`Failed to import GoogleGenAI: ${detail.error}`));
      }
    };
    
    window.addEventListener(`genai-loaded-${globalVarName}`, handleLoad, { once: true });
    
    // Set a timeout in case the script never loads
    setTimeout(() => {
      window.removeEventListener(`genai-loaded-${globalVarName}`, handleLoad);
      reject(new Error('Timeout waiting for GoogleGenAI to load'));
    }, 10000); // 10 second timeout
    
    document.head.appendChild(captureScript);
  });
};

// Your RealEstateData interface
export interface RealEstateData {
  clientName: string;
  requestedBy: string;
  appraisalDate: string;
  reportNumber: string;
  appraiserName: string;
  registrationNumber: string;
  appraisalValidUntil: string;
  ownerName: string;
  reportType: string;

  propertyAddressArabic: string;
  propertyAddressEnglish: string;
  districtName: string;
  cityName: string;
  governorate: string;
  propertyBoundaries: string;

  buildingNumber: string;
  floorNumber: string;
  unitNumber: string;
  entrance: string;
  buildingAgeYears: string;
  effectiveBuildingAgeYears: string;
  economicBuildingLifeYears: string;
  remainingBuildingLifeYears: string;
  constructionType: string;

  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  receptionRooms: string;
  kitchens: string;
  parkingSpaces: string;
  totalFloors: string;
  yearBuilt: string;

  landAreaSqm: string;
  builtAreaSqm: string;
  unitAreaSqm: string;
  balconyAreaSqm: string;
  garageAreaSqm: string;
  totalBuildingAreaSqm: string;
  unitLandShareSqm: string;

  finishingLevel: string;
  floorMaterials: string;
  wallFinishes: string;
  ceilingType: string;
  windowsType: string;
  doorsType: string;
  electricalSystemDescription: string;
  sanitaryWareDescription: string;
  exteriorFinishesDescription: string;

  overallConditionRating: string;
  structuralCondition: string;
  mechanicalSystemsCondition: string;
  exteriorCondition: string;
  interiorCondition: string;

  electricityAvailable: string;
  waterSupplyAvailable: string;
  sewageSystemAvailable: string;
  gasSupplyAvailable: string;
  telephoneAvailable: string;
  internetFiberAvailable: string;
  elevatorAvailable: string;
  parkingAvailable: string;
  securitySystem: string;
  nearbyServices: string;

  streetWidthMeters: string;
  accessibilityRating: string;
  noiseLevel: string;
  viewQuality: string;
  neighborhoodQualityRating: string;
  locationDescription: string;
  constructionVolume: string;
  fundingSource: string;
  areaCharacter: string;

  marketTrend: string;
  demandSupplyRatio: string;
  timeToSell: string;
  pricePerSqmArea: string;
  pricePerSqmSemiFinished: string;
  pricePerSqmFullyFinished: string;
  pricePerSqmLand: string;

  costApproachValue: string;
  salesComparisonValue: string;
  incomeApproachValue: string;
  finalReconciledValue: string;
  recommendedValuationMethod: string;
  monthlyRentalEstimate: string;
  landValue: string;
  buildingValue: string;
  landPricePerSqm: string;
  unitLandShareValue: string;
  constructionCostPerSqm: string;
  unitConstructionCost: string;
  buildingValueWithProfit: string;
  curableDepreciationValue: string;
  incurableDepreciationValue: string;
  totalDepreciationValue: string;
  garageShareDescription: string;

  ownershipType: string;
  titleDeedAvailable: string;
  buildingPermitAvailable: string;
  occupancyCertificate: string;
  realEstateTaxPaid: string;
  
  // Additional extracted fields
  occupancyStatus: string;
  totalUnitsInBuilding: string;
  estimatedSellingTime: string;
  
  // Comparable Sales (3 sales maximum)
  comparableSale1Address: string;
  comparableSale1Price: string;
  comparableSale1Area: string;
  comparableSale1PricePerSqm: string;
  comparableSale1Age: string;
  comparableSale1Finishing: string;
  comparableSale1Floor: string;
  comparableSale1Orientation: string;
  comparableSale1StreetView: string;
  comparableSale1SaleDate: string;
  
  comparableSale2Address: string;
  comparableSale2Price: string;
  comparableSale2Area: string;
  comparableSale2PricePerSqm: string;
  comparableSale2Age: string;
  comparableSale2Finishing: string;
  comparableSale2Floor: string;
  comparableSale2Orientation: string;
  comparableSale2StreetView: string;
  comparableSale2SaleDate: string;
  
  comparableSale3Address: string;
  comparableSale3Price: string;
  comparableSale3Area: string;
  comparableSale3PricePerSqm: string;
  comparableSale3Age: string;
  comparableSale3Finishing: string;
  comparableSale3Floor: string;
  comparableSale3Orientation: string;
  comparableSale3StreetView: string;
  comparableSale3SaleDate: string;
}

export interface ExtractedImage {
  base64: string;
  mimeType: string;
  filename: string;
  category?: string;
  description?: string;
  page?: number;
  // Enhanced properties from context analysis
  contextualText?: {
    above: string[];
    below: string[];
    nearby: string[];
  };
  confidence?: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface GeminiExtractionResult {
  success: boolean;
  extractedData: RealEstateData | null;
  formData: SmartAppraisalFormData;
  extractedImages: ExtractedImage[];
  processingTime: number;
  error?: string;
}

class GeminiDocumentExtractor {
  private genAI: any = null;
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || null;
    
    if (!this.apiKey) {
      console.warn('Google AI API key not found. Document extraction will not work.');
    }
  }

  // Initialize GenAI when needed
  private async initializeGenAI(): Promise<void> {
    if (this.genAI) {
      return; // Already initialized
    }

    if (!this.apiKey) {
      throw new Error('Google AI API key not found');
    }

    try {
      const GoogleGenAI = await loadGoogleGenAI();
      this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
    } catch (error) {
      throw new Error(`Failed to initialize Google GenAI: ${error}`);
    }
  }

  private fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  // Extract images from PDF using enhanced PDF.js with context analysis
  private async extractImagesFromPDF(file: File): Promise<ExtractedImage[]> {
    try {
      console.log('📄 Extracting images from PDF using enhanced PDF.js with context analysis...');
      
      // Use the new PDF image extractor for context-aware extraction
      const imagesWithContext = await pdfImageExtractor.extractImagesWithContext(file);
      
      // Convert to ExtractedImage format
      const extractedImages: ExtractedImage[] = imagesWithContext.map(imgContext => ({
        base64: imgContext.image.base64,
        mimeType: imgContext.image.mimeType,
        filename: imgContext.image.filename,
        category: imgContext.classification,
        description: imgContext.description,
        page: imgContext.image.page,
        contextualText: imgContext.surroundingText,
        confidence: imgContext.confidence,
        position: imgContext.image.position
      }));

      console.log(`✅ Enhanced PDF image extraction completed: ${extractedImages.length} images with context`);
      
      // Log classification summary
      const classificationSummary = extractedImages.reduce((acc, img) => {
        acc[img.category || 'unknown'] = (acc[img.category || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('📊 Image classification summary:', classificationSummary);
      
      return extractedImages;
      
    } catch (error) {
      console.warn('Failed to extract images from PDF with context:', error);
      
      // Fallback to simple document representation
      try {
        const base64EncodedData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });

        return [{
          base64: base64EncodedData,
          mimeType: file.type,
          filename: `${file.name.replace('.pdf', '_document.pdf')}`,
          category: 'document_source',
          description: 'Complete appraisal document (PDF)',
          page: 1,
          confidence: 0.5
        }];
      } catch (fallbackError) {
        console.error('Failed fallback image extraction:', fallbackError);
        return [];
      }
    }
  }

  // Extract images from image files directly
  private async extractImagesFromImageFile(file: File): Promise<ExtractedImage[]> {
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      return [{
        base64,
        mimeType: file.type,
        filename: file.name,
        category: 'property_image',
        description: 'Property image from appraisal document'
      }];
      
    } catch (error) {
      console.warn('Failed to process image file:', error);
      return [];
    }
  }

  // Main image extraction method
  private async extractImagesFromDocument(file: File): Promise<ExtractedImage[]> {
    console.log('🖼️ Starting image extraction from document...');
    
    if (file.type === 'application/pdf') {
      return await this.extractImagesFromPDF(file);
    } else if (file.type.startsWith('image/')) {
      return await this.extractImagesFromImageFile(file);
    } else {
      console.log('📄 Document type does not support image extraction:', file.type);
      return [];
    }
  }

  private getSystemPrompt(): string {
    return `You are a world-class data extraction and NLP agent specialized in Arabic real estate appraisal documents. Your sole purpose is to analyze a provided document (PDF, DOCX, XLSX, TXT) and extract specific information.

Your task is to identify and normalize appraisal-related information written in Arabic (and sometimes English) and map it to a predefined JSON schema.

**Extraction Rules:**

1. **Flexible Matching:** You must identify relevant data even if the wording varies. For example:
   * "اسم العميل", "العميل", "مقدم الطلب", "اسم العميل المحترم" should all map to \`clientName\`.
   * "العنوان", "عنوان العقار", "الموقع" should all map to \`propertyAddressArabic\`.
   * Handle synonyms, spelling variations, abbreviations, plurals, and singular forms.
2. **Context is Key:** Ignore unrelated words that might resemble keywords but do not fit the real estate appraisal context.
3. **Data Location:** The data can be anywhere: in tables, free text paragraphs, headers, or footers.
4. **Number Normalization:** Convert both Arabic numerals (e.g., ١٢٣, ٢٠٢٤) and Western numerals (123, 2024) into standard Western numerals in the final JSON.
5. **Output Format:** You MUST output a single, valid JSON object and nothing else. Do not include any explanations, apologies, or markdown formatting like \`\`\`json. The output must be directly parsable by a JavaScript \`JSON.parse()\` function.
6. **Completeness:** Fill in all fields from the schema. If a piece of information cannot be found in the document, the corresponding JSON value must be an empty string \`""\`. Do not omit any keys from the schema.

**JSON Output Schema:**

{
    "clientName": "",
    "requestedBy": "",
    "appraisalDate": "",
    "reportNumber": "",
    "propertyAddressArabic": "",
    "propertyAddressEnglish": "",
    "districtName": "",
    "cityName": "",
    "governorate": "",
    "buildingNumber": "",
    "floorNumber": "",
    "unitNumber": "",
    "buildingAgeYears": "",
    "constructionType": "",
    "propertyType": "",
    "bedrooms": "",
    "bathrooms": "",
    "receptionRooms": "",
    "kitchens": "",
    "parkingSpaces": "",
    "totalFloors": "",
    "yearBuilt": "",
    "landAreaSqm": "",
    "builtAreaSqm": "",
    "unitAreaSqm": "",
    "balconyAreaSqm": "",
    "garageAreaSqm": "",
    "finishingLevel": "",
    "floorMaterials": "",
    "wallFinishes": "",
    "ceilingType": "",
    "windowsType": "",
    "doorsType": "",
    "overallConditionRating": "",
    "structuralCondition": "",
    "mechanicalSystemsCondition": "",
    "exteriorCondition": "",
    "interiorCondition": "",
    "electricityAvailable": "",
    "waterSupplyAvailable": "",
    "sewageSystemAvailable": "",
    "gasSupplyAvailable": "",
    "internetFiberAvailable": "",
    "elevatorAvailable": "",
    "parkingAvailable": "",
    "securitySystem": "",
    "streetWidthMeters": "",
    "accessibilityRating": "",
    "noiseLevel": "",
    "viewQuality": "",
    "neighborhoodQualityRating": "",
    "marketTrend": "",
    "demandSupplyRatio": "",
    "pricePerSqmArea": "",
    "costApproachValue": "",
    "salesComparisonValue": "",
    "incomeApproachValue": "",
    "finalReconciledValue": "",
    "recommendedValuationMethod": "",
    "monthlyRentalEstimate": "",
    "ownershipType": "",
    "titleDeedAvailable": "",
    "buildingPermitAvailable": "",
    "occupancyCertificate": "",
    "realEstateTaxPaid": "",
    "ownerName": "",
    "occupancyStatus": "",
    "remainingBuildingLifeYears": "",
    "totalUnitsInBuilding": "",
    "propertyBoundaries": "",
    "constructionCostPerSqm": "",
    "totalDepreciationValue": "",
    "pricePerSqmLand": "",
    "estimatedSellingTime": "",
    
    "appraiserName": "",
    "registrationNumber": "",
    "appraisalValidUntil": "",
    "reportType": "",
    "entrance": "",
    "effectiveBuildingAgeYears": "",
    "economicBuildingLifeYears": "",
    "totalBuildingAreaSqm": "",
    "unitLandShareSqm": "",
    "electricalSystemDescription": "",
    "sanitaryWareDescription": "",
    "exteriorFinishesDescription": "",
    "telephoneAvailable": "",
    "nearbyServices": "",
    "locationDescription": "",
    "constructionVolume": "",
    "fundingSource": "",
    "areaCharacter": "",
    "pricePerSqmSemiFinished": "",
    "pricePerSqmFullyFinished": "",
    "landValue": "",
    "buildingValue": "",
    "unitLandShareValue": "",
    "unitConstructionCost": "",
    "buildingValueWithProfit": "",
    "curableDepreciationValue": "",
    "incurableDepreciationValue": "",
    "garageShareDescription": "",
    
    "comparableSale1Address": "",
    "comparableSale1Price": "",
    "comparableSale1Area": "",
    "comparableSale1PricePerSqm": "",
    "comparableSale1Age": "",
    "comparableSale1Finishing": "",
    "comparableSale1Floor": "",
    "comparableSale1Orientation": "",
    "comparableSale1StreetView": "",
    "comparableSale1SaleDate": "",
    
    "comparableSale2Address": "",
    "comparableSale2Price": "",
    "comparableSale2Area": "",
    "comparableSale2PricePerSqm": "",
    "comparableSale2Age": "",
    "comparableSale2Finishing": "",
    "comparableSale2Floor": "",
    "comparableSale2Orientation": "",
    "comparableSale2StreetView": "",
    "comparableSale2SaleDate": "",
    
    "comparableSale3Address": "",
    "comparableSale3Price": "",
    "comparableSale3Area": "",
    "comparableSale3PricePerSqm": "",
    "comparableSale3Age": "",
    "comparableSale3Finishing": "",
    "comparableSale3Floor": "",
    "comparableSale3Orientation": "",
    "comparableSale3StreetView": "",
    "comparableSale3SaleDate": ""
}

Now, analyze the following document and provide the extracted data in the specified JSON format.`;
  }

  // Convert string to number safely
  private parseNumber(value?: string): number | undefined {
    if (!value || value.trim() === '') return undefined;
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? undefined : parsed;
  }

  // Parse and round monetary values
  private parseAndRoundMoney(value?: string): number | undefined {
    const parsed: number | undefined = this.parseNumber(value);
    return roundMonetaryValue(parsed);
  }

  // Convert string to boolean
  private parseBoolean(value: string): boolean {
    if (!value) return false;
    const lowerValue = value.toLowerCase().trim();
    return ['true', 'yes', 'نعم', 'متوفر', 'موجود', '1', 'available', 'متاح'].includes(lowerValue);
  }

  // Map Arabic noise levels to English
  private mapNoiseLevel(level: string): string {
    const noiseLevelMap: Record<string, string> = {
      'منخفضة': 'low',
      'منخفضة (هادئة)': 'low',
      'متوسطة': 'moderate',
      'عالية': 'high',
      'مرتفعة': 'high'
    };
    
    return noiseLevelMap[level?.trim()] || 'moderate';
  }

  // Map Arabic view quality to English
  private mapViewQuality(quality: string): string {
    const viewQualityMap: Record<string, string> = {
      'ممتازة': 'excellent',
      'جيدة': 'good',
      'متوسطة': 'average',
      'ضعيفة': 'poor',
      'إطلالة على حديقة ومسطح أخضر': 'good',
      'إطلالة على الشارع': 'average'
    };
    
    return viewQualityMap[quality?.trim()] || 'good';
  }

  // Map Arabic market trend to English
  private mapMarketTrend(trend: string): string {
    const marketTrendMap: Record<string, string> = {
      'متزايد': 'rising',
      'صاعد': 'rising',
      'مستقر': 'stable',
      'ثابت': 'stable',
      'متراجع': 'declining',
      'هابط': 'declining'
    };
    
    return marketTrendMap[trend?.trim()] || 'stable';
  }

  // Map Arabic windows type to English
  private mapWindowsType(type: string): string {
    const windowsTypeMap: Record<string, string> = {
      'الومنيوم': 'aluminum',
      'الومينيوم': 'aluminum',
      'خشب': 'wood',
      'بي في سي': 'upvc',
      'حديد': 'steel'
    };
    
    return windowsTypeMap[type?.trim()] || 'aluminum';
  }

  // Map Arabic ownership type to English
  private mapOwnershipType(type: string): string {
    const ownershipTypeMap: Record<string, string> = {
      'تمليك': 'freehold',
      'ملكية حرة': 'freehold',
      'إيجار': 'leasehold',
      'انتفاع': 'usufruct',
      'ابتدائي': 'ibtida2i',
      'توكيل': 'tawkeel'
    };
    
    return ownershipTypeMap[type?.trim()] || 'freehold';
  }

  // Map Arabic orientation to English
  private mapOrientation(orientation: string): string {
    const orientationMap: Record<string, string> = {
      'شرقية': 'east',
      'شرقي': 'east',
      'شمالية': 'north', 
      'شمالي': 'north',
      'بحرى': 'north', // Egyptian term for north
      'بحري': 'north',
      'غربية': 'west',
      'غربي': 'west',
      'جنوبية': 'south',
      'جنوبي': 'south',
      'قبلي': 'south', // Egyptian term for south
      'شمال شرق': 'northeast',
      'شمال شرقي': 'northeast',
      'شمال غرب': 'northwest',
      'شمال غربي': 'northwest', 
      'جنوب شرق': 'southeast',
      'جنوب شرقي': 'southeast',
      'جنوب غرب': 'southwest',
      'جنوب غربي': 'southwest'
    };
    
    return orientationMap[orientation?.trim()] || orientation || '';
  }

  // Map Arabic street view to English
  private mapStreetView(streetView: string): string {
    const streetViewMap: Record<string, string> = {
      'على حديقة': 'garden_view',
      'حديقة': 'garden_view',
      'شارع رئيسي': 'main_street',
      'رئيسي': 'main_street',
      'شارع فرعي': 'side_street',
      'فرعي': 'side_street',
      'شارع داخلي': 'internal_street',
      'داخلي': 'internal_street',
      'منظر بحري': 'sea_view',
      'بحري': 'sea_view',
      'منظر نيلي': 'nile_view',
      'نيلي': 'nile_view',
      'منظر متنزه': 'park_view',
      'متنزه': 'park_view',
      'منظر مباني': 'building_view',
      'مباني': 'building_view',
      'good': 'main_street', // Default mapping for generic "good"
      'ممتاز': 'garden_view',
      'جيد': 'main_street'
    };
    
    return streetViewMap[streetView?.trim()] || streetView || '';
  }

  // Map Arabic ceiling type to English
  private mapCeilingType(ceilingType: string): string {
    if (!ceilingType) return '';
    
    const ceilingTypeMap: Record<string, string> = {
      'سقف معلق': 'suspended',
      'معلق': 'suspended',
      'سقف خرساني': 'concrete',
      'خرساني': 'concrete',
      'خرسانة': 'concrete',
      'سقف زخرفي': 'decorative',
      'زخرفي': 'decorative',
      'ألواح جبس': 'gypsum_board',
      'جبس': 'gypsum_board',
      'سقف خشبي': 'wood',
      'خشبي': 'wood',
      'خشب': 'wood',
      'سقف معدني': 'metal',
      'معدني': 'metal',
      'معدن': 'metal',
      'سقف بي في سي': 'pvc',
      'بي في سي': 'pvc',
      'pvc': 'pvc',
      'سقف صوتي': 'acoustic',
      'صوتي': 'acoustic',
      'دهانات بلاستيك': 'plastic_paint',
      'بلاستيك': 'plastic_paint',
      'دهان بلاستيك': 'plastic_paint'
    };
    
    // Check if it's a detailed room description
    if (ceilingType.includes('دهانات بلاستيك') || ceilingType.includes('بلاستيك')) {
      return 'plastic_paint';
    }
    
    // Try to match individual words
    for (const [arabic, english] of Object.entries(ceilingTypeMap)) {
      if (ceilingType.includes(arabic)) {
        return english;
      }
    }
    
    return ceilingTypeMap[ceilingType?.trim()] || '';
  }

  // Retry mechanism for API calls with exponential backoff and jitter
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 30000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Gemini API attempt ${attempt + 1}/${maxRetries + 1}`);
        const result = await operation();
        
        // Log success message if this was a retry
        if (attempt > 0) {
          console.info(`✅ Gemini API succeeded on retry attempt ${attempt + 1}!`);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a retryable error (503 overload, 429 rate limit, etc.)
        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === maxRetries;
        
        if (!isRetryable || isLastAttempt) {
          if (isLastAttempt && isRetryable) {
            console.error(`❌ Gemini API still overloaded after ${maxRetries + 1} attempts. Please try again in a few minutes.`, error);
            // Enhance error message for better user experience
            const enhancedError = new Error(
              `Gemini API is currently overloaded. We've tried ${maxRetries + 1} times over ${Math.round((Date.now() - (Date.now() - (maxRetries * 2000))) / 1000)}+ seconds. Please try again in a few minutes when Google's servers have more capacity.`
            );
            enhancedError.name = 'GeminiOverloadError';
            throw enhancedError;
          } else {
            console.error(`❌ Non-retryable error:`, error);
            throw error;
          }
        }
        
        // Calculate delay with exponential backoff and jitter
        const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        const jitter = Math.random() * 1000; // Random jitter up to 1 second
        const totalDelay = exponentialDelay + jitter;
        
        const retryMessage = `⏳ Gemini API overloaded - retrying in ${Math.round(totalDelay / 1000)}s (attempt ${attempt + 1}/${maxRetries + 1})`;
        console.warn(retryMessage, {
          error: error?.message || 'Unknown error',
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          delay: `${Math.round(totalDelay)}ms`
        });
        
        // Show user-friendly message in console for debugging
        console.info(`🔄 ${retryMessage}`);
        
        // Wait before retrying
        await this.delay(totalDelay);
      }
    }
    
    throw lastError;
  }

  // Check if error is retryable
  private isRetryableError(error: any): boolean {
    // Check for various error patterns that indicate temporary issues
    if (error?.message) {
      const message = error.message.toLowerCase();
      // Google API overload errors
      if (message.includes('overloaded') || message.includes('unavailable')) return true;
      // Rate limiting
      if (message.includes('rate limit') || message.includes('quota')) return true;
      // Temporary server issues
      if (message.includes('internal error') || message.includes('server error')) return true;
    }
    
    // Check error codes
    if (error?.error?.code) {
      const code = error.error.code;
      // 503 Service Unavailable, 429 Too Many Requests, 500 Internal Server Error
      if (code === 503 || code === 429 || code === 500) return true;
    }
    
    // Check status codes directly
    if (error?.status) {
      const status = error.status;
      if (status === 503 || status === 429 || status === 500) return true;
    }
    
    return false;
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Translate Arabic property address to English
  private translateAddressToEnglish(arabicAddress: string): string {
    if (!arabicAddress) return '';
    
    // Common Arabic-to-English translations for Egyptian real estate addresses
    const addressTranslations: Record<string, string> = {
      // Governorates
      'القاهرة': 'Cairo',
      'الجيزة': 'Giza', 
      'الأسكندرية': 'Alexandria',
      'الاقصر': 'Luxor',
      'أسوان': 'Aswan',
      'المنصورة': 'Mansoura',
      'طنطا': 'Tanta',
      'دمياط': 'Damietta',
      
      // Districts/Areas
      'المعادي': 'Maadi',
      'الزمالك': 'Zamalek',
      'المهندسين': 'Mohandessin',
      'الدقي': 'Dokki',
      'مدينة نصر': 'Nasr City',
      'هليوبوليس': 'Heliopolis',
      'مصر الجديدة': 'New Cairo',
      'التجمع الأول': 'First Settlement',
      'التجمع الثالث': 'Third Settlement',
      'التجمع الخامس': 'Fifth Settlement',
      'الشيخ زايد': 'Sheikh Zayed',
      '6 أكتوبر': '6th of October',
      
      // Common words
      'شارع': 'Street',
      'طريق': 'Road',  
      'ميدان': 'Square',
      'كورنيش': 'Corniche',
      'عمارة': 'Building',
      'برج': 'Tower',
      'كمبوند': 'Compound',
      'فيلا': 'Villa',
      'شقة': 'Apartment',
      'الدور': 'Floor',
      'رقم': 'No.',
      'العنوان': 'Address'
    };
    
    let translatedAddress = arabicAddress;
    
    // Replace Arabic terms with English equivalents
    for (const [arabic, english] of Object.entries(addressTranslations)) {
      const regex = new RegExp(arabic, 'g');
      translatedAddress = translatedAddress.replace(regex, english);
    }
    
    // Clean up extra spaces and formatting
    translatedAddress = translatedAddress.replace(/\s+/g, ' ').trim();
    
    return translatedAddress;
  }

  // Get empty RealEstateData schema for comparison
  private getEmptyRealEstateData(): RealEstateData {
    return {
      clientName: "", requestedBy: "", appraisalDate: "", reportNumber: "", appraiserName: "", 
      registrationNumber: "", appraisalValidUntil: "", ownerName: "", reportType: "",
      
      propertyAddressArabic: "", propertyAddressEnglish: "", districtName: "", cityName: "", 
      governorate: "", propertyBoundaries: "",
      
      buildingNumber: "", floorNumber: "", unitNumber: "", entrance: "", buildingAgeYears: "", 
      effectiveBuildingAgeYears: "", economicBuildingLifeYears: "", remainingBuildingLifeYears: "", 
      constructionType: "",
      
      propertyType: "", bedrooms: "", bathrooms: "", receptionRooms: "", kitchens: "", 
      parkingSpaces: "", totalFloors: "", yearBuilt: "",
      
      landAreaSqm: "", builtAreaSqm: "", unitAreaSqm: "", balconyAreaSqm: "", garageAreaSqm: "", 
      totalBuildingAreaSqm: "", unitLandShareSqm: "",
      
      finishingLevel: "", floorMaterials: "", wallFinishes: "", ceilingType: "", windowsType: "", 
      doorsType: "", electricalSystemDescription: "", sanitaryWareDescription: "", exteriorFinishesDescription: "",
      
      overallConditionRating: "", structuralCondition: "", mechanicalSystemsCondition: "", 
      exteriorCondition: "", interiorCondition: "",
      
      electricityAvailable: "", waterSupplyAvailable: "", sewageSystemAvailable: "", gasSupplyAvailable: "", 
      telephoneAvailable: "", internetFiberAvailable: "", elevatorAvailable: "", parkingAvailable: "", 
      securitySystem: "", nearbyServices: "",
      
      streetWidthMeters: "", accessibilityRating: "", noiseLevel: "", viewQuality: "", 
      neighborhoodQualityRating: "", locationDescription: "", constructionVolume: "", fundingSource: "", 
      areaCharacter: "",
      
      marketTrend: "", demandSupplyRatio: "", timeToSell: "", pricePerSqmArea: "", pricePerSqmSemiFinished: "", 
      pricePerSqmFullyFinished: "", pricePerSqmLand: "",
      
      costApproachValue: "", salesComparisonValue: "", incomeApproachValue: "", finalReconciledValue: "", 
      recommendedValuationMethod: "", monthlyRentalEstimate: "", landValue: "", buildingValue: "", 
      landPricePerSqm: "", unitLandShareValue: "", constructionCostPerSqm: "", unitConstructionCost: "", 
      buildingValueWithProfit: "", curableDepreciationValue: "", incurableDepreciationValue: "", 
      totalDepreciationValue: "", garageShareDescription: "",
      
      ownershipType: "", titleDeedAvailable: "", buildingPermitAvailable: "", occupancyCertificate: "", 
      realEstateTaxPaid: "", occupancyStatus: "", totalUnitsInBuilding: "", estimatedSellingTime: "",
      
      // Comparable Sales
      comparableSale1Address: "", comparableSale1Price: "", comparableSale1Area: "", comparableSale1PricePerSqm: "",
      comparableSale1Age: "", comparableSale1Finishing: "", comparableSale1Floor: "", comparableSale1Orientation: "",
      comparableSale1StreetView: "", comparableSale1SaleDate: "",
      
      comparableSale2Address: "", comparableSale2Price: "", comparableSale2Area: "", comparableSale2PricePerSqm: "",
      comparableSale2Age: "", comparableSale2Finishing: "", comparableSale2Floor: "", comparableSale2Orientation: "",
      comparableSale2StreetView: "", comparableSale2SaleDate: "",
      
      comparableSale3Address: "", comparableSale3Price: "", comparableSale3Area: "", comparableSale3PricePerSqm: "",
      comparableSale3Age: "", comparableSale3Finishing: "", comparableSale3Floor: "", comparableSale3Orientation: "",
      comparableSale3StreetView: "", comparableSale3SaleDate: ""
    };
  }

  // Map property type
  private mapPropertyType(type: string): string {
    const typeMap: Record<string, string> = {
      'شقة': 'apartment',
      'شقه': 'apartment', // Alternative spelling
      'فيلا': 'villa',
      'تاون هاوس': 'townhouse',
      'دوبلكس': 'duplex',
      'استوديو': 'studio',
      'بنت هاوس': 'penthouse',
      'تجاري': 'commercial',
      'صناعي': 'industrial',
      'أرض': 'land'
    };
    
    return typeMap[type] || typeMap[type?.trim()] || 'apartment';
  }

  // Map finishing level
  private mapFinishingLevel(level: string): string {
    const levelMap: Record<string, string> = {
      'خام': 'core_shell',
      'نصف تشطيب': 'semi_finished', 
      'تشطيب كامل': 'fully_finished',
      'تشطيب فاخر': 'luxury',
      'سوبر لوكس': 'luxury'
    };
    
    return levelMap[level] || levelMap[level?.trim()] || 'fully_finished';
  }

  // Map condition
  private mapCondition(condition: string): string {
    if (!condition) return 'good';
    
    const conditionMap: Record<string, string> = {
      'ممتاز': 'excellent',
      'ممتازة': 'excellent',
      'جيد': 'good',
      'جيدة': 'good', 
      'متوسط': 'fair',
      'متوسطة': 'fair',
      'ضعيف': 'poor',
      'ضعيفة': 'poor',
      'تشطيب فاخر': 'excellent', // For interior condition
      'دهانات درای مکس, رخام, كريتال, بلاط': 'excellent' // For exterior condition
    };
    
    return conditionMap[condition?.trim()] || 'good';
  }

  // Parse Arabic room-by-room specifications AND general material lists
  private parseRoomSpecifications(
    floorMaterials?: string,
    wallFinishes?: string, 
    ceilingType?: string,
    exteriorFinishes?: string
  ): {
    reception_flooring?: string,
    kitchen_flooring?: string,
    bathroom_flooring?: string,
    bedroom_flooring?: string,
    terrace_flooring?: string,
    reception_walls?: string,
    kitchen_walls?: string,
    bathroom_walls?: string,
    bedroom_walls?: string,
    exterior_finishes_parsed?: Record<string, string>,
    // Add general material parsing results
    general_floor_materials?: string[],
    general_wall_materials?: string[],
    general_doors_type?: string
  } {
    console.log('🏠 Parsing room specifications:', { floorMaterials, wallFinishes, ceilingType, exteriorFinishes });

    // Arabic room name mappings
    const roomNameMap: Record<string, string> = {
      'نوم': 'bedroom',
      'غرفة نوم': 'bedroom',
      'غرف النوم': 'bedroom',
      'استقبال': 'reception', 
      'صالة': 'reception',
      'ريسبشن': 'reception',
      'معيشة': 'reception', // Living room -> reception
      'ليفينج': 'reception',
      'حمام': 'bathroom',
      'حمامات': 'bathroom',
      'مطبخ': 'kitchen',
      'مطابخ': 'kitchen',
      'حمام ومطبخ': 'bathroom_kitchen', // Special case for combined
      'تراسات': 'terrace',
      'تراس': 'terrace',
      'شرفة': 'terrace',
      'بلكونة': 'terrace',
      'تيراس': 'terrace'
    };

    // Arabic material mappings for flooring
    const flooringMaterialMap: Record<string, string> = {
      'سيراميك': 'ceramic',
      'سراميك': 'ceramic', 
      'بورسلين': 'porcelain',
      'بورسيلين': 'porcelain',
      'رخام': 'marble',
      'جرانيت': 'granite',
      'باركيه': 'parquet',
      'باركيت': 'parquet',
      'لامينيت': 'laminate',
      'لامينات': 'laminate',
      'فينيل': 'vinyl',
      'موكيت': 'carpet',
      'سجاد': 'carpet',
      'تيرازو': 'terrazzo',
      'موزاييك': 'mosaic',
      'موزايك': 'mosaic',
      'حجر طبيعي': 'natural_stone',
      'حجر': 'natural_stone',
      'خرسانة': 'concrete',
      'كونكريت': 'concrete',
      'بلاط': 'tiles',
      'hdf': 'laminate', // HDF is a type of laminate
      'HDF': 'laminate'
    };

    // Arabic material mappings for wall finishes  
    const wallMaterialMap: Record<string, string> = {
      'دهانات بلاستيك': 'plastic_paint',
      'دهان بلاستيك': 'plastic_paint',
      'بلاستيك': 'plastic_paint',
      'دهانات زيت': 'oil_paint',
      'دهان زيت': 'oil_paint',
      'دهانات زيتية': 'oil_paint',
      'ورق حائط': 'wallpaper',
      'ورق جدران': 'wallpaper',
      'كسوة حجر': 'stone_cladding',
      'كسوة حجرية': 'stone_cladding',
      'ألواح خشب': 'wood_panels',
      'ألواح خشبية': 'wood_panels',
      'جبس بورد': 'gypsum_board',
      'جبسوم بورد': 'gypsum_board',
      'ألواح جبس': 'gypsum_board',
      'سيراميك': 'ceramic_tiles',
      'سراميك': 'ceramic_tiles',
      'رخام': 'marble',
      'جرانيت': 'granite',
      'موزاييك': 'mosaic',
      'استانلس ستيل': 'stainless_steel',
      'زجاج': 'glass',
      'دهان مقاوم للماء': 'waterproof_paint'
    };

    const result: any = {};

    // Parse floor materials - handle both room-by-room AND general format
    if (floorMaterials) {
      console.log('🔧 Parsing floor materials:', floorMaterials);
      
      // Check if it's room-by-room format (contains colons) or general format (comma-separated)
      if (floorMaterials.includes(':')) {
        console.log('📝 Room-by-room format detected for floor materials');
        const floorSpecs = this.parseRoomByRoomSpecification(floorMaterials, roomNameMap, flooringMaterialMap);
        Object.entries(floorSpecs).forEach(([room, material]) => {
          if (room === 'bathroom_kitchen') {
            result.bathroom_flooring = material;
            result.kitchen_flooring = material;
          } else {
            result[`${room}_flooring`] = material;
          }
        });
      } else {
        console.log('📝 General format detected for floor materials');
        // Parse general comma-separated format: "HDF, بورسلين, سيراميك"
        result.general_floor_materials = this.parseGeneralMaterialList(floorMaterials, flooringMaterialMap);
        console.log('✅ Parsed general floor materials:', result.general_floor_materials);
      }
    }

    // Parse wall finishes - handle both room-by-room AND general format
    if (wallFinishes) {
      console.log('🔧 Parsing wall finishes:', wallFinishes);
      
      if (wallFinishes.includes(':')) {
        console.log('📝 Room-by-room format detected for wall finishes');
        const wallSpecs = this.parseRoomByRoomSpecification(wallFinishes, roomNameMap, wallMaterialMap);
        Object.entries(wallSpecs).forEach(([room, material]) => {
          if (room === 'bathroom_kitchen') {
            result.bathroom_walls = material;
            result.kitchen_walls = material;
          } else {
            result[`${room}_walls`] = material;
          }
        });
      } else {
        console.log('📝 General format detected for wall finishes');
        // Parse general comma-separated format
        result.general_wall_materials = this.parseGeneralMaterialList(wallFinishes, wallMaterialMap);
        console.log('✅ Parsed general wall materials:', result.general_wall_materials);
      }
    }

    // Parse exterior finishes into structured data
    if (exteriorFinishes) {
      console.log('🔧 Parsing exterior finishes:', exteriorFinishes);
      
      if (exteriorFinishes.includes(':')) {
        console.log('📝 Structured format detected for exterior finishes');
        result.exterior_finishes_parsed = this.parseExteriorFinishes(exteriorFinishes);
      } else {
        console.log('📝 General format detected for exterior finishes');
        const exteriorMaterialMap = {
          'دهانات درای ماکس': 'dry_mix_paint',
          'دهانات درای مکس': 'dry_mix_paint', 
          'درای ماکس': 'dry_mix_paint',
          'رخام': 'marble',
          'جرانيت': 'granite',
          'كريتال': 'crystal_glass',
          'كريستال': 'crystal_glass',
          'بلاط': 'tiles',
          'سيراميك': 'ceramic',
          'حجر طبيعي': 'natural_stone',
          'دهانات': 'paint',
          'دهان': 'paint'
        };
        result.general_exterior_materials = this.parseGeneralMaterialList(exteriorFinishes, exteriorMaterialMap);
        console.log('✅ Parsed general exterior materials:', result.general_exterior_materials);
      }
    }

    console.log('✅ Parsed room specifications:', result);
    return result;
  }

  // Parse room-by-room specification string format: "نوم: HDF، استقبال: بورسلين، معيشة: سيراميك"
  private parseRoomByRoomSpecification(
    specText: string, 
    roomNameMap: Record<string, string>,
    materialMap: Record<string, string>
  ): Record<string, string> {
    const result: Record<string, string> = {};

    // Split by Arabic comma and semicolon
    const specs = specText.split(/[،؛,;]/).map(s => s.trim()).filter(s => s.length > 0);
    
    for (const spec of specs) {
      // Split by colon to get room and material
      const parts = spec.split(':').map(s => s.trim());
      if (parts.length === 2) {
        const [roomArabic, materialArabic] = parts;
        
        // Map room name to English
        const roomEnglish = roomNameMap[roomArabic.trim()] || roomArabic.toLowerCase();
        
        // Map material to enum value
        const materialKey = materialArabic.toLowerCase().trim();
        const materialEnglish = materialMap[materialKey] || materialKey;
        
        result[roomEnglish] = materialEnglish;
      }
    }

    return result;
  }

  // Parse exterior finishes: "واجهات: دهانات درای مکس، مدخل: رخام، درج: رخام، درابزين: كريتال، السطح: بلاط"
  private parseExteriorFinishes(exteriorFinishesText: string): Record<string, string> {
    const exteriorAreaMap: Record<string, string> = {
      'واجهات': 'facade',
      'الواجهات': 'facade',
      'مدخل': 'entrance',
      'المدخل': 'entrance',
      'درج': 'stairs',
      'الدرج': 'stairs',
      'درابزين': 'railing',
      'الدرابزين': 'railing',
      'السطح': 'roof',
      'سطح': 'roof'
    };

    const exteriorMaterialMap: Record<string, string> = {
      'دهانات درای ماکس': 'dry_mix_paint',
      'دهانات درای مکس': 'dry_mix_paint', 
      'درای ماکس': 'dry_mix_paint',
      'رخام': 'marble',
      'جرانيت': 'granite',
      'كريتال': 'crystal_glass',
      'كريستال': 'crystal_glass',
      'بلاط': 'tiles',
      'سيراميك': 'ceramic',
      'حجر طبيعي': 'natural_stone',
      'دهانات': 'paint',
      'دهان': 'paint'
    };

    return this.parseRoomByRoomSpecification(exteriorFinishesText, exteriorAreaMap, exteriorMaterialMap);
  }

  // Map Arabic doors type to English enum values
  private mapDoorsType(doorsType: string): string {
    if (!doorsType) return '';
    
    const doorTypeMap: Record<string, string> = {
      'خشب': 'wood',
      'أخشاب': 'wood',
      'خشبي': 'wood',
      'خشبية': 'wood',
      'معدن': 'metal',
      'معدني': 'metal',
      'معدنية': 'metal',
      'حديد': 'steel',
      'حديدي': 'steel',
      'حديدية': 'steel',
      'ألومنيوم': 'aluminum',
      'المونيوم': 'aluminum',
      'زجاج': 'glass',
      'زجاجي': 'glass',
      'زجاجية': 'glass',
      'بلاستيك': 'plastic',
      'pvc': 'pvc',
      'upvc': 'upvc',
      'مختلط': 'composite',
      'مركب': 'composite'
    };
    
    const lowerType = doorsType.toLowerCase().trim();
    
    // Try exact match first
    if (doorTypeMap[lowerType]) {
      console.log(`🚪 Mapped doors type "${doorsType}" → "${doorTypeMap[lowerType]}"`);
      return doorTypeMap[lowerType];
    }
    
    // Try partial matching
    for (const [arabic, english] of Object.entries(doorTypeMap)) {
      if (lowerType.includes(arabic)) {
        console.log(`🚪 Partial match doors type "${doorsType}" → "${english}"`);
        return english;
      }
    }
    
    console.log(`⚠️ Unknown doors type "${doorsType}", keeping original`);
    return lowerType;
  }

  // Parse general comma-separated material list with room specifications: "HDF (نوم), بورسلين (استقبال), سيراميك (معيشة)"
  private parseGeneralMaterialList(materialText: string, materialMap: Record<string, string>): string[] {
    console.log('🔍 Parsing general material list:', materialText);
    
    const materials: string[] = [];
    const uniqueMaterials = new Set<string>();
    
    // Handle complex formats like "دهانات بلاستيك (نوم, استقبال, معيشة, تراسات), سيراميك (حمام ومطبخ)"
    // Split by comma, but be smart about parentheses
    const items = this.smartSplitMaterials(materialText);
    
    for (const item of items) {
      // Extract material name (before parentheses or the whole string)
      const materialName = item.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      
      // Try to map to standard enum value
      const mappedMaterial = materialMap[materialName];
      if (mappedMaterial && !uniqueMaterials.has(mappedMaterial)) {
        materials.push(mappedMaterial);
        uniqueMaterials.add(mappedMaterial);
        console.log(`✅ Mapped "${item}" → "${mappedMaterial}"`);
      } else if (!mappedMaterial) {
        // Try partial matching for compound terms
        const partialMatch = this.findPartialMaterialMatch(materialName, materialMap);
        if (partialMatch && !uniqueMaterials.has(partialMatch)) {
          materials.push(partialMatch);
          uniqueMaterials.add(partialMatch);
          console.log(`✅ Partial match "${item}" → "${partialMatch}"`);
        } else {
          // Keep original text if no mapping found
          const cleanOriginal = materialName || item.toLowerCase().trim();
          if (!uniqueMaterials.has(cleanOriginal)) {
            materials.push(cleanOriginal);
            uniqueMaterials.add(cleanOriginal);
            console.log(`⚠️ No mapping found for "${item}", keeping "${cleanOriginal}"`);
          }
        }
      }
    }
    
    console.log('🎯 Final mapped materials:', materials);
    return materials;
  }

  // Smart split that handles parentheses properly
  private smartSplitMaterials(text: string): string[] {
    const items: string[] = [];
    let current = '';
    let parenthesesDepth = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '(') {
        parenthesesDepth++;
        current += char;
      } else if (char === ')') {
        parenthesesDepth--;
        current += char;
      } else if ((char === ',' || char === '،') && parenthesesDepth === 0) {
        if (current.trim()) {
          items.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      items.push(current.trim());
    }
    
    return items.filter(item => item.length > 0);
  }

  // Find partial matches for material names
  private findPartialMaterialMatch(materialName: string, materialMap: Record<string, string>): string | null {
    // Try to find matches in the material name
    for (const [arabic, english] of Object.entries(materialMap)) {
      if (materialName.includes(arabic.toLowerCase()) || arabic.toLowerCase().includes(materialName)) {
        return english;
      }
    }
    return null;
  }

  // Convert string data from Gemini to proper types for AppraisalDataMapper
  private convertToTypedData(extractedData: RealEstateData): ExtractedAppraisalData {
    console.log('🔧 Converting Gemini strings to proper data types...');
    
    const typedData: ExtractedAppraisalData = {
      // Client & Professional Info  
      client_name: extractedData.clientName || '',
      requested_by: extractedData.requestedBy || '',
      appraisal_date: extractedData.appraisalDate || '',
      report_number: extractedData.reportNumber || '',
      
      // Property Address - Translate from Arabic to English if English is missing
      property_address_arabic: extractedData.propertyAddressArabic || '',
      property_address_english: extractedData.propertyAddressEnglish || 
                               this.translateAddressToEnglish(extractedData.propertyAddressArabic),
      district_name: extractedData.districtName || '',
      city_name: extractedData.cityName || '',
      governorate: extractedData.governorate || '',
      
      // Building Info - CONVERT STRINGS TO NUMBERS WHERE NEEDED
      building_number: extractedData.buildingNumber || '',
      floor_number: this.parseNumber(extractedData.floorNumber),
      unit_number: extractedData.unitNumber || '',
      building_age_years: this.parseNumber(extractedData.buildingAgeYears) || 0,
      construction_type: extractedData.constructionType || 'concrete',
      
      // Property Details - CONVERT STRINGS TO NUMBERS
      property_type: this.mapPropertyType(extractedData.propertyType),
      bedrooms: this.parseNumber(extractedData.bedrooms),
      bathrooms: this.parseNumber(extractedData.bathrooms),
      reception_rooms: this.parseNumber(extractedData.receptionRooms),
      kitchens: this.parseNumber(extractedData.kitchens),
      parking_spaces: this.parseNumber(extractedData.parkingSpaces),
      total_floors: this.parseNumber(extractedData.totalFloors),
      year_built: this.parseNumber(extractedData.yearBuilt),
      
      // Areas - CONVERT STRINGS TO NUMBERS
      land_area_sqm: this.parseNumber(extractedData.landAreaSqm),
      built_area_sqm: this.parseNumber(extractedData.builtAreaSqm),
      unit_area_sqm: this.parseNumber(extractedData.unitAreaSqm),
      balcony_area_sqm: this.parseNumber(extractedData.balconyAreaSqm),
      garage_area_sqm: this.parseNumber(extractedData.garageAreaSqm),
      
      // Technical Specifications
      finishing_level: this.mapFinishingLevel(extractedData.finishingLevel),
      floor_materials: extractedData.floorMaterials ? { general: extractedData.floorMaterials } : undefined,
      wall_finishes: extractedData.wallFinishes ? { general: extractedData.wallFinishes } : undefined,
      ceiling_type: this.mapCeilingType(extractedData.ceilingType),
      windows_type: this.mapWindowsType(extractedData.windowsType),
      doors_type: this.mapDoorsType(extractedData.doorsType) || '',
      
      // Parse room-by-room specifications from Arabic text
      ...this.parseRoomSpecifications(
        extractedData.floorMaterials,
        extractedData.wallFinishes, 
        extractedData.ceilingType,
        extractedData.exteriorFinishesDescription
      ),
      
      // Egyptian Standards Critical Fields - ADD DEFAULTS
      economic_life_years: this.parseNumber(extractedData.economicBuildingLifeYears) || 0,
      street_type: 'main_street', // Most properties are on main streets
      market_activity: 'stable', // Default market condition
      property_liquidity: 'medium', // Standard for residential
      egyptian_standards_compliance: true, // Assume compliance
      report_validity_months: 12, // Standard validity period
      professional_statement_confirmed: true, // Professional requirement
      
      // Condition Assessment - CONVERT STRINGS TO NUMBERS AND ENUMS
      overall_condition_rating: this.parseNumber(extractedData.overallConditionRating) || 8,
      structural_condition: this.mapCondition(extractedData.structuralCondition),
      mechanical_systems_condition: this.mapCondition(extractedData.mechanicalSystemsCondition),
      exterior_condition: this.mapCondition(extractedData.exteriorCondition),
      interior_condition: this.mapCondition(extractedData.interiorCondition),
      
      // Utilities - CONVERT STRINGS TO BOOLEANS
      electricity_available: this.parseBoolean(extractedData.electricityAvailable),
      water_supply_available: this.parseBoolean(extractedData.waterSupplyAvailable),
      sewage_system_available: this.parseBoolean(extractedData.sewageSystemAvailable),
      gas_supply_available: this.parseBoolean(extractedData.gasSupplyAvailable),
      internet_fiber_available: this.parseBoolean(extractedData.internetFiberAvailable),
      elevator_available: this.parseBoolean(extractedData.elevatorAvailable),
      parking_available: this.parseBoolean(extractedData.parkingAvailable),
      security_system: this.parseBoolean(extractedData.securitySystem),
      
      // Location Factors - CONVERT STRINGS TO NUMBERS AND MAP ENUMS
      street_width_meters: this.parseNumber(extractedData.streetWidthMeters),
      accessibility_rating: this.parseNumber(extractedData.accessibilityRating) || 7,
      noise_level: this.mapNoiseLevel(extractedData.noiseLevel),
      view_quality: this.mapViewQuality(extractedData.viewQuality),
      neighborhood_quality_rating: this.parseNumber(extractedData.neighborhoodQualityRating) || 7,
      
      // Market Analysis - CONVERT STRINGS TO NUMBERS AND MAP ENUMS
      market_trend: this.mapMarketTrend(extractedData.marketTrend),
      demand_supply_ratio: this.parseNumber(extractedData.demandSupplyRatio),
      price_per_sqm_area: roundPricePerSqm(this.parseNumber(extractedData.pricePerSqmArea)),
      
      // Valuation - CONVERT STRINGS TO NUMBERS
      final_reconciled_value: this.parseAndRoundMoney(extractedData.finalReconciledValue),
      cost_approach_value: this.parseAndRoundMoney(extractedData.costApproachValue),
      sales_comparison_value: this.parseAndRoundMoney(extractedData.salesComparisonValue),
      income_approach_value: this.parseAndRoundMoney(extractedData.incomeApproachValue) || 0,
      monthly_rental_estimate: this.parseAndRoundMoney(extractedData.monthlyRentalEstimate),
      
      // Legal Status - CONVERT STRINGS TO BOOLEANS  
      ownership_type: this.mapOwnershipType(extractedData.ownershipType),
      title_deed_available: this.parseBoolean(extractedData.titleDeedAvailable),
      building_permit_available: this.parseBoolean(extractedData.buildingPermitAvailable),
      occupancy_certificate: this.parseBoolean(extractedData.occupancyCertificate),
      real_estate_tax_paid: this.parseBoolean(extractedData.realEstateTaxPaid),
      
      // MISSING FIELDS MAPPING ADDED - CONVERT STRINGS TO PROPER TYPES
      owner_name: extractedData.ownerName || '',
      occupancy_status: extractedData.occupancyStatus || '',
      remaining_building_life_years: this.parseNumber(extractedData.remainingBuildingLifeYears),
      total_units_in_building: this.parseNumber(extractedData.totalUnitsInBuilding),
      property_boundaries: extractedData.propertyBoundaries || '',
      construction_cost_per_sqm: this.parseAndRoundMoney(extractedData.constructionCostPerSqm),
      total_depreciation_value: this.parseAndRoundMoney(extractedData.totalDepreciationValue),
      price_per_sqm_land: roundPricePerSqm(this.parseNumber(extractedData.pricePerSqmLand)),
      estimated_selling_time: this.parseNumber(extractedData.estimatedSellingTime),
      
      // 24 NEWLY ADDED FIELDS - PROFESSIONAL INFO & BUILDING DETAILS
      appraiser_name: extractedData.appraiserName || '',
      registration_number: extractedData.registrationNumber || '',
      appraisal_valid_until: extractedData.appraisalValidUntil || '',
      report_type: extractedData.reportType || '',
      entrance: extractedData.entrance || '',
      effective_building_age_years: this.parseNumber(extractedData.effectiveBuildingAgeYears),
      economic_building_life_years: this.parseNumber(extractedData.economicBuildingLifeYears),
      total_building_area_sqm: this.parseNumber(extractedData.totalBuildingAreaSqm),
      unit_land_share_sqm: this.parseNumber(extractedData.unitLandShareSqm),
      electrical_system_description: extractedData.electricalSystemDescription || '',
      sanitary_ware_description: extractedData.sanitaryWareDescription || '',
      exterior_finishes_description: extractedData.exteriorFinishesDescription || '',
      telephone_available: this.parseBoolean(extractedData.telephoneAvailable),
      nearby_services: extractedData.nearbyServices || '',
      location_description: extractedData.locationDescription || '',
      construction_volume: this.parseNumber(extractedData.constructionVolume),
      funding_source: extractedData.fundingSource || '',
      area_character: extractedData.areaCharacter || '',
      price_per_sqm_semi_finished: this.parseNumber(extractedData.pricePerSqmSemiFinished),
      price_per_sqm_fully_finished: this.parseNumber(extractedData.pricePerSqmFullyFinished),
      land_value: this.parseAndRoundMoney(extractedData.landValue),
      building_value: this.parseAndRoundMoney(extractedData.buildingValue),
      unit_land_share_value: this.parseAndRoundMoney(extractedData.unitLandShareValue),
      unit_construction_cost: this.parseAndRoundMoney(extractedData.unitConstructionCost),
      building_value_with_profit: this.parseAndRoundMoney(extractedData.buildingValueWithProfit),
      curable_depreciation_value: this.parseAndRoundMoney(extractedData.curableDepreciationValue),
      incurable_depreciation_value: this.parseAndRoundMoney(extractedData.incurableDepreciationValue),
      garage_share_description: extractedData.garageShareDescription || '',
      
      // COMPARABLE SALES - CONVERT STRINGS TO PROPER TYPES
      comparable_sale_1_address: extractedData.comparableSale1Address || '',
      comparable_sale_1_price: this.parseAndRoundMoney(extractedData.comparableSale1Price),
      comparable_sale_1_area: this.parseNumber(extractedData.comparableSale1Area),
      comparable_sale_1_price_per_sqm: roundPricePerSqm(this.parseNumber(extractedData.comparableSale1PricePerSqm)),
      comparable_sale_1_age: this.parseNumber(extractedData.comparableSale1Age),
      comparable_sale_1_finishing: this.mapFinishingLevel(extractedData.comparableSale1Finishing),
      comparable_sale_1_floor: this.parseNumber(extractedData.comparableSale1Floor),
      comparable_sale_1_orientation: this.mapOrientation(extractedData.comparableSale1Orientation),
      comparable_sale_1_street_view: this.mapStreetView(extractedData.comparableSale1StreetView),
      comparable_sale_1_sale_date: extractedData.comparableSale1SaleDate || '',
      
      comparable_sale_2_address: extractedData.comparableSale2Address || '',
      comparable_sale_2_price: this.parseAndRoundMoney(extractedData.comparableSale2Price),
      comparable_sale_2_area: this.parseNumber(extractedData.comparableSale2Area),
      comparable_sale_2_price_per_sqm: roundPricePerSqm(this.parseNumber(extractedData.comparableSale2PricePerSqm)),
      comparable_sale_2_age: this.parseNumber(extractedData.comparableSale2Age),
      comparable_sale_2_finishing: this.mapFinishingLevel(extractedData.comparableSale2Finishing),
      comparable_sale_2_floor: this.parseNumber(extractedData.comparableSale2Floor),
      comparable_sale_2_orientation: this.mapOrientation(extractedData.comparableSale2Orientation),
      comparable_sale_2_street_view: this.mapStreetView(extractedData.comparableSale2StreetView),
      comparable_sale_2_sale_date: extractedData.comparableSale2SaleDate || '',
      
      comparable_sale_3_address: extractedData.comparableSale3Address || '',
      comparable_sale_3_price: this.parseAndRoundMoney(extractedData.comparableSale3Price),
      comparable_sale_3_area: this.parseNumber(extractedData.comparableSale3Area),
      comparable_sale_3_price_per_sqm: roundPricePerSqm(this.parseNumber(extractedData.comparableSale3PricePerSqm)),
      comparable_sale_3_age: this.parseNumber(extractedData.comparableSale3Age),
      comparable_sale_3_finishing: this.mapFinishingLevel(extractedData.comparableSale3Finishing),
      comparable_sale_3_floor: this.parseNumber(extractedData.comparableSale3Floor),
      comparable_sale_3_orientation: this.mapOrientation(extractedData.comparableSale3Orientation),
      comparable_sale_3_street_view: this.mapStreetView(extractedData.comparableSale3StreetView),
      comparable_sale_3_sale_date: extractedData.comparableSale3SaleDate || ''
    };
    
    console.log('✅ Type conversion completed:', {
      strings_to_numbers: ['unit_area_sqm', 'final_reconciled_value', 'building_age_years'].map(field => 
        `${field}: "${(extractedData as any)[field]}" → ${(typedData as any)[field]}`
      ),
      strings_to_booleans: ['electricity_available', 'parking_available'].map(field => 
        `${field}: "${(extractedData as any)[field]}" → ${(typedData as any)[field]}`
      )
    });
    
    // Apply price rounding to all monetary and price-per-sqm fields
    console.log('💰 Applying price rounding to monetary fields...');
    const roundedTypedData = {
      ...roundAllMonetaryFields(typedData),
      ...roundAllPricePerSqmFields(typedData)
    };
    
    console.log('✅ Price rounding applied:', {
      before_incurable_depreciation: typedData.incurable_depreciation_value,
      after_incurable_depreciation: roundedTypedData.incurable_depreciation_value,
      before_total_depreciation: typedData.total_depreciation_value,
      after_total_depreciation: roundedTypedData.total_depreciation_value,
      before_final_value: typedData.final_reconciled_value,
      after_final_value: roundedTypedData.final_reconciled_value
    });
    
    return roundedTypedData;
  }

  // Convert RealEstateData to SmartAppraisalFormData using AppraisalDataMapper
  private mapToFormData(extractedData: RealEstateData): SmartAppraisalFormData {
    console.log('🔄 Mapping Gemini extracted data using AppraisalDataMapper...');
    
    // Convert string data to proper types for AppraisalDataMapper
    const typedData = this.convertToTypedData(extractedData);
    
    console.log('🔧 Type-converted data sample:', {
      client_name: typedData.client_name,
      unit_area_sqm: typedData.unit_area_sqm,
      final_reconciled_value: typedData.final_reconciled_value,
      building_age_years: typedData.building_age_years
    });
    
    // Create AppraisalDataMapper instance
    const mapper = new AppraisalDataMapper();
    
    // Generate comprehensive mapping report
    const mappingReport = mapper.generateMappingReport(typedData);
    
    console.log('📊 COMPREHENSIVE MAPPING REPORT:');
    console.log(`📈 Overall Completeness: ${mappingReport.overall_completeness_percentage.toFixed(1)}%`);
    console.log(`✅ Successfully Mapped: ${mappingReport.successfully_mapped_fields}/${mappingReport.total_form_fields}`);
    console.log(`❌ Missing Critical: ${mappingReport.missing_critical_fields}`);
    console.log(`⚠️ Low Confidence: ${mappingReport.low_confidence_fields}`);
    console.log(`📋 Unmapped Additional Data: ${mappingReport.unmapped_additional_data}`);
    
    // Log warnings
    if (mappingReport.warnings.length > 0) {
      console.log('⚠️ MAPPING WARNINGS:');
      mappingReport.warnings.forEach(warning => {
        console.log(`  ${warning.severity.toUpperCase()}: ${warning.field} - ${warning.message}`);
      });
    }
    
    // Create SmartAppraisalFormData from validated typedData with proper field mapping
    const formData: SmartAppraisalFormData = {
      // Client & Professional Info
      client_name: typedData.client_name || '',
      requested_by: typedData.requested_by || '',
      appraisal_date: typedData.appraisal_date || '',
      
      // Property Address
      property_address_arabic: typedData.property_address_arabic || '',
      property_address_english: typedData.property_address_english || '',
      district_name: typedData.district_name || '',
      city_name: typedData.city_name || '',
      governorate: typedData.governorate || '',
      
      // Building Info - HANDLE TYPE CONVERSIONS PROPERLY
      building_number: typedData.building_number || '',
      floor_number: typedData.floor_number,
      unit_number: typedData.unit_number || '',
      building_age_years: typedData.building_age_years,
      construction_type: this.mapConstructionType(typedData.construction_type) || 'concrete',
      
      // Property Details
      property_type: typedData.property_type || 'apartment',
      bedrooms: typedData.bedrooms,
      bathrooms: typedData.bathrooms,
      reception_rooms: typedData.reception_rooms,
      kitchens: typedData.kitchens,
      parking_spaces: typedData.parking_spaces,
      total_floors: typedData.total_floors,
      year_built: typedData.year_built,
      
      // Areas
      land_area_sqm: typedData.land_area_sqm,
      built_area_sqm: typedData.built_area_sqm,
      unit_area_sqm: typedData.unit_area_sqm,
      balcony_area_sqm: typedData.balcony_area_sqm,
      garage_area_sqm: typedData.garage_area_sqm,
      
      // Technical Specifications
      finishing_level: typedData.finishing_level || 'fully_finished',
      floor_materials: typedData.floor_materials,
      wall_finishes: typedData.wall_finishes,
      ceiling_type: typedData.ceiling_type || '',
      windows_type: typedData.windows_type || '',
      doors_type: typedData.doors_type || '',
      
      // Condition Assessment
      overall_condition_rating: typedData.overall_condition_rating || 8,
      structural_condition: typedData.structural_condition as any,
      mechanical_systems_condition: typedData.mechanical_systems_condition as any,
      exterior_condition: typedData.exterior_condition as any,
      interior_condition: typedData.interior_condition as any,
      
      // Utilities
      electricity_available: typedData.electricity_available,
      water_supply_available: typedData.water_supply_available,
      sewage_system_available: typedData.sewage_system_available,
      gas_supply_available: typedData.gas_supply_available,
      internet_fiber_available: typedData.internet_fiber_available,
      elevator_available: typedData.elevator_available,
      parking_available: typedData.parking_available,
      security_system: typedData.security_system,
      
      // Location Factors
      street_width_meters: typedData.street_width_meters,
      accessibility_rating: typedData.accessibility_rating || 7,
      noise_level: typedData.noise_level as any || 'moderate',
      view_quality: typedData.view_quality as any || 'good',
      neighborhood_quality_rating: typedData.neighborhood_quality_rating || 7,
      
      // Market Analysis
      market_trend: typedData.market_trend || '',
      demand_supply_ratio: typedData.demand_supply_ratio,
      
      // Valuation
      final_reconciled_value: typedData.final_reconciled_value,
      cost_approach_value: typedData.cost_approach_value,
      sales_comparison_value: typedData.sales_comparison_value,
      income_approach_value: typedData.income_approach_value,
      monthly_rental_estimate: typedData.monthly_rental_estimate,
      
      // Legal Status
      ownership_type: typedData.ownership_type || '',
      title_deed_available: typedData.title_deed_available,
      building_permit_available: typedData.building_permit_available,
      occupancy_certificate: typedData.occupancy_certificate,
      real_estate_tax_paid: typedData.real_estate_tax_paid,
      
      // Additional Extracted Fields (properly typed from typedData)
      report_number: extractedData.reportNumber || '',
      owner_name: typedData.owner_name || '',
      occupancy_status: typedData.occupancy_status || '',
      remaining_building_life_years: typedData.remaining_building_life_years,
      total_units_in_building: typedData.total_units_in_building,
      property_boundaries: typedData.property_boundaries || '',
      construction_cost_per_sqm: typedData.construction_cost_per_sqm,
      total_depreciation_value: typedData.total_depreciation_value,
      price_per_sqm_land: typedData.price_per_sqm_land,
      estimated_selling_time: typedData.estimated_selling_time,
      
      // 24 NEWLY ADDED FIELDS - MAPPED FROM TYPED DATA
      appraiser_name: typedData.appraiser_name || '',
      registration_number: typedData.registration_number || '',
      appraisal_valid_until: typedData.appraisal_valid_until || '',
      report_type: this.mapReportType(typedData.report_type) || '',
      entrance: typedData.entrance || '',
      effective_building_age_years: typedData.effective_building_age_years,
      economic_building_life_years: typedData.economic_building_life_years,
      total_building_area_sqm: typedData.total_building_area_sqm,
      unit_land_share_sqm: typedData.unit_land_share_sqm,
      electrical_system_description: typedData.electrical_system_description || '',
      sanitary_ware_description: typedData.sanitary_ware_description || '',
      exterior_finishes_description: typedData.exterior_finishes_description || '',
      telephone_available: typedData.telephone_available,
      nearby_services: typedData.nearby_services || '',
      location_description: typedData.location_description || '',
      construction_volume: this.parseConstructionVolume(typedData.construction_volume),
      funding_source: typedData.funding_source || '',
      area_character: typedData.area_character || '',
      price_per_sqm_semi_finished: typedData.price_per_sqm_semi_finished,
      price_per_sqm_fully_finished: typedData.price_per_sqm_fully_finished,
      land_value: typedData.land_value,
      building_value: typedData.building_value,
      unit_land_share_value: typedData.unit_land_share_value,
      unit_construction_cost: typedData.unit_construction_cost,
      building_value_with_profit: typedData.building_value_with_profit,
      curable_depreciation_value: typedData.curable_depreciation_value,
      incurable_depreciation_value: typedData.incurable_depreciation_value,
      garage_share_description: typedData.garage_share_description || '',
      
      // Room Specifications (Parsed from Arabic text)
      reception_flooring: typedData.reception_flooring,
      kitchen_flooring: typedData.kitchen_flooring,
      bathroom_flooring: typedData.bathroom_flooring,
      bedroom_flooring: typedData.bedroom_flooring,
      terrace_flooring: typedData.terrace_flooring,
      reception_walls: typedData.reception_walls,
      kitchen_walls: typedData.kitchen_walls,
      bathroom_walls: typedData.bathroom_walls,
      bedroom_walls: typedData.bedroom_walls,
      
      // General Materials (for checkbox/dropdown population)
      general_floor_materials: typedData.general_floor_materials,
      general_wall_materials: typedData.general_wall_materials,
      general_exterior_materials: typedData.general_exterior_materials,
      
      // Comparable Sales (3 sales maximum)
      comparable_sale_1_address: typedData.comparable_sale_1_address || '',
      comparable_sale_1_price: typedData.comparable_sale_1_price,
      comparable_sale_1_area: typedData.comparable_sale_1_area,
      comparable_sale_1_price_per_sqm: typedData.comparable_sale_1_price_per_sqm,
      comparable_sale_1_age: typedData.comparable_sale_1_age,
      comparable_sale_1_finishing: typedData.comparable_sale_1_finishing,
      comparable_sale_1_floor: typedData.comparable_sale_1_floor,
      comparable_sale_1_orientation: typedData.comparable_sale_1_orientation,
      comparable_sale_1_street_view: typedData.comparable_sale_1_street_view,
      comparable_sale_1_sale_date: typedData.comparable_sale_1_sale_date,
      
      comparable_sale_2_address: typedData.comparable_sale_2_address || '',
      comparable_sale_2_price: typedData.comparable_sale_2_price,
      comparable_sale_2_area: typedData.comparable_sale_2_area,
      comparable_sale_2_price_per_sqm: typedData.comparable_sale_2_price_per_sqm,
      comparable_sale_2_age: typedData.comparable_sale_2_age,
      comparable_sale_2_finishing: typedData.comparable_sale_2_finishing,
      comparable_sale_2_floor: typedData.comparable_sale_2_floor,
      comparable_sale_2_orientation: typedData.comparable_sale_2_orientation,
      comparable_sale_2_street_view: typedData.comparable_sale_2_street_view,
      comparable_sale_2_sale_date: typedData.comparable_sale_2_sale_date,
      
      comparable_sale_3_address: typedData.comparable_sale_3_address || '',
      comparable_sale_3_price: typedData.comparable_sale_3_price,
      comparable_sale_3_area: typedData.comparable_sale_3_area,
      comparable_sale_3_price_per_sqm: typedData.comparable_sale_3_price_per_sqm,
      comparable_sale_3_age: typedData.comparable_sale_3_age,
      comparable_sale_3_finishing: typedData.comparable_sale_3_finishing,
      comparable_sale_3_floor: typedData.comparable_sale_3_floor,
      comparable_sale_3_orientation: typedData.comparable_sale_3_orientation,
      comparable_sale_3_street_view: typedData.comparable_sale_3_street_view,
      comparable_sale_3_sale_date: typedData.comparable_sale_3_sale_date,
      
      // Add Egyptian Legal Standards
      egyptian_legal_standards: this.createEgyptianLegalStandards(extractedData)
    };
    
    // Set some derived values if missing
    if (!formData.unit_land_share_sqm && formData.land_area_sqm && formData.unit_area_sqm) {
      formData.unit_land_share_sqm = formData.unit_area_sqm;
    }

    if (!formData.land_value_per_sqm && formData.land_area_sqm && formData.final_reconciled_value) {
      formData.land_value_per_sqm = Math.round(formData.final_reconciled_value * 0.4 / formData.land_area_sqm);
    }

    console.log('✅ Enhanced mapping completed with AppraisalDataMapper:', {
      client_name: formData.client_name,
      property_type: formData.property_type,
      unit_area_sqm: formData.unit_area_sqm,
      final_reconciled_value: formData.final_reconciled_value,
      overall_completeness: `${mappingReport.overall_completeness_percentage.toFixed(1)}%`
    });

    return formData;
  }

  // Create Egyptian Legal Standards from extracted data
  private createEgyptianLegalStandards(extractedData: RealEstateData): EgyptianLegalStandardsData {
    const propertyTypeMap: Record<string, string> = {
      'apartment': 'شقة',
      'villa': 'فيلا',
      'townhouse': 'تاون هاوس',
      'duplex': 'دوبلكس',
      'penthouse': 'بنت هاوس',
      'studio': 'استوديو',
      'commercial': 'تجاري',
      'industrial': 'صناعي'
    };

    return {
      ...DEFAULT_EGYPTIAN_LEGAL_STANDARDS,
      
      // Property information
      property_address_arabic: extractedData.propertyAddressArabic || '',
      property_address_english: extractedData.propertyAddressEnglish || '',
      building_number: extractedData.buildingNumber || '',
      unit_number: extractedData.unitNumber || '',
      floor_number: extractedData.floorNumber || '',
      property_type_arabic: propertyTypeMap[this.mapPropertyType(extractedData.propertyType)] || extractedData.propertyType,
      property_type_english: this.mapPropertyType(extractedData.propertyType),
      
      // Client information  
      client_name_arabic: extractedData.clientName || '',
      requesting_entity_arabic: extractedData.requestedBy || '',
      
      // Report dates
      inspection_date: extractedData.appraisalDate || new Date().toISOString().split('T')[0],
      report_issue_date: new Date().toISOString().split('T')[0],
      signature_date: new Date().toISOString().split('T')[0]
    };
  }

  // Arabic-to-English mapping methods
  private mapReportType(arabicType?: string): string {
    if (!arabicType) return '';
    
    const reportTypeMap: Record<string, string> = {
      'مختصر': 'summary',
      'سردي محدود': 'restricted',
      'سردي متكامل': 'full_appraisal',
      'سردی متكامل': 'full_appraisal', // Alternative spelling
      'تحديث': 'update',
      'كامل': 'full_appraisal',
      'محدود': 'restricted'
    };
    
    return reportTypeMap[arabicType.trim()] || '';
  }
  
  private mapConstructionType(arabicType?: string): string {
    if (!arabicType) return 'concrete';
    
    const constructionTypeMap: Record<string, string> = {
      'خرسانة مسلحة': 'concrete',
      'خرسانة': 'concrete',
      'عمارة': 'concrete', // Common term for concrete buildings in Egypt
      'طوب': 'brick',
      'حديد': 'steel',
      'مختلط': 'mixed',
      'هيكل حديدي': 'steel'
    };
    
    return constructionTypeMap[arabicType.trim()] || 'concrete';
  }
  
  private parseConstructionVolume(arabicVolume?: string | number): number | undefined {
    if (!arabicVolume) return undefined;
    
    // Convert to string if it's a number
    const volumeStr = typeof arabicVolume === 'string' ? arabicVolume : String(arabicVolume);
    
    // Handle percentage ranges like "اكثر من ٧٥%"
    const volumeText = volumeStr.trim();
    
    if (volumeText.includes('٧٥%') || volumeText.includes('75%')) {
      return 75; // Convert percentage to representative number
    }
    if (volumeText.includes('٥٠%') || volumeText.includes('50%')) {
      return 50;
    }
    if (volumeText.includes('٢٥%') || volumeText.includes('25%')) {
      return 25;
    }
    
    // Try to extract pure numbers
    const numbers = volumeText.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      return parseInt(numbers[0]);
    }
    
    return undefined;
  }

  async extractFromDocument(file: File): Promise<GeminiExtractionResult> {
    const startTime = Date.now();

    try {
      // Initialize GenAI first
      await this.initializeGenAI();
    } catch (error) {
      return {
        success: false,
        extractedData: null,
        formData: {},
        extractedImages: [],
        processingTime: 0,
        error: `Failed to initialize Gemini AI: ${error}`
      };
    }

    if (!this.genAI) {
      return {
        success: false,
        extractedData: null,
        formData: {},
        extractedImages: [],
        processingTime: 0,
        error: 'Gemini AI not initialized. Check your API key.'
      };
    }

    try {
      console.log('📤 Starting enhanced document extraction (Gemini + PDF.js)...', {
        filename: file.name,
        size: file.size,
        type: file.type
      });

      // Run Gemini text extraction and PDF.js image extraction in parallel for optimal performance
      const [filePart, extractedImages, geminiResponse] = await Promise.all([
        this.fileToGenerativePart(file),
        this.extractImagesFromDocument(file),
        // Start Gemini processing in parallel
        (async () => {
          const part = await this.fileToGenerativePart(file);
          return await this.retryWithBackoff(async () => {
            return await this.genAI.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: {
                parts: [
                  part,
                  { text: this.getSystemPrompt() }
                ]
              }
            });
          }, 4, 2000, 60000); // Max 4 retries, start with 2s, cap at 60s
        })()
      ]);

      const text = geminiResponse.text;
      
      console.log('📥 Parallel processing completed:');
      console.log(`  📝 Gemini response length: ${text.length} characters`);
      console.log(`  🖼️ Extracted images: ${extractedImages.length} images`);
      
      // Log detailed image extraction results
      if (extractedImages.length > 0) {
        console.log('🖼️ Image extraction details:');
        extractedImages.forEach((img, index) => {
          console.log(`  ${index + 1}. ${img.category} - ${img.description} (confidence: ${(img.confidence || 0).toFixed(2)})`);
        });
      }
      
      // Clean the response text to ensure it's valid JSON
      const jsonString = text.trim()
        .replace(/^```json\s*\n?/, '')
        .replace(/\n?\s*```$/, '')
        .replace(/^```\s*\n?/, '')
        .replace(/\n?\s*```$/, '');
      
      const extractedData = JSON.parse(jsonString) as RealEstateData;
      
      // COMPREHENSIVE EXTRACTION ANALYSIS
      console.log('🔍 EXTRACTED FIELDS ANALYSIS:');
      const allFields = Object.keys(this.getEmptyRealEstateData());
      const extractedFields = Object.entries(extractedData).filter(([_, value]) => value && value.trim() !== '');
      const missingFields = allFields.filter(field => !extractedData[field as keyof RealEstateData] || extractedData[field as keyof RealEstateData].trim() === '');
      
      console.log(`📊 Total fields in schema: ${allFields.length}`);
      console.log(`✅ Fields extracted: ${extractedFields.length}`);
      console.log(`❌ Fields missing: ${missingFields.length}`);
      
      console.log('✅ SUCCESSFULLY EXTRACTED FIELDS:');
      extractedFields.forEach(([field, value]) => {
        console.log(`  ${field}: "${value}"`);
      });
      
      console.log('❌ MISSING/EMPTY FIELDS:');
      missingFields.forEach(field => {
        console.log(`  ${field}: (missing)`);
      });
      
      // Show first 500 chars of raw response for debugging
      console.log('🔤 Raw Gemini response (first 500 chars):', text.substring(0, 500) + '...');
      
      // Validate that we got proper data
      if (typeof extractedData !== 'object' || extractedData === null) {
        throw new Error("AI did not return a valid JSON object.");
      }

      const formData = this.mapToFormData(extractedData);
      const processingTime = Date.now() - startTime;

      console.log('✅ Gemini extraction completed successfully:', {
        processingTime: `${processingTime}ms`,
        clientName: extractedData.clientName,
        propertyType: extractedData.propertyType,
        finalValue: extractedData.finalReconciledValue,
        extractedImages: extractedImages.length
      });

      return {
        success: true,
        extractedData,
        formData,
        extractedImages,
        processingTime
      };

    } catch (error) {
      console.error('❌ Gemini extraction error:', error);
      
      return {
        success: false,
        extractedData: null,
        formData: {},
        extractedImages: [],
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      };
    }
  }

  // Health check
  isAvailable(): boolean {
    return this.apiKey !== null;
  }
}

// Export singleton instance
// Export factory function instead of instantiated service to avoid build-time environment variable requirements
export const getGeminiDocumentExtractor = () => {
  if (!geminiDocumentExtractorInstance) {
    geminiDocumentExtractorInstance = new GeminiDocumentExtractor();
  }
  return geminiDocumentExtractorInstance;
};

// Singleton instance
let geminiDocumentExtractorInstance: GeminiDocumentExtractor | null = null;

// Legacy export for backward compatibility
export const geminiDocumentExtractor = {
  get instance() {
    return getGeminiDocumentExtractor();
  }
};
export default geminiDocumentExtractor;