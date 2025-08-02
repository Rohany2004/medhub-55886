
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, CheckCircle, Info, ArrowRight } from 'lucide-react';
import LanguageSwitcher, { Language } from './LanguageSwitcher';
import MedicalImageDisplay from './MedicalImageDisplay';
import ReportChatInterface from './ReportChatInterface';
import MedicalDisclaimer from './MedicalDisclaimer';

interface ReportAnalysis {
  summary?: string;
  medical_terms?: { term: string; explanation: string }[];
  diagnosis?: string[];
  recommendations?: string[];
  key_findings?: string[];
  next_steps?: string[];
  risk_level?: 'low' | 'medium' | 'high' | 'unknown';
}

interface ReportResultsProps {
  analysis: ReportAnalysis | null;
  isLoading: boolean;
  uploadedFiles: File[];
}

interface TranslatedAnalysis extends ReportAnalysis {
  language?: string;
}

const ReportResults: React.FC<ReportResultsProps> = ({ analysis, isLoading, uploadedFiles }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [translatedAnalysis, setTranslatedAnalysis] = useState<TranslatedAnalysis | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Store original language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && ['en', 'hi', 'mr'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Handle language changes
  const handleLanguageChange = async (newLanguage: Language) => {
    if (newLanguage === currentLanguage) return;
    
    localStorage.setItem('preferred-language', newLanguage);
    setCurrentLanguage(newLanguage);

    if (newLanguage === 'en') {
      setTranslatedAnalysis(null);
      return;
    }

    if (!analysis) return;

    setIsTranslating(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('translate-medical-content', {
        body: { 
          content: analysis, 
          targetLanguage: newLanguage,
          contentType: 'analysis'
        }
      });

      if (error) throw error;
      
      setTranslatedAnalysis({
        ...data.translatedContent,
        language: newLanguage
      });
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback to original language on error
      setCurrentLanguage('en');
      setTranslatedAnalysis(null);
    } finally {
      setIsTranslating(false);
    }
  };

  // Get the analysis to display (translated or original)
  const displayAnalysis = currentLanguage === 'en' ? analysis : (translatedAnalysis || analysis);
  const reportText = analysis ? 
    `${analysis.summary || ''} ${analysis.key_findings?.join(' ') || ''} ${analysis.diagnosis?.join(' ') || ''}`.toLowerCase() : 
    '';
  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="animate-pulse-slow">
            <FileText className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold">Analyzing Medical Reports...</h3>
            <p className="text-muted-foreground mt-2">
              Our AI is carefully reviewing your documents and extracting key insights.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                  <div className="h-3 bg-muted rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No Analysis Available</h3>
        <p className="text-muted-foreground">
          We couldn't analyze your reports. Please try uploading different files.
        </p>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'high': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in">
      {/* Medical Disclaimer */}
      {showDisclaimer && (
        <div className="mb-6">
          <MedicalDisclaimer 
            onDismiss={() => setShowDisclaimer(false)}
            language={currentLanguage}
          />
        </div>
      )}

      {/* Header with Language Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="text-center lg:text-left mb-4 lg:mb-0">
          <div className="flex justify-center lg:justify-start items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
            <h2 className="text-3xl font-bold">Medical Report Analysis</h2>
          </div>
          <p className="text-muted-foreground">
            Analysis completed for {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
          </p>
          {displayAnalysis?.risk_level && (
            <Badge className={`mt-2 ${getRiskColor(displayAnalysis.risk_level)}`}>
              Risk Level: {displayAnalysis.risk_level.toUpperCase()}
            </Badge>
          )}
        </div>
        
        <div className="flex justify-center lg:justify-end">
          <LanguageSwitcher
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            isTranslating={isTranslating}
          />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Analysis Content */}
        <div className="lg:col-span-3 space-y-6">

          {/* Summary */}
          {displayAnalysis?.summary && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{displayAnalysis.summary}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Findings */}
            {displayAnalysis?.key_findings && displayAnalysis.key_findings.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <CheckCircle className="w-5 h-5" />
                    Key Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {displayAnalysis.key_findings.map((finding, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Diagnosis */}
            {displayAnalysis?.diagnosis && displayAnalysis.diagnosis.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <FileText className="w-5 h-5" />
                    Diagnosis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {displayAnalysis.diagnosis.map((diag, index) => (
                      <Badge key={index} variant="secondary" className="mr-2 mb-2">
                        {diag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Medical Terms */}
          {displayAnalysis?.medical_terms && displayAnalysis.medical_terms.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Medical Terms Explained</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayAnalysis.medical_terms.map((term, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">{term.term}</h4>
                      <p className="text-sm text-muted-foreground">{term.explanation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recommendations */}
            {displayAnalysis?.recommendations && displayAnalysis.recommendations.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {displayAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            {displayAnalysis?.next_steps && displayAnalysis.next_steps.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <ArrowRight className="w-5 h-5" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {displayAnalysis.next_steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-accent text-accent-foreground rounded-full text-sm flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <MedicalImageDisplay 
            reportText={reportText}
            language={currentLanguage}
          />
        </div>
      </div>

      {/* Chat Interface */}
      <div className="mt-8">
        <ReportChatInterface
          reportContext={displayAnalysis}
          language={currentLanguage}
        />
      </div>
    </div>
  );
};

export default ReportResults;
