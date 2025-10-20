import api, { apiUtils } from './api.js';

/**
 * Payment service for subscription and transaction management
 */
export const paymentsService = {
  // Subscription management
  async getSubscriptions(userId = null) {
    try {
      const url = userId ? `/api/payments/user/${userId}/subscriptions/` : '/api/payments/subscriptions/';
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getSubscription(subscriptionId) {
    try {
      const response = await api.get(`/api/payments/subscriptions/${subscriptionId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async createSubscription(subscriptionData) {
    try {
      const response = await api.post('/api/payments/subscriptions/', subscriptionData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async updateSubscription(subscriptionId, updateData) {
    try {
      const response = await api.patch(`/api/payments/subscriptions/${subscriptionId}/`, updateData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async cancelSubscription(subscriptionId, reason = '') {
    try {
      const response = await api.post(`/api/payments/subscriptions/${subscriptionId}/cancel/`, { reason });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async reactivateSubscription(subscriptionId) {
    try {
      const response = await api.post(`/api/payments/subscriptions/${subscriptionId}/reactivate/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Payment methods
  async getPaymentMethods() {
    try {
      const response = await api.get('/api/payments/methods/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async addPaymentMethod(methodData) {
    try {
      const response = await api.post('/api/payments/methods/', methodData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async updatePaymentMethod(methodId, methodData) {
    try {
      const response = await api.patch(`/api/payments/methods/${methodId}/`, methodData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async deletePaymentMethod(methodId) {
    try {
      await api.delete(`/api/payments/methods/${methodId}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async setDefaultPaymentMethod(methodId) {
    try {
      const response = await api.post(`/api/payments/methods/${methodId}/set-default/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Transaction history
  async getTransactions(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/payments/transactions/${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getTransaction(transactionId) {
    try {
      const response = await api.get(`/api/payments/transactions/${transactionId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Payment processing
  async processPayment(paymentData) {
    try {
      const response = await api.post('/api/payments/process/', paymentData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const response = await api.post('/api/payments/create-intent/', {
        amount,
        currency,
        metadata
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async confirmPayment(paymentIntentId, paymentMethodId) {
    try {
      const response = await api.post('/api/payments/confirm/', {
        payment_intent_id: paymentIntentId,
        payment_method_id: paymentMethodId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Invoices and receipts
  async getInvoices(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/payments/invoices/${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getInvoice(invoiceId) {
    try {
      const response = await api.get(`/api/payments/invoices/${invoiceId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async downloadInvoice(invoiceId) {
    try {
      const response = await api.get(`/api/payments/invoices/${invoiceId}/download/`, {
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data,
        filename: response.headers['content-disposition']?.split('filename=')[1] || 'invoice.pdf'
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Pricing plans
  async getPricingPlans() {
    try {
      const response = await api.get('/api/payments/subscription-plans/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getPlan(planId) {
    try {
      const response = await api.get(`/api/payments/subscription-plans/${planId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Coupons and discounts
  async validateCoupon(code, planId = null) {
    try {
      const response = await api.post('/api/payments/coupons/validate/', {
        code,
        plan_id: planId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async applyCoupon(code, subscriptionId) {
    try {
      const response = await api.post(`/api/payments/subscriptions/${subscriptionId}/apply-coupon/`, { code });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Webhooks and payment status
  async getPaymentStatus(paymentId) {
    try {
      const response = await api.get(`/api/payments/status/${paymentId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Admin functions
  async getPaymentAnalytics(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/payments/analytics/${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async refundTransaction(transactionId, amount = null, reason = '') {
    try {
      const response = await api.post(`/api/payments/transactions/${transactionId}/refund/`, {
        amount,
        reason
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  }
};

export default paymentsService;
