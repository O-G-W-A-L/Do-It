import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePayments } from '../hooks/usePayments.js';
import { useAuth } from './AuthContext';

const PaymentContext = createContext();

export function PaymentProvider({ children }) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [paymentIntent, setPaymentIntent] = useState(null);

  // Use the payments hook
  const paymentsHook = usePayments();

  // Initialize payment data only for authenticated users
  useEffect(() => {
    if (user?.id) {
      const loadInitialData = async () => {
        try {
          // Load subscriptions and pricing plans in parallel
          await Promise.all([
            paymentsHook.getSubscriptions(),
            loadPricingPlans()
          ]);
        } catch (error) {
          console.error('Failed to load payment data:', error);
        }
      };

      loadInitialData();
    }
  }, [user?.id]);

  // Load pricing plans
  const loadPricingPlans = useCallback(async () => {
    try {
      const plans = await paymentsHook.getPricingPlans();
      if (plans) {
        setPricingPlans(plans);
      }
    } catch (error) {
      console.error('Failed to load pricing plans:', error);
    }
  }, [paymentsHook]);

  // Enhanced subscription operations
  const createSubscription = useCallback(async (subscriptionData) => {
    const result = await paymentsHook.createSubscription(subscriptionData);
    if (result) {
      // Refresh subscriptions after creation
      await paymentsHook.getSubscriptions();
    }
    return result;
  }, [paymentsHook]);

  const cancelSubscription = useCallback(async (subscriptionId, reason = '') => {
    const result = await paymentsHook.cancelSubscription(subscriptionId, reason);
    if (result) {
      // Refresh subscriptions after cancellation
      await paymentsHook.getSubscriptions();
    }
    return result;
  }, [paymentsHook]);

  // Payment processing
  const processPayment = useCallback(async (paymentData) => {
    const result = await paymentsHook.processPayment(paymentData);
    if (result) {
      // Refresh transactions and subscriptions after payment
      await Promise.all([
        paymentsHook.getTransactions(),
        paymentsHook.getSubscriptions()
      ]);
    }
    return result;
  }, [paymentsHook]);

  const createPaymentIntent = useCallback(async (amount, currency = 'usd', metadata = {}) => {
    const result = await paymentsHook.createPaymentIntent(amount, currency, metadata);
    if (result) {
      setPaymentIntent(result);
    }
    return result;
  }, [paymentsHook]);

  // Payment methods management
  const addPaymentMethod = useCallback(async (methodData) => {
    const result = await paymentsHook.addPaymentMethod(methodData);
    if (result) {
      // Refresh payment methods
      await paymentsHook.getPaymentMethods();
    }
    return result;
  }, [paymentsHook]);

  // Transaction analysis
  const getTransactionSummary = useCallback(() => {
    const transactions = paymentsHook.transactions;
    const totalSpent = transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const monthlySpending = transactions
      .filter(t => {
        const transactionDate = new Date(t.created_at);
        const now = new Date();
        return transactionDate.getMonth() === now.getMonth() &&
               transactionDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    return {
      totalTransactions: transactions.length,
      totalSpent,
      monthlySpending,
      completedTransactions: transactions.filter(t => t.status === 'completed').length,
      pendingTransactions: transactions.filter(t => t.status === 'pending').length
    };
  }, [paymentsHook.transactions]);

  // Subscription status helpers
  const getActiveSubscription = useCallback(() => {
    return paymentsHook.subscriptions.find(sub => sub.status === 'active');
  }, [paymentsHook.subscriptions]);

  const hasActiveSubscription = useCallback(() => {
    return paymentsHook.subscriptions.some(sub => sub.status === 'active');
  }, [paymentsHook.subscriptions]);

  const getSubscriptionByPlan = useCallback((planId) => {
    return paymentsHook.subscriptions.find(sub => sub.plan === planId);
  }, [paymentsHook.subscriptions]);

  // Invoice management
  const downloadInvoice = useCallback(async (invoiceId) => {
    return await paymentsHook.downloadInvoice(invoiceId);
  }, [paymentsHook]);

  // Clear payment intent
  const clearPaymentIntent = useCallback(() => {
    setPaymentIntent(null);
  }, []);

  const contextValue = {
    // State
    subscriptions: paymentsHook.subscriptions,
    transactions: paymentsHook.transactions,
    pricingPlans,
    selectedPlan,
    paymentIntent,
    isLoading: paymentsHook.loading,
    error: paymentsHook.error,

    // Subscription operations
    getSubscriptions: paymentsHook.getSubscriptions,
    createSubscription,
    cancelSubscription,
    getSubscription: paymentsHook.getSubscription,

    // Payment operations
    getPaymentMethods: paymentsHook.getPaymentMethods,
    addPaymentMethod,
    processPayment,
    createPaymentIntent,
    getTransactions: paymentsHook.getTransactions,

    // Invoice operations
    getInvoices: paymentsHook.getInvoices,
    downloadInvoice,

    // Pricing
    getPricingPlans: paymentsHook.getPricingPlans,

    // Enhanced features
    getTransactionSummary,
    getActiveSubscription,
    hasActiveSubscription,
    getSubscriptionByPlan,

    // Utility functions
    setSelectedPlan,
    clearPaymentIntent,
    clearError: paymentsHook.clearError,
    refreshData: async () => {
      await Promise.all([
        paymentsHook.getSubscriptions(),
        paymentsHook.getTransactions(),
        loadPricingPlans()
      ]);
    }
  };

  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
    </PaymentContext.Provider>
  );
}

export const usePaymentContext = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePaymentContext must be used within a PaymentProvider');
  }
  return context;
};
