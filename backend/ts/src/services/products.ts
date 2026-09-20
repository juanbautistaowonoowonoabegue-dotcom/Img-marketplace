import { db } from '../firebase.js';
import type { Product, ApiResponse } from '../types.js';

export async function getProducts(): Promise<ApiResponse<Product[]>> {
  try {
    const snapshot = await db.collection('productos').get();
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Product)
    }));

    return { ok: true, data: products };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { ok: false, error: `No se pudieron cargar productos: ${message}` };
  }
}

export async function getProductById(productId: string): Promise<ApiResponse<Product | null>> {
  try {
    const doc = await db.collection('productos').doc(productId).get();

    if (!doc.exists) {
      return { ok: true, data: null };
    }

    return {
      ok: true,
      data: {
        id: doc.id,
        ...(doc.data() as Product)
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { ok: false, error: `No se pudo leer el producto: ${message}` };
  }
}

export async function createProduct(input: Product): Promise<ApiResponse<Product>> {
  try {
    const payload: Product = {
      ...input,
      creadoEn: Date.now(),
      actualizadoEn: Date.now(),
      activo: input.activo ?? true,
      status: input.status ?? 'activo'
    };

    const ref = await db.collection('productos').add(payload);

    return {
      ok: true,
      data: {
        id: ref.id,
        ...payload
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { ok: false, error: `No se pudo crear el producto: ${message}` };
  }
}
