from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PaymentTransactionViewSet, SubscriptionPlanViewSet, UserSubscriptionViewSet,
    CouponViewSet, InvoiceViewSet, RefundViewSet, create_course_purchase,
    create_subscription_purchase, create_payment_intent, confirm_payment,
    request_refund, payment_history, payment_analytics, stripe_webhook
)

router = DefaultRouter()
router.register(r'transactions', PaymentTransactionViewSet)
router.register(r'subscription-plans', SubscriptionPlanViewSet)
router.register(r'subscriptions', UserSubscriptionViewSet)
router.register(r'coupons', CouponViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'refunds', RefundViewSet)

urlpatterns = [
    # ViewSet endpoints
    path('', include(router.urls)),

    # Payment processing endpoints
    path('purchase/course/', create_course_purchase, name='course-purchase'),
    path('purchase/subscription/', create_subscription_purchase, name='subscription-purchase'),
    path('create-payment-intent/', create_payment_intent, name='create-payment-intent'),
    path('confirm-payment/', confirm_payment, name='confirm-payment'),

    # Refund endpoints
    path('request-refund/', request_refund, name='request-refund'),

    # History and analytics
    path('history/', payment_history, name='payment-history'),
    path('analytics/', payment_analytics, name='payment-analytics'),

    # Webhook endpoints
    path('webhooks/stripe/', stripe_webhook, name='stripe-webhook'),
]
