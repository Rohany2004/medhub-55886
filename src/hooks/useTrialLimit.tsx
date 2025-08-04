import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const TRIAL_LIMIT = 2;
const TRIAL_STORAGE_KEY = 'trial_usage_count';

export const useTrialLimit = () => {
  const { user } = useAuth();
  const [trialCount, setTrialCount] = useState(0);
  const [showTrialModal, setShowTrialModal] = useState(false);

  useEffect(() => {
    if (!user) {
      const count = parseInt(localStorage.getItem(TRIAL_STORAGE_KEY) || '0');
      setTrialCount(count);
    } else {
      // Clear trial count for authenticated users
      localStorage.removeItem(TRIAL_STORAGE_KEY);
      setTrialCount(0);
    }
  }, [user]);

  const canUseFeature = () => {
    if (user) return true; // Authenticated users have unlimited access
    return trialCount < TRIAL_LIMIT;
  };

  const incrementTrialUsage = () => {
    if (user) return true; // Don't increment for authenticated users

    const newCount = trialCount + 1;
    setTrialCount(newCount);
    localStorage.setItem(TRIAL_STORAGE_KEY, newCount.toString());

    if (newCount >= TRIAL_LIMIT) {
      setShowTrialModal(true);
      return false; // Block usage
    }
    return true; // Allow usage
  };

  const closeTrialModal = () => {
    setShowTrialModal(false);
  };

  const getRemainingTries = () => {
    if (user) return null;
    return Math.max(0, TRIAL_LIMIT - trialCount);
  };

  return {
    canUseFeature,
    incrementTrialUsage,
    showTrialModal,
    closeTrialModal,
    trialCount,
    remainingTries: getRemainingTries(),
    isAuthenticated: !!user,
  };
};