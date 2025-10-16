const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = localStorage.getItem('scanner_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username, password) {
    return this.request('/scanner/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  async verifyToken() {
    return this.request('/scanner/verify', {
      method: 'POST'
    });
  }

  // Ticket endpoints
  async getTicketStats() {
    return this.request('/tickets/stats');
  }

  async getTicket(ticketId) {
    return this.request(`/tickets/${ticketId}`);
  }

  async validateTicket(ticketId, action = 'checkin') {
    return this.request(`/tickets/validate/${ticketId}`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  }
}

export default new ApiService();