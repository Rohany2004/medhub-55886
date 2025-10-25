
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

  // Lazy-load pdfjs only when needed to keep bundle small
  const analyzeReportsWithSupabase = async (files: File[]) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      // Convert input files to JPEG base64 images (supports PDF first page)
      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

      const dataUrlToJpegBase64 = async (dataUrl: string) => {
        // If it's already an image, downscale & convert to JPEG for consistency
        return await new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 1600;
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(dataUrl.split(',')[1] || '');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const jpeg = canvas.toDataURL('image/jpeg', 0.85);
            resolve(jpeg.split(',')[1] || '');
          };
          img.onerror = () => resolve(dataUrl.split(',')[1] || '');
          img.src = dataUrl;
        });
      };

      const pdfToImages = async (file: File) => {
        const [{ GlobalWorkerOptions, getDocument }, workerSrc] = await Promise.all([
          import('pdfjs-dist'),
          import('pdfjs-dist/build/pdf.worker.min.mjs?url')
        ]);
        // @ts-ignore - pdfjs typing varies
        GlobalWorkerOptions.workerSrc = (workerSrc as any).default || workerSrc;

        const arrayBuffer = await file.arrayBuffer();
        // @ts-ignore - pdfjs typing varies
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        const images: string[] = [];
        const pagesToRender = Math.min(pdf.numPages, 3); // Limit to first 3 pages
        for (let i = 1; i <= pagesToRender; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // @ts-ignore
          await page.render({ canvasContext: ctx, viewport }).promise;
          const jpeg = canvas.toDataURL('image/jpeg', 0.85);
          images.push(jpeg.split(',')[1] || '');
        }
        return images;
      };

      const filesDataArrays = await Promise.all(
        files.map(async (file) => {
          if (file.type === 'application/pdf') {
            return await pdfToImages(file);
          }
          // Images
          const dataUrl = await toBase64(file);
          const jpegBase64 = await dataUrlToJpegBase64(dataUrl);
          return [jpegBase64];
        })
      );

      // Flatten arrays and keep a max of 5 images total as per backend limits
      const filesData = filesDataArrays.flat().slice(0, 5);

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
