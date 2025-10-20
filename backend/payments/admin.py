from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    PaymentTransaction, SubscriptionPlan, UserSubscription,
    Coupon, CouponUsage, Invoice, Refund, PaymentWebhook
)


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'user', 'payment_type', 'amount', 'currency', 'status', 'gateway', 'created_at')
    list_filter = ('status', 'payment_type', 'gateway', 'created_at', 'currency')
    search_fields = ('transaction_id', 'user__username', 'user__email', 'gateway_transaction_id')
    readonly_fields = ('transaction_id', 'processed_at', 'created_at', 'updated_at')

    fieldsets = (
        ('Transaction Info', {
            'fields': ('transaction_id', 'user', 'payment_type', 'gateway', 'gateway_transaction_id')
        }),
        ('Payment Details', {
            'fields': ('amount', 'currency', 'status', 'related_objects', 'payment_method')
        }),
        ('Processing', {
            'fields': ('processed_at', 'failure_reason', 'ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

    actions = ['mark_completed', 'mark_failed']

    def mark_completed(self, request, queryset):
        updated = 0
        for transaction in queryset.filter(status__in=['pending', 'processing']):
            transaction.mark_completed()
            updated += 1
        self.message_user(request, f'Marked {updated} transactions as completed.')
    mark_completed.short_description = 'Mark selected transactions as completed'

    def mark_failed(self, request, queryset):
        updated = 0
        for transaction in queryset.filter(status__in=['pending', 'processing']):
            transaction.mark_failed('Marked as failed by admin')
            updated += 1
        self.message_user(request, f'Marked {updated} transactions as failed.')
    mark_failed.short_description = 'Mark selected transactions as failed'


class SubscriptionPlanFeaturesInline(admin.TabularInline):
    model = SubscriptionPlan
    extra = 0
    fields = ('name', 'features')
    readonly_fields = ('features',)
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'plan_type', 'price', 'currency', 'status', 'is_popular', 'created_at')
    list_filter = ('plan_type', 'status', 'is_popular', 'currency')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Plan Info', {
            'fields': ('name', 'description', 'plan_type', 'price', 'currency')
        }),
        ('Features', {
            'fields': ('features',)
        }),
        ('Settings', {
            'fields': ('trial_days', 'grace_period_days', 'status', 'is_popular', 'stripe_price_id')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'status', 'current_period_start', 'current_period_end', 'cancel_at_period_end')
    list_filter = ('status', 'plan__plan_type', 'cancel_at_period_end', 'current_period_start')
    search_fields = ('user__username', 'user__email', 'plan__name')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Subscription Info', {
            'fields': ('user', 'plan', 'status')
        }),
        ('Billing Period', {
            'fields': ('current_period_start', 'current_period_end', 'stripe_subscription_id')
        }),
        ('Settings', {
            'fields': ('cancel_at_period_end', 'trial_end', 'grace_period_end')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['cancel_subscriptions']

    def cancel_subscriptions(self, request, queryset):
        updated = 0
        for subscription in queryset.filter(status='active'):
            subscription.cancel()
            updated += 1
        self.message_user(request, f'Cancelled {updated} subscriptions.')
    cancel_subscriptions.short_description = 'Cancel selected subscriptions'


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'is_active', 'usage_count', 'max_uses', 'valid_until')
    list_filter = ('discount_type', 'is_active', 'valid_from', 'valid_until')
    search_fields = ('code', 'description')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Coupon Info', {
            'fields': ('code', 'description', 'discount_type', 'discount_value')
        }),
        ('Usage Limits', {
            'fields': ('max_uses', 'max_uses_per_user')
        }),
        ('Validity', {
            'fields': ('valid_from', 'valid_until', 'is_active')
        }),
        ('Applicability', {
            'fields': ('applicable_plans', 'applicable_courses')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = ('coupon', 'user', 'transaction', 'discount_amount', 'used_at')
    list_filter = ('used_at', 'coupon__code')
    search_fields = ('coupon__code', 'user__username', 'transaction__transaction_id')
    readonly_fields = ('used_at',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('coupon', 'user', 'transaction')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'user', 'total', 'status', 'issued_at', 'due_date', 'paid_at')
    list_filter = ('status', 'issued_at', 'due_date', 'paid_at')
    search_fields = ('invoice_number', 'user__username', 'user__email')
    readonly_fields = ('invoice_number', 'issued_at', 'paid_at', 'created_at', 'updated_at')

    fieldsets = (
        ('Invoice Info', {
            'fields': ('invoice_number', 'user', 'transaction')
        }),
        ('Amounts', {
            'fields': ('subtotal', 'tax_amount', 'discount_amount', 'total')
        }),
        ('Status', {
            'fields': ('status', 'issued_at', 'due_date', 'paid_at')
        }),
        ('Billing Info', {
            'fields': ('billing_address', 'payment_terms')
        }),
        ('File', {
            'fields': ('pdf_file',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['mark_paid', 'generate_pdf']

    def mark_paid(self, request, queryset):
        updated = 0
        for invoice in queryset.filter(status__in=['sent', 'overdue']):
            invoice.mark_paid()
            updated += 1
        self.message_user(request, f'Marked {updated} invoices as paid.')
    mark_paid.short_description = 'Mark selected invoices as paid'

    def generate_pdf(self, request, queryset):
        # This would implement PDF generation in production
        self.message_user(request, 'PDF generation not implemented in demo.')
    generate_pdf.short_description = 'Generate PDF for selected invoices'


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('refund_id', 'original_transaction', 'amount', 'status', 'processed_by', 'processed_at')
    list_filter = ('status', 'processed_at', 'created_at')
    search_fields = ('refund_id', 'original_transaction__transaction_id', 'processed_by__username')
    readonly_fields = ('refund_id', 'processed_at', 'created_at', 'updated_at')

    fieldsets = (
        ('Refund Info', {
            'fields': ('refund_id', 'original_transaction', 'amount', 'reason')
        }),
        ('Processing', {
            'fields': ('gateway_refund_id', 'status', 'processed_by', 'processed_at', 'failure_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['process_refunds', 'mark_completed']

    def process_refunds(self, request, queryset):
        updated = 0
        for refund in queryset.filter(status='pending'):
            refund.mark_completed()
            updated += 1
        self.message_user(request, f'Processed {updated} refunds.')
    process_refunds.short_description = 'Process selected refunds'

    def mark_completed(self, request, queryset):
        updated = 0
        for refund in queryset.filter(status='processing'):
            refund.mark_completed()
            updated += 1
        self.message_user(request, f'Marked {updated} refunds as completed.')
    mark_completed.short_description = 'Mark selected refunds as completed'


@admin.register(PaymentWebhook)
class PaymentWebhookAdmin(admin.ModelAdmin):
    list_display = ('gateway', 'event_type', 'event_id', 'processed', 'processed_at', 'created_at')
    list_filter = ('gateway', 'event_type', 'processed', 'created_at')
    search_fields = ('event_id', 'event_type')
    readonly_fields = ('processed_at', 'created_at')

    fieldsets = (
        ('Webhook Info', {
            'fields': ('gateway', 'event_type', 'event_id', 'processed', 'processed_at')
        }),
        ('Data', {
            'fields': ('payload', 'error_message'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    actions = ['mark_processed']

    def mark_processed(self, request, queryset):
        updated = 0
        for webhook in queryset.filter(processed=False):
            webhook.mark_processed()
            updated += 1
        self.message_user(request, f'Marked {updated} webhooks as processed.')
    mark_processed.short_description = 'Mark selected webhooks as processed'
