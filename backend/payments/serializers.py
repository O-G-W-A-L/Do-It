from rest_framework import serializers
from django.utils import timezone
from .models import (
    PaymentTransaction, SubscriptionPlan, UserSubscription,
    Coupon, CouponUsage, Invoice, Refund, PaymentWebhook
)


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer for payment transactions"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'transaction_id', 'user', 'user_name', 'amount', 'currency',
            'payment_type', 'gateway', 'gateway_transaction_id', 'status',
            'related_objects', 'payment_method', 'processed_at', 'failure_reason',
            'ip_address', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'transaction_id', 'user', 'processed_at', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        """Create payment transaction with user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans"""
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'plan_type', 'price', 'currency',
            'features', 'trial_days', 'grace_period_days', 'status',
            'is_popular', 'stripe_price_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for user subscriptions"""
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_price = serializers.DecimalField(source='plan.price', max_digits=10, decimal_places=2, read_only=True)
    plan_currency = serializers.CharField(source='plan.currency', read_only=True)

    class Meta:
        model = UserSubscription
        fields = [
            'id', 'user', 'plan', 'plan_name', 'plan_price', 'plan_currency',
            'status', 'current_period_start', 'current_period_end',
            'stripe_subscription_id', 'cancel_at_period_end',
            'trial_end', 'grace_period_end', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        """Create user subscription with user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CouponSerializer(serializers.ModelSerializer):
    """Serializer for coupons"""
    usage_count = serializers.ReadOnlyField()

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'max_uses', 'max_uses_per_user', 'valid_from', 'valid_until',
            'applicable_plans', 'applicable_courses', 'is_active',
            'usage_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']


class CouponUsageSerializer(serializers.ModelSerializer):
    """Serializer for coupon usage tracking"""
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = CouponUsage
        fields = [
            'id', 'coupon', 'coupon_code', 'user', 'user_name',
            'transaction', 'discount_amount', 'used_at'
        ]
        read_only_fields = ['id', 'used_at']


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for invoices"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    transaction_details = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'user', 'user_name', 'transaction',
            'transaction_details', 'status', 'subtotal', 'tax_amount',
            'discount_amount', 'total', 'billing_address', 'payment_terms',
            'issued_at', 'due_date', 'paid_at', 'pdf_file', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'invoice_number', 'user', 'transaction', 'transaction_details',
            'issued_at', 'paid_at', 'pdf_file', 'created_at', 'updated_at'
        ]

    def get_transaction_details(self, obj):
        """Get transaction details for invoice display"""
        transaction = obj.transaction
        return {
            'amount': transaction.amount,
            'currency': transaction.currency,
            'payment_type': transaction.payment_type,
            'status': transaction.status
        }


class RefundSerializer(serializers.ModelSerializer):
    """Serializer for refunds"""
    original_transaction_details = serializers.SerializerMethodField()
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)

    class Meta:
        model = Refund
        fields = [
            'id', 'refund_id', 'original_transaction', 'original_transaction_details',
            'amount', 'gateway_refund_id', 'status', 'reason',
            'processed_by', 'processed_by_name', 'processed_at',
            'failure_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'refund_id', 'processed_at', 'created_at', 'updated_at'
        ]

    def get_original_transaction_details(self, obj):
        """Get original transaction details"""
        transaction = obj.original_transaction
        return {
            'transaction_id': str(transaction.transaction_id),
            'amount': transaction.amount,
            'currency': transaction.currency,
            'payment_type': transaction.payment_type
        }


class PaymentWebhookSerializer(serializers.ModelSerializer):
    """Serializer for payment webhooks"""
    class Meta:
        model = PaymentWebhook
        fields = [
            'id', 'gateway', 'event_type', 'event_id', 'payload',
            'processed', 'processed_at', 'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'processed_at', 'created_at']


# Specialized serializers for specific use cases

class CoursePurchaseSerializer(serializers.Serializer):
    """Serializer for course purchase requests"""
    course_id = serializers.IntegerField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    payment_method_id = serializers.CharField(required=False)

    def validate_course_id(self, value):
        """Validate course exists and is purchasable"""
        from courses.models import Course
        try:
            course = Course.objects.get(id=value)
            if not course.is_free and course.status == 'published':
                return value
            elif course.is_free:
                raise serializers.ValidationError("This course is free and doesn't require payment")
            else:
                raise serializers.ValidationError("Course is not available for purchase")
        except Course.DoesNotExist:
            raise serializers.ValidationError("Course not found")

    def validate_coupon_code(self, value):
        """Validate coupon if provided"""
        if value:
            from .models import Coupon
            try:
                coupon = Coupon.objects.get(code=value.upper())
                user = self.context['request'].user
                can_use, reason = coupon.can_be_used_by(user)
                if not can_use:
                    raise serializers.ValidationError(reason)
                return value.upper()
            except Coupon.DoesNotExist:
                raise serializers.ValidationError("Invalid coupon code")
        return value


class SubscriptionPurchaseSerializer(serializers.Serializer):
    """Serializer for subscription purchase requests"""
    plan_id = serializers.IntegerField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    payment_method_id = serializers.CharField(required=False)

    def validate_plan_id(self, value):
        """Validate subscription plan exists and is active"""
        try:
            plan = SubscriptionPlan.objects.get(id=value, status='active')
            return value
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError("Subscription plan not found or not available")

    def validate_coupon_code(self, value):
        """Validate coupon if provided"""
        if value:
            from .models import Coupon
            try:
                coupon = Coupon.objects.get(code=value.upper())
                user = self.context['request'].user
                can_use, reason = coupon.can_be_used_by(user)
                if not can_use:
                    raise serializers.ValidationError(reason)
                return value.upper()
            except Coupon.DoesNotExist:
                raise serializers.ValidationError("Invalid coupon code")
        return value


class PaymentIntentSerializer(serializers.Serializer):
    """Serializer for Stripe payment intent creation"""
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(max_length=3, default='usd')
    payment_type = serializers.ChoiceField(choices=[
        ('course_purchase', 'Course Purchase'),
        ('subscription', 'Subscription'),
    ])
    related_objects = serializers.JSONField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)


class RefundRequestSerializer(serializers.Serializer):
    """Serializer for refund requests"""
    transaction_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    reason = serializers.CharField(max_length=500)

    def validate_transaction_id(self, value):
        """Validate transaction exists and belongs to user"""
        from .models import PaymentTransaction
        try:
            transaction = PaymentTransaction.objects.get(
                transaction_id=value,
                user=self.context['request'].user
            )
            # Check if transaction is eligible for refund
            if transaction.status not in ['completed']:
                raise serializers.ValidationError("Transaction is not eligible for refund")
            return value
        except PaymentTransaction.DoesNotExist:
            raise serializers.ValidationError("Transaction not found")


class PaymentAnalyticsSerializer(serializers.Serializer):
    """Serializer for payment analytics data"""
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_transactions = serializers.IntegerField()
    successful_transactions = serializers.IntegerField()
    failed_transactions = serializers.IntegerField()
    refund_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    average_transaction_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    revenue_by_payment_type = serializers.JSONField()
    revenue_trend = serializers.JSONField()
    top_courses = serializers.JSONField()
    conversion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
