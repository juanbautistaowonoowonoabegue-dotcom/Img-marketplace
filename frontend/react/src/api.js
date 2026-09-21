const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || 'No se pudo completar la solicitud');
  }
  return payload;
}

export const api = {
  products: () => request('/api/products'),
  product: (id) => request(`/api/products/${encodeURIComponent(id)}`),
  users: () => request('/api/users'),
  user: (uid) => request(`/api/users/${encodeURIComponent(uid)}`),
  createPayment: (provider, payment) => request('/api/payments/create', {
    method: 'POST',
    body: JSON.stringify({ provider, request: payment })
  }),
  verifyPayment: (provider, reference) => request('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ provider, reference })
  })
};
