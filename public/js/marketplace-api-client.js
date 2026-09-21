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

  window.MarketplaceApi = {
    async getProducts() {
      return request('/api/products');
    },
    async getUsers() {
      return request('/api/users');
    },
    async getUserById(uid) {
      return request(`/api/users/${encodeURIComponent(uid)}`);
    },
    async getProductById(id) {
      return request(`/api/products/${encodeURIComponent(id)}`);
    }
  };
})();
