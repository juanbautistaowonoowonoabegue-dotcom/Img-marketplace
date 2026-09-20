(function () {
  const API_BASE = window.COMPRA_YA_API_BASE || 'http://localhost:4000';

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Error en la API');
    }

    return response.json();
  }

  window.CompraYaCoreApi = {
    async getProducts() {
      return request('/api/products');
    },
    async getProductById(id) {
      return request(`/api/products/${encodeURIComponent(id)}`);
    },
    async getUsers() {
      return request('/api/users');
    },
    async getUserById(uid) {
      return request(`/api/users/${encodeURIComponent(uid)}`);
    },
    async createPayment(provider, request) {
      return request('/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({ provider, request })
      });
    }
  };
})();
