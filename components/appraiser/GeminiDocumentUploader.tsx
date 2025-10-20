'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Image, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  File,
  Clock,
  Sparkles,
  Brain
} from 'lucide-react';
import { geminiDocumentExtractor, GeminiExtractionResult, RealEstateData, ExtractedImage } from '@/lib/services/gemini-document-extractor';
import { SmartAppraisalFormData } from '@/types/document-processor';

interface GeminiDocumentUploaderProps {
  onExtractionComplete: (result: GeminiExtractionResult) => void;
  onError: (error: string) => void;
  onImagesExtracted?: (images: ExtractedImage[]) => void;
  disabled?: boolean;
  className?: string;
}

interface ProcessingStep {
  name: string;
  description: string;
  progress: number;
  duration?: number;
}

export function GeminiDocumentUploader({
  onExtractionComplete,
  onError,
  onImagesExtracted,
  disabled = false,
  className = ""
}: GeminiDocumentUploaderProps) {
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<GeminiExtractionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const processingSteps: ProcessingStep[] = [
    { name: 'Preparing', description: 'Initializing document processing...', progress: 0 },
    { name: 'Uploading', description: 'Uploading document to Gemini AI...', progress: 15 },
    { name: 'Analyzing', description: 'AI is analyzing document structure...', progress: 35 },
    { name: 'Extracting', description: 'Extracting property information...', progress: 55 },
    { name: 'Processing Images', description: 'Identifying and extracting images...', progress: 75 },
    { name: 'Finalizing', description: 'Preparing extraction results...', progress: 90 },
    { name: 'Complete', description: 'Processing completed successfully!', progress: 100 }
  ];

  // Reset component state
  const resetUploader = useCallback(() => {
    setFile(null);
    setIsProcessing(false);
    setExtractionResult(null);
    setCurrentStep(0);
    setOverallProgress(0);
  }, []);

  // Simulate step progression for better UX
  const progressThroughStep = useCallback(async (stepIndex: number, duration: number = 1000) => {
    const step = processingSteps[stepIndex];
    setCurrentStep(stepIndex);
    
    const startProgress = stepIndex === 0 ? 0 : processingSteps[stepIndex - 1].progress;
    const endProgress = step.progress;
    const steps = 20; // Number of progress updates
    const increment = (endProgress - startProgress) / steps;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      setOverallProgress(Math.min(startProgress + (increment * i), endProgress));
    }
  }, [processingSteps]);

  // Handle file selection from input or drag-drop
  const handleFileSelect = useCallback((selectedFile: File) => {
    // Basic validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (selectedFile.size > maxSize) {
      onError('File size must be less than 50MB');
      return;
    }

    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|docx|doc|txt|xlsx|xls)$/i)) {
      onError('Please upload a PDF, Word document, Excel file, or text file');
      return;
    }

    setFile(selectedFile);
    setExtractionResult(null);
    setCurrentStep(0);
    setOverallProgress(0);
  }, [onError]);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Process the document with Gemini AI
  const processDocument = async () => {
    if (!file || disabled || isProcessing) return;

    if (!geminiDocumentExtractor.isAvailable()) {
      onError('Gemini AI is not available. Please check your API key configuration.');
      return;
    }

    setIsProcessing(true);
    setCurrentStep(0);
    setOverallProgress(0);

    try {
      // Step 1: Preparing
      await progressThroughStep(0, 500);
      
      // Step 2: Uploading
      await progressThroughStep(1, 800);
      
      // Step 3: Analyzing
      await progressThroughStep(2, 1200);
      
      // Step 4: Extracting (actual AI processing)
      const extractionPromise = geminiDocumentExtractor.extractFromDocument(file);
      await progressThroughStep(3, 1500);
      
      // Step 5: Processing Images
      await progressThroughStep(4, 1000);
      
      const result = await extractionPromise;
      
      // Step 6: Finalizing
      await progressThroughStep(5, 800);
      
      setExtractionResult(result);
      
      if (result.success) {
        // Step 7: Complete
        await progressThroughStep(6, 500);
        
        onExtractionComplete(result);
        
        // Notify about extracted images if callback provided
        if (onImagesExtracted && result.extractedImages.length > 0) {
          onImagesExtracted(result.extractedImages);
        }
        
      } else {
        onError(result.error || 'Extraction failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      onError(errorMessage);
      setCurrentStep(0);
      setOverallProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get file type icon
  const getFileTypeIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'xlsx':
      case 'xls':
        return <File className="h-8 w-8 text-green-500" />;
      case 'docx':
      case 'doc':
        return <File className="h-8 w-8 text-blue-500" />;
      case 'txt':
        return <FileText className="h-8 w-8 text-gray-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-500" />
          AI-Powered Document Extraction
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Gemini AI
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* File Upload Area */}
        {!file && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  Upload Egyptian Appraisal Document
                </p>
                <p className="text-sm text-gray-500">
                  Drag and drop your document here, or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Supports PDF, Word, Excel, and Text files (max 50MB)
                </p>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="mt-4"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleFileInputChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                disabled={disabled}
              />
            </div>
          </div>
        )}

        {/* Selected File Display */}
        {file && !isProcessing && !extractionResult && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-3">
              {getFileTypeIcon(file.name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={processDocument}
                disabled={disabled}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Brain className="h-4 w-4 mr-2" />
                Extract with AI
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetUploader}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Processing with Gemini AI... ({Math.round(overallProgress)}%)
                  </p>
                  <p className="text-sm text-blue-600">
                    {processingSteps[currentStep]?.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(overallProgress)}%
                </div>
                <div className="text-xs text-blue-500">
                  Step {currentStep + 1} of {processingSteps.length}
                </div>
              </div>
            </div>
            
            {/* Detailed Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {processingSteps[currentStep]?.name}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(overallProgress)}% Complete
                </span>
              </div>
              
              <div className="relative">
                <Progress value={overallProgress} className="h-3" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse" 
                     style={{ width: `${overallProgress}%` }} />
              </div>
              
              {/* Step indicators */}
              <div className="flex justify-between text-xs text-gray-400">
                {processingSteps.map((step, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mb-1 ${
                      index < currentStep ? 'bg-green-500' :
                      index === currentStep ? 'bg-blue-500 animate-pulse' :
                      'bg-gray-300'
                    }`} />
                    <span className={`text-center ${
                      index === currentStep ? 'text-blue-600 font-medium' : ''
                    }`}>
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Time estimate */}
              <div className="text-center text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <Clock className="h-3 w-3 inline mr-1" />
                Estimated time: {Math.max(1, Math.ceil((100 - overallProgress) / 20))} minutes remaining
              </div>
            </div>
          </div>
        )}

        {/* Extraction Results */}
        {extractionResult && (
          <div className="space-y-4">
            {extractionResult.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="flex items-center justify-between">
                    <span>
                      Document processed successfully! Extracted data is ready for form population.
                    </span>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {extractionResult.processingTime}ms
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Extraction failed: {extractionResult.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Extracted Data Preview */}
            {extractionResult.success && extractionResult.extractedData && (
              <Card className="bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Extracted Information Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Client:</span>
                      <div className="text-gray-900">{extractionResult.extractedData.clientName || 'Not found'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Property Type:</span>
                      <div className="text-gray-900">{extractionResult.extractedData.propertyType || 'Not found'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Area:</span>
                      <div className="text-gray-900">{extractionResult.extractedData.unitAreaSqm || 'Not found'} m²</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Final Value:</span>
                      <div className="text-gray-900">{extractionResult.extractedData.finalReconciledValue || 'Not found'} EGP</div>
                    </div>
                    {extractionResult.extractedImages.length > 0 && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">Images Extracted:</span>
                        <div className="text-gray-900">{extractionResult.extractedImages.length} images found</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Extracted Images Preview */}
                  {extractionResult.extractedImages.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Extracted Images</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {extractionResult.extractedImages.slice(0, 8).map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-200 rounded-md overflow-hidden">
                              <img
                                src={`data:${image.mimeType};base64,${image.base64}`}
                                alt={image.description || `Extracted image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-md flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 text-white text-xs text-center p-2">
                                {image.category || 'Image'}
                                {image.page && ` (Page ${image.page})`}
                              </div>
                            </div>
                          </div>
                        ))}
                        {extractionResult.extractedImages.length > 8 && (
                          <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center text-gray-500 text-xs text-center">
                            +{extractionResult.extractedImages.length - 8} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetUploader}
                    >
                      Process Another Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* AI Service Info */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3 w-3" />
            <span className="font-medium">Powered by Google Gemini AI</span>
          </div>
          <p>Advanced document understanding with Arabic text recognition and real estate domain expertise.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default GeminiDocumentUploader;