
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import EnhancedMedicineUpload from '@/components/EnhancedMedicineUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, AlertTriangle, Info } from 'lucide-react';

type MultipleMedicinesState = 'upload' | 'results';

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

interface AnalysisResult {
  index: number;
  result?: MedicineInfo;
  error?: string;
}

const MultipleMedicines = () => {
  const [currentState, setCurrentState] = useState<MultipleMedicinesState>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const { toast } = useToast();

  const handleHome = () => {
    setCurrentState('upload');
    setAnalysisResults([]);
    setUploadedImages([]);
  };

  const handleNewUpload = () => {
    setCurrentState('upload');
    setAnalysisResults([]);
    setUploadedImages([]);
  };

  const analyzeMultipleMedicinesWithSupabase = async (files: File[]) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Convert files to base64
      const imagesData = await Promise.all(
        files.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target?.result as string;
              const base64Data = base64.split(',')[1];
              resolve(base64Data);
            };
            reader.readAsDataURL(file);
          });
        })
      );

      const { data, error } = await supabase.functions.invoke('analyze-multiple-medicines', {
        body: { images: imagesData }
      });

      if (error) throw error;
      return data.results;
    } catch (error) {
      console.error('Multiple medicines analysis error:', error);
      throw error;
    }
  };

  const handleImageUpload = async (files: File[]) => {
    setIsAnalyzing(true);
    setCurrentState('results');

    try {
      // Store image URLs for display
      const imageUrls = await Promise.all(
        files.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        })
      );
      setUploadedImages(imageUrls);

      const results = await analyzeMultipleMedicinesWithSupabase(files);
      setAnalysisResults(results);
      
      const successCount = results.filter((r: AnalysisResult) => !r.error).length;
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${successCount} out of ${files.length} medicine images.`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the medicines. Please try again with clearer images.",
        variant: "destructive",
      });
      
      setCurrentState('upload');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation 
        onHome={handleHome}
        onNewUpload={handleNewUpload}
        showBackButton={true}
      />
      
      <div className="pt-16">
        {currentState === 'upload' && (
          <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-4xl">
              <div className="text-center mb-12 animate-fade-in">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  Analyze Multiple Medicines
                </h1>
                <p className="text-xl text-muted-foreground">
                  Upload multiple medicine photos for comprehensive analysis
                </p>
              </div>
              
              <EnhancedMedicineUpload 
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
                Detailed information about your medicines
              </p>
            </div>

            {isAnalyzing ? (
              <div className="text-center py-12">
                <div className="animate-pulse-slow">
                  <Pill className="w-16 h-16 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-semibold">Analyzing Multiple Medicines...</h3>
                  <p className="text-muted-foreground mt-2">
                    Processing {uploadedImages.length} medicine images...
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {analysisResults.map((result, index) => (
                    <Card key={index} className="glass-card overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {uploadedImages[result.index] && (
                              <img
                                src={uploadedImages[result.index]}
                                alt={`Medicine ${result.index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <CardTitle className="text-lg">
                                Medicine {result.index + 1}
                              </CardTitle>
                              {result.error ? (
                                <Badge variant="destructive" className="mt-1">
                                  Analysis Failed
                                </Badge>
                              ) : (
                                <Badge className="mt-1 bg-success text-success-foreground">
                                  Analysis Complete
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        {result.error ? (
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            <span>{result.error}</span>
                          </div>
                        ) : result.result ? (
                          <div className="space-y-4">
                            {/* Basic Info */}
                            <div>
                              <h4 className="font-semibold text-primary mb-2">Basic Information</h4>
                              <div className="space-y-1 text-sm">
                                <p><strong>Name:</strong> {result.result.name || 'Not identified'}</p>
                                <p><strong>Generic:</strong> {result.result.generic_name || 'Not available'}</p>
                                <p><strong>Manufacturer:</strong> {result.result.manufacturer || 'Not identified'}</p>
                                <p><strong>Prescription Required:</strong> {result.result.prescription_required ? 'Yes' : 'No'}</p>
                              </div>
                            </div>

                            {/* Composition */}
                            {result.result.composition && result.result.composition.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-primary mb-2">Composition</h4>
                                <div className="flex flex-wrap gap-1">
                                  {result.result.composition.map((comp, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {comp}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Uses */}
                            {result.result.uses && result.result.uses.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-accent mb-2">Uses</h4>
                                <ul className="text-sm space-y-1">
                                  {result.result.uses.slice(0, 3).map((use, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-accent">•</span>
                                      <span>{use}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Dosage */}
                            {result.result.dosage && (
                              <div>
                                <h4 className="font-semibold text-primary mb-2">Dosage</h4>
                                <p className="text-sm">{result.result.dosage}</p>
                              </div>
                            )}

                            {/* Warnings */}
                            {result.result.warnings && result.result.warnings.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Important Warnings
                                </h4>
                                <ul className="text-sm space-y-1">
                                  {result.result.warnings.slice(0, 2).map((warning, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-destructive">•</span>
                                      <span>{warning}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Storage */}
                            {result.result.storage && (
                              <div>
                                <h4 className="font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                  <Info className="w-4 h-4" />
                                  Storage
                                </h4>
                                <p className="text-sm">{result.result.storage}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No analysis data available</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultipleMedicines;
