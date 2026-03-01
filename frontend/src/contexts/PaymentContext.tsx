import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ServiceResponse } from '../types/api/user';

interface Subscription {
  id: number;
  plan: string;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
}

interface PaymentContextType {
  subscriptions: Subscription[];
  hasActiveSubscription: () => boolean;
  isLoading: boolean;
  fetchSubscriptions: () => Promise<void>;
  createPayment: (courseId: number, paymentMethod: string) => Promise<ServiceResponse<unknown>>;
  processPayment: (paymentId: number) => Promise<ServiceResponse<unknown>>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

interface PaymentProviderProps {
  children: ReactNode;
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [hasActive, setHasActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const hasActiveSubscription = useCallback((): boolean => {
    return subscriptions.some(sub => sub.status === 'active') || hasActive;
  }, [subscriptions, hasActive]);

  const fetchSubscriptions = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulated - would call API
      setSubscriptions([]);
      setHasActive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (_courseId: number, _paymentMethod: string): Promise<ServiceResponse<unknown>> => {
    setIsLoading(true);
    try {
      return { success: false, error: 'Not implemented' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processPayment = useCallback(async (_paymentId: number): Promise<ServiceResponse<unknown>> => {
    setIsLoading(true);
    try {
      return { success: false, error: 'Not implemented' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: PaymentContextType = {
    subscriptions,
    hasActiveSubscription,
    isLoading,
    fetchSubscriptions,
    createPayment,
    processPayment
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
}

export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const usePaymentContext = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePaymentContext must be used within a PaymentProvider');
  }
  return context;
};
