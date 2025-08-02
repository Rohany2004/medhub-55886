import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ImageIcon, 
  ZoomIn, 
  ExternalLink, 
  Heart, 
  Brain, 
  Zap, 
  Eye,
  Loader2 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface MedicalImage {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  annotations?: string[];
  learnMoreUrl?: string;
}

interface MedicalImageDisplayProps {
  reportText: string;
  language: string;
}

// Simulated medical image database
const medicalImagesDatabase: MedicalImage[] = [
  {
    id: 'heart-anatomy',
    title: 'Heart Anatomy',
    description: 'Detailed view of cardiac structures and chambers',
    category: 'cardiovascular',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
    annotations: ['Left ventricle', 'Right atrium', 'Aorta', 'Pulmonary artery'],
    learnMoreUrl: '#'
  },
  {
    id: 'brain-mri',
    title: 'Brain MRI Cross-section',
    description: 'Normal brain anatomy as seen in MRI imaging',
    category: 'neurological',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
    annotations: ['Cerebral cortex', 'White matter', 'Ventricles'],
    learnMoreUrl: '#'
  },
  {
    id: 'lung-xray',
    title: 'Chest X-ray',
    description: 'Normal chest radiograph showing lung fields',
    category: 'respiratory',
    imageUrl: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=400&h=300&fit=crop',
    annotations: ['Right lung', 'Left lung', 'Heart shadow', 'Diaphragm'],
    learnMoreUrl: '#'
  },
  {
    id: 'liver-ultrasound',
    title: 'Liver Ultrasound',
    description: 'Ultrasound imaging of liver structure',
    category: 'gastroenterology',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
    annotations: ['Liver parenchyma', 'Portal vein', 'Hepatic artery'],
    learnMoreUrl: '#'
  },
  {
    id: 'kidney-ct',
    title: 'Kidney CT Scan',
    description: 'CT imaging showing kidney anatomy',
    category: 'urology',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
    annotations: ['Renal cortex', 'Renal medulla', 'Renal pelvis'],
    learnMoreUrl: '#'
  }
];

// Keywords mapping to detect relevant medical images
const keywordMapping = {
  cardiovascular: ['heart', 'cardiac', 'coronary', 'aorta', 'ventricle', 'atrium', 'ecg', 'ekg', 'chest pain'],
  neurological: ['brain', 'neural', 'neurological', 'cerebral', 'headache', 'migraine', 'stroke', 'mri brain'],
  respiratory: ['lung', 'pulmonary', 'respiratory', 'breathing', 'chest', 'pneumonia', 'bronchi', 'x-ray chest'],
  gastroenterology: ['liver', 'stomach', 'gastric', 'intestinal', 'digestive', 'hepatic', 'abdomen', 'ultrasound abdomen'],
  urology: ['kidney', 'renal', 'urinary', 'bladder', 'urological', 'ct abdomen']
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'cardiovascular': return <Heart className="w-5 h-5" />;
    case 'neurological': return <Brain className="w-5 h-5" />;
    case 'respiratory': return <Zap className="w-5 h-5" />;
    default: return <Eye className="w-5 h-5" />;
  }
};

const MedicalImageDisplay: React.FC<MedicalImageDisplayProps> = ({ reportText, language }) => {
  const [relevantImages, setRelevantImages] = useState<MedicalImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectRelevantImages = () => {
      setIsLoading(true);
      const lowerText = reportText.toLowerCase();
      const foundImages: MedicalImage[] = [];

      // Check for keywords in the report text
      Object.entries(keywordMapping).forEach(([category, keywords]) => {
        const hasKeyword = keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
        if (hasKeyword) {
          const categoryImages = medicalImagesDatabase.filter(img => img.category === category);
          foundImages.push(...categoryImages);
        }
      });

      // Remove duplicates and limit to 4 images
      const uniqueImages = foundImages.filter((img, index, self) => 
        index === self.findIndex(i => i.id === img.id)
      ).slice(0, 4);

      // If no specific matches, show a default anatomical image
      if (uniqueImages.length === 0) {
        uniqueImages.push(medicalImagesDatabase[0]); // Default to heart anatomy
      }

      setTimeout(() => {
        setRelevantImages(uniqueImages);
        setIsLoading(false);
      }, 1000); // Simulate processing time
    };

    if (reportText) {
      detectRelevantImages();
    }
  }, [reportText]);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Medical Illustrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Finding relevant medical images...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relevantImages.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Medical Illustrations
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Visual references related to your report findings
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {relevantImages.map((image) => (
            <div key={image.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-video bg-muted">
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {getCategoryIcon(image.category)}
                    <span className="capitalize">{image.category}</span>
                  </Badge>
                </div>
              </div>
              
              <div className="p-3">
                <h4 className="font-semibold text-sm mb-1">{image.title}</h4>
                <p className="text-xs text-muted-foreground mb-3">{image.description}</p>
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-1">
                        <ZoomIn className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>{image.title}</DialogTitle>
                        <DialogDescription>{image.description}</DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <img
                          src={image.imageUrl}
                          alt={image.title}
                          className="w-full rounded-lg"
                        />
                        {image.annotations && (
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">Key Structures:</h4>
                            <div className="flex flex-wrap gap-2">
                              {image.annotations.map((annotation, index) => (
                                <Badge key={index} variant="outline">
                                  {annotation}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {image.learnMoreUrl && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={image.learnMoreUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> These images are for educational purposes only and may not represent your specific condition. 
            Consult your healthcare provider for personalized medical interpretation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicalImageDisplay;