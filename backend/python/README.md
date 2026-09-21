# Compra Ya Python / Django

Servicio Python para automatizaciones, catálogo auxiliar y checkout. La experiencia web vive en `frontend/react` y el adaptador de pagos existente continúa en TypeScript.

Este directorio también expone una API Django pequeña y centralizable:

- sincronización con bases de datos
- limpieza de datos
- tareas automáticas
- análisis y IA
- importaciones
- procesos de imagen y auditoría

## Ejecutar Django

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 8000
```

Endpoints: `GET /api/health/`, `GET /api/products/`, `POST /api/checkout/`.

## Estructura

- app/
  - config.py
  - firebase_client.py
  - services/
- jobs/
- scripts/

## Convención

No se debe usar Python para la capa de UI ni para lógica principal del frontend. Python se usa para procesos y automatización.
