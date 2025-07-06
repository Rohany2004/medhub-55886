import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import MedicineUpload from '@/components/MedicineUpload';
import MedicineResults from '@/components/MedicineResults';
import { FileText, Camera, Upload } from 'lucide-react';

type AppState = 'home' | 'upload' | 'results';

interface MedicineInfo {
  name?: string;
  generic_name?: string;
  manufacturer?: string;
  composition?: string[];
  uses?: string[];
  dosage?: string;
  side_effects?: string[];
  warnings?: string[];
  storage?: string;
  prescription_required?: boolean;
}

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [medicineInfo, setMedicineInfo] = useState<MedicineInfo | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const { toast } = useToast();

  const handleGetStarted = () => {
    setCurrentState('upload');
  };

  const handleHome = () => {
    setCurrentState('home');
    setMedicineInfo(null);
    setUploadedImageUrl('');
  };

  const handleNewUpload = () => {
    setCurrentState('upload');
    setMedicineInfo(null);
    setUploadedImageUrl('');
  };

  const analyzeMedicineWithSupabase = async (imageBase64: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('analyze-medicine', {
        body: { imageBase64 }
      });

      if (error) throw error;
      return data.medicineInfo;
    } catch (error) {
      console.error('Medicine analysis error:', error);
      throw error;
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsAnalyzing(true);
    setCurrentState('results');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        setUploadedImageUrl(base64);

        try {
          const result = await analyzeMedicineWithSupabase(base64Data);
          setMedicineInfo(result);
          
          toast({
            title: "Analysis Complete",
            description: "Medicine information has been successfully identified.",
          });
        } catch (error) {
          console.error('Analysis error:', error);
          toast({
            title: "Analysis Failed",
            description: "Unable to analyze the medicine. Please try again with a clearer image.",
            variant: "destructive",
          });
          
          setCurrentState('upload');
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setIsAnalyzing(false);
      setCurrentState('upload');
      
      toast({
        title: "Upload Failed",
        description: "Failed to upload the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation 
        onHome={handleHome}
        onNewUpload={handleNewUpload}
        showBackButton={currentState !== 'home'}
      />
      
      <div className="pt-16">
        {currentState === 'home' && (
          <div>
            <HeroSection onGetStarted={handleGetStarted} />
            
            {/* New Features Section */}
            <div className="py-16 px-4 bg-gradient-to-b from-background to-muted/20">
              <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">Explore Our Features</h2>
                <p className="text-muted-foreground mb-12">
                  Comprehensive medical analysis tools at your fingertips
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="glass-card p-6 rounded-xl hover-lift">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">MedExplain</h3>
                    <p className="text-muted-foreground mb-4">
                      Transform complex medical reports into simple, understandable insights with AI-powered analysis.
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/medexplain'}
                      className="btn-medical w-full"
                    >
                      Try MedExplain
                    </Button>
                  </div>
                  
                  <div className="glass-card p-6 rounded-xl hover-lift">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Single Medicine</h3>
                    <p className="text-muted-foreground mb-4">
                      Identify and analyze individual medicine photos for detailed information and usage guidelines.
                    </p>
                    <Button 
                      onClick={handleGetStarted}
                      className="btn-accent w-full"
                    >
                      Analyze Medicine
                    </Button>
                  </div>
                  
                  <div className="glass-card p-6 rounded-xl hover-lift">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Multiple Medicines</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload and analyze multiple medicine photos at once for comprehensive medication review.
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/multiple-medicines'}
                      className="bg-success hover:bg-success/90 text-white w-full"
                    >
                      Analyze Multiple
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentState === 'upload' && (
          <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-4xl">
              <div className="text-center mb-12 animate-fade-in">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  Upload Medicine Photo
                </h1>
                <p className="text-xl text-muted-foreground">
                  Take or upload a clear photo of your medicine for instant identification
                </p>
              </div>
              
              <MedicineUpload 
                onImageUpload={handleImageUpload} 
                isLoading={isAnalyzing}
              />
            </div>
          </div>
        )}

        {currentState === 'results' && (
          <div className="min-h-screen px-4 py-12">
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Medicine Analysis Results
              </h1>
              <p className="text-xl text-muted-foreground">
                Detailed information about your medicine
              </p>
            </div>
            
            <MedicineResults 
              medicineInfo={medicineInfo}
              isLoading={isAnalyzing}
              uploadedImage={uploadedImageUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
