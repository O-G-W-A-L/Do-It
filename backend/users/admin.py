from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html

from .models import EmailVerification, Profile

@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'token_preview', 'created', 'expires', 'used', 'is_valid')
    list_filter = ('used', 'created', 'expires')
    search_fields = ('user__username', 'user__email', 'token')
    readonly_fields = ('token', 'created', 'expires')

    def token_preview(self, obj):
        return obj.token[:8] + '...' if len(obj.token) > 8 else obj.token
    token_preview.short_description = 'Token'

    def is_valid(self, obj):
        return obj.is_valid()
    is_valid.boolean = True

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role_badge', 'is_profile_complete', 'enrolled_courses_count',
                   'location', 'phone_number', 'is_account_locked')
    list_filter = ('role', 'is_profile_complete', 'is_active_instructor')
    search_fields = ('user__username', 'user__email', 'location', 'phone_number')
    readonly_fields = ('enrolled_courses_count', 'completed_courses_count',
                      'assigned_courses_count', 'created_at', 'updated_at')

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'role')
        }),
        ('Profile Details', {
            'fields': ('bio', 'location', 'profile_image', 'phone_number')
        }),
        ('LMS Statistics', {
            'fields': ('is_profile_complete', 'enrolled_courses_count',
                      'completed_courses_count', 'assigned_courses_count', 'is_active_instructor'),
            'classes': ('collapse',)
        }),
        ('Security', {
            'fields': ('failed_login_attempts', 'account_locked_until', 'last_password_change'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def role_badge(self, obj):
        colors = {
            'student': 'blue',
            'instructor': 'green',
            'admin': 'red'
        }
        color = colors.get(obj.role, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px;">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = 'Role'

    actions = ['reset_failed_logins', 'unlock_accounts']

    def reset_failed_logins(self, request, queryset):
        updated = queryset.update(failed_login_attempts=0, account_locked_until=None)
        self.message_user(request, f'Reset failed login attempts for {updated} profiles.')
    reset_failed_logins.short_description = 'Reset failed login attempts'

    def unlock_accounts(self, request, queryset):
        updated = queryset.filter(account_locked_until__isnull=False).update(
            account_locked_until=None, failed_login_attempts=0
        )
        self.message_user(request, f'Unlocked {updated} accounts.')
    unlock_accounts.short_description = 'Unlock selected accounts'

# Extend the default UserAdmin to include profile information
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'get_role', 'is_active', 'date_joined', 'last_login')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'date_joined', 'profile__role')
    search_fields = ('username', 'email', 'first_name', 'last_name')

    def get_role(self, obj):
        return obj.profile.get_role_display() if hasattr(obj, 'profile') else 'No Profile'
    get_role.short_description = 'Role'
    get_role.admin_order_field = 'profile__role'

    fieldsets = UserAdmin.fieldsets + (
        ('LMS Information', {
            'fields': ('get_role',),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('get_role',)

# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
