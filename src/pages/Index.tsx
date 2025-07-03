import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import MedicineUpload from '@/components/MedicineUpload';
import MedicineResults from '@/components/MedicineResults';

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
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
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

  const analyzeMedicineWithGemini = async (imageBase64: string, userApiKey: string) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${userApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Analyze this medicine image and provide detailed information in JSON format. Include: name, generic_name, manufacturer, composition (array), uses (array), dosage, side_effects (array), warnings (array), storage, prescription_required (boolean). If you cannot identify the medicine clearly, return null for unknown fields. Be accurate and only provide information you're confident about.`
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (textResponse) {
        // Try to extract JSON from the response
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      throw new Error('No valid response from Gemini API');
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  };

  const handleImageUpload = async (file: File) => {
    // Show API key input if not provided
    if (!apiKey) {
      setShowApiKeyInput(true);
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key to analyze the medicine. For production use, consider connecting to Supabase for secure API key management.",
      });
      return;
    }

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
          const result = await analyzeMedicineWithGemini(base64Data, apiKey);
          setMedicineInfo(result);
          
          toast({
            title: "Analysis Complete",
            description: "Medicine information has been successfully identified.",
          });
        } catch (error) {
          console.error('Analysis error:', error);
          toast({
            title: "Analysis Failed",
            description: "Unable to analyze the medicine. Please try again with a clearer image or check your API key.",
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

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      setShowApiKeyInput(false);
      toast({
        title: "API Key Set",
        description: "You can now upload and analyze medicine images.",
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
          <HeroSection onGetStarted={handleGetStarted} />
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
              
              {showApiKeyInput && (
                <div className="glass-card rounded-2xl p-8 mb-8 animate-scale-in">
                  <h3 className="text-xl font-semibold mb-4">Enter Gemini API Key</h3>
                  <p className="text-muted-foreground mb-4">
                    To analyze medicine images, please enter your Gemini API key. 
                    <a 
                      href="https://makersuite.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline ml-1"
                    >
                      Get your API key here
                    </a>
                  </p>
                  <div className="flex gap-4">
                    <input
                      type="password"
                      placeholder="Enter your Gemini API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-background"
                    />
                    <Button onClick={handleApiKeySubmit} className="btn-medical">
                      Set API Key
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Note: For production apps, consider using Supabase integration for secure API key management.
                  </p>
                </div>
              )}
              
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
