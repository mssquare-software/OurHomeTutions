import { useContext } from 'react';
import { TourContext, TourContextType } from './TourContext';

export const useTour = (): TourContextType => {
  const context = useContext(TourContext);

  if (!context) {
    throw new Error(
      'useTour must be used within TourProvider. Make sure TourProvider is wrapping your app in _layout.tsx'
    );
  }

  return context;
};