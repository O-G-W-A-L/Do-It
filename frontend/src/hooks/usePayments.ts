import { usePayment } from '../contexts/PaymentContext';

export function usePayments() {
  return usePayment();
}
