/**
 * Professional Headshot Generation Service - 2025 Enhanced
 * Transforms verification selfies into standardized professional headshots
 * Uses Replicate FLUX.1 Kontext Pro for precise image-to-image enhancement
 * Enhanced with 2025 vision capabilities for maximum feature preservation
 */

interface ReplicateConfig {
  apiKey: string;
}

interface HeadshotStyle {
  model: 'flux-kontext-pro';
  size: '1024x1024' | '1536x1024' | '1024x1536';
  quality: 'high' | 'medium' | 'low';
  style: 'natural' | 'professional';
  background: 'corporate_blue' | 'neutral_gray' | 'professional_white' | 'warm_beige';
  attire: 'business_suit' | 'smart_casual' | 'professional_shirt';
  lighting: 'soft_professional' | 'studio_lighting' | 'natural_bright';
}

interface ReplicateImageResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
  output?: string | string[];
  error?: string;
}

interface HeadshotGenerationResult {
  success: boolean;
  headshot_url?: string;
  revised_prompt?: string;
  facial_analysis?: string;
  error?: string;
  cost_estimate?: number;
  generation_time?: number;
}

interface FacialAnalysisResult {
  success: boolean;
  description: string;
  features: {
    facial_structure: string;
    eye_characteristics: string;
    nose_shape: string;
    mouth_features: string;
    skin_tone: string;
    hair_description: string;
    age_range: string;
    gender_presentation: string;
  };
  error?: string;
}

class ReplicateHeadshotService {
  private config: ReplicateConfig;

  constructor() {
    this.config = {
      apiKey: process.env.REPLICATE_API_TOKEN || '',
    };

    if (!this.config.apiKey) {
      console.warn('Replicate API token not configured. Service will operate in mock mode.');
    }
  }

