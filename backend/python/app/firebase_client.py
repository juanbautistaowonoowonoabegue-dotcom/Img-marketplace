import os
from firebase_admin import credentials, firestore, initialize_app
from .config import PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS

if not os.path.exists(GOOGLE_APPLICATION_CREDENTIALS):
    raise FileNotFoundError(
        "No existe la clave de Firebase para Python. Añade serviceAccountKey.json o configura GOOGLE_APPLICATION_CREDENTIALS."
    )

cred = credentials.Certificate(GOOGLE_APPLICATION_CREDENTIALS)
initialize_app(cred, {'projectId': PROJECT_ID})

db = firestore.client()


def get_products():
    return [doc.to_dict() | {'id': doc.id} for doc in db.collection('productos').stream()]
