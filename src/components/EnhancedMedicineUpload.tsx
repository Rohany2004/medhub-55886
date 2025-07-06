
import React, { useState, useRef } from 'react';
import { Upload, Camera, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface EnhancedMedicineUploadProps {
  onImageUpload: (files: File[]) => void;
  isLoading?: boolean;
}

const EnhancedMedicineUpload: React.FC<EnhancedMedicineUploadProps> = ({ onImageUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
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
      if (file.type.startsWith('image/')) {
        return true;
      } else {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image. Please upload image files only.`,
          variant: "destructive",
        });
        return false;
      }
    });

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, { 
          file, 
          url: e.target?.result as string 
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (previews.length === 0) {
      toast({
        title: "No images selected",
        description: "Please upload at least one medicine image.",
        variant: "destructive",
      });
      return;
    }
    onImageUpload(previews.map(p => p.file));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {previews.length === 0 ? (
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
            multiple
            disabled={isLoading}
          />
          
          <div className="animate-fade-in">
            <div className="mx-auto mb-6 w-20 h-20 rounded-full glass-card flex items-center justify-center">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Upload Medicine Photos
            </h3>
            
            <p className="text-muted-foreground mb-6 text-lg">
              Drag and drop multiple medicine images here, or click to browse
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button className="btn-medical flex items-center gap-2" disabled={isLoading}>
                <Camera className="w-5 h-5" />
                Choose Photos
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Supports JPG, PNG, WebP up to 10MB each
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-scale-in">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                Medicine Images ({previews.length})
              </h3>
              <Button
                onClick={openFileDialog}
                variant="outline"
                className="hover-lift flex items-center gap-2"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
                Add More
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="relative overflow-hidden rounded-xl bg-muted">
                    <img
                      src={preview.url}
                      alt={`Medicine ${index + 1}`}
                      className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 p-0 rounded-full bg-destructive/80 hover:bg-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2 truncate">
                    {preview.file.name}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Button
                onClick={handleAnalyze}
                className="btn-medical hover-lift"
                disabled={isLoading}
              >
                {isLoading ? 'Analyzing...' : `Analyze ${previews.length} Image${previews.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
        multiple
        disabled={isLoading}
      />
    </div>
  );
};

export default EnhancedMedicineUpload;