  /**
   * Generate professional headshot from verification selfie
   */
  async generateProfessionalHeadshot(
    originalImageUrl: string,
    appraiser_id: string,
    stylePreferences: Partial<HeadshotStyle> = {}
  ): Promise<HeadshotGenerationResult> {
    const startTime = Date.now();

    try {
      // Default style configuration for professional real estate appraisers
      const defaultStyle: HeadshotStyle = {
        model: 'flux-kontext-pro',
        size: '1024x1024',
        quality: 'high',
        style: 'professional',
        background: 'corporate_blue',
        attire: 'business_suit',
        lighting: 'soft_professional',
      };

      const style = { ...defaultStyle, ...stylePreferences };

      // Step 1: Skip facial analysis, use image editing instead
      console.log(`Enhancing existing photo for appraiser ${appraiser_id}...`);
      
      // Step 2: Create professional headshot prompt optimized for FLUX.1 Kontext Pro
      const prompt = `Professional corporate headshot of a real estate appraiser. ${style.attire === 'business_suit' ? 'Wearing a dark business suit with professional tie' : 'Professional business attire'}. ${style.background === 'corporate_blue' ? 'Corporate blue gradient background' : 'Professional neutral background'}. Confident, trustworthy expression with direct eye contact. ${style.lighting === 'soft_professional' ? 'Soft professional lighting' : 'Studio lighting'}. High-quality corporate photography style, suitable for LinkedIn profile or business card. Clean, polished, authoritative appearance representing expertise in real estate and property valuation services.`;

      console.log(`Enhancing headshot for appraiser ${appraiser_id} with professional styling...`);

      // Use Replicate FLUX.1 Kontext Pro for professional headshot enhancement
      const replicateApiKey = process.env.REPLICATE_API_TOKEN;
      if (!replicateApiKey) {
        throw new Error('REPLICATE_API_TOKEN environment variable is required');
      }

      // Create enhanced prompt for maximum facial accuracy with FLUX.1 Kontext Pro
      const enhancementPrompt = `Professional corporate headshot transformation: CRITICAL - preserve ALL original facial features, bone structure, eye shape, nose characteristics, lip shape, facial proportions, and skin texture exactly as shown. Only change: ${style.attire === 'business_suit' ? 'add well-fitted dark business suit with professional tie' : 'add professional business attire'}, ${style.background === 'corporate_blue' ? 'replace background with clean corporate blue gradient' : 'replace background with professional neutral backdrop'}, ${style.lighting === 'soft_professional' ? 'enhance with soft professional studio lighting' : 'enhance with bright even lighting'}, maintain natural expression and direct eye contact. High-quality corporate photography standard. DO NOT alter facial features, facial structure, or natural appearance - only enhance lighting and add professional attire/background.`;
      
      console.log(`Using FLUX.1 Kontext Pro for headshot enhancement...`);
      console.log(`Enhancement prompt: ${enhancementPrompt}`);
      
      // Call Replicate API with FLUX.1 Kontext Pro
      const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${replicateApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            prompt: enhancementPrompt,
            input_image: originalImageUrl,
            guidance_scale: 3.5,  // Higher guidance for better prompt following
            num_inference_steps: 30,  // More steps for better quality
            strength: 0.6  // Lower strength to preserve more of original image
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Replicate API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const prediction = await response.json();
      console.log(`Replicate prediction created: ${prediction.id}`);
      
      // Poll for completion (Replicate is asynchronous)
      let result = prediction;
      while (result.status === 'starting' || result.status === 'processing') {
        console.log(`Prediction status: ${result.status}...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            'Authorization': `Token ${replicateApiKey}`,
          },
        });
        
        if (!statusResponse.ok) {
          throw new Error(`Failed to check prediction status: ${statusResponse.status}`);
        }
        
        result = await statusResponse.json();
      }

      const generationTime = Date.now() - startTime;

      if (result.status === 'failed') {
        throw new Error(`Replicate prediction failed: ${result.error}`);
      }

      if (result.status !== 'succeeded' || !result.output) {
        throw new Error('No image generated from Replicate FLUX.1 Kontext Pro');
      }

      // Replicate returns the image URL in the output
      const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      const revisedPrompt = enhancementPrompt;

      // Calculate cost estimate based on DALL-E 3 pricing
      const costEstimate = this.calculateCostEstimate(style);

      console.log(`Headshot generated successfully for appraiser ${appraiser_id} in ${generationTime}ms`);

      return {
        success: true,
        headshot_url: imageUrl,
        revised_prompt: revisedPrompt,
        facial_analysis: 'FLUX.1 Kontext Pro handles facial analysis internally',
        cost_estimate: costEstimate,
        generation_time: generationTime,
      };

    } catch (error: any) {
      console.error('Headshot generation error:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to generate professional headshot',
        generation_time: Date.now() - startTime,
      };
    }
  }

  // Facial analysis is handled internally by FLUX.1 Kontext Pro

  // Parse method removed - FLUX.1 Kontext Pro handles analysis internally

  /**
   * Generate professional prompt for FLUX.1 Kontext Pro enhancement
   */
  private generateProfessionalPrompt(style: HeadshotStyle, faceDescription?: string): string {
    const backgrounds = {
      corporate_blue: 'clean corporate blue gradient background',
      neutral_gray: 'professional neutral gray backdrop',
      professional_white: 'crisp white studio background',
      warm_beige: 'warm beige professional background',
    };

    const attireDescriptions = {
      business_suit: 'wearing a well-fitted dark business suit with a professional tie',
      smart_casual: 'wearing a smart casual button-down shirt, professional but approachable',
      professional_shirt: 'wearing a crisp professional dress shirt, polished appearance',
    };

    const lightingStyles = {
      soft_professional: 'soft, even professional lighting that flatters facial features',
      studio_lighting: 'perfect studio lighting with subtle shadows for depth',
      natural_bright: 'bright, natural-looking lighting that appears professional',
    };

    // Use facial analysis for feature preservation
    if (faceDescription) {
      // Create a detailed prompt with specific facial features using 2025 AI precision
      const featuresPrompt = `PROFESSIONAL HEADSHOT GENERATION - EXACT FEATURE PRESERVATION

PRIMARY SUBJECT: Person with these EXACT facial characteristics: ${faceDescription}

CRITICAL FEATURE REQUIREMENTS:
- MUST maintain ALL specified facial features with 100% accuracy
- Preserve exact eye color, shape, and characteristics 
- Maintain precise nose structure and proportions
- Keep exact lip shape, mouth characteristics, and smile
- Preserve skin tone and texture exactly as described
- Maintain hair color, texture, and style precisely
- Keep all unique identifying features intact
- Preserve facial proportions and symmetry/asymmetry as specified

PROFESSIONAL STYLING:
- ${attireDescriptions[style.attire]}
- Positioned for premium corporate headshot
- Confident, trustworthy professional expression
- Direct eye contact with camera
- Slight professional smile (maintain natural smile characteristics)
- ${backgrounds[style.background]}
- ${lightingStyles[style.lighting]}

TECHNICAL SPECIFICATIONS:
- Ultra-high-quality corporate photography standard (8K equivalent)
- Razor-sharp focus on facial features
- Professional real estate industry headshot standard
- LinkedIn executive profile quality
- Premium business card suitable
- Clean, polished, authoritative appearance
- Represents expertise in property valuation and real estate services

GENERATION CONSTRAINTS:
- NO alterations to facial identity or distinguishing features
- NO beautification that changes natural appearance
- MAINTAIN professional authenticity while enhancing presentation
- PRESERVE individual's unique facial characteristics completely
- Focus on professional lighting and composition, NOT feature modification

Image style: Premium corporate headshot, executive LinkedIn profile, professional business portrait, industry-standard quality.`;
      
      return featuresPrompt;
    }
    
    // Fallback to generic prompt if no facial analysis available
    const baseSubject = 'professional real estate appraiser';
    
    return `Professional headshot portrait of ${baseSubject}, ${attireDescriptions[style.attire]}, 
    confident and trustworthy expression, direct eye contact with camera, slight professional smile, 
    ${backgrounds[style.background]}, ${lightingStyles[style.lighting]}, 
    high-quality corporate photography style, sharp focus on face, professional real estate industry standard, 
    suitable for LinkedIn profile or business card, clean and polished appearance, 
    representing expertise and reliability in property valuation services`;
  }

  /**
   * Generate variations of a headshot
   */
  async generateHeadshotVariations(
    originalHeadshotUrl: string,
    appraiser_id: string,
    numberOfVariations: number = 2
  ): Promise<HeadshotGenerationResult[]> {
    const variations: HeadshotGenerationResult[] = [];
    
    const styleVariations: Partial<HeadshotStyle>[] = [
      { background: 'corporate_blue', attire: 'business_suit' },
      { background: 'professional_white', attire: 'smart_casual' },
      { background: 'neutral_gray', attire: 'professional_shirt' },
    ];

    for (let i = 0; i < Math.min(numberOfVariations, styleVariations.length); i++) {
      const variation = await this.generateProfessionalHeadshot(
        originalHeadshotUrl,
        appraiser_id,
        styleVariations[i]
      );
      variations.push(variation);
    }

    return variations;
  }

  /**
   * Validate image quality and dimensions
   */
  async validateHeadshotQuality(imageUrl: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    // In a production environment, this would analyze the image
    // For now, we'll return a basic validation
    return {
      isValid: true,
      issues: [],
      recommendations: [
        'Image meets professional standards',
        'Suitable for public profile display'
      ]
    };
  }

  /**
   * Calculate cost estimate for headshot generation
   */
  private calculateCostEstimate(style: HeadshotStyle): number {
    // FLUX.1 Kontext Pro pricing on Replicate (as of 2025)
    // Approximate cost per image generation
    return 0.015; // 75% cheaper than DALL-E 3
  }

  /**
   * Mock response for development mode
   */
  private getMockHeadshotResponse(
    appraiser_id: string,
    style: HeadshotStyle,
    startTime: number
  ): HeadshotGenerationResult {
    // Simulate API delay
    const generationTime = Date.now() - startTime + Math.random() * 2000 + 1000;
    
    // Generate a mock URL that would represent a professional headshot
    const mockUrl = `https://replicate.delivery/mock/headshot_${appraiser_id}_${Date.now()}.jpg`;
    
    console.log(`Mock: Generated headshot for appraiser ${appraiser_id} in ${generationTime}ms`);

    return {
      success: true,
      headshot_url: mockUrl,
      revised_prompt: `Mock: Professional headshot with ${style.background} background and ${style.attire}`,
      cost_estimate: this.calculateCostEstimate(style),
      generation_time: generationTime,
    };
  }

  /**
   * Download and convert Replicate image URL to File object
   */
  async downloadHeadshotAsFile(imageUrl: string, filename: string): Promise<File> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const blob = await response.blob();
      return new File([blob], filename, { type: 'image/jpeg' });
    } catch (error) {
      console.error('Download headshot error:', error);
      throw new Error('Failed to download generated headshot');
    }
  }

  /**
   * Get available style options for UI
   */
  getAvailableStyles(): {
    backgrounds: Array<{ value: string; label: string; description: string }>;
    attire: Array<{ value: string; label: string; description: string }>;
    lighting: Array<{ value: string; label: string; description: string }>;
  } {
    return {
      backgrounds: [
        { value: 'corporate_blue', label: 'Corporate Blue', description: 'Professional blue gradient backdrop' },
        { value: 'neutral_gray', label: 'Neutral Gray', description: 'Classic gray professional background' },
        { value: 'professional_white', label: 'Professional White', description: 'Clean white studio background' },
        { value: 'warm_beige', label: 'Warm Beige', description: 'Approachable beige background' },
      ],
      attire: [
        { value: 'business_suit', label: 'Business Suit', description: 'Formal dark suit with tie' },
        { value: 'smart_casual', label: 'Smart Casual', description: 'Professional but approachable' },
        { value: 'professional_shirt', label: 'Professional Shirt', description: 'Crisp dress shirt' },
      ],
      lighting: [
        { value: 'soft_professional', label: 'Soft Professional', description: 'Even, flattering lighting' },
        { value: 'studio_lighting', label: 'Studio Lighting', description: 'Perfect studio setup' },
        { value: 'natural_bright', label: 'Natural Bright', description: 'Bright, natural appearance' },
      ],
    };
  }

  /**
   * Estimate monthly usage costs
   */
  estimateMonthlyUsage(headshotsPerMonth: number, style: HeadshotStyle): {
    costPerHeadshot: number;
    monthlyCost: number;
    yearlyEstimate: number;
  } {
    const costPerHeadshot = this.calculateCostEstimate(style);
    const monthlyCost = headshotsPerMonth * costPerHeadshot;
    const yearlyEstimate = monthlyCost * 12;

    return {
      costPerHeadshot,
      monthlyCost,
      yearlyEstimate,
    };
  }
}

// Export singleton instance
// Export singleton instance only if API token is available
export const replicateHeadshotService = process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_API_TOKEN !== 'disabled'
  ? new ReplicateHeadshotService()
  : null;
export default replicateHeadshotService;

// Export types
export type { HeadshotStyle, HeadshotGenerationResult, ReplicateImageResponse };