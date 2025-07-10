
import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Plus, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CameraCapture from './CameraCapture';

interface ReportUploadProps {
  onReportUpload: (files: File[]) => void;
  isLoading?: boolean;
}

const ReportUpload: React.FC<ReportUploadProps> = ({ onReportUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
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

    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isValid) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not supported. Please upload images or PDF files.`,
          variant: "destructive",
        });
      }
      return isValid;
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one medical report or image.",
        variant: "destructive",
      });
      return;
    }
    onReportUpload(uploadedFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = (file: File) => {
    setUploadedFiles(prev => [...prev, file]);
    setShowCamera(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
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
          accept="image/*,.pdf"
          onChange={handleChange}
          multiple
          disabled={isLoading}
        />
        
        <div className="animate-fade-in">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full glass-card flex items-center justify-center">
            <Upload className="w-10 h-10 text-primary" />
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-3">
            Upload Medical Reports
          </h3>
          
          <p className="text-muted-foreground mb-6 text-lg">
            Drag and drop your medical reports here, or click to browse
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
            <Button 
              className="btn-medical flex items-center gap-2" 
              disabled={isLoading}
              onClick={openFileDialog}
            >
              <FileText className="w-5 h-5" />
              Choose Files
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
              Supports PDF, JPG, PNG, WebP up to 10MB each
            </p>
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-6 animate-scale-in">
          <h4 className="text-lg font-semibold mb-4">Uploaded Files ({uploadedFiles.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="glass-card rounded-xl p-4 relative">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-destructive hover:bg-destructive/80"
                  disabled={isLoading}
                >
                  <X className="w-3 h-3" />
                </Button>
                
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button
              onClick={handleAnalyze}
              className="btn-medical hover-lift"
              disabled={isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Reports'}
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

export default ReportUpload;
