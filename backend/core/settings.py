from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Basic settings
SECRET_KEY   = os.getenv('SECRET_KEY', 'fallback-secret-key')
DEBUG        = os.getenv('DEBUG', 'False').lower() == 'true'
ENVIRONMENT  = os.getenv('ENVIRONMENT', 'development')
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Applications
INSTALLED_APPS = [
    # Django core
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Sites framework (required by allauth)
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',

    # Third-party
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',

    # Local Apps
    'users',
    'courses',
    'progress',

    'rest_framework.authtoken',
    'dj_rest_auth',
    'dj_rest_auth.registration',
]

SITE_ID = 1

# Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # django-allauth requires this immediately after AuthenticationMiddleware
    'allauth.account.middleware.AccountMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

# Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database (PostgreSQL)
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     os.getenv('DB_NAME', 'do_it_db'),
        'USER':     os.getenv('DB_USER', 'do_it_user'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'securepassword'),
        'HOST':     os.getenv('DB_HOST', 'localhost'),
        'PORT':     os.getenv('DB_PORT', '5432'),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True

# Static files
STATIC_URL = '/static/'

# CORS
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
CORS_ALLOW_CREDENTIALS = True

# Media settings for handling file uploads
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# REST Framework & JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':    timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME':   timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':    True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES':        ('Bearer',),
    'USER_ID_FIELD':            'id',
    'USER_ID_CLAIM':            'user_id',
}

# django-allauth config
ACCOUNT_LOGIN_METHODS       = {'email'}
ACCOUNT_SIGNUP_FIELDS       = ['username*', 'email*', 'password1*', 'password2*']
ACCOUNT_UNIQUE_EMAIL        = True
ACCOUNT_EMAIL_VERIFICATION  = 'mandatory'
LOGIN_REDIRECT_URL          = '/'
LOGOUT_REDIRECT_URL         = '/'

# Google OAuth2 configuration for django-allauth
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['email', 'profile'],
        'AUTH_PARAMS': {'access_type': 'offline'},
        'APP': {
            'client_id': os.getenv('GOOGLE_CLIENT_ID'),
            'secret':    os.getenv('GOOGLE_CLIENT_SECRET'),
            'key':       '',
        }
    }
}

# Email backend
if DEBUG:
    # Prints emails to console in dev
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    # Real SMTP in production
    EMAIL_BACKEND          = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST             = os.getenv('EMAIL_HOST')
    EMAIL_PORT             = int(os.getenv('EMAIL_PORT', 587))
    EMAIL_HOST_USER        = os.getenv('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD    = os.getenv('EMAIL_HOST_PASSWORD')
    EMAIL_USE_TLS          = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true','1','yes')
    DEFAULT_FROM_EMAIL     = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@example.com')

# Frontend URL for email links
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
