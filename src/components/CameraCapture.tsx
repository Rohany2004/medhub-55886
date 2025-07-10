import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  isOpen: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported by this browser.';
      } else {
        errorMessage += 'Please check camera permissions and try again.';
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setCapturedImage(null);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
  }, []);

  const confirmCapture = useCallback(() => {
    if (!capturedImage || !canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onCapture(file);
        stopCamera();
        onClose();
      }
    }, 'image/jpeg', 0.8);
  }, [capturedImage, onCapture, onClose, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    stopCamera();
    setTimeout(() => startCamera(), 100);
  }, [startCamera, stopCamera]);

  React.useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
        
        <h2 className="text-white font-semibold">Take Photo</h2>
        
        <Button
          onClick={switchCamera}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          disabled={!isStreaming}
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative flex items-center justify-center">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-w-full max-h-full object-contain"
          />
        )}
        
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Loading overlay */}
        {!isStreaming && !capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Camera className="w-12 h-12 mx-auto mb-4 animate-pulse" />
              <p>Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/80">
        {capturedImage ? (
          <div className="flex justify-center gap-4">
            <Button
              onClick={retakePhoto}
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/20"
            >
              Retake
            </Button>
            <Button
              onClick={confirmCapture}
              size="lg"
              className="btn-medical"
            >
              <Check className="w-5 h-5 mr-2" />
              Use Photo
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              onClick={capturePhoto}
              size="lg"
              disabled={!isStreaming}
              className="w-20 h-20 rounded-full bg-white hover:bg-white/90 text-black"
            >
              <Camera className="w-8 h-8" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;