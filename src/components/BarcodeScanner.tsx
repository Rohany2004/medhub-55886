import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, CameraOff, RotateCw, ScanLine } from 'lucide-react';

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
  const { toast } = useToast();

  const startScanning = async () => {
    try {
      setError(null);
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
        videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    // Simulate barcode detection (in a real app, you'd use a library like ZXing)
    // For demo purposes, we'll generate a random barcode after a short delay
    setTimeout(() => {
      const mockBarcode = Math.random().toString().substr(2, 12);
      onScanResult(mockBarcode);
      toast({
        title: "Barcode Detected",
        description: `Scanned: ${mockBarcode}`,
      });
    }, 1000);
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
          {!isScanning ? (
            <Button onClick={startScanning} className="btn-medical flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <>
              <Button onClick={captureFrame} className="btn-accent flex-1">
                <ScanLine className="w-4 h-4 mr-2" />
                Scan Now
              </Button>
              <Button onClick={stopScanning} variant="outline">
                <CameraOff className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Position the barcode within the scanning area and tap "Scan Now"
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeScanner;