import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotifications must be used within NotificationProvider. Make sure NotificationProvider is wrapping your app in _layout.tsx'
    );
  }

  return context;
};