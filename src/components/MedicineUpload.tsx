import React, { useState, useRef } from 'react';
import { Upload, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CameraCapture from './CameraCapture';

interface MedicineUploadProps {
  onImageUpload: (file: File) => void;
  isLoading?: boolean;
}

const MedicineUpload: React.FC<MedicineUploadProps> = ({ onImageUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      onImageUpload(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = (file: File) => {
    handleFile(file);
    setShowCamera(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!preview ? (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-primary bg-primary/5 scale-105' 
              : 'border-border hover:border-primary/50 hover:bg-primary/5'
          } ${isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={isLoading}
          />
          
          <div className="animate-fade-in">
            <div className="mx-auto mb-6 w-20 h-20 rounded-full glass-card flex items-center justify-center">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Upload Medicine Photo
            </h3>
            
            <p className="text-muted-foreground mb-6 text-lg">
              Drag and drop your medicine image here, or click to browse
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                className="btn-medical flex items-center gap-2" 
                disabled={isLoading}
                onClick={openFileDialog}
              >
                <Upload className="w-5 h-5" />
                Choose Photo
              </Button>
              
              <Button 
                className="btn-accent flex items-center gap-2" 
                disabled={isLoading}
                onClick={() => setShowCamera(true)}
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Supports JPG, PNG, WebP up to 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-scale-in">
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="relative inline-block mb-4">
              <img
                src={preview}
                alt="Medicine preview"
                className="max-w-full max-h-64 rounded-xl shadow-lg object-contain"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Image Ready for Analysis
            </h3>
            
            <p className="text-muted-foreground mb-4">
              Your medicine photo has been uploaded successfully
            </p>
            
            <Button
              onClick={openFileDialog}
              variant="outline"
              className="hover-lift"
              disabled={isLoading}
            >
              Choose Different Photo
            </Button>
          </div>
        </div>
      )}
      
      <CameraCapture
        isOpen={showCamera}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    </div>
  );
};

export default MedicineUpload;