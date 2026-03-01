import api, { apiUtils } from './api';
import type { ServiceResponse } from '../types/api/user';
import type {
  PaymentTransaction,
  SubscriptionPlan,
  UserSubscription,
  Coupon,
  Invoice,
  Refund,
  CoursePurchaseRequest,
  SubscriptionPurchaseRequest,
  PaymentAnalytics
} from '../types/api/payment';

/**
 * Payment service for payment-related API calls
 */
export const paymentService = {
  // Get payment transactions
  async getTransactions(): Promise<ServiceResponse<PaymentTransaction[]>> {
    try {
      const response = await api.get<PaymentTransaction[]>('/api/payments/transactions/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get single transaction
  async getTransaction(transactionId: string): Promise<ServiceResponse<PaymentTransaction>> {
    try {
      const response = await api.get<PaymentTransaction>(`/api/payments/transactions/${transactionId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Purchase a course
  async purchaseCourse(request: CoursePurchaseRequest): Promise<ServiceResponse<PaymentTransaction>> {
    try {
      const response = await api.post<PaymentTransaction>('/api/payments/course-purchase/', request);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get subscription plans
  async getPlans(): Promise<ServiceResponse<SubscriptionPlan[]>> {
    try {
      const response = await api.get<SubscriptionPlan[]>('/api/payments/plans/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get user's subscription
  async getSubscription(): Promise<ServiceResponse<UserSubscription | null>> {
    try {
      const response = await api.get<UserSubscription>('/api/payments/subscription/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Purchase subscription
  async purchaseSubscription(request: SubscriptionPurchaseRequest): Promise<ServiceResponse<UserSubscription>> {
    try {
      const response = await api.post<UserSubscription>('/api/payments/subscription-purchase/', request);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Cancel subscription
  async cancelSubscription(): Promise<ServiceResponse<UserSubscription>> {
    try {
      const response = await api.post<UserSubscription>('/api/payments/subscription/cancel/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Validate coupon
  async validateCoupon(code: string): Promise<ServiceResponse<Coupon>> {
    try {
      const response = await api.get<Coupon>(`/api/payments/coupons/${code}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get invoices
  async getInvoices(): Promise<ServiceResponse<Invoice[]>> {
    try {
      const response = await api.get<Invoice[]>('/api/payments/invoices/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Request refund
  async requestRefund(transactionId: string, reason: string): Promise<ServiceResponse<Refund>> {
    try {
      const response = await api.post<Refund>('/api/payments/refunds/', {
        transaction_id: transactionId,
        reason
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get payment analytics
  async getAnalytics(): Promise<ServiceResponse<PaymentAnalytics>> {
    try {
      const response = await api.get<PaymentAnalytics>('/api/payments/analytics/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  }
};

export default paymentService;
