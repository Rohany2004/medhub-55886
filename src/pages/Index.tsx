
import React from 'react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { FileText, Camera, Pill, Shield, Zap, Users } from 'lucide-react';

const Index = () => {
  const handleHome = () => {
    // Already on home page
  };

  const handleNewUpload = () => {
    // Navigate to medicine identifier
    window.location.href = '/medicine-identifier';
  };

  return (
    <div className="min-h-screen">
      <Navigation 
        onHome={handleHome}
        onNewUpload={handleNewUpload}
        showBackButton={false}
      />
      
      <div className="pt-16">
        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="text-center max-w-6xl mx-auto">
            <div className="animate-fade-in mb-12">
              <div className="mx-auto mb-8 w-32 h-32 rounded-full glass-card flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Pill className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-6xl font-bold text-foreground mb-6">
                Medical AI Assistant
              </h1>
              
              <p className="text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto">
                Your intelligent companion for medicine identification and medical report analysis. 
                Powered by advanced AI technology for accurate and reliable healthcare insights.
              </p>
            </div>

            {/* Main Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="glass-card p-8 rounded-xl text-center hover-lift">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-3xl font-semibold mb-4">Medicine Identifier</h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  Identify medicines instantly by uploading photos. Get detailed information about 
                  composition, uses, dosage, and safety warnings for single or multiple medicines.
                </p>
                <Button 
                  onClick={() => window.location.href = '/medicine-identifier'}
                  className="btn-medical w-full text-lg py-4"
                >
                  Identify Your Medicine
                </Button>
              </div>
              
              <div className="glass-card p-8 rounded-xl text-center hover-lift">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-3xl font-semibold mb-4">MedExplain</h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  Transform complex medical reports into simple, understandable insights. 
                  Get explanations of medical terms, diagnosis, and recommended next steps.
                </p>
                <Button 
                  onClick={() => window.location.href = '/medexplain'}
                  className="btn-accent w-full text-lg py-4"
                >
                  Analyze Medical Reports
                </Button>
              </div>
            </div>

            {/* Why Choose Us Section */}
            <div className="mb-16">
              <h2 className="text-4xl font-bold text-center mb-12">
                Why Choose Our Platform?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-card p-6 rounded-xl text-center hover-lift">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h4 className="text-xl font-semibold mb-2">Lightning Fast</h4>
                  <p className="text-muted-foreground">
                    Get instant results with our advanced AI processing technology.
                  </p>
                </div>
                
                <div className="glass-card p-6 rounded-xl text-center hover-lift">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h4 className="text-xl font-semibold mb-2">Secure & Private</h4>
                  <p className="text-muted-foreground">
                    Your medical data is processed securely with enterprise-grade encryption.
                  </p>
                </div>
                
                <div className="glass-card p-6 rounded-xl text-center hover-lift">
                  <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h4 className="text-xl font-semibold mb-2">User-Friendly</h4>
                  <p className="text-muted-foreground">
                    Simple interface designed for everyone, with clear explanations.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="glass-card p-8 rounded-xl">
              <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-xl text-muted-foreground mb-6">
                Choose the service that best fits your needs and experience the power of AI-assisted healthcare.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => window.location.href = '/medicine-identifier'}
                  className="btn-medical text-lg px-8 py-4"
                >
                  Start Medicine Identification
                </Button>
                <Button 
                  onClick={() => window.location.href = '/medexplain'}
                  className="btn-accent text-lg px-8 py-4"
                >
                  Analyze Medical Reports
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
