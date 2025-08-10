import React from 'react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import FloatingMedicalIcons from '@/components/FloatingMedicalIcons';
import { FileText, Camera, Pill, Shield, Zap, Users, Edit, Activity, Heart, Search, Stethoscope, MessageSquare } from 'lucide-react';
import { ScanLine } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
const Index = () => {
  const { t } = useI18n();
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
                {t('app.title')}
              </h1>
              
              <p className="text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto">
                {t('app.tagline')}
              </p>
            </div>

            {/* Main Features - Balanced Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{t('features.medicineIdentifier.title')}</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  {t('features.medicineIdentifier.desc')}
                </p>
                <Button onClick={() => window.location.href = '/medicine-identifier'} className="btn-medical w-full text-lg py-4">
                  {t('features.medicineIdentifier.cta')}
                </Button>
              </div>
              
              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{t('features.medExplain.title')}</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  {t('features.medExplain.desc')}
                </p>
                <Button onClick={() => window.location.href = '/medexplain'} className="btn-accent w-full text-lg py-4">
                  {t('features.medExplain.cta')}
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Edit className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{t('features.medicineEntry.title')}</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  {t('features.medicineEntry.desc')}
                </p>
                <Button onClick={() => window.location.href = '/manual-medicine-entry'} className="btn-secondary w-full text-lg py-4">
                  {t('features.medicineEntry.cta')}
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Pill className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{t('features.myMedicines.title')}</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  {t('features.myMedicines.desc')}
                </p>
                <Button onClick={() => window.location.href = '/my-medicines'} className="btn-medical w-full text-lg py-4">
                  {t('features.myMedicines.cta')}
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <Activity className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{t('features.dashboard.title')}</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  {t('features.dashboard.desc')}
                </p>
                <Button onClick={() => window.location.href = '/dashboard'} className="btn-accent w-full text-lg py-4">
                  {t('features.dashboard.cta')}
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{t('features.interactionChecker.title')}</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  {t('features.interactionChecker.desc')}
                </p>
                <Button onClick={() => window.location.href = '/interaction-checker'} className="btn-medical w-full text-lg py-4">
                  {t('features.interactionChecker.cta')}
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <Search className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{t('features.symptomChecker.title')}</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  {t('features.symptomChecker.desc')}
                </p>
                <Button onClick={() => window.location.href = '/symptom-checker'} className="btn-accent w-full text-lg py-4">
                  {t('features.symptomChecker.cta')}
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Stethoscope className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{t('features.prescriptionReader.title')}</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  {t('features.prescriptionReader.desc')}
                </p>
                <Button onClick={() => window.location.href = '/prescription-reader'} className="btn-secondary w-full text-lg py-4">
                  {t('features.prescriptionReader.cta')}
                </Button>
              </div>

              <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{t('features.healthAnalytics.title')}</h3>
                <p className="text-muted-foreground mb-6 text-lg flex-grow">
                  {t('features.healthAnalytics.desc')}
                </p>
                <Button onClick={() => window.location.href = '/dashboard'} className="btn-secondary w-full text-lg py-4">
                  {t('features.healthAnalytics.cta')}
                </Button>
              </div>
            </div>

            {/* Why Choose Us Section - Perfect Symmetry */}
            <div className="mb-20">
              <h2 className="text-4xl font-bold text-center mb-12">
                {t('why.title')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-10 h-10 text-primary" />
                  </div>
                  <h4 className="text-2xl font-semibold mb-4">{t('why.fast.title')}</h4>
                  <p className="text-muted-foreground text-lg flex-grow">
                    {t('why.fast.desc')}
                  </p>
                </div>
                
                <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-accent" />
                  </div>
                  <h4 className="text-2xl font-semibold mb-4">{t('why.secure.title')}</h4>
                  <p className="text-muted-foreground text-lg flex-grow">
                    {t('why.secure.desc')}
                  </p>
                </div>
                
                <div className="glass-card p-8 rounded-xl text-center hover-lift h-full flex flex-col">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Users className="w-10 h-10 text-secondary" />
                  </div>
                  <h4 className="text-2xl font-semibold mb-4">{t('why.userFriendly.title')}</h4>
                  <p className="text-muted-foreground text-lg flex-grow">
                    {t('why.userFriendly.desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action - Perfectly Centered */}
            <div className="text-center">
              <div className="glass-card p-12 rounded-2xl max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-6">{t('cta.title')}</h2>
                <p className="text-xl text-muted-foreground mb-8">
                  {t('cta.desc')}
                </p>
                <Button onClick={() => window.location.href = '/medicine-identifier'} className="btn-medical text-lg px-12 py-4">
                  {t('cta.button')}
                </Button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>;
};
export default Index;