'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye,
  Shield,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import fileUploadService from '@/lib/services/file-upload-service';
import valifyService from '@/lib/services/valify-service';

interface DocumentUploadProps {
  appraiser_id: string;
  onUploadComplete: (result: any) => void;
  onUploadError: (error: string) => void;
}

export function ValifyDocumentUpload({ 
  appraiser_id, 
  onUploadComplete, 
  onUploadError 
}: DocumentUploadProps) {
  const [documentType, setDocumentType] = useState<'national_id' | 'passport'>('national_id');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // For passport (single image)
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
  const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // For passport
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front'); // For National ID
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelection = (file: File) => {
    // Validate file
    const validation = fileUploadService.validateFile(file, 'document');
    if (!validation.isValid) {
      toast.error(validation.error);
      onUploadError(validation.error || 'Invalid file');
      return;
    }

    if (documentType === 'national_id') {
      // Handle front/back for National ID
      if (currentSide === 'front') {
        setFrontFile(file);
        const url = URL.createObjectURL(file);
        setFrontPreviewUrl(url);
        toast.success('Front side uploaded successfully');
        setCurrentSide('back'); // Move to back side
      } else {
        setBackFile(file);
        const url = URL.createObjectURL(file);
        setBackPreviewUrl(url);
        toast.success('Back side uploaded successfully');
      }
    } else {
      // Handle single image for Passport
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      toast.success('Document selected successfully');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const processDocument = async () => {
    // Validate required files based on document type
    if (documentType === 'national_id') {
      if (!frontFile || !backFile) {
        toast.error('Please upload both front and back sides of your National ID');
        return;
      }
    } else {
      if (!uploadedFile) {
        toast.error('Please select a document first');
        return;
      }
    }

    setIsUploading(true);
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      let uploadResult, ocrResponse;

      if (documentType === 'national_id') {
        // Step 1: Upload both sides to secure storage
        setUploadProgress(25);
        const frontUploadResult = await fileUploadService.uploadIdentityDocument(
          frontFile!,
          appraiser_id,
          'national_id_front'
        );
        
        const backUploadResult = await fileUploadService.uploadIdentityDocument(
          backFile!,
          appraiser_id,
          'national_id_back'
        );

        uploadResult = { front: frontUploadResult, back: backUploadResult };

        // Step 2: Process with Valify OCR
        setUploadProgress(50);
        ocrResponse = await valifyService.processEgyptianNationalID(frontFile!, backFile!, appraiser_id);
      } else {
        // Step 1: Upload passport to secure storage  
        setUploadProgress(25);
        uploadResult = await fileUploadService.uploadIdentityDocument(
          uploadedFile!,
          appraiser_id,
          documentType
        );

        // Step 2: Process with Valify OCR
        setUploadProgress(50);
        ocrResponse = await valifyService.processEgyptianPassport(uploadedFile!, appraiser_id);
      }

      setUploadProgress(75);
      setOcrResult(ocrResponse);

      // Step 3: Complete process
      setUploadProgress(100);
      
      toast.success('Document processed successfully!');
      onUploadComplete({
        uploadResult,
        ocrResponse,
        documentType
      });

    } catch (error: any) {
      console.error('Document processing error:', error);
      toast.error(error.message || 'Failed to process document');
      onUploadError(error.message || 'Processing failed');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const clearSelection = () => {
    setUploadedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setOcrResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCameraDialog = () => {
    cameraInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Identity Document Verification
        </CardTitle>
        <CardDescription>
          Upload your Egyptian National ID or Passport for identity verification
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Document Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Document Type</label>
          <Select value={documentType} onValueChange={(value: 'national_id' | 'passport') => setDocumentType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="national_id">Egyptian National ID</SelectItem>
              <SelectItem value="passport">Egyptian Passport</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Upload Area */}
        {documentType === 'national_id' ? (
          /* National ID - Both sides required */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Side */}
              <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                currentSide === 'front' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}>
                <div className="space-y-3">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                  <h4 className="font-medium">Front Side</h4>
                  {frontFile ? (
                    <div className="space-y-2">
                      <div className="relative w-full h-32 bg-gray-100 rounded">
                        <Image
                          src={frontPreviewUrl!}
                          alt="Front ID preview"
                          className="w-full h-full object-cover rounded"
                          width={200}
                          height={128}
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => { setCurrentSide('front'); openFileDialog(); }}
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Front
                    </Button>
                  )}
                </div>
              </div>

              {/* Back Side */}
              <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                currentSide === 'back' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}>
                <div className="space-y-3">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                  <h4 className="font-medium">Back Side</h4>
                  {backFile ? (
                    <div className="space-y-2">
                      <div className="relative w-full h-32 bg-gray-100 rounded">
                        <Image
                          src={backPreviewUrl!}
                          alt="Back ID preview"
                          className="w-full h-full object-cover rounded"
                          width={200}
                          height={128}
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => { setCurrentSide('back'); openFileDialog(); }}
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      disabled={!frontFile}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Back
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Both front and back sides of your National ID are required
            </p>
          </div>
        ) : (
          /* Passport - Single image */
          !uploadedFile && (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="flex justify-center">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Upload Passport
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Drag and drop your passport here, or click to browse
                  </p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button onClick={openFileDialog} variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Browse Files
                  </Button>
                  <Button onClick={openCameraDialog} variant="outline" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Take Photo
                  </Button>
                </div>

                <p className="text-xs text-gray-400">
                  Supported formats: JPEG, PNG, WebP • Maximum size: 10MB
                </p>
              </div>
            </div>
          )
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* File Preview */}
        {uploadedFile && previewUrl && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="relative w-32 h-24 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={previewUrl}
                    alt="Document preview"
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • {uploadedFile.type}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(previewUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearSelection}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Processing Progress */}
                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Processing document...</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {/* OCR Results */}
                  {ocrResult && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Document Processed</span>
                        <Badge variant={ocrResult.status === 'success' ? 'default' : 'destructive'}>
                          {ocrResult.status}
                        </Badge>
                      </div>
                      
                      {ocrResult.status === 'success' && ocrResult.extracted_data && (
                        <div className="bg-green-50 p-3 rounded-md space-y-1">
                          <p className="text-sm"><strong>Name:</strong> {ocrResult.extracted_data.full_name}</p>
                          <p className="text-sm"><strong>ID Number:</strong> {ocrResult.extracted_data.national_id}</p>
                          <p className="text-sm"><strong>Date of Birth:</strong> {ocrResult.extracted_data.date_of_birth}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-green-700">Confidence Score:</span>
                            <Badge variant="secondary">{ocrResult.confidence_score}%</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {((documentType === 'national_id' && frontFile && backFile) || (documentType === 'passport' && uploadedFile)) && !ocrResult && (
          <div className="flex gap-4">
            <Button 
              onClick={processDocument} 
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Document
                </>
              )}
            </Button>
            <Button variant="outline" onClick={clearSelection}>
              Cancel
            </Button>
          </div>
        )}

        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your documents are encrypted and securely processed. We use industry-standard security 
            measures to protect your personal information.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}