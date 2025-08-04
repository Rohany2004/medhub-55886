import React from 'react';
import { useTrialLimit } from '@/hooks/useTrialLimit';
import TrialLimitModal from './TrialLimitModal';

interface TrialLimitWrapperProps {
  children: React.ReactNode;
  featureName?: string;
}

const TrialLimitWrapper: React.FC<TrialLimitWrapperProps> = ({ 
  children, 
  featureName = 'feature' 
}) => {
  const { 
    canUseFeature, 
    incrementTrialUsage, 
    showTrialModal, 
    closeTrialModal,
    remainingTries,
    isAuthenticated 
  } = useTrialLimit();

  return (
    <>
      {children}
      <TrialLimitModal 
        open={showTrialModal} 
        onClose={closeTrialModal} 
      />
    </>
  );
};

export default TrialLimitWrapper;