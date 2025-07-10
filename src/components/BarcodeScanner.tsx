import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, CameraOff, RotateCw, ScanLine } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface BarcodeScannerProps {
  onScanResult: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanResult, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by this browser');
      }

      // Initialize the code reader
      const reader = new BrowserMultiFormatReader();
      setCodeReader(reader);
      
      // Request camera permission and start stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          
          // Start decoding from video stream
          reader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
            if (result) {
              const barcode = result.getText();
              onScanResult(barcode);
              toast({
                title: "Barcode Detected",
                description: `Scanned: ${barcode}`,
              });
              stopScanning();
            }
            if (error && !(error.name === 'NotFoundException')) {
              console.warn('Barcode scanning error:', error);
            }
          });
        };
      }
    } catch (err: any) {
      console.error('Error accessing camera or scanning barcode:', err);
      setIsScanning(false);
      
      let errorMessage = 'Unable to access camera. ';
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported by this browser.';
      } else {
        errorMessage += 'Please check camera permissions and try again.';
      }
      
      setError(errorMessage);
      toast({
        title: "Scanner Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (codeReader) {
      codeReader.reset();
      setCodeReader(null);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const captureFrame = async () => {
    if (!codeReader || !videoRef.current) return;
    
    try {
      const result = await codeReader.decodeFromVideoElement(videoRef.current);
      
      if (result) {
        const barcode = result.getText();
        onScanResult(barcode);
        toast({
          title: "Barcode Detected",
          description: `Scanned: ${barcode}`,
        });
        stopScanning();
      }
    } catch (err) {
      console.error('Error scanning barcode:', err);
      toast({
        title: "Scan Failed",
        description: "No barcode detected. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card className="glass-card w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary" />
          Barcode Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 object-cover rounded-lg bg-muted"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-lg">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Camera not active</p>
              </div>
            </div>
          )}
          
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-primary rounded-lg">
                <div className="w-full h-1 bg-primary animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-center text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={startScanning} className="btn-medical flex-1" disabled={isScanning}>
            <Camera className="w-4 h-4 mr-2" />
            {isScanning ? 'Scanning...' : 'Start Scanning'}
          </Button>
          {isScanning && (
            <Button onClick={stopScanning} variant="outline">
              <CameraOff className="w-4 h-4" />
            </Button>
          )}
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Position the barcode within the camera view. Scanning will happen automatically.
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeScanner;