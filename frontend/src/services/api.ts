import axios, { type AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async register(data: any) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Events
  async createEvent(data: any) {
    const response = await this.client.post('/api/events', data);
    return response.data;
  }

  async getMyEvents() {
    const response = await this.client.get('/api/events');
    return response.data;
  }

  async getEvent(eventId: number) {
    const response = await this.client.get(`/api/events/${eventId}`);
    return response.data;
  }

  async joinEvent(inviteCode: string, role: 'participant' | 'sponsor') {
    const response = await this.client.post('/api/events/join', {
      invite_code: inviteCode,
      role,
    });
    return response.data;
  }

  async getEventWishlistItems(eventId: number) {
    const response = await this.client.get(`/api/events/${eventId}/wishlist-items`);
    return response.data;
  }

  // Wishlists
  async getMyWishlists() {
    const response = await this.client.get('/api/wishlists');
    return response.data;
  }

  async getWishlistItems(wishlistId: number) {
    const response = await this.client.get(`/api/wishlists/${wishlistId}/items`);
    return response.data;
  }

  async createWishlistItem(data: any) {
    const response = await this.client.post('/api/wishlist-items', data);
    return response.data;
  }

  async updateWishlistItem(itemId: number, data: any) {
    const response = await this.client.patch(`/api/wishlist-items/${itemId}`, data);
    return response.data;
  }

  async deleteWishlistItem(itemId: number) {
    const response = await this.client.delete(`/api/wishlist-items/${itemId}`);
    return response.data;
  }

  // Matching
  async getMatchSuggestions(filters: any) {
    const response = await this.client.post('/api/matching/suggestions', filters);
    return response.data;
  }

  async saveSponsorPreferences(data: any) {
    const response = await this.client.post('/api/sponsor-preferences', data);
    return response.data;
  }

  async getSponsorPreferences(eventId: number) {
    const response = await this.client.get(`/api/sponsor-preferences/${eventId}`);
    return response.data;
  }

  // Gifts
  async claimGift(data: any) {
    const response = await this.client.post('/api/gifts/claim', data);
    return response.data;
  }

  async getMyGifts() {
    const response = await this.client.get('/api/gifts/my-gifts');
    return response.data;
  }

  // Product Search (Exa)
  async searchProducts(query: string, maxResults: number = 10, priceMin?: number, priceMax?: number) {
    const response = await this.client.post('/api/search/products', {
      query,
      max_results: maxResults,
      price_min: priceMin,
      price_max: priceMax,
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
