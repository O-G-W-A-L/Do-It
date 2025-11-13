import uuid
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import EmailVerification, Profile, UserSession, LoginHistory, UserBan, UserStatus, UserPreferences

# REGISTRATION & EMAIL VERIFICATION
class RegisterSerializer(serializers.ModelSerializer):
    email     = serializers.EmailField(required=True)
    password1 = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ('username', 'email', 'password1', 'password2')

    def validate(self, attrs):
        if attrs['password1'] != attrs['password2']:
            raise serializers.ValidationError({'password2': "Passwords must match."})
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({'email': "Email already in use."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username  = validated_data['username'],
            email     = validated_data['email'],
            password  = validated_data['password1'],
            is_active = True  # For testing - enable immediately
        )
        # TODO: Re-enable email verification for production
        # ev = EmailVerification.objects.create(user=user)
        # verify_url = f"{settings.FRONTEND_URL}/verify-email/{ev.token}/"
        # send_mail(
        #     subject        = 'Verify your email',
        #     message        = f'Click here to verify your account: {verify_url}',
        #     from_email     = settings.DEFAULT_FROM_EMAIL,
        #     recipient_list = [user.email],
        #     fail_silently  = False,
        # )
        return user

class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            ev = EmailVerification.objects.get(token=value)
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError("Invalid token.")
        if not ev.is_valid():
            raise serializers.ValidationError("Token expired or already used.")
        return ev

    def save(self):
        ev = self.validated_data['token']
        ev.used = True
        ev.save(update_fields=['used'])
        user = ev.user
        user.is_active = True
        user.save(update_fields=['is_active'])
        return user

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account with this email.")
        if user.is_active:
            raise serializers.ValidationError("Account already verified.")
        return user

    def save(self):
        user = self.validated_data['email']
        EmailVerification.objects.filter(user=user, used=False).update(used=True)
        ev = EmailVerification.objects.create(user=user)
        verify_url = f"{settings.FRONTEND_URL}/verify-email/{ev.token}/"
        send_mail(
            subject        = 'Resend verification',
            message        = f'Click here to verify your account: {verify_url}',
            from_email     = settings.DEFAULT_FROM_EMAIL,
            recipient_list = [user.email],
            fail_silently  = False,
        )
        return ev

# PASSWORD RESET FLOW
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("No active account with this email.")
        return user

    def save(self):
        user = self.validated_data['email']
        ev = EmailVerification.objects.create(user=user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{ev.token}/"
        send_mail(
            subject        = 'Password reset requested',
            message        = f'Click here to reset your password: {reset_url}',
            from_email     = settings.DEFAULT_FROM_EMAIL,
            recipient_list = [user.email],
            fail_silently  = False,
        )
        return ev


class PasswordResetConfirmSerializer(serializers.Serializer):
    token        = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate(self, attrs):
        try:
            ev = EmailVerification.objects.get(token=attrs['token'])
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError("Invalid token.")
        if not ev.is_valid():
            raise serializers.ValidationError("Token expired or already used.")
        attrs['ev'] = ev
        return attrs

    def save(self):
        ev = self.validated_data['ev']
        user = ev.user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        ev.used = True
        ev.save(update_fields=['used'])
        return user

# JWT & USER SERIALIZER
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        return token

class ProfileSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    is_account_locked = serializers.BooleanField(read_only=True)
    profile_visibility_display = serializers.CharField(source='get_profile_visibility_display', read_only=True)

    class Meta:
        model = Profile
        fields = (
            'role', 'role_display', 'bio', 'location', 'profile_image', 'phone_number',
            'is_profile_complete', 'enrolled_courses_count', 'completed_courses_count',
            # Enhanced LMS fields
            'skills', 'achievements', 'teaching_subjects', 'profile_visibility', 'profile_visibility_display',
            # Instructor fields
            'assigned_courses_count', 'is_active_instructor', 'is_account_locked',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'is_profile_complete', 'enrolled_courses_count', 'completed_courses_count',
            'assigned_courses_count', 'is_account_locked', 'created_at', 'updated_at'
        )

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'full_name',
                 'date_joined', 'last_login', 'is_active', 'profile')

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

# ADMIN SERIALIZERS
class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user creation/editing"""
    profile = ProfileSerializer()
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password',
                 'is_active', 'date_joined', 'last_login', 'profile')

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)

        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()

        # Update profile
        if profile_data:
            for attr, value in profile_data.items():
                setattr(user.profile, attr, value)
            user.profile.save()

        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})

        # Update user fields
        for attr, value in validated_data.items():
            if attr == 'password':
                instance.set_password(value)
            else:
                setattr(instance, attr, value)
        instance.save()

        # Update profile
        if profile_data:
            for attr, value in profile_data.items():
                setattr(instance.profile, attr, value)
            instance.profile.save()

        return instance

class UserSessionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = ('id', 'user', 'user_email', 'user_full_name', 'session_key',
                 'ip_address', 'user_agent', 'created_at', 'last_activity', 'is_active')
        read_only_fields = ('id', 'session_key', 'created_at', 'last_activity')

    def get_user_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

class UserPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for user preferences and settings"""

    class Meta:
        model = UserPreferences
        fields = (
            'language', 'timezone', 'email_notifications', 'push_notifications',
            'study_reminders', 'course_updates', 'achievement_notifications',
            'weekly_study_goal', 'preferred_study_time', 'learning_style',
            'show_learning_progress', 'show_achievements', 'allow_profile_views',
            'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at')

class LoginHistorySerializer(serializers.ModelSerializer):
    user_full_name = serializers.SerializerMethodField()
    event_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        model = LoginHistory
        fields = ('id', 'user', 'user_full_name', 'email', 'event_type', 'event_display',
                 'ip_address', 'user_agent', 'timestamp', 'details')
        read_only_fields = ('id', 'timestamp')

    def get_user_full_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return None

class UserBanSerializer(serializers.ModelSerializer):
    banned_by_name = serializers.SerializerMethodField()
    user_full_name = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = UserBan
        fields = ('id', 'user', 'user_full_name', 'ban_type', 'reason', 'banned_by',
                 'banned_by_name', 'banned_at', 'expires_at', 'is_active', 'is_expired')
        read_only_fields = ('id', 'banned_at', 'is_expired')

    def get_banned_by_name(self, obj):
        if obj.banned_by:
            return obj.banned_by.get_full_name() or obj.banned_by.username
        return None

    def get_user_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

class UserStatusSerializer(serializers.ModelSerializer):
    set_by_name = serializers.SerializerMethodField()
    user_full_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = UserStatus
        fields = ('id', 'user', 'user_full_name', 'status', 'status_display', 'reason',
                 'set_by', 'set_by_name', 'set_at', 'expires_at', 'notes', 'is_expired')
        read_only_fields = ('id', 'set_at', 'is_expired')

    def get_set_by_name(self, obj):
        if obj.set_by:
            return obj.set_by.get_full_name() or obj.set_by.username
        return None

    def get_user_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
