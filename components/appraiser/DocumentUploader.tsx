/**
 * Document Uploader Component
 * UI for uploading Egyptian appraisal documents to Python processing API
 * Issue #8: Smart Document Import Integration
 */

'use client';

import React, { useState, useCallback } from 'react';
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
  Clock
} from 'lucide-react';
import documentProcessorService from '@/lib/services/documentProcessorService';
import { 
  DocumentProcessingResult, 
  ProcessingStatus,
  FileValidation 
} from '@/types/document-processor';

interface DocumentUploaderProps {
  appraiser_id: string;
  onProcessingComplete: (result: DocumentProcessingResult) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function DocumentUploader({
  appraiser_id,
  onProcessingComplete,
  onError,
  disabled = false
}: DocumentUploaderProps) {
  
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [processingResult, setProcessingResult] = useState<DocumentProcessingResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileValidation, setFileValidation] = useState<FileValidation | null>(null);

  const allowedTypes = documentProcessorService.getAllowedFileTypes();
  const maxFileSize = documentProcessorService.getMaxFileSize();

  // Reset component state
  const resetUploader = useCallback(() => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setProcessingResult(null);
    setFileValidation(null);
  }, []);

  // Handle file selection from input or drag-drop
  const handleFileSelect = useCallback((selectedFile: File) => {
    // Validate file
    const validation = documentProcessorService.validateFile(selectedFile);
    setFileValidation(validation);

    if (validation.isValid) {
      setFile(selectedFile);
      setStatus('idle');
    } else {
      onError(validation.error || 'Invalid file');
    }
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

  // Process the document with Python API
  const processDocument = async () => {
    if (!file || disabled) return;

    setStatus('uploading');
    setProgress(0);

    try {
      console.log('📤 Starting document processing with Python API...', {
        filename: file.name,
        size: file.size,
        appraiser_id
      });
      
      // Call Python API with progress tracking
      const result = await documentProcessorService.processDocument(
        file,
        appraiser_id,
        (progressPercent) => {
          console.log(`📊 Progress: ${progressPercent}%`);
          setProgress(progressPercent);
          if (progressPercent >= 90) {
            console.log('🔄 Switching to processing status...');
            setStatus('processing');
          }
        }
      );

      console.log('🎉 Document processing completed successfully:', {
        import_id: result.import_id,
        fields_extracted: result.fields_extracted,
        images_count: result.images_count,
        status: result.processing_status
      });

      setStatus('completed');
      setProgress(100);
      setProcessingResult(result);
      
      console.log('🎯 Calling parent onProcessingComplete handler...');
      onProcessingComplete(result);

    } catch (error) {
      setStatus('error');
      setProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      onError(errorMessage);
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
        return <File className="h-8 w-8 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="h-8 w-8 text-purple-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Egyptian Appraisal Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* File Upload Area */}
        {status === 'idle' && !file && (
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
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Appraisal Document
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <input
              type="file"
              id="document-upload"
              accept={allowedTypes.map(type => `.${type}`).join(',')}
              onChange={handleFileInputChange}
              disabled={disabled}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('document-upload')?.click()}
              disabled={disabled}
            >
              Choose File
            </Button>
            <div className="flex justify-center gap-2 mt-4">
              {allowedTypes.map(type => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type.toUpperCase()}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Maximum file size: {documentProcessorService.formatFileSize(maxFileSize)}
            </p>
          </div>
        )}

        {/* Selected File Display */}
        {file && status === 'idle' && (
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileTypeIcon(file.name)}
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-600">
                      {documentProcessorService.formatFileSize(file.size)}
                    </p>
                    {fileValidation?.isValid && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">Valid file</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetUploader}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={processDocument}
                disabled={disabled || !fileValidation?.isValid}
              >
                Process Document with AI
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {(status === 'uploading' || status === 'processing') && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <p className="font-medium text-blue-900">
                    {status === 'uploading' ? 'Uploading document...' : 'Processing with AI...'}
                  </p>
                  <p className="text-sm text-blue-700">
                    {status === 'uploading' 
                      ? 'Sending file to document processor'
                      : 'Extracting fields and images from Egyptian appraisal'
                    }
                  </p>
                </div>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-blue-600 mt-2">{Math.round(progress)}% complete</p>
            </CardContent>
          </Card>
        )}

        {/* Processing Complete */}
        {status === 'completed' && processingResult && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-green-900">
                  ✅ Document processed successfully!
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
                  <div>
                    <span className="font-medium">Fields extracted:</span> {processingResult.fields_extracted}
                  </div>
                  <div>
                    <span className="font-medium">Images found:</span> {processingResult.images_count}
                  </div>
                  <div>
                    <span className="font-medium">Processing time:</span> {processingResult.processing_time_seconds.toFixed(1)}s
                  </div>
                  <div>
                    <span className="font-medium">AI service:</span> {processingResult.ai_service_used}
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {status === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-red-900">Processing failed</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetUploader}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Processing Statistics (if available) */}
        {processingResult && (
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Average processing time for Egyptian PDFs: ~2 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3" />
              <span>Supports 67+ field extraction with 90%+ accuracy</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}