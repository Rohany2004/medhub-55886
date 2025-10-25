
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import ReportUpload from '@/components/ReportUpload';
import ReportResults from '@/components/ReportResults';
import { FileText, Shield, Zap, Users } from 'lucide-react';
import TrialLimitWrapper from '@/components/TrialLimitWrapper';
import { useTrialLimit } from '@/hooks/useTrialLimit';

type MedExplainState = 'home' | 'upload' | 'results';

interface ReportAnalysis {
  summary?: string;
  medical_terms?: { term: string; explanation: string }[];
  diagnosis?: string[];
  recommendations?: string[];
  key_findings?: string[];
  next_steps?: string[];
  risk_level?: 'low' | 'medium' | 'high' | 'unknown';
}

const MedExplain = () => {
  const [currentState, setCurrentState] = useState<MedExplainState>('home');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const { canUseFeature, incrementTrialUsage, remainingTries, isAuthenticated } = useTrialLimit();

  const handleGetStarted = () => {
    setCurrentState('upload');
  };

  const handleHome = () => {
    setCurrentState('home');
    setAnalysis(null);
    setUploadedFiles([]);
  };

  const handleNewUpload = () => {
    setCurrentState('upload');
    setAnalysis(null);
    setUploadedFiles([]);
  };

  const analyzeReportsWithSupabase = async (files: File[]) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Convert files to base64
      const filesData = await Promise.all(
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

      const { data, error } = await supabase.functions.invoke('analyze-reports', {
        body: { files: filesData }
      });

      if (error) throw error;
      return data.analysis;
    } catch (error) {
      console.error('Report analysis error:', error);
      throw error;
    }
  };

  const handleReportUpload = async (files: File[]) => {
    // Check trial limit for unregistered users
    if (!canUseFeature()) {
      return;
    }

    if (!incrementTrialUsage()) {
      return; // Trial limit reached, modal will show
    }

    setIsAnalyzing(true);
    setCurrentState('results');
    setUploadedFiles(files);

    try {
      const result = await analyzeReportsWithSupabase(files);
      setAnalysis(result);
      
      toast({
        title: "Analysis Complete",
        description: "Your medical reports have been successfully analyzed.",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      const errMsg = (error as any)?.message || '';
      let description = "Unable to analyze the reports. Please try again with clearer images.";
      if (errMsg.includes('Rate limit')) description = "Too many requests right now. Please wait a moment and try again.";
      if (errMsg.includes('Payment required')) description = "Service credit has run out. Please add credits and try again.";
      toast({
        title: "Analysis Failed",
        description,
        variant: "destructive",
      });
      
      setCurrentState('upload');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <TrialLimitWrapper featureName="MedExplain">
      <div className="min-h-screen">
        <Navigation 
          onHome={handleHome}
          onNewUpload={handleNewUpload}
          showBackButton={currentState !== 'home'}
        />
        
        <div className="pt-16">
        {currentState === 'home' && (
          <div className="min-h-screen px-4 py-12">
            {/* Hero Section */}
            <div className="text-center mb-16 animate-fade-in">
              <div className="mx-auto mb-8 w-24 h-24 rounded-full glass-card flex items-center justify-center">
                <FileText className="w-12 h-12 text-primary" />
              </div>
              
              <h1 className="text-5xl font-bold text-foreground mb-6">
                MedExplain
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Transform complex medical reports into simple, understandable insights. 
                Our AI-powered platform helps you understand your health data better.
                {!isAuthenticated && remainingTries !== null && (
                  <span className="block mt-4 text-lg font-medium text-primary">
                    {remainingTries > 0 ? `${remainingTries} free tries remaining` : 'Sign up to continue using this feature'}
                  </span>
                )}
              </p>
              
              <Button 
                onClick={handleGetStarted}
                className="btn-medical text-lg px-8 py-4 hover-lift"
              >
                Get Started
              </Button>
            </div>

            {/* Features Section */}
            <div className="max-w-6xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-center mb-12">
                Why Choose MedExplain?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="glass-card p-6 rounded-xl text-center hover-lift">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">Fast Analysis</h3>
                  <p className="text-muted-foreground">
                    Get instant insights from your medical reports using advanced AI technology.
                  </p>
                </div>
                
                <div className="glass-card p-6 rounded-xl text-center hover-lift">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
                  <p className="text-muted-foreground">
                    Your medical data is processed securely with enterprise-grade encryption.
                  </p>
                </div>
                
                <div className="glass-card p-6 rounded-xl text-center hover-lift">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">Multiple Formats</h3>
                  <p className="text-muted-foreground">
                    Support for PDFs, scanned images, and various medical document formats.
                  </p>
                </div>
                
                <div className="glass-card p-6 rounded-xl text-center hover-lift">
                  <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">Patient-Friendly</h3>
                  <p className="text-muted-foreground">
                    Complex medical terms explained in simple, understandable language.
                  </p>
                </div>
              </div>
            </div>

            {/* Supported File Types */}
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-2xl font-semibold mb-6">Supported File Types</h3>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {['PDF Documents', 'JPEG Images', 'PNG Images', 'WebP Images', 'Scanned Reports'].map((type, index) => (
                  <div key={index} className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                    {type}
                  </div>
                ))}
              </div>
              
              <p className="text-muted-foreground">
                Upload multiple files at once for comprehensive analysis. Maximum file size: 10MB per file.
              </p>
            </div>
          </div>
        )}

        {currentState === 'upload' && (
          <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-4xl">
              <div className="text-center mb-12 animate-fade-in">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  Upload Medical Reports
                </h1>
                <p className="text-xl text-muted-foreground">
                  Upload your medical documents for instant AI-powered analysis
                </p>
              </div>
              
              <ReportUpload 
                onReportUpload={handleReportUpload} 
                isLoading={isAnalyzing}
              />
            </div>
          </div>
        )}

        {currentState === 'results' && (
          <div className="min-h-screen px-4 py-12">
            <ReportResults 
              analysis={analysis}
              isLoading={isAnalyzing}
              uploadedFiles={uploadedFiles}
            />
          </div>
        )}
        </div>
      </div>
    </TrialLimitWrapper>
  );
};

export default MedExplain;
