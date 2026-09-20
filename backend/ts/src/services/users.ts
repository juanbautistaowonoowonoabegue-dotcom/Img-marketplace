import { db } from '../firebase.js';
import type { ApiResponse, UserProfile } from '../types.js';

export async function getUsers(): Promise<ApiResponse<UserProfile[]>> {
  try {
    const snapshot = await db.collection('usuarios').get();
    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...(doc.data() as UserProfile)
    }));

    return { ok: true, data: users };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { ok: false, error: `No se pudieron cargar usuarios: ${message}` };
  }
}

export async function getUserById(uid: string): Promise<ApiResponse<UserProfile | null>> {
  try {
    const doc = await db.collection('usuarios').doc(uid).get();
    if (!doc.exists) {
      return { ok: true, data: null };
    }

    return {
      ok: true,
      data: {
        uid: doc.id,
        ...(doc.data() as UserProfile)
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { ok: false, error: `No se pudo leer el usuario: ${message}` };
  }
}
