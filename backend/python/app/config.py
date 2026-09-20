import os
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
PYTHON_ENV = os.getenv("PYTHON_ENV", "development")

if not PROJECT_ID:
    raise RuntimeError("Falta FIREBASE_PROJECT_ID en el entorno Python")
