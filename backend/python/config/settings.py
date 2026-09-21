import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


def env_bool(name: str, default: bool = False) -> bool:
	value = os.getenv(name)
	if value is None:
		return default
	return value.strip().lower() in {'1', 'true', 'yes', 'on'}


def env_list(name: str, default: str = '') -> list[str]:
	return [item.strip() for item in os.getenv(name, default).split(',') if item.strip()]


ENVIRONMENT = os.getenv('DJANGO_ENV', 'development').strip().lower()
DEBUG = env_bool('DJANGO_DEBUG', ENVIRONMENT != 'production')
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', '').strip()

if not SECRET_KEY:
	if ENVIRONMENT == 'production' or not DEBUG:
		raise RuntimeError('DJANGO_SECRET_KEY es obligatoria cuando Django no esta en modo debug')
	SECRET_KEY = 'django-insecure-local-development-only'

ROOT_URLCONF = 'config.urls'
ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1')
INSTALLED_APPS = ['django.contrib.contenttypes', 'django.contrib.auth', 'rest_framework', 'corsheaders', 'marketplace']
MIDDLEWARE = [
	'django.middleware.security.SecurityMiddleware',
	'corsheaders.middleware.CorsMiddleware',
	'django.middleware.common.CommonMiddleware',
]
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db.sqlite3'}}
CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')
CSRF_TRUSTED_ORIGINS = env_list('CSRF_TRUSTED_ORIGINS', 'http://localhost:5173')
REST_FRAMEWORK = {'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer']}
USE_TZ = True

IS_PRODUCTION = ENVIRONMENT == 'production'
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_SSL_REDIRECT = IS_PRODUCTION
SESSION_COOKIE_SECURE = IS_PRODUCTION
CSRF_COOKIE_SECURE = IS_PRODUCTION
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000' if IS_PRODUCTION else '0'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = IS_PRODUCTION
SECURE_HSTS_PRELOAD = IS_PRODUCTION
