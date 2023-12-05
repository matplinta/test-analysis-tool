"""
Django settings for backend project.

Generated by 'django-admin startproject' using Django 4.0.3.

For more information on this file, see
https://docs.djangoproject.com/en/4.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.0/ref/settings/
"""

from pathlib import Path
import ldap
from django_auth_ldap.config import LDAPSearch, GroupOfNamesType
import os

# -----------------------------------------------------------------------------
# LDAP
# -----------------------------------------------------------------------------

AUTHENTICATION_BACKENDS = (
    'django_auth_ldap.backend.LDAPBackend',
    'django.contrib.auth.backends.ModelBackend',
)

AUTH_LDAP_GLOBAL_OPTIONS = {
    ldap.OPT_X_TLS_REQUIRE_CERT: False,
    ldap.OPT_REFERRALS: False,
}

AUTH_LDAP_SERVER_URI = "ldaps://ed-qa-gl.emea.nsn-net.net"
AUTH_LDAP_BIND_DN = ""
AUTH_LDAP_BIND_PASSWORD = ""
AUTH_LDAP_USER_SEARCH = LDAPSearch("ou=people,o=NSN",  ldap.SCOPE_SUBTREE, "uid=%(user)s")
AUTH_LDAP_USER_ATTR_MAP = {"email": "nsnPrimaryEmailAddress"}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "loggers": {"django_auth_ldap": {"level": "DEBUG", "handlers": ["console"]}},
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
    'DEFAULT_AUTHENTICATION_CLASSES': (
    #     # 'rest_framework_simplejwt.authentication.JWTAuthentication',
    #     # 'dj_rest_auth.jwt_auth.JWTCookieAuthentication',
        # 'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
    ),
}


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-cal*j$k8(!5o^lnb69#0t0&1e*hojf(sk^obf&kj_44f5#hdr2'
# SECRET_KEY = os.environ.get("SECRET_KEY")


DEBUG                               = bool(os.environ.get("DEBUG", default=''))

LOGS_STORAGE_DOCKER_PATH            = os.environ.get("LOGS_STORAGE_DOCKER_PATH", default='')
LOGS_STORAGE_DOCKER_PATH_DEBUG      = os.environ.get("LOGS_STORAGE_DOCKER_PATH_DEBUG", default='')
LOGS_STORAGE_HTTP_SERVER            = os.environ.get("LOGS_STORAGE_HTTP_SERVER", default='')
LOGS_STORAGE_HTTP_SERVER_DEBUG      = os.environ.get("LOGS_STORAGE_HTTP_SERVER_DEBUG", default='')
LOGS_STORAGE_HTTP_SERVER_DEBUG_PORT = os.environ.get("LOGS_STORAGE_HTTP_SERVER_DEBUG_PORT", default='')

ALLOWED_HOSTS = ['*']

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'constance',
    'constance.backends.database',
    'django_filters',
    'dj_rest_auth',
    'drf_yasg',
    'polymorphic',
    'corsheaders',
    'tra',
    'stats',
    'django_celery_beat',
]

if DEBUG:
    INSTALLED_APPS += (
        # Dev extensions
        'django_extensions',
    )

NOTEBOOK_ARGUMENTS = [
    "--ip",
    "0.0.0.0",
    "--port",
    "8888",
    "--allow-root",
    "--no-browser",
]

CSRF_TRUSTED_ORIGINS = [
    "https://test-results-analyzer.sc5g.krk-lab.nsn-rdnet.net",
    "http://test-results-analyzer.sc5g.krk-lab.nsn-rdnet.net",
    "https://test-results-analyzer.sc5g.krk-lab.nsn-rdnet.net:1337",
    "https://localhost:1337",
]

# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
# USE_X_FORWARDED_HOST = True
# USE_X_FORWARDED_PORT = True

CORS_ALLOWED_ORIGINS = [
    'https://test-results-analyzer.sc5g.krk-lab.nsn-rdnet.net',
    'http://test-results-analyzer.sc5g.krk-lab.nsn-rdnet.net:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
# CORS_ORIGIN_ALLOW_ALL = True

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_NAME', 'trs_database'),
        'USER': os.environ.get('POSTGRES_USER', 'trs_user'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'trs'),
        'HOST': 'db' if os.environ.get('POSTGRES_NAME') else 'localhost',
        'PORT': 5432,
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/4.0/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'CET' # UTC
USE_I18N = True
USE_TZ = True

# CONSTANCE
CONSTANCE_IGNORE_ADMIN_VERSION_CHECK = True
CONSTANCE_BACKEND = 'constance.backends.database.DatabaseBackend'
CONSTANCE_CONFIG = {
    'UTE_LOGS_LIFESPAN': (6, 'Lifespan of logs at UTE Logs storage', int),
    'FB_TESTRUN_RETENTION': (3, 'Number of FBs of which we want to hold data in the DB', int),
    'FB_TESTRUN_PULL_SYNC_RETENTION': (3, 'Number of FBs of which we want to pull and sync data in the DB from the RP', int),
    'RP_USER': (os.environ.get("RP_USER", default=''), 'Reporting Portal Username', str),
    'RP_PASSWORD': (os.environ.get("RP_PASSWORD", default=''), 'Reporting Portal Username password', str),
    'RP_URL': (os.environ.get("RP_URL", default="https://rep-portal.wroclaw.nsn-rdnet.net"), 'Reporting Portal URL', str),
}

# CELERY STUFF
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER", "redis://localhost:6379")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_BACKEND", "redis://localhost:6379")
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.0/howto/static-files/

STATIC_URL = '/django_static/'
MEDIA_URL = '/media/'
STATIC_ROOT = os.path.join(BASE_DIR, "django_static")
MEDIA_ROOT = os.path.join(BASE_DIR, "media")
# Default primary key field type
# https://docs.djangoproject.com/en/4.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
