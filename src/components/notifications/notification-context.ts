import { createContext, useContext } from 'react';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  tone: AlertTone;
  createdAt: string;
  read: boolean;
}

export interface NotificationContextValue {
  alerts: AlertItem[];
  toastAlerts: AlertItem[];
  dismissToast: (id: string) => void;
  markAllRead: () => void;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider');
  return context;
};
