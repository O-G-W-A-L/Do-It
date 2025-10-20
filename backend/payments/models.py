from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
import uuid


class PaymentTransaction(models.Model):
    """
    Core payment transaction model for all financial operations
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]

    PAYMENT_TYPE_CHOICES = [
        ('course_purchase', 'Course Purchase'),
        ('subscription', 'Subscription'),
        ('certification', 'Certification'),
        ('premium_access', 'Premium Access'),
    ]

    GATEWAY_CHOICES = [
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('manual', 'Manual'),
    ]

    # Core transaction data
    transaction_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')

    # Transaction details
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES, default='stripe')
    gateway_transaction_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Related objects (JSON for flexibility)
    related_objects = models.JSONField(help_text="Links to courses, subscriptions, etc.")

    # Payment method details (encrypted/tokenized)
    payment_method = models.JSONField(blank=True, null=True)

    # Processing details
    processed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True)

    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['gateway', 'status']),
            models.Index(fields=['payment_type', 'status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.payment_type} - {self.amount} {self.currency}"

    def mark_completed(self, gateway_transaction_id=None):
        """Mark transaction as completed"""
        self.status = 'completed'
        self.processed_at = timezone.now()
        if gateway_transaction_id:
            self.gateway_transaction_id = gateway_transaction_id
        self.save()

    def mark_failed(self, reason=None):
        """Mark transaction as failed"""
        self.status = 'failed'
        self.failure_reason = reason or 'Payment failed'
        self.save()

    def process_refund(self, refund_amount=None, reason=None):
        """Process a refund for this transaction"""
        if refund_amount is None:
            refund_amount = self.amount

        refund = Refund.objects.create(
            original_transaction=self,
            amount=refund_amount,
            reason=reason,
            processed_by=self.user
        )

        if refund_amount == self.amount:
            self.status = 'refunded'
        else:
            self.status = 'partially_refunded'

        self.save()
        return refund


class SubscriptionPlan(models.Model):
    """
    Subscription plans for recurring payments
    """
    PLAN_TYPE_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual'),
        ('lifetime', 'Lifetime'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')

    # Features included
    features = models.JSONField(help_text="List of features included in this plan")

    # Billing settings
    trial_days = models.PositiveIntegerField(default=0)
    grace_period_days = models.PositiveIntegerField(default=3)

    # Status and visibility
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_popular = models.BooleanField(default=False)

    # Metadata
    stripe_price_id = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['price']

    def __str__(self):
        return f"{self.name} - {self.price} {self.currency}/{self.plan_type}"


class UserSubscription(models.Model):
    """
    User's active subscriptions
    """
    STATUS_CHOICES = [
        ('trialing', 'Trialing'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE, related_name='subscriptions')

    # Subscription details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trialing')
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()

    # Payment details
    stripe_subscription_id = models.CharField(max_length=100, blank=True, null=True)
    cancel_at_period_end = models.BooleanField(default=False)

    # Trial and grace periods
    trial_end = models.DateTimeField(null=True, blank=True)
    grace_period_end = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'plan']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.plan.name}"

    def is_active(self):
        """Check if subscription is currently active"""
        return self.status in ['trialing', 'active'] and not self.cancel_at_period_end

    def cancel(self, cancel_at_period_end=True):
        """Cancel the subscription"""
        self.cancel_at_period_end = cancel_at_period_end
        if not cancel_at_period_end:
            self.status = 'cancelled'
        self.save()


class Coupon(models.Model):
    """
    Discount coupons and promotional codes
    """
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]

    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)

    # Usage limits
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    max_uses_per_user = models.PositiveIntegerField(default=1)

    # Validity period
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()

    # Applicable items
    applicable_plans = models.ManyToManyField(SubscriptionPlan, blank=True)
    applicable_courses = models.JSONField(blank=True, null=True)  # Course IDs

    # Status
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} - {self.discount_value}{'%' if self.discount_type == 'percentage' else '$'}"

    def is_valid(self):
        """Check if coupon is currently valid"""
        now = timezone.now()
        return (
            self.is_active and
            self.valid_from <= now <= self.valid_until and
            (self.max_uses is None or self.usage_count < self.max_uses)
        )

    @property
    def usage_count(self):
        """Get total usage count"""
        return CouponUsage.objects.filter(coupon=self).count()

    def can_be_used_by(self, user):
        """Check if user can use this coupon"""
        if not self.is_valid():
            return False, "Coupon is not valid"

        user_uses = CouponUsage.objects.filter(coupon=self, user=user).count()
        if user_uses >= self.max_uses_per_user:
            return False, f"Coupon can only be used {self.max_uses_per_user} time(s) per user"

        return True, "Valid"


class CouponUsage(models.Model):
    """
    Track coupon usage
    """
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coupon_usages')
    transaction = models.ForeignKey(PaymentTransaction, on_delete=models.CASCADE, related_name='coupon_usages')

    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['coupon', 'transaction']

    def __str__(self):
        return f"{self.coupon.code} used by {self.user.username}"


class Invoice(models.Model):
    """
    Generated invoices for payments
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    transaction = models.OneToOneField(PaymentTransaction, on_delete=models.CASCADE, related_name='invoice')

    # Invoice details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    # Billing information
    billing_address = models.JSONField(blank=True, null=True)
    payment_terms = models.CharField(max_length=100, default='Due immediately')

    # Dates
    issued_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    paid_at = models.DateTimeField(null=True, blank=True)

    # File storage
    pdf_file = models.FileField(upload_to='invoices/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issued_at']

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.username}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Generate invoice number
            import datetime
            today = datetime.date.today()
            self.invoice_number = f"INV-{today.year}{today.month:02d}-{self.user.id:04d}-{PaymentTransaction.objects.filter(user=self.user).count() + 1:04d}"

        super().save(*args, **kwargs)

    def mark_paid(self):
        """Mark invoice as paid"""
        self.status = 'paid'
        self.paid_at = timezone.now()
        self.save()


class Refund(models.Model):
    """
    Refund records for transactions
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    refund_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    original_transaction = models.ForeignKey(PaymentTransaction, on_delete=models.CASCADE, related_name='refunds')
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    # Processing details
    gateway_refund_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reason = models.TextField(blank=True)

    # Audit
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='processed_refunds')
    processed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Refund {self.refund_id} - {self.amount}"

    def mark_completed(self, gateway_refund_id=None):
        """Mark refund as completed"""
        self.status = 'completed'
        self.processed_at = timezone.now()
        if gateway_refund_id:
            self.gateway_refund_id = gateway_refund_id
        self.save()

    def mark_failed(self, reason=None):
        """Mark refund as failed"""
        self.status = 'failed'
        self.failure_reason = reason or 'Refund failed'
        self.save()


class PaymentWebhook(models.Model):
    """
    Store payment gateway webhooks for processing
    """
    gateway = models.CharField(max_length=20)
    event_type = models.CharField(max_length=100)
    event_id = models.CharField(max_length=255, unique=True)
    payload = models.JSONField()

    processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['gateway', 'processed']),
            models.Index(fields=['event_id']),
        ]

    def __str__(self):
        return f"{self.gateway} - {self.event_type} - {self.event_id}"

    def mark_processed(self):
        """Mark webhook as processed"""
        self.processed = True
        self.processed_at = timezone.now()
        self.save()
