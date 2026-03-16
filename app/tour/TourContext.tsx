import React, { createContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AnimationType = 'popup' | 'slideUp' | 'slideDown' | 'bounce' | 'fade' | 'rotate' | 'flip';

export interface TourStep {
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'center';
}

export interface TourConfig {
  pageId: string;
  pageName: string;
  animationType: AnimationType;
  steps: TourStep[];
}

export const TOUR_CONFIGS: Record<string, TourConfig> = {
  landing: {
    pageId: 'landing',
    pageName: 'Landing Page',
    animationType: 'popup',
    steps: [
      {
        title: 'Welcome to EduConnect',
        description: 'Your platform for connecting with expert tutors',
        position: 'center',
      },
      {
        title: 'Explore Features',
        description: 'Swipe through to discover our offerings',
        position: 'center',
      },
    ],
  },
  login: {
    pageId: 'login',
    pageName: 'Login Page',
    animationType: 'slideUp',
    steps: [
      {
        title: 'Welcome Back',
        description: 'Sign in with your email and password',
        position: 'center',
      },
    ],
  },
  parentDashboard: {
    pageId: 'parentDashboard',
    pageName: 'Parent Dashboard',
    animationType: 'slideDown',
    steps: [
      {
        title: 'Welcome to Your Dashboard',
        description: 'Manage your child\'s learning journey',
        position: 'center',
      },
    ],
  },
  booking: {
    pageId: 'booking',
    pageName: 'Booking Flow',
    animationType: 'popup',
    steps: [
      {
        title: 'Book a Tutor',
        description: 'Select mode, date, time and confirm',
        position: 'center',
      },
    ],
  },
};

export interface TourContextType {
  currentPage: string | null;
  currentStep: number;
  isActive: boolean;
  completedPages: string[];
  startTour: (pageId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  getCurrentConfig: () => TourConfig | null;
  getCurrentStep: () => TourStep | null;
  getAnimationType: () => AnimationType;
  resumeTour: (pageId: string) => void;
}

export const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedPages, setCompletedPages] = useState<string[]>([]);

  // Load tour state on mount
  useEffect(() => {
    const loadTourState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('tourState');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setCompletedPages(parsed.completedPages || []);
        }
      } catch (error) {
        console.log('Error loading tour state:', error);
      }
    };

    loadTourState();
  }, []);

  const saveTourState = useCallback(async (pages: string[]) => {
    try {
      await AsyncStorage.setItem(
        'tourState',
        JSON.stringify({ completedPages: pages })
      );
    } catch (error) {
      console.log('Error saving tour state:', error);
    }
  }, []);

  const startTour = useCallback((pageId: string) => {
    if (!TOUR_CONFIGS[pageId]) {
      console.warn(`Tour config not found for page: ${pageId}`);
      return;
    }

    console.log(`🎯 Starting tour for: ${pageId}`);
    setCurrentPage(pageId);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const resumeTour = useCallback((pageId: string) => {
    startTour(pageId);
  }, [startTour]);

  const nextStep = useCallback(() => {
    if (!currentPage) return;

    const config = TOUR_CONFIGS[currentPage];
    if (!config) return;

    if (currentStep < config.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTour();
    }
  }, [currentPage, currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    console.log('⏭️ Skipping tour');
    setIsActive(false);
    setCurrentPage(null);
    setCurrentStep(0);
  }, []);

  const completeTour = useCallback(async () => {
    if (currentPage && !completedPages.includes(currentPage)) {
      const updated = [...completedPages, currentPage];
      setCompletedPages(updated);
      await saveTourState(updated);
      console.log(`✅ Tour completed for: ${currentPage}`);
    }

    setIsActive(false);
    setCurrentPage(null);
    setCurrentStep(0);
  }, [currentPage, completedPages, saveTourState]);

  const getCurrentConfig = useCallback(() => {
    if (!currentPage) return null;
    return TOUR_CONFIGS[currentPage] || null;
  }, [currentPage]);

  const getCurrentStep = useCallback(() => {
    const config = getCurrentConfig();
    if (!config) return null;
    return config.steps[currentStep] || null;
  }, [getCurrentConfig, currentStep]);

  const getAnimationType = useCallback(() => {
    const config = getCurrentConfig();
    return (config?.animationType || 'popup') as AnimationType;
  }, [getCurrentConfig]);

  const value: TourContextType = {
    currentPage,
    currentStep,
    isActive,
    completedPages,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    getCurrentConfig,
    getCurrentStep,
    getAnimationType,
    resumeTour,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};