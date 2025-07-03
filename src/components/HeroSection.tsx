import React from 'react';
import { Camera, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-medicines.jpg';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-6xl mx-auto text-center animate-fade-in">
        {/* Hero Image */}
        <div className="relative mb-16">
          <div className="relative overflow-hidden rounded-3xl max-w-4xl mx-auto mb-12">
            <img 
              src={heroImage} 
              alt="Medicine identification with AI" 
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
          </div>
        </div>

        {/* Main Hero Content */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 animate-scale-in">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse-slow"></span>
            AI-Powered Medicine Identification
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Identify Your
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Medicine Instantly
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Simply upload a photo of your medicine and get comprehensive information 
            including usage, side effects, composition, and manufacturer details.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              onClick={onGetStarted}
              className="btn-medical text-lg px-8 py-4 h-auto"
            >
              <Camera className="w-6 h-6 mr-2" />
              Start Identification
            </Button>
            
            <Button 
              variant="outline" 
              className="text-lg px-8 py-4 h-auto hover-lift"
            >
              <Search className="w-6 h-6 mr-2" />
              Learn More
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 animate-slide-up">
          <div className="glass-card rounded-2xl p-8 hover-lift">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-6">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Easy Upload
            </h3>
            <p className="text-muted-foreground">
              Drag & drop or click to upload your medicine photo. 
              Supports all common image formats.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 hover-lift">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              AI Analysis
            </h3>
            <p className="text-muted-foreground">
              Advanced AI powered by Gemini API identifies your medicine 
              and provides detailed information.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 hover-lift">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center mx-auto mb-6">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Detailed Results
            </h3>
            <p className="text-muted-foreground">
              Get comprehensive information including usage, side effects, 
              composition, and safety warnings.
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4">
            Trusted by healthcare professionals and patients worldwide
          </p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <div className="text-2xl font-bold">99.9%</div>
            <div className="w-px h-8 bg-border"></div>
            <div className="text-2xl font-bold">24/7</div>
            <div className="w-px h-8 bg-border"></div>
            <div className="text-2xl font-bold">1M+</div>
          </div>
          <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground mt-2">
            <span>Accuracy</span>
            <span>Available</span>
            <span>Medicines Identified</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;