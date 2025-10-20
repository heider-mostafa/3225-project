'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wand2, 
  Image as ImageIcon, 
  CheckCircle, 
  RefreshCw, 
  Download,
  Eye,
  Palette,
  Shirt,
  Sun,
  DollarSign,
  Loader2,
  Sparkles,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import openaiHeadshotService, { HeadshotStyle } from '@/lib/services/openai-headshot-service';

interface HeadshotGenerationProps {
  appraiser_id: string;
  originalSelfieUrl: string;
  onHeadshotGenerated: (headshotUrl: string, metadata: any) => void;
  onGenerationError: (error: string) => void;
}

type GenerationStep = 'style_selection' | 'generating' | 'preview' | 'variations' | 'complete';

export function HeadshotGeneration({ 
  appraiser_id, 
  originalSelfieUrl, 
  onHeadshotGenerated, 
  onGenerationError 
}: HeadshotGenerationProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<GenerationStep>('style_selection');
  const [selectedStyle, setSelectedStyle] = useState<Partial<HeadshotStyle>>({
    background: 'corporate_blue',
    attire: 'business_suit',
    lighting: 'soft_professional',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedHeadshots, setGeneratedHeadshots] = useState<any[]>([]);
  const [selectedHeadshot, setSelectedHeadshot] = useState<any>(null);
  const [costEstimate, setCostEstimate] = useState(0);
  const [availableStyles, setAvailableStyles] = useState<any>({});

  useEffect(() => {
    loadAvailableStyles();
    calculateCostEstimate();
  }, [selectedStyle]);

  const loadAvailableStyles = () => {
    const styles = openaiHeadshotService.getAvailableStyles();
    setAvailableStyles(styles);
  };

  const calculateCostEstimate = () => {
    const fullStyle: HeadshotStyle = {
      model: 'dall-e-3',
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
      ...selectedStyle,
    } as HeadshotStyle;

    const estimate = openaiHeadshotService.estimateMonthlyUsage(1, fullStyle);
    setCostEstimate(estimate.costPerHeadshot);
  };

  const generateProfessionalHeadshot = async () => {
    setIsGenerating(true);
    setCurrentStep('generating');
    setGenerationProgress(0);

    try {
      // Simulate progress updates with facial analysis step
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 8;
        });
      }, 600);

      // Show facial analysis progress
      setGenerationProgress(20);
      toast.info('🔍 Analyzing facial features for preservation...');
      
      // Generate headshot with feature preservation
      const result = await openaiHeadshotService.generateProfessionalHeadshot(
        originalSelfieUrl,
        appraiser_id,
        selectedStyle
      );

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate headshot');
      }

      const headshotData = {
        ...result,
        style: selectedStyle,
        generated_at: new Date().toISOString(),
      };

      setGeneratedHeadshots([headshotData]);
      setSelectedHeadshot(headshotData);
      setCurrentStep('preview');
      
      if (result.facial_analysis) {
        toast.success('✅ Headshot generated with preserved facial features!');
      } else {
        toast.success('Professional headshot generated successfully!');
      }

    } catch (error: any) {
      console.error('Headshot generation error:', error);
      toast.error(error.message || 'Failed to generate headshot');
      onGenerationError(error.message || 'Generation failed');
      setCurrentStep('style_selection');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVariations = async () => {
    setIsGenerating(true);
    
    try {
      const variations = await openaiHeadshotService.generateHeadshotVariations(
        selectedHeadshot.headshot_url,
        appraiser_id,
        2
      );

      const successfulVariations = variations.filter(v => v.success);
      if (successfulVariations.length > 0) {
        setGeneratedHeadshots([selectedHeadshot, ...successfulVariations.map(v => ({
          ...v,
          style: selectedStyle,
          generated_at: new Date().toISOString(),
        }))]);
        setCurrentStep('variations');
        toast.success(`Generated ${successfulVariations.length} additional variations`);
      }
    } catch (error: any) {
      toast.error('Failed to generate variations');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectHeadshot = (headshot: any) => {
    setSelectedHeadshot(headshot);
  };

  const confirmHeadshot = async () => {
    if (!selectedHeadshot) return;

    try {
      onHeadshotGenerated(selectedHeadshot.headshot_url, {
        style: selectedHeadshot.style,
        revised_prompt: selectedHeadshot.revised_prompt,
        cost: selectedHeadshot.cost_estimate,
        generation_time: selectedHeadshot.generation_time,
        generated_at: selectedHeadshot.generated_at,
      });
      
      setCurrentStep('complete');
      toast.success('Professional headshot confirmed and saved!');
    } catch (error: any) {
      toast.error('Failed to save headshot');
    }
  };

  const startOver = () => {
    setCurrentStep('style_selection');
    setGeneratedHeadshots([]);
    setSelectedHeadshot(null);
    setGenerationProgress(0);
  };

  const renderStyleSelection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
          <Wand2 className="h-10 w-10 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">AI Professional Headshot Generation</h3>
          <p className="text-gray-600">Transform your selfie into a standardized professional headshot</p>
        </div>
      </div>

      {/* Original Selfie Preview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={originalSelfieUrl}
                alt="Original selfie"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h4 className="font-medium">Original Verification Selfie</h4>
              <p className="text-sm text-gray-600">This will be transformed into a professional headshot</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style Customization */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Customize Professional Style
        </h4>

        {/* Background Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Background Style</label>
          <Select value={selectedStyle.background} onValueChange={(value) => 
            setSelectedStyle(prev => ({ ...prev, background: value as any }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select background" />
            </SelectTrigger>
            <SelectContent>
              {availableStyles.backgrounds?.map((bg: any) => (
                <SelectItem key={bg.value} value={bg.value}>
                  <div className="flex flex-col">
                    <span>{bg.label}</span>
                    <span className="text-xs text-gray-500">{bg.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Attire Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1">
            <Shirt className="h-3 w-3" />
            Professional Attire
          </label>
          <Select value={selectedStyle.attire} onValueChange={(value) => 
            setSelectedStyle(prev => ({ ...prev, attire: value as any }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select attire" />
            </SelectTrigger>
            <SelectContent>
              {availableStyles.attire?.map((attire: any) => (
                <SelectItem key={attire.value} value={attire.value}>
                  <div className="flex flex-col">
                    <span>{attire.label}</span>
                    <span className="text-xs text-gray-500">{attire.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lighting Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1">
            <Sun className="h-3 w-3" />
            Lighting Style
          </label>
          <Select value={selectedStyle.lighting} onValueChange={(value) => 
            setSelectedStyle(prev => ({ ...prev, lighting: value as any }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select lighting" />
            </SelectTrigger>
            <SelectContent>
              {availableStyles.lighting?.map((lighting: any) => (
                <SelectItem key={lighting.value} value={lighting.value}>
                  <div className="flex flex-col">
                    <span>{lighting.label}</span>
                    <span className="text-xs text-gray-500">{lighting.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cost Estimate */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Generation Cost: ${costEstimate.toFixed(3)} USD</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            High-quality DALL-E 3 professional headshot generation
          </p>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button 
        onClick={generateProfessionalHeadshot} 
        disabled={isGenerating}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Professional Headshot
          </>
        )}
      </Button>
    </div>
  );

  const renderGenerating = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Generating Professional Headshot...</h3>
        <p className="text-gray-600">
          AI is creating your standardized professional headshot
        </p>
        
        <div className="space-y-2">
          <Progress value={generationProgress} className="h-3" />
          <p className="text-sm text-gray-500">{generationProgress}% complete</p>
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <p>• Analyzing facial features and structure</p>
          <p>• Applying professional styling and lighting</p>
          <p>• Generating high-quality business headshot</p>
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Your Professional Headshot</h3>
        <p className="text-gray-600">AI-generated professional headshot for your profile</p>
      </div>

      {/* Before and After Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Original Selfie</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={originalSelfieUrl}
                alt="Original selfie"
                fill
                className="object-cover"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-600" />
              AI Professional Headshot
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {selectedHeadshot?.headshot_url ? (
                <Image
                  src={selectedHeadshot.headshot_url}
                  alt="Generated professional headshot"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Details */}
      {selectedHeadshot && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium">Generation Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Style:</span>
                <p className="capitalize">{selectedHeadshot.style?.background?.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-gray-600">Cost:</span>
                <p>${selectedHeadshot.cost_estimate?.toFixed(3)} USD</p>
              </div>
              <div>
                <span className="text-gray-600">Generation Time:</span>
                <p>{(selectedHeadshot.generation_time / 1000).toFixed(1)}s</p>
              </div>
              <div>
                <span className="text-gray-600">Quality:</span>
                <p>HD Professional</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={confirmHeadshot} className="flex-1">
          <CheckCircle className="h-4 w-4 mr-2" />
          Use This Headshot
        </Button>
        <Button variant="outline" onClick={generateVariations} disabled={isGenerating}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate Variations
        </Button>
        <Button variant="outline" onClick={startOver}>
          Start Over
        </Button>
      </div>
    </div>
  );

  const renderVariations = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">{t('appraiserDashboard.choosePreferredStyle')}</h3>
        <p className="text-gray-600">Select the headshot that best represents your professional image</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {generatedHeadshots.map((headshot, index) => (
          <Card 
            key={index}
            className={`cursor-pointer transition-all ${
              selectedHeadshot === headshot ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
            }`}
            onClick={() => selectHeadshot(headshot)}
          >
            <CardContent className="p-4">
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                <Image
                  src={headshot.headshot_url}
                  alt={`Professional headshot variation ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {selectedHeadshot === headshot && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-5 w-5 text-green-600 bg-white rounded-full" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Style {index + 1}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {headshot.style?.background?.replace('_', ' ')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Button onClick={confirmHeadshot} disabled={!selectedHeadshot} className="flex-1">
          <CheckCircle className="h-4 w-4 mr-2" />
          Confirm Selection
        </Button>
        <Button variant="outline" onClick={startOver}>
          Start Over
        </Button>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-green-600">Headshot Generated Successfully!</h3>
        <p className="text-gray-600 mt-2">
          Your professional headshot has been generated and saved to your profile.
        </p>
      </div>

      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          Your AI-generated professional headshot maintains consistency with our platform's 
          visual standards and enhances your professional credibility.
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-purple-600" />
          AI Professional Headshot Generation
        </CardTitle>
        <CardDescription>
          Transform your verification selfie into a standardized professional headshot
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {currentStep === 'style_selection' && renderStyleSelection()}
        {currentStep === 'generating' && renderGenerating()}
        {currentStep === 'preview' && renderPreview()}
        {currentStep === 'variations' && renderVariations()}
        {currentStep === 'complete' && renderComplete()}
      </CardContent>
    </Card>
  );
}