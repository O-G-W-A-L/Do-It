"""
Service layer for payments app.
Separates business logic from views for maintainability and testability.
"""
from datetime import timedelta
from django.db import models, transaction
from django.utils import timezone

from .models import PaymentTransaction, Refund, Coupon, CouponUsage


class PaymentService:
    """
    Service for payment processing logic.
    All payment rules in one place.
    """
    
    VALID_STATUSES = ['pending', 'completed', 'failed', 'refunded', 'partially_refunded']
    GATEWAYS = ['stripe', 'paypal', 'razorpay']
    
    @staticmethod
    @transaction.atomic
    def create_course_purchase(user, course, coupon_code=None):
        """
        Create a course purchase with all related records atomically.
        Returns (transaction, invoice, error)
        
        All writes happen in one transaction - no partial writes.
        """
        from .models import Invoice
        
        # Calculate final amount
        amount = course.price
        discount_amount = 0

        if coupon_code:
            discount_amount, error = CouponApplicationService.apply_coupon(
                coupon_code, user, None
            )
            if error:
                return None, None, error
            amount = max(0, amount - discount_amount)

        # Create payment transaction - all in one transaction
        tx = PaymentTransaction.objects.create(
            user=user,
            amount=amount,
            currency='USD',
            payment_type='course_purchase',
            related_objects={'course_id': course.id},
            status='pending'
        )

        # Create invoice
        invoice = Invoice.objects.create(
            user=user,
            transaction=tx,
            subtotal=course.price,
            discount_amount=discount_amount,
            total=amount,
            due_date=timezone.now()
        )

        return tx, invoice, None

    @staticmethod
    @transaction.atomic
    def create_subscription_purchase(user, plan, gateway='stripe'):
        """
        Create a subscription purchase atomically.
        Returns (transaction, subscription, error)
        """
        from .models import Subscription
        
        # Create payment transaction
        tx = PaymentTransaction.objects.create(
            user=user,
            amount=plan.price,
            currency='USD',
            payment_type='subscription',
            gateway=gateway,
            related_objects={'plan_id': plan.id},
            status='pending'
        )
        
        # Create subscription
        subscription = Subscription.objects.create(
            user=user,
            plan=plan,
            status='trialing',
            current_period_start=timezone.now(),
            current_period_end=timezone.now() + timedelta(days=30)
        )
        
        return tx, subscription, None
    
    @staticmethod
    @transaction.atomic
    def create_payment(user, amount, payment_type, gateway='stripe', coupon_code=None):
        """
        Create a payment with optional coupon application.
        Returns (transaction, error)
        """
        # Validate inputs
        if amount <= 0:
            return None, "Amount must be positive"
        
        if gateway not in PaymentService.GATEWAYS:
            return None, f"Invalid gateway: {gateway}"
        
        # Create transaction
        tx = PaymentTransaction.objects.create(
            user=user,
            amount=amount,
            payment_type=payment_type,
            gateway=gateway,
            status='pending'
        )
        
        # Apply coupon if provided - call CouponApplicationService directly
        discount = 0
        if coupon_code:
            discount, error = CouponApplicationService.apply_coupon(coupon_code, user, tx)
            if error:
                tx.status = 'failed'
                tx.save(update_fields=['status'])
                return None, error
        
        tx.final_amount = tx.amount - discount
        tx.save(update_fields=['final_amount'])
        
        return tx, None
    
    @staticmethod
    @transaction.atomic
    def process_payment(tx, gateway_transaction_id):
        """
        Mark payment as completed.
        """
        if tx.status != 'pending':
            return False, "Payment not in pending state"
        
        # Check for duplicate gateway ID
        if PaymentTransaction.objects.filter(
            gateway_transaction_id=gateway_transaction_id
        ).exists():
            return False, "Duplicate transaction"
        
        tx.gateway_transaction_id = gateway_transaction_id
        tx.status = 'completed'
        tx.completed_at = timezone.now()
        tx.save(update_fields=['gateway_transaction_id', 'status', 'completed_at'])
        
        return True, None
    
    @staticmethod
    def mark_completed(tx, gateway_transaction_id=None):
        """Mark transaction as completed."""
        tx.status = 'completed'
        tx.processed_at = timezone.now()
        if gateway_transaction_id:
            tx.gateway_transaction_id = gateway_transaction_id
        tx.save()

    @staticmethod
    def mark_failed(tx, reason=None):
        """Mark transaction as failed."""
        tx.status = 'failed'
        tx.failure_reason = reason or 'Payment failed'
        tx.save()

    @staticmethod
    @transaction.atomic
    def process_refund(tx, refund_amount=None, reason=None, processed_by=None):
        """
        Process refund with proper validation.
        """
        if refund_amount is None:
            refund_amount = tx.amount
        
        if refund_amount > tx.amount:
            return None, "Refund amount exceeds payment"
        
        if tx.status not in ['completed', 'partially_refunded']:
            return None, "Transaction cannot be refunded"
        
        # Create refund
        refund = Refund.objects.create(
            original_transaction=tx,
            amount=refund_amount,
            reason=reason,
            processed_by=processed_by or tx.user
        )
        
        # Update transaction status
        if refund_amount == tx.amount:
            tx.status = 'refunded'
        else:
            tx.status = 'partially_refunded'
        
        tx.save(update_fields=['status', 'updated_at'])
        
        return refund, None
    
    @staticmethod
    def get_transaction_history(user, payment_type=None):
        """Get user's payment history."""
        qs = PaymentTransaction.objects.filter(user=user)
        
        if payment_type:
            qs = qs.filter(payment_type=payment_type)
        
        return qs.order_by('-created_at')
    
    @staticmethod
    def calculate_revenue(course_id=None):
        """Calculate revenue, optionally by course."""
        # Note: For course-specific revenue, use EnrollmentService.get_course_revenue()
        # This keeps payments service focused on payment logic only
        
        qs = PaymentTransaction.objects.filter(status='completed')
        
        if course_id:
            # Only count transactions with course_id in metadata
            qs = qs.filter(metadata__course_id=course_id)
        
        return qs.aggregate(total=models.Sum('amount'))


