from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import (
    PaymentTransaction, SubscriptionPlan, UserSubscription,
    Coupon, CouponUsage, Invoice, Refund, PaymentWebhook
)
from .serializers import (
    PaymentTransactionSerializer, SubscriptionPlanSerializer, UserSubscriptionSerializer,
    CouponSerializer, CouponUsageSerializer, InvoiceSerializer, RefundSerializer,
    PaymentWebhookSerializer, CoursePurchaseSerializer, SubscriptionPurchaseSerializer,
    PaymentIntentSerializer, RefundRequestSerializer, PaymentAnalyticsSerializer
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class PaymentTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for payment transaction history (read-only for users)
    """
    queryset = PaymentTransaction.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentTransactionSerializer

    def get_queryset(self):
        user = self.request.user

        if user.profile.is_admin:
            return PaymentTransaction.objects.all()
        else:
            return PaymentTransaction.objects.filter(user=user)


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for subscription plans (read-only)
    """
    permission_classes = [AllowAny]
    serializer_class = SubscriptionPlanSerializer
    queryset = SubscriptionPlan.objects.filter(status='active')


class UserSubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user subscription management
    """
    queryset = UserSubscription.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = UserSubscriptionSerializer

    def get_queryset(self):
        user = self.request.user

        if user.profile.is_admin:
            return UserSubscription.objects.all()
        else:
            return UserSubscription.objects.filter(user=user)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a subscription"""
        subscription = self.get_object()

        # Only subscription owner or admin can cancel
        if subscription.user != request.user and not request.user.profile.is_admin:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        cancel_at_period_end = request.data.get('cancel_at_period_end', True)
        subscription.cancel(cancel_at_period_end)

        serializer = self.get_serializer(subscription)
        return Response(serializer.data)


class CouponViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for coupon information (read-only)
    """
    queryset = Coupon.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = CouponSerializer

    def get_queryset(self):
        # Only return active coupons
        return Coupon.objects.filter(is_active=True)


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for invoice access
    """
    queryset = Invoice.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        user = self.request.user

        if user.profile.is_admin:
            return Invoice.objects.all()
        else:
            return Invoice.objects.filter(user=user)


class RefundViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for refund history
    """
    queryset = Refund.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = RefundSerializer

    def get_queryset(self):
        user = self.request.user

        if user.profile.is_admin:
            return Refund.objects.all()
        else:
            return Refund.objects.filter(original_transaction__user=user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_course_purchase(request):
    """Create a course purchase transaction"""
    serializer = CoursePurchaseSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        course_id = serializer.validated_data['course_id']
        coupon_code = serializer.validated_data.get('coupon_code')

        # Get course details
        from courses.models import Course
        course = Course.objects.get(id=course_id)

        # Calculate final amount
        amount = course.price
        discount_amount = 0

        if coupon_code:
            coupon = Coupon.objects.get(code=coupon_code)
            if coupon.discount_type == 'percentage':
                discount_amount = amount * (coupon.discount_value / 100)
            else:
                discount_amount = min(coupon.discount_value, amount)

            amount -= discount_amount

        # Create payment transaction first
        transaction = PaymentTransaction.objects.create(
            user=request.user,
            amount=amount,
            currency='USD',
            payment_type='course_purchase',
            related_objects={'course_id': course_id},
            status='pending'
        )

        # Record coupon usage with transaction
        if coupon_code:
            CouponUsage.objects.create(
                coupon=coupon,
                user=request.user,
                transaction=transaction,
                discount_amount=discount_amount
            )

        # Create invoice
        Invoice.objects.create(
            user=request.user,
            transaction=transaction,
            subtotal=course.price,
            discount_amount=discount_amount,
            total=amount,
            due_date=timezone.now()  # Due immediately
        )

        return Response({
            'transaction_id': str(transaction.transaction_id),
            'amount': amount,
            'currency': 'USD',
            'course_title': course.title
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_subscription_purchase(request):
    """Create a subscription purchase transaction"""
    serializer = SubscriptionPurchaseSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        plan_id = serializer.validated_data['plan_id']
        coupon_code = serializer.validated_data.get('coupon_code')

        # Get plan details
        plan = SubscriptionPlan.objects.get(id=plan_id)

        # Calculate final amount
        amount = plan.price
        discount_amount = 0

        if coupon_code:
            coupon = Coupon.objects.get(code=coupon_code)
            if coupon.discount_type == 'percentage':
                discount_amount = amount * (coupon.discount_value / 100)
            else:
                discount_amount = min(coupon.discount_value, amount)

            amount -= discount_amount

        # Create payment transaction first
        transaction = PaymentTransaction.objects.create(
            user=request.user,
            amount=amount,
            currency=plan.currency,
            payment_type='subscription',
            related_objects={'plan_id': plan_id},
            status='pending'
        )

        # Record coupon usage with transaction
        if coupon_code:
            CouponUsage.objects.create(
                coupon=coupon,
                user=request.user,
                transaction=transaction,
                discount_amount=discount_amount
            )

        # Create invoice
        Invoice.objects.create(
            user=request.user,
            transaction=transaction,
            subtotal=plan.price,
            discount_amount=discount_amount,
            total=amount,
            due_date=timezone.now()  # Due immediately
        )

        return Response({
            'transaction_id': str(transaction.transaction_id),
            'amount': amount,
            'currency': plan.currency,
            'plan_name': plan.name
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_intent(request):
    """Create a Stripe payment intent"""
    serializer = PaymentIntentSerializer(data=request.data)
    if serializer.is_valid():
        amount = serializer.validated_data['amount']
        currency = serializer.validated_data['currency']
        payment_type = serializer.validated_data['payment_type']
        related_objects = serializer.validated_data['related_objects']
        coupon_code = serializer.validated_data.get('coupon_code')

        # Apply coupon discount if provided
        discount_amount = 0
        if coupon_code:
            coupon = Coupon.objects.get(code=coupon_code)
            if coupon.discount_type == 'percentage':
                discount_amount = amount * (coupon.discount_value / 100)
            else:
                discount_amount = min(coupon.discount_value, amount)
            amount -= discount_amount

        # Convert amount to cents for Stripe
        amount_cents = int(amount * 100)

        try:
            # This would integrate with Stripe in production
            # For now, we'll simulate the payment intent creation
            payment_intent_data = {
                'id': f'pi_simulated_{timezone.now().timestamp()}',
                'client_secret': f'sk_test_simulated_{timezone.now().timestamp()}',
                'amount': amount_cents,
                'currency': currency,
                'status': 'requires_payment_method'
            }

            # Create transaction record
            transaction = PaymentTransaction.objects.create(
                user=request.user,
                amount=amount,
                currency=currency.upper(),
                payment_type=payment_type,
                related_objects=related_objects,
                gateway='stripe',
                status='pending'
            )

            return Response({
                'payment_intent': payment_intent_data,
                'transaction_id': str(transaction.transaction_id)
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_payment(request):
    """Confirm payment completion"""
    transaction_id = request.data.get('transaction_id')
    payment_intent_id = request.data.get('payment_intent_id')

    if not transaction_id:
        return Response({'detail': 'transaction_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        transaction = PaymentTransaction.objects.get(
            transaction_id=transaction_id,
            user=request.user
        )

        # Mark transaction as completed
        transaction.mark_completed(payment_intent_id)

        # Process related business logic
        if transaction.payment_type == 'course_purchase':
            # Grant course access
            course_id = transaction.related_objects.get('course_id')
            from courses.models import Enrollment
            Enrollment.objects.get_or_create(
                student=request.user,
                course_id=course_id,
                defaults={'status': 'active'}
            )

        elif transaction.payment_type == 'subscription':
            # Create subscription
            plan_id = transaction.related_objects.get('plan_id')
            plan = SubscriptionPlan.objects.get(id=plan_id)

            # Calculate subscription dates
            now = timezone.now()
            if plan.plan_type == 'monthly':
                period_end = now.replace(month=now.month + 1)
            elif plan.plan_type == 'quarterly':
                period_end = now.replace(month=now.month + 3)
            elif plan.plan_type == 'annual':
                period_end = now.replace(year=now.year + 1)
            else:  # lifetime
                period_end = now.replace(year=now.year + 100)

            UserSubscription.objects.create(
                user=request.user,
                plan=plan,
                current_period_start=now,
                current_period_end=period_end,
                status='active'
            )

        # Mark invoice as paid
        invoice = transaction.invoice
        if invoice:
            invoice.mark_paid()

        return Response({'detail': 'Payment confirmed successfully'})

    except PaymentTransaction.DoesNotExist:
        return Response({'detail': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_refund(request):
    """Request a refund for a transaction"""
    serializer = RefundRequestSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        transaction_id = serializer.validated_data['transaction_id']
        amount = serializer.validated_data.get('amount')
        reason = serializer.validated_data['reason']

        transaction = PaymentTransaction.objects.get(
            transaction_id=transaction_id,
            user=request.user
        )

        # Create refund request
        refund = transaction.process_refund(amount, reason)

        return Response({
            'refund_id': str(refund.refund_id),
            'status': refund.status,
            'amount': refund.amount
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_history(request):
    """Get user's payment history with filtering"""
    user = request.user

    # Filtering parameters
    payment_type = request.query_params.get('payment_type')
    status_filter = request.query_params.get('status')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')

    queryset = PaymentTransaction.objects.filter(user=user)

    if payment_type:
        queryset = queryset.filter(payment_type=payment_type)
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    if date_from:
        queryset = queryset.filter(created_at__gte=date_from)
    if date_to:
        queryset = queryset.filter(created_at__lte=date_to)

    serializer = PaymentTransactionSerializer(queryset, many=True)
    return Response({'transactions': serializer.data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_analytics(request):
    """Get payment analytics for admin users"""
    user = request.user

    if not user.profile.is_admin:
        return Response({'detail': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    # Calculate analytics
    total_revenue = PaymentTransaction.objects.filter(
        status='completed'
    ).aggregate(total=Sum('amount'))['total'] or 0

    total_transactions = PaymentTransaction.objects.count()
    successful_transactions = PaymentTransaction.objects.filter(status='completed').count()
    failed_transactions = PaymentTransaction.objects.filter(status='failed').count()

    refund_amount = Refund.objects.filter(
        status='completed'
    ).aggregate(total=Sum('amount'))['total'] or 0

    avg_transaction_value = PaymentTransaction.objects.filter(
        status='completed'
    ).aggregate(avg=Avg('amount'))['avg'] or 0

    # Revenue by payment type
    revenue_by_type = PaymentTransaction.objects.filter(
        status='completed'
    ).values('payment_type').annotate(
        total=Sum('amount')
    ).order_by('-total')

    # Simple conversion rate (successful transactions / total attempts)
    conversion_rate = (successful_transactions / total_transactions * 100) if total_transactions > 0 else 0

    analytics_data = {
        'total_revenue': total_revenue,
        'total_transactions': total_transactions,
        'successful_transactions': successful_transactions,
        'failed_transactions': failed_transactions,
        'refund_amount': refund_amount,
        'average_transaction_value': avg_transaction_value,
        'revenue_by_payment_type': list(revenue_by_type),
        'conversion_rate': round(conversion_rate, 2)
    }

    serializer = PaymentAnalyticsSerializer(analytics_data)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """Handle Stripe webhook events"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        # This would verify the webhook signature in production
        # For now, we'll process the webhook payload

        import json
        event = json.loads(payload)

        # Create webhook record
        webhook = PaymentWebhook.objects.create(
            gateway='stripe',
            event_type=event.get('type'),
            event_id=event.get('id'),
            payload=event
        )

        # Process the event
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            # Find and update transaction
            transaction = PaymentTransaction.objects.filter(
                gateway_transaction_id=payment_intent['id']
            ).first()

            if transaction:
                transaction.mark_completed(payment_intent['id'])

        elif event['type'] == 'invoice.payment_succeeded':
            # Handle subscription payments
            pass

        webhook.mark_processed()
        return Response({'status': 'success'})

    except Exception as e:
        PaymentWebhook.objects.create(
            gateway='stripe',
            event_type='error',
            event_id='unknown',
            payload={'error': str(e)},
            processed=True,
            error_message=str(e)
        )
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
