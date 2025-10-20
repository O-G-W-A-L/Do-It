import { useState, useCallback } from 'react';
import { paymentsService } from '../services/payments.js';

/**
 * Custom hook for payment and subscription management
 */
export function usePayments() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Subscription management
  const getSubscriptions = useCallback(async (userId = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentsService.getSubscriptions(userId);
      if (result.success) {
        setSubscriptions(result.data.results || result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch subscriptions');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubscription = useCallback(async (subscriptionData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentsService.createSubscription(subscriptionData);
      if (result.success) {
        setSubscriptions(prev => [result.data, ...prev]);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to create subscription');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(async (subscriptionId, reason = '') => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentsService.cancelSubscription(subscriptionId, reason);
      if (result.success) {
        setSubscriptions(prev => prev.map(sub =>
          sub.id === subscriptionId ? { ...sub, status: 'cancelled' } : sub
        ));
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel subscription');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Payment methods
  const getPaymentMethods = useCallback(async () => {
    try {
      const result = await paymentsService.getPaymentMethods();
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch payment methods');
      return null;
    }
  }, []);

  const addPaymentMethod = useCallback(async (methodData) => {
    try {
      const result = await paymentsService.addPaymentMethod(methodData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to add payment method');
      return null;
    }
  }, []);

  // Transaction history
  const getTransactions = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentsService.getTransactions(params);
      if (result.success) {
        setTransactions(result.data.results || result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch transactions');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Payment processing
  const processPayment = useCallback(async (paymentData) => {
    try {
      const result = await paymentsService.processPayment(paymentData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to process payment');
      return null;
    }
  }, []);

  const createPaymentIntent = useCallback(async (amount, currency = 'usd', metadata = {}) => {
    try {
      const result = await paymentsService.createPaymentIntent(amount, currency, metadata);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to create payment intent');
      return null;
    }
  }, []);

  // Invoices
  const getInvoices = useCallback(async (params = {}) => {
    try {
      const result = await paymentsService.getInvoices(params);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices');
      return null;
    }
  }, []);

  const downloadInvoice = useCallback(async (invoiceId) => {
    try {
      const result = await paymentsService.downloadInvoice(invoiceId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to download invoice');
      return null;
    }
  }, []);

  // Pricing plans
  const getPricingPlans = useCallback(async () => {
    try {
      const result = await paymentsService.getPricingPlans();
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch pricing plans');
      return null;
    }
  }, []);

  return {
    subscriptions,
    transactions,
    loading,
    error,
    getSubscriptions,
    createSubscription,
    cancelSubscription,
    getPaymentMethods,
    addPaymentMethod,
    getTransactions,
    processPayment,
    createPaymentIntent,
    getInvoices,
    downloadInvoice,
    getPricingPlans,
    // Utility functions
    clearError: () => setError(null),
    setSubscriptions: setSubscriptions,
    setTransactions: setTransactions
  };
}
