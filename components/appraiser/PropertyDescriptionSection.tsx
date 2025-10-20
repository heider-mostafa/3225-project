'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Copy, RefreshCw, Loader2, Sparkles, FileText, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generatePropertyDescription } from '@/lib/services/property-description-generator';
import type { PropertyDescriptionOptions, PropertyDescriptionResult } from '@/lib/services/property-description-generator';

interface PropertyDescriptionSectionProps {
  formData: any;
  isCompleted: boolean;
  onDescriptionChange?: (data: {
    description: string;
    marketing_headline: string;
    key_features: string[];
  }) => void;
}

export default function PropertyDescriptionSection({
  formData,
  isCompleted,
  onDescriptionChange
}: PropertyDescriptionSectionProps) {
  const [currentDescription, setCurrentDescription] = useState<PropertyDescriptionResult | null>(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedHeadline, setEditedHeadline] = useState('');
  const [editedFeatures, setEditedFeatures] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Generation options for variations
  const [options, setOptions] = useState<PropertyDescriptionOptions>({
    language: 'ar-en',
    tone: 'professional',
    target_audience: 'family',
    include_technical_details: true,
    include_market_analysis: false,
    max_length: 800
  });

  // Auto-generate initial description when calculations complete
  useEffect(() => {
    if (isCompleted && formData && !currentDescription) {
      generateInitialDescription();
    }
  }, [isCompleted, formData]);

  // Notify parent of description changes
  useEffect(() => {
    if (onDescriptionChange && (editedDescription || editedHeadline || editedFeatures.length > 0)) {
      onDescriptionChange({
        description: editedDescription,
        marketing_headline: editedHeadline,
        key_features: editedFeatures.filter(f => f.trim())
      });
    }
  }, [editedDescription, editedHeadline, editedFeatures, onDescriptionChange]);

  const generateInitialDescription = async () => {
    if (!formData) return;

    setIsGenerating(true);
    try {
      console.log('🔄 Auto-generating property description from completed appraisal...');
      
      // Use the same options as the automatic generation in the API
      const result = generatePropertyDescription(formData, {
        language: 'ar-en',
        tone: 'professional',
        target_audience: 'family',
        include_technical_details: true,
        include_market_analysis: false,
        max_length: 800
      });
      
      setCurrentDescription(result);
      setEditedDescription(result.description);
      setEditedHeadline(result.marketing_headline);
      setEditedFeatures([...result.key_features]);
      
      console.log('✅ Auto-generated description ready for editing');
      
    } catch (error) {
      console.error('Auto-generation error:', error);
      // Don't show error toast for auto-generation - just log it
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateVariation = async () => {
    if (!formData) {
      toast.error('No form data available for regeneration');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('🔄 Regenerating description with new options:', options);
      
      const result = generatePropertyDescription(formData, options);
      
      setCurrentDescription(result);
      setEditedDescription(result.description);
      setEditedHeadline(result.marketing_headline);
      setEditedFeatures([...result.key_features]);
      
      toast.success(`Generated ${options.tone} variation for ${options.target_audience.replace('_', ' ')}`);
      
    } catch (error) {
      console.error('Regeneration error:', error);
      toast.error('Failed to regenerate description');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const addFeature = () => {
    setEditedFeatures([...editedFeatures, '']);
  };

  const updateFeature = (index: number, value: string) => {
    const updated = [...editedFeatures];
    updated[index] = value;
    setEditedFeatures(updated);
  };

  const removeFeature = (index: number) => {
    setEditedFeatures(editedFeatures.filter((_, i) => i !== index));
  };

  const getVariationButtonText = () => {
    const tones = ['professional', 'casual', 'luxury', 'investment'] as const;
    const audiences = ['family', 'investor', 'first_time_buyer', 'luxury_buyer'] as const;
    
    const currentToneIndex = tones.indexOf(options.tone as any);
    const currentAudienceIndex = audiences.indexOf(options.target_audience as any);
    
    const nextTone = tones[(currentToneIndex + 1) % tones.length];
    const nextAudience = audiences[(currentAudienceIndex + 1) % audiences.length];
    
    return `Try ${nextTone} for ${nextAudience.replace('_', ' ')}`;
  };

  // Show waiting state when calculations not completed
  if (!isCompleted) {
    return (
      <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Sparkles className="h-16 w-16 opacity-30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-slate-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div>
            <p className="font-medium text-slate-700">Property Description Ready</p>
            <p className="text-sm text-slate-500 mt-1">Complete the valuation calculation to generate description</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state during initial generation
  if (isGenerating && !currentDescription) {
    return (
      <div className="text-center py-12 text-blue-600 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin" />
          </div>
          <div>
            <p className="font-medium">Generating Property Description...</p>
            <p className="text-sm text-blue-500 mt-1">Creating professional description from appraisal data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generation Options & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-blue-700">Style:</Label>
            <Select
              value={options.tone}
              onValueChange={(value) => setOptions(prev => ({ ...prev, tone: value as any }))}
              disabled={isGenerating}
            >
              <SelectTrigger className="w-32 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-blue-700">Audience:</Label>
            <Select
              value={options.target_audience}
              onValueChange={(value) => setOptions(prev => ({ ...prev, target_audience: value as any }))}
              disabled={isGenerating}
            >
              <SelectTrigger className="w-36 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Families</SelectItem>
                <SelectItem value="investor">Investors</SelectItem>
                <SelectItem value="first_time_buyer">First-time Buyers</SelectItem>
                <SelectItem value="luxury_buyer">Luxury Buyers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-blue-700">Language:</Label>
            <Select
              value={options.language}
              onValueChange={(value) => setOptions(prev => ({ ...prev, language: value as any }))}
              disabled={isGenerating}
            >
              <SelectTrigger className="w-32 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar-en">Arabic + English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={regenerateVariation}
            disabled={isGenerating}
            size="sm"
            variant="outline"
            className="bg-white"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {getVariationButtonText()}
          </Button>
        </div>
      </div>

      {/* Generated Content Editing */}
      <div className="space-y-6">
        {/* Marketing Headline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium text-slate-700">Marketing Headline</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(editedHeadline, 'Headline')}
                className="h-auto p-1 text-blue-600 hover:text-blue-700"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>
          <Input
            value={editedHeadline}
            onChange={(e) => setEditedHeadline(e.target.value)}
            placeholder="Enter marketing headline..."
            className="font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 focus:border-blue-400"
          />
        </div>

        {/* Main Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium text-slate-700">Property Description</Label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {editedDescription.length} chars
                {currentDescription && (
                  <> • {currentDescription.confidence_score}% confidence</>
                )}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="h-auto p-1 text-slate-600"
              >
                <Eye className="h-3 w-3 mr-1" />
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(editedDescription, 'Description')}
                className="h-auto p-1 text-blue-600 hover:text-blue-700"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>
          
          {showPreview ? (
            <div className="p-4 bg-white border border-slate-200 rounded-lg min-h-[200px] text-slate-700 leading-relaxed">
              {editedDescription || (
                <span className="text-slate-400 italic">No description available</span>
              )}
            </div>
          ) : (
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Property description will appear here after generation..."
              className="min-h-[200px] bg-white resize-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {/* Key Features */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium text-slate-700">Key Features</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={addFeature}
              className="h-auto p-1 text-green-600 hover:text-green-700"
            >
              + Add Feature
            </Button>
          </div>
          
          <div className="space-y-2">
            {editedFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  placeholder="Enter feature..."
                  className="flex-1 bg-white"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFeature(index)}
                  className="h-auto p-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
          
          {editedFeatures.length > 0 && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border">
              <Label className="text-xs text-slate-600 block mb-2">Feature Preview:</Label>
              <div className="flex flex-wrap gap-2">
                {editedFeatures.filter(f => f.trim()).map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Generation Status & Info */}
        {currentDescription && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Description Generated Successfully
                  </p>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    {currentDescription.generated_at.toLocaleString()}
                  </span>
                </div>
                
                <div className="text-xs text-green-700 space-y-1">
                  <p>
                    <strong>Style:</strong> {options.tone.charAt(0).toUpperCase() + options.tone.slice(1)} • 
                    <strong> Audience:</strong> {options.target_audience.replace('_', ' ')} • 
                    <strong> Confidence:</strong> {currentDescription.confidence_score}%
                  </p>
                  
                  {currentDescription.seo_keywords.length > 0 && (
                    <div>
                      <strong>SEO Keywords:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentDescription.seo_keywords.slice(0, 6).map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-green-300 text-green-700">
                            {keyword}
                          </Badge>
                        ))}
                        {currentDescription.seo_keywords.length > 6 && (
                          <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                            +{currentDescription.seo_keywords.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">How this works:</p>
            <ul className="mt-1 space-y-1 text-blue-700">
              <li>• Description is automatically generated when you complete the valuation</li>
              <li>• Edit any section above to customize the content before saving</li>
              <li>• Use "Regenerate" to try different styles and target audiences</li>
              <li>• These descriptions will be saved to the property record when you submit the appraisal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}