
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Zap, Shield, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-6xl mx-auto text-center">
        {/* Hero Content */}
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Identify Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent glow-text">
              Medicine
            </span>
            <span className="block">Instantly</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Upload a photo of any medicine and get detailed information including 
            usage, side effects, composition, and manufacturer details powered by AI
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              onClick={onGetStarted}
              size="lg" 
              className="btn-medical text-lg px-8 py-6 h-auto"
            >
              <Camera className="w-5 h-5 mr-2" />
              Start Identifying
            </Button>
            
            {!user && (
              <Button 
                onClick={() => navigate('/auth')}
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 h-auto border-2 hover:bg-primary/10"
              >
                Create Account
              </Button>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 animate-slide-up">
          <div className="glass-card rounded-2xl p-8 hover-lift">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Instant Results
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Get comprehensive medicine information in seconds using advanced AI technology
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 hover-lift">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Safe & Secure
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Your uploaded images are processed securely and not stored permanently
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 hover-lift">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              User Friendly
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Simple interface designed for everyone, no medical expertise required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
