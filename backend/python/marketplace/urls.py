from django.urls import path
from .views import health, products, checkout

urlpatterns = [
    path('health/', health),
    path('products/', products),
    path('checkout/', checkout),
]
