import React from 'react';
import Navigation from '@/components/Navigation';
import Breadcrumb from '@/components/Breadcrumb';
import InteractionChecker from '@/components/InteractionChecker';
import { Heart } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

const InteractionCheckerPage = () => {
  const { t } = useI18n();
  const handleHome = () => {
    window.location.href = '/';
  };

  const handleNewUpload = () => {
    window.location.href = '/medicine-identifier';
  };

  return (
    <div className="min-h-screen">
      <Navigation onHome={handleHome} onNewUpload={handleNewUpload} showBackButton={true} />
      
      <div className="pt-16 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Breadcrumb items={[{ label: t('interaction.title'), active: true }]} />
          </div>
          
          <div className="text-center mb-12 animate-fade-in">
            <div className="mx-auto mb-8 w-24 h-24 rounded-full glass-card flex items-center justify-center">
              <Heart className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-5xl font-bold text-foreground mb-6">
              {t('interaction.title')}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              {t('interaction.subtitle')}
            </p>
          </div>

          <InteractionChecker />
        </div>
      </div>
    </div>
  );
};

export default InteractionCheckerPage;