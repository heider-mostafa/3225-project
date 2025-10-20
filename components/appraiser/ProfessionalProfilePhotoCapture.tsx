'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Camera, 
  User, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Eye,
  Shield,
  Loader2,
  Wand2,
  Image as ImageIcon,
  Sparkles,
  Sun,
  Palette,
  Shirt,
  X,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import openaiHeadshotService, { HeadshotStyle } from '@/lib/services/openai-headshot-service';

interface ProfessionalProfilePhotoCaptureProps {
  appraiser_id: string;
  isOpen: boolean;
  onClose: () => void;
  onPhotoUpdated: (photoUrl: string, metadata: any) => void;
  currentPhotoUrl?: string;
}

type CaptureStep = 'instructions' | 'camera_setup' | 'capturing' | 'photo_preview' | 'style_selection' | 'generating' | 'result_preview' | 'complete';

export function ProfessionalProfilePhotoCapture({ 
  appraiser_id, 
  isOpen,
  onClose,
  onPhotoUpdated,
  currentPhotoUrl
}: ProfessionalProfilePhotoCaptureProps) {
  const [currentStep, setCurrentStep] = useState<CaptureStep>('instructions');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [generatedHeadshots, setGeneratedHeadshots] = useState<any[]>([]);
  const [selectedHeadshot, setSelectedHeadshot] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState<Partial<HeadshotStyle>>({
    background: 'corporate_blue',
    attire: 'business_suit',
    lighting: 'soft_professional',
  });
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceGuideRef = useRef<HTMLDivElement>(null);

  // Cleanup stream on unmount or close
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setCurrentStep('instructions');
      setCapturedImage(null);
      setCapturedBlob(null);
      setGeneratedHeadshots([]);
      setSelectedHeadshot(null);
      setProcessingProgress(0);
      setIsVideoReady(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  }, [isOpen, stream]);

  // Effect to assign stream to video element when both are ready
  useEffect(() => {
    if (stream && videoRef.current && currentStep === 'capturing') {
      console.log('🔄 Stream and video element ready, assigning...');
      
      const video = videoRef.current;
      
      // Add event listeners for debugging
      const handleLoadedMetadata = () => {
        console.log('✅ Video metadata loaded:', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          duration: video.duration,
          readyState: video.readyState
        });
      };
      
      const handleCanPlay = () => {
        console.log('✅ Video can play, attempting to play...');
        video.play().catch(e => {
          console.error('❌ Video play on canplay failed:', e);
        });
      };
      
      const handlePlay = () => {
        console.log('▶️ Video started playing successfully');
        setIsVideoReady(true);
      };
      
      const handleLoadedData = () => {
        console.log('📺 Video data loaded, forcing play...');
        video.play().catch(e => {
          console.error('❌ Video play on loadeddata failed:', e);
        });
      };
      
      const handleError = (e: any) => {
        console.error('❌ Video error:', e);
        console.error('Video error details:', {
          error: video.error,
          networkState: video.networkState,
          readyState: video.readyState
        });
      };
      
      const handleStalled = () => {
        console.warn('⚠️ Video stalled, retrying...');
        video.load();
      };
      
      // Add all event listeners before setting srcObject
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('play', handlePlay);
      video.addEventListener('error', handleError);
      video.addEventListener('stalled', handleStalled);
      
      // Set video properties for better compatibility
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      
      // Assign stream AFTER event listeners are set
      video.srcObject = stream;
      
      // Force load and play with retries
      const forcePlayWithRetry = (retries = 3) => {
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            video.play().catch(e => {
              console.error(`❌ Force play attempt failed (${4 - retries} retries left):`, e);
              if (retries > 0) {
                forcePlayWithRetry(retries - 1);
              }
            });
          } else if (retries > 0) {
            console.log('🔄 Video not ready, retrying...');
            forcePlayWithRetry(retries - 1);
          }
        }, 200);
      };
      
      forcePlayWithRetry();
      
      // Cleanup event listeners
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('stalled', handleStalled);
      };
    }
  }, [stream, currentStep]);

  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      console.log('📡 Got media stream:', mediaStream);
      console.log('📹 Video tracks:', mediaStream.getVideoTracks());
      
      // Check if video tracks are active
      const videoTracks = mediaStream.getVideoTracks();
      videoTracks.forEach((track, index) => {
        console.log(`Track ${index}:`, {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings()
        });
      });
      
      setStream(mediaStream);
      setIsVideoReady(false);
      console.log('📺 Stream set, waiting for video element...');
      
      setCurrentStep('capturing');
    } catch (error: any) {
      console.error('❌ Camera access error:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const capturePhoto = useCallback(() => {
    console.log('📸 Attempting to capture photo...');
    
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Video or canvas ref not available');
      toast.error('Camera not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('❌ Canvas context not available');
      return;
    }

    // Check video dimensions
    console.log('📺 Video dimensions:', {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      currentTime: video.currentTime
    });

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('❌ Video has no dimensions - not ready for capture');
      toast.error('Video not ready. Please wait a moment and try again.');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    console.log('🖼️ Canvas dimensions set:', {
      width: canvas.width,
      height: canvas.height
    });

    // Draw the video frame to canvas
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log('✅ Drew video frame to canvas');
      
      // Get image data to verify it's not black
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Check if image is mostly black (simple check)
      let nonBlackPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 10 || g > 10 || b > 10) {
          nonBlackPixels++;
        }
      }
      
      const totalPixels = data.length / 4;
      const nonBlackPercentage = (nonBlackPixels / totalPixels) * 100;
      console.log(`🎨 Non-black pixels: ${nonBlackPercentage.toFixed(2)}%`);
      
      if (nonBlackPercentage < 5) {
        console.warn('⚠️ Image appears to be mostly black');
        toast.error('Camera image appears black. Please check camera permissions and try again.');
        return;
      }

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          console.log('✅ Photo captured successfully, size:', blob.size, 'bytes');
          
          setCapturedBlob(blob);
          setCapturedImage(dataUrl);
          
          // Stop camera stream
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
          }
          
          setCurrentStep('photo_preview');
          toast.success('Photo captured! Review your image.');
        } else {
          console.error('❌ Failed to create blob from canvas');
          toast.error('Failed to capture photo. Please try again.');
        }
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('❌ Error drawing video to canvas:', error);
      toast.error('Failed to capture photo. Please try again.');
    }
  }, [stream]);

  const retakePhoto = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  };

  const processPhoto = async () => {
    if (!capturedBlob || !capturedImage) {
      toast.error('No photo to process');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('generating');
    setProcessingProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 8;
        });
      }, 800);

      // Step 1: Upload photo directly to storage (bypass Valify verification)
      setProcessingProgress(15);
      toast.info('📸 Uploading photo for AI processing...');
      
      console.log('🔍 DEBUG: Starting photo upload for headshot generation...');
      console.log('📋 Appraiser ID:', appraiser_id);
      console.log('📁 Captured blob size:', capturedBlob?.size, 'bytes');
      console.log('📁 Captured blob type:', capturedBlob?.type);
      
      // Convert blob to File object
      const photoFile = new File([capturedBlob], 'profile-photo.jpg', { type: 'image/jpeg' });
      
      // Upload using server-side endpoint with proper permissions
      const formData = new FormData();
      formData.append('file', photoFile);
      formData.append('appraiser_id', appraiser_id);
      
      const uploadResponse = await fetch('/api/upload-headshot', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      const originalPhotoUrl = uploadResult.publicUrl;
      console.log('📸 Original photo uploaded:', originalPhotoUrl);

      // Step 2: Generate professional headshot
      setProcessingProgress(40);
      toast.info('🎨 Analyzing facial features...');

      const fullStyle: HeadshotStyle = {
        model: 'dall-e-3',
        size: '1024x1024',
        quality: 'hd',
        style: 'natural',
        ...selectedStyle,
      } as HeadshotStyle;

      const headshotResponse = await fetch('/api/headshots/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appraiser_id,
          original_image_url: originalPhotoUrl,
          style_preferences: fullStyle
        })
      });

      if (!headshotResponse.ok) {
        throw new Error('Failed to generate professional headshot');
      }

      const headshotResult = await headshotResponse.json();
      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (headshotResult.success) {
        // Transform API response to match component expectations
        const headshot = {
          headshot_url: headshotResult.headshot?.url,
          generation_details: headshotResult.generation_details,
          path: headshotResult.headshot?.path,
          filename: headshotResult.headshot?.filename
        };
        
        setGeneratedHeadshots([headshot]);
        setSelectedHeadshot(headshot);
        setCurrentStep('result_preview');
        toast.success('✨ Professional headshot generated successfully!');
      } else {
        throw new Error(headshotResult.error || 'Generation failed');
      }

    } catch (error: any) {
      console.error('Photo processing error:', error);
      toast.error('Failed to process photo: ' + error.message);
      setCurrentStep('photo_preview'); // Go back to allow retry
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmSelection = async () => {
    if (!selectedHeadshot) {
      toast.error('No headshot selected');
      return;
    }

    try {
      console.log('🔄 Updating appraiser profile with enhanced headshot...');
      console.log('📸 Selected headshot URL:', selectedHeadshot.headshot_url);
      console.log('👤 Appraiser ID:', appraiser_id);
      
      // Update appraiser profile with new headshot
      const updateResponse = await fetch(`/api/brokers/${appraiser_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_headshot_url: selectedHeadshot.headshot_url
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile photo');
      }

      onPhotoUpdated(selectedHeadshot.headshot_url, selectedHeadshot);
      setCurrentStep('complete');
      toast.success('Profile photo updated successfully!');
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile: ' + error.message);
    }
  };

  const renderInstructions = () => (
    <div className="text-center space-y-4">
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-white" />
      </div>
      <h3 className="text-xl font-semibold">AI Professional Headshot</h3>
      <p className="text-gray-600 max-w-md mx-auto">
        Take a selfie and our AI will transform it into a professional, uniform headshot for your appraiser profile.
      </p>
      
      <div className="bg-blue-50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-blue-900">📸 Photo Guidelines:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Face the camera directly with good lighting</li>
          <li>• Keep your head inside the oval guide</li>
          <li>• Use natural expression with slight smile</li>
          <li>• Avoid shadows on your face</li>
          <li>• Plain background works best</li>
        </ul>
      </div>

      <Button onClick={startCamera} className="flex items-center gap-2">
        <Camera className="w-4 h-4" />
        Start Camera
      </Button>
    </div>
  );

  const renderCamera = () => (
    <div className="relative">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-80 object-cover"
          style={{ backgroundColor: '#000' }}
          onLoadedData={() => console.log('📺 Video data loaded')}
          onPlaying={() => console.log('▶️ Video playing')}
          onTimeUpdate={() => console.log('🕐 Video time update - playing')}
          onCanPlayThrough={() => console.log('✅ Video can play through')}
        />
        
        {/* Loading Overlay */}
        {!isVideoReady && stream && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading camera...</p>
            </div>
          </div>
        )}
        
        {/* Face Guide Overlay */}
        {isVideoReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              ref={faceGuideRef}
              className="w-48 h-60 border-4 border-white/60 rounded-full flex items-center justify-center"
              style={{
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)'
              }}
            >
              <span className="text-white/80 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                Center your face here
              </span>
            </div>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="mt-4 text-center space-y-3">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-sm text-green-800">
            💡 <strong>Perfect lighting tip:</strong> Face a window or bright light source
          </p>
        </div>
        
        {/* Debug info */}
        {videoRef.current && (
          <div className="bg-gray-100 rounded p-2 text-xs text-gray-600">
            <p>Video: {videoRef.current.videoWidth}x{videoRef.current.videoHeight}</p>
            <p>Ready State: {videoRef.current.readyState} ({
              videoRef.current.readyState === 0 ? 'HAVE_NOTHING' :
              videoRef.current.readyState === 1 ? 'HAVE_METADATA' :
              videoRef.current.readyState === 2 ? 'HAVE_CURRENT_DATA' :
              videoRef.current.readyState === 3 ? 'HAVE_FUTURE_DATA' :
              videoRef.current.readyState === 4 ? 'HAVE_ENOUGH_DATA' : 'UNKNOWN'
            })</p>
            <p>Current Time: {videoRef.current.currentTime.toFixed(2)}s</p>
            <p>Paused: {videoRef.current.paused}</p>
            <p>Stream: {stream ? 'Active' : 'None'}</p>
          </div>
        )}
        
        <div className="flex justify-center gap-3">
          <Button 
            onClick={capturePhoto} 
            size="lg" 
            className="flex items-center gap-2"
            disabled={!isVideoReady || !stream}
          >
            <Camera className="w-5 h-5" />
            {isVideoReady ? 'Capture Photo' : 'Loading Camera...'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPhotoPreview = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Review Your Photo</h3>
        <p className="text-gray-600 text-sm">Make sure you're happy with this photo before processing</p>
      </div>
      
      <div className="flex justify-center">
        <div className="relative">
          {capturedImage && (
            <img 
              src={capturedImage} 
              alt="Captured selfie"
              className="w-64 h-64 object-cover rounded-lg border-2 border-gray-200"
            />
          )}
        </div>
      </div>

      {/* Style Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Professional Style
          </CardTitle>
          <CardDescription>Choose the style for your professional headshot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Background</label>
              <Select 
                value={selectedStyle.background} 
                onValueChange={(value) => setSelectedStyle(prev => ({ ...prev, background: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corporate_blue">Corporate Blue</SelectItem>
                  <SelectItem value="professional_white">Professional White</SelectItem>
                  <SelectItem value="neutral_gray">Neutral Gray</SelectItem>
                  <SelectItem value="warm_beige">Warm Beige</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Attire</label>
              <Select 
                value={selectedStyle.attire} 
                onValueChange={(value) => setSelectedStyle(prev => ({ ...prev, attire: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_suit">Business Suit</SelectItem>
                  <SelectItem value="professional_shirt">Professional Shirt</SelectItem>
                  <SelectItem value="smart_casual">Smart Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center gap-3">
        <Button onClick={processPhoto} className="flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          Generate Professional Photo
        </Button>
        <Button variant="outline" onClick={retakePhoto} className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Retake
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto">
        <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Creating Your Professional Headshot</h3>
        <p className="text-gray-600">AI is analyzing your features and generating a professional photo...</p>
      </div>
      
      <div className="space-y-2">
        <Progress value={processingProgress} className="w-full max-w-md mx-auto" />
        <p className="text-sm text-gray-500">{processingProgress}% complete</p>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Your Professional Headshots</h3>
        <p className="text-gray-600 text-sm">Select your preferred professional photo</p>
      </div>
      
      {generatedHeadshots.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {generatedHeadshots.map((headshot, index) => (
            <div 
              key={index}
              className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                selectedHeadshot?.headshot_url === headshot.headshot_url 
                  ? 'border-blue-500 ring-2 ring-blue-500/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedHeadshot(headshot)}
            >
              <img 
                src={headshot.headshot_url} 
                alt={`Professional headshot option ${index + 1}`}
                className="w-full h-48 object-cover"
              />
              {selectedHeadshot?.headshot_url === headshot.headshot_url && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-6 h-6 text-blue-500 bg-white rounded-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {selectedHeadshot && (
        <Alert>
          <Sparkles className="w-4 h-4" />
          <AlertDescription>
            Perfect! This professional headshot maintains your natural features while providing a uniform, professional appearance.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-center gap-3">
        <Button onClick={confirmSelection} disabled={!selectedHeadshot} className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Use This Photo
        </Button>
        <Button variant="outline" onClick={() => setCurrentStep('photo_preview')}>
          Back to Photo
        </Button>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-semibold">Profile Photo Updated!</h3>
      <p className="text-gray-600">Your professional headshot has been set as your profile photo.</p>
      
      {selectedHeadshot && (
        <div className="flex justify-center">
          <img 
            src={selectedHeadshot.headshot_url} 
            alt="Final professional headshot"
            className="w-32 h-32 object-cover rounded-full border-4 border-green-500"
          />
        </div>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'instructions': return renderInstructions();
      case 'capturing': return renderCamera();
      case 'photo_preview': return renderPhotoPreview();
      case 'generating': return renderProcessing();
      case 'result_preview': return renderResults();
      case 'complete': return renderComplete();
      default: return renderInstructions();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            AI Professional Profile Photo
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { ProfessionalProfilePhotoCaptureProps };