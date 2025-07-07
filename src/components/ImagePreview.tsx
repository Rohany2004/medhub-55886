import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCw, Download, X } from 'lucide-react';

interface ImagePreviewProps {
  images: string[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  images, 
  currentIndex = 0, 
  onIndexChange,
  className = ''
}) => {
  const [selectedImage, setSelectedImage] = useState(currentIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleImageSelect = (index: number) => {
    setSelectedImage(index);
    onIndexChange?.(index);
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => prev + 90);

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `medicine-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (images.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative group cursor-pointer">
            <img
              src={images[selectedImage]}
              alt={`Medicine ${selectedImage + 1}`}
              className="w-full h-64 object-cover rounded-lg transition-transform hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
          </div>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <div className="relative h-full bg-black/90 rounded-lg overflow-hidden">
            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRotate}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => downloadImage(images[selectedImage], selectedImage)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            {/* Main Image */}
            <div className="h-full flex items-center justify-center p-4">
              <img
                src={images[selectedImage]}
                alt={`Medicine ${selectedImage + 1}`}
                className="max-w-full max-h-full object-contain transition-all duration-300"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`
                }}
              />
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex gap-2 bg-black/60 p-2 rounded-lg">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageSelect(index)}
                      className={`w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                        index === selectedImage 
                          ? 'border-primary scale-110' 
                          : 'border-white/30 hover:border-white/60'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageSelect(index)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedImage 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagePreview;