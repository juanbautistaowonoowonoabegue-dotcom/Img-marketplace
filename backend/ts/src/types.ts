export type ProductStatus = 'activo' | 'pendiente' | 'inactivo' | 'eliminado';

export type Product = {
  id?: string;
  titulo?: string;
  descripcion?: string;
  precio?: number;
  categoria?: string;
  vendedorId?: string;
  ubicacion?: string;
  activo?: boolean;
  status?: ProductStatus;
  creadoEn?: number | string;
  actualizadoEn?: number | string;
  [key: string]: unknown;
};

export type UserProfile = {
  uid?: string;
  nombre?: string;
  email?: string;
  rol?: 'comprador' | 'vendedor' | 'admin';
  creadoEn?: number | string;
  [key: string]: unknown;
};

export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};