class CouponApplicationService:
    """
    Service for coupon application - owns all coupon logic.
    Payments app owns coupons, courses app uses them.
    """
    
    @staticmethod
    @transaction.atomic
    def apply_coupon(coupon_code, user, transaction_obj):
        """
        Apply coupon to transaction atomically.
        Returns (discount_amount or 0, error or None)
        
        Note: This is the ONLY method for applying coupons.
        Courses should call this, not implement their own coupon logic.
        """
        try:
            coupon = Coupon.objects.get(code=coupon_code, is_active=True)
        except Coupon.DoesNotExist:
            return 0, "Invalid coupon code"
        
        # Use the atomic method we added to the model
        try:
            coupon.use(user, transaction_obj)
            return coupon.calculate_discount(transaction_obj.amount), None
        except ValueError as e:
            return 0, str(e)
    
    @staticmethod
    def calculate_discount(coupon, amount):
        """Calculate discount amount based on coupon type."""
        if coupon.discount_type == 'percentage':
            return (amount * coupon.discount_value) / 100
        elif coupon.discount_type == 'fixed':
            return min(coupon.discount_value, amount)
        return 0


class SubscriptionService:
    """
    Service for subscription management.
    """
    
    @staticmethod
    @transaction.atomic
    def create_subscription(user, plan, gateway='stripe'):
        """Create new subscription."""
        from .models import Subscription
        
        # Check for existing active subscription
        if Subscription.objects.filter(user=user, status='active').exists():
            return None, "Active subscription already exists"
        
        sub = Subscription.objects.create(
            user=user,
            plan=plan,
            gateway=gateway,
            status='active',
            start_date=timezone.now()
        )
        
        return sub, None
    
    @staticmethod
    @transaction.atomic
    def cancel_subscription(subscription):
        """Cancel subscription."""
        subscription.status = 'cancelled'
        subscription.end_date = timezone.now()
        subscription.save(update_fields=['status', 'end_date'])
        return True
