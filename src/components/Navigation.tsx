import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';
import type { Language as SwitcherLanguage } from '@/components/LanguageSwitcher';
interface NavigationProps {
  onHome: () => void;
  onNewUpload: () => void;
  showBackButton?: boolean;
}
const Navigation: React.FC<NavigationProps> = ({
  onHome,
  onNewUpload,
  showBackButton
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  return <nav className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div onClick={onHome} className="flex items-center gap-3 cursor-pointer hover-lift">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              Medicine<span className="text-primary">ID</span>
            </span>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLanguage={language as any} onLanguageChange={(code) => setLanguage(code as any)} />
            {showBackButton && (
              <Button onClick={onHome} variant="ghost" className="hover-lift">
                {t('nav.back')}
              </Button>
            )}
            {user ? (
              <>
                <UserProfile user={user} />
              </>
            ) : (
              <>
                {!loading && (
                  <Button onClick={() => navigate('/auth')} variant="ghost" className="hover-lift">
                    {t('nav.signIn')}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>;
};
export default Navigation;