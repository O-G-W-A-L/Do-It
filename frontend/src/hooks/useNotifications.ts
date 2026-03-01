import { useNotification } from '../contexts/NotificationContext';

export function useNotifications() {
  return useNotification();
}
