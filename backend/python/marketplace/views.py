from uuid import uuid4
from rest_framework.decorators import api_view
from rest_framework.response import Response

DEMO_PRODUCTS = [
    {'id': 'django-demo-1', 'nombre': 'Servicios gestionados', 'categoria': 'Servicios', 'precio': 45000, 'ciudad': 'Malabo'},
    {'id': 'django-demo-2', 'nombre': 'Productos de vendedores locales', 'categoria': 'Marketplace', 'precio': 28000, 'ciudad': 'Bata'},
]

@api_view(['GET'])
def health(request):
    return Response({'ok': True, 'service': 'compra-ya-python', 'version': '0.1.0'})

@api_view(['GET'])
def products(request):
    return Response({'ok': True, 'data': DEMO_PRODUCTS})

@api_view(['POST'])
def checkout(request):
    payload = request.data
    if not payload.get('amount') or not payload.get('currency'):
        return Response({'ok': False, 'error': 'amount y currency son obligatorios'}, status=400)
    return Response({'ok': True, 'data': {'status': 'pending', 'provider': payload.get('provider', 'local-wallet'), 'transactionId': f'py_{uuid4().hex}', 'reference': payload.get('reference', uuid4().hex)}})
