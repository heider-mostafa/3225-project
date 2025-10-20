'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Download, 
  Settings, 
  Eye, 
  Globe,
  Shield,
  TrendingUp,
  Building,
  Calculator,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import type { ReportOptions, PropertyData, AppraisalData, MarketAnalysis } from '@/lib/services/pdf-report-generator';
import { ReportFilteringService, type ReportType } from '@/lib/services/report-filtering';
import { toast } from 'sonner';

interface Props {
  appraisalId: string;
  onReportGenerated?: (reportData: any) => void;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  languages: string[];
  estimated_pages: number;
}

export function AppraisalReportGenerator({ appraisalId, onReportGenerated }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('comprehensive');
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    language: 'both',
    format: 'comprehensive',
    reportType: 'comprehensive',
    include_legal_analysis: true,
    include_mortgage_analysis: true,
    include_market_comparables: true,
    include_investment_projections: true,
    include_images: true,
    watermark: 'CONFIDENTIAL'
  });
  
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('comprehensive');
  const [customWatermark, setCustomWatermark] = useState('CONFIDENTIAL');
  const [reportPreview, setReportPreview] = useState<any>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Update report options when report type changes - this takes precedence over templates
  useEffect(() => {
    console.log('🔄 Report type changed to:', reportType);
    setReportOptions(prev => ({
      ...prev,
      reportType: reportType,
      // Adjust options based on report type (overrides template settings)
      include_legal_analysis: reportType !== 'standard',
      include_mortgage_analysis: reportType !== 'standard',
      include_investment_projections: reportType !== 'standard',
      include_market_comparables: true // Always include for all types
    }));
  }, [reportType]);

  const loadTemplates = async () => {
    try {
      console.log('Loading report templates...');
      const response = await fetch('/api/generate-report?action=templates');
      const result = await response.json();
      
      console.log('Templates API response:', result);
      
      if (result.success) {
        setTemplates(result.data);
        console.log('Templates loaded:', result.data);
      } else {
        console.error('Templates API failed:', result.error);
        toast.error('Failed to load report templates: ' + result.error);
      }
    } catch (error) {
      console.error('Load templates error:', error);
      toast.error('Failed to load report templates');
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      // Update report options based on template BUT respect report type filtering
      setReportOptions(prev => ({
        ...prev,
        format: template.id as any,
        // Don't override report type-based filtering - let reportType useEffect handle this
        // include_legal_analysis, include_mortgage_analysis, etc. will be set by reportType
      }));
    }
  };

  const generateReportPreview = async () => {
    try {
      setIsGenerating(true);
      console.log('📊 Generating report preview for appraisal:', appraisalId);
      console.log('🔒 Report type:', reportType);
      console.log('⚙️ Report options:', reportOptions);

      const requestData = {
        appraisal_id: appraisalId,
        reportType: reportType,
        report_options: {
          ...reportOptions,
          reportType: reportType,
          watermark: customWatermark || 'CONFIDENTIAL'
        }
      };
      
      console.log('Report generation request:', requestData);

      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      console.log('Report generation response:', result);
      
      if (result.success) {
        setReportPreview(result.data);
        toast.success('Report preview generated successfully');
        
        if (onReportGenerated) {
          onReportGenerated(result.data);
        }
      } else {
        console.error('Report generation failed:', result.error);
        toast.error('Failed to generate report preview: ' + result.error);
      }
    } catch (error) {
      console.error('Generate report preview error:', error);
      toast.error('Failed to generate report preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAndDownloadPDF = async () => {
    if (!reportPreview) {
      toast.error('Please generate preview first');
      return;
    }

    try {
      setIsGenerating(true);
      
      // IMPORTANT: Get fresh data with current report type instead of using cached preview
      console.log('🔄 Generating fresh PDF data for report type:', reportType);
      
      const requestData = {
        appraisal_id: appraisalId,
        reportType: reportType, // Use current report type
        report_options: {
          ...reportOptions,
          reportType: reportType,
          watermark: customWatermark || 'CONFIDENTIAL'
        }
      };
      
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fresh report data');
      }

      const freshData = await response.json();
      console.log('✅ Fresh data received for PDF generation:', freshData.metadata?.reportType);
      
      // Generate PDF using dynamic import for better performance
      console.log('Generating PDF with jsPDF and embedded Amiri font...');
      const { PDFReportGenerator } = await import('@/lib/services/pdf-report-generator');
      const pdfGenerator = new PDFReportGenerator();
      
      const pdfBlob = await pdfGenerator.generateReport(
        freshData.data.property as PropertyData,
        freshData.data.appraisal as AppraisalData,
        freshData.data.market as MarketAnalysis,
        freshData.data.options as ReportOptions
      );
      
      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Appraisal_Report_${freshData.data.appraisal.reference_number || reportPreview.appraisal.reference_number}_${reportType}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PDF generated successfully with Arabic font support! 🎉');
    } catch (error) {
      console.error('Generate PDF error:', error);
      toast.error('Failed to generate PDF report: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Configuration
          </CardTitle>
          <CardDescription>
            Configure your property appraisal report settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Report Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select report template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-gray-500">{template.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTemplateData && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Estimated Pages:</span> {selectedTemplateData.estimated_pages}
                  </div>
                  <div>
                    <span className="font-medium">Sections:</span> {selectedTemplateData.sections.length}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTemplateData.sections.map((section) => (
                    <Badge key={section} variant="secondary" className="text-xs">
                      {section.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Report Type & Privacy Level
            </Label>
            <div className="grid gap-3">
              {(Object.keys(ReportFilteringService.getReportTypePricing()) as ReportType[]).map((type) => {
                const pricing = ReportFilteringService.getReportTypePricing()[type];
                const isSelected = reportType === type;
                
                return (
                  <div
                    key={type}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setReportType(type);
                      setReportOptions(prev => ({ ...prev, reportType: type }));
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => {}}
                            className="text-blue-600"
                          />
                          <h4 className="font-medium capitalize">{type} Report</h4>
                          <Badge 
                            variant={pricing.privacyLevel === 'high' ? 'default' : pricing.privacyLevel === 'medium' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {pricing.privacyLevel} Privacy
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{pricing.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {pricing.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-1 text-xs text-gray-500">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{pricing.basePrice} EGP</div>
                        <div className="text-xs text-gray-500">Base price</div>
                      </div>
                    </div>
                    
                    {type !== 'comprehensive' && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="font-medium">Privacy Notice:</span>
                        </div>
                        <span>Some sensitive information will be protected or excluded in this report type.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Report Language
            </Label>
            <Select 
              value={reportOptions.language} 
              onValueChange={(value) => setReportOptions(prev => ({ ...prev, language: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English Only</SelectItem>
                <SelectItem value="ar">Arabic Only</SelectItem>
                <SelectItem value="both">Bilingual (Arabic & English)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Section Inclusions */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Report Sections</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_legal"
                    checked={reportOptions.include_legal_analysis}
                    onCheckedChange={(checked) => 
                      setReportOptions(prev => ({ ...prev, include_legal_analysis: !!checked }))
                    }
                  />
                  <Label htmlFor="include_legal" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Legal Analysis
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_mortgage"
                    checked={reportOptions.include_mortgage_analysis}
                    onCheckedChange={(checked) => 
                      setReportOptions(prev => ({ ...prev, include_mortgage_analysis: !!checked }))
                    }
                  />
                  <Label htmlFor="include_mortgage" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Mortgage Analysis
                  </Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_market"
                    checked={reportOptions.include_market_comparables}
                    onCheckedChange={(checked) => 
                      setReportOptions(prev => ({ ...prev, include_market_comparables: !!checked }))
                    }
                  />
                  <Label htmlFor="include_market" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Market Comparables
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_investment"
                    checked={reportOptions.include_investment_projections}
                    onCheckedChange={(checked) => 
                      setReportOptions(prev => ({ ...prev, include_investment_projections: !!checked }))
                    }
                  />
                  <Label htmlFor="include_investment" className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Investment Projections
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_advanced"
              checked={showAdvancedOptions}
              onCheckedChange={(checked) => setShowAdvancedOptions(!!checked)}
            />
            <Label htmlFor="show_advanced" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Show Advanced Options
            </Label>
          </div>

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-2">
                <Label htmlFor="watermark" className="text-sm font-medium">Custom Watermark</Label>
                <Input
                  id="watermark"
                  value={customWatermark}
                  onChange={(e) => setCustomWatermark(e.target.value)}
                  placeholder="Enter custom watermark text"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_images"
                  checked={reportOptions.include_images}
                  onCheckedChange={(checked) => 
                    setReportOptions(prev => ({ ...prev, include_images: !!checked }))
                  }
                />
                <Label htmlFor="include_images">Include Property Images</Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Preview */}
      {reportPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Report Preview
            </CardTitle>
            <CardDescription>
              Review your report configuration before generating the PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Report Type</span>
                </div>
                <div className="text-sm text-gray-600">{selectedTemplateData?.name}</div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Language</span>
                </div>
                <div className="text-sm text-gray-600">
                  {reportOptions.language === 'both' ? 'Bilingual' : 
                   reportOptions.language === 'ar' ? 'Arabic' : 'English'}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4" />
                  <span className="font-medium">Appraised Value</span>
                </div>
                <div className="text-sm text-gray-600 font-medium text-green-600">
                  {reportPreview.appraisal.market_value_estimate.toLocaleString()} EGP
                </div>
              </div>
            </div>

            {/* Property Info */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Property Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Property:</span>
                  <div className="font-medium">{reportPreview.property.title}</div>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <div className="font-medium">{reportPreview.property.city}</div>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <div className="font-medium">{reportPreview.property.property_type}</div>
                </div>
                <div>
                  <span className="text-gray-600">Area:</span>
                  <div className="font-medium">{reportPreview.property.area} m²</div>
                </div>
              </div>
            </div>

            {/* Included Sections */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Included Sections</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Executive Summary</Badge>
                <Badge variant="default">Property Details</Badge>
                {reportOptions.include_market_comparables && (
                  <Badge variant="default">Market Analysis</Badge>
                )}
                {reportOptions.include_legal_analysis && (
                  <Badge variant="default">Legal Analysis</Badge>
                )}
                {reportOptions.include_mortgage_analysis && (
                  <Badge variant="default">Mortgage Analysis</Badge>
                )}
                {reportOptions.include_investment_projections && (
                  <Badge variant="default">Investment Analysis</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {reportPreview ? 'Ready to generate PDF' : 'Configure your report settings above'}
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={generateReportPreview}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Generating Preview...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Generate Preview
              </>
            )}
          </Button>

          <Button
            onClick={generateAndDownloadPDF}
            disabled={isGenerating || !reportPreview}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Report Status Indicators */}
      {reportPreview && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Report Configuration Complete</span>
              </div>
              <div className="text-sm text-gray-600">
                Estimated pages: {selectedTemplateData?.estimated_pages || 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}