import React from 'react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import FloatingMedicalIcons from '@/components/FloatingMedicalIcons';
import { FileText, Camera, Pill, Shield, Zap, Users, Edit, Activity, Heart, Search, Stethoscope, MessageSquare } from 'lucide-react';
import { ScanLine } from 'lucide-react';
const Index = () => {
  const handleHome = () => {
    // Already on home page
  };
  const handleNewUpload = () => {
    // Navigate to medicine identifier
    window.location.href = '/medicine-identifier';
  };
  return <div className="min-h-screen">
      <Navigation onHome={handleHome} onNewUpload={handleNewUpload} showBackButton={false} />
      
      <div className="pt-16">
        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
          <FloatingMedicalIcons />
          <div className="text-center max-w-6xl mx-auto relative z-10">
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

            {/* Main Features - Perfect 3x3 Symmetrical Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Medicine Identifier</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  Identify medicines instantly by uploading photos. Get detailed information about 
                  composition, uses, dosage, and safety warnings.
                </p>
                <Button onClick={() => window.location.href = '/medicine-identifier'} className="btn-medical w-full text-lg py-4">
                  Identify Medicine
                </Button>
              </div>
              
              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">MedExplain</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  Transform complex medical reports into simple, understandable insights. 
                  Get explanations of medical terms and diagnosis.
                </p>
                <Button onClick={() => window.location.href = '/medexplain'} className="btn-accent w-full text-lg py-4">
                  Analyze Reports
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Edit className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Medicine Entry</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  Manually add medicine details with photo upload. Use AI to auto-fill information 
                  or enter everything yourself.
                </p>
                <Button onClick={() => window.location.href = '/manual-medicine-entry'} className="btn-secondary w-full text-lg py-4">
                  Add Medicine
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Pill className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">My Medicines</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  View and manage your saved medicine collection. Search, edit, and organize 
                  all your medicine entries in one place.
                </p>
                <Button onClick={() => window.location.href = '/my-medicines'} className="btn-medical w-full text-lg py-4">
                  View Collection
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <Activity className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Health Dashboard</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  Track your medicine usage, expiry dates, and get health insights 
                  all in one personalized dashboard.
                </p>
                <Button onClick={() => window.location.href = '/dashboard'} className="btn-accent w-full text-lg py-4">
                  View Dashboard
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
                  <ScanLine className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Barcode Scanner</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  Quickly identify medicines by scanning their barcodes with your 
                  device camera for instant results.
                </p>
                <Button onClick={() => window.location.href = '/barcode-scanner'} className="btn-secondary w-full text-lg py-4">
                  Scan Barcode
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Interaction Checker</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  Check for potential dangerous interactions between multiple 
                  medicines to ensure your safety.
                </p>
                <Button onClick={() => window.location.href = '/interaction-checker'} className="btn-medical w-full text-lg py-4">
                  Check Interactions
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <Search className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Symptom Checker</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  Describe your symptoms and get AI-powered health insights and 
                  possible condition suggestions.
                </p>
                <Button onClick={() => window.location.href = '/symptom-checker'} className="btn-accent w-full text-lg py-4">
                  Check Symptoms
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Stethoscope className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Prescription Reader</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  Upload prescription images to extract medicine information 
                  using advanced OCR technology.
                </p>
                <Button onClick={() => window.location.href = '/prescription-reader'} className="btn-secondary w-full text-lg py-4">
                  Read Prescription
                </Button>
              </div>
            </div>

            {/* Complete the 3x3 Grid with Community Feature */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Community Q&A</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  Ask health questions and get answers from the community 
                  and AI-powered assistance.
                </p>
                <Button onClick={() => window.location.href = '/community-qa'} className="btn-medical w-full text-lg py-4">
                  Join Community
                </Button>
              </div>
              
              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <Pill className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Multiple Medicines</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  Upload multiple medicine images at once and get comprehensive 
                  analysis for all your medications.
                </p>
                <Button onClick={() => window.location.href = '/multiple-medicines'} className="btn-accent w-full text-lg py-4">
                  Analyze Multiple
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Activity className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Health Analytics</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  Get detailed insights about your health patterns, medicine usage, 
                  and personalized recommendations.
                </p>
                <Button onClick={() => window.location.href = '/dashboard'} className="btn-secondary w-full text-lg py-4">
                  View Analytics
                </Button>
              </div>
            </div>

            {/* Why Choose Us Section - Perfect Symmetry */}
            <div className="mb-20">
              <h2 className="text-4xl font-bold text-center mb-12">
                Why Choose Our Platform?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-10 h-10 text-primary" />
                  </div>
                  <h4 className="text-2xl font-semibold mb-4">Lightning Fast</h4>
                  <p className="text-muted-foreground text-lg flex-grow">
                    Get instant results with our advanced AI processing technology 
                    for immediate healthcare insights.
                  </p>
                </div>
                
                <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-accent" />
                  </div>
                  <h4 className="text-2xl font-semibold mb-4">Secure & Private</h4>
                  <p className="text-muted-foreground text-lg flex-grow">
                    Your medical data is processed securely with enterprise-grade 
                    encryption and privacy protection.
                  </p>
                </div>
                
                <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Users className="w-10 h-10 text-secondary" />
                  </div>
                  <h4 className="text-2xl font-semibold mb-4">User-Friendly</h4>
                  <p className="text-muted-foreground text-lg flex-grow">
                    Simple interface designed for everyone, with clear explanations 
                    and intuitive navigation.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action - Perfectly Centered */}
            <div className="text-center">
              
            </div>
            
          </div>
        </div>
      </div>
    </div>;
};
export default Index;