// services/authService.ts
// Complete Authentication Service with API Integration

import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Change this to your computer's IP address
// Find it using: ipconfig (Windows) or ifconfig (Mac/Linux)
const API_URL = 'http://192.168.1.100:3000/api'; // ← CHANGE THIS

// Storage keys
const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';

export interface User {
  id: number;
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isVerified: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  field?: string;
}

export interface RegisterData {
  email: string;
  phone: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

class AuthService {
  // ============================================
  // AUTHENTICATION
  // ============================================

  // Register
  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.token) {
        // Store token and user data
        await AsyncStorage.setItem(TOKEN_KEY, result.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
      }

      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  // Login
  async login(
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store token and user data
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  // Verify token
  async verifyToken(): Promise<{ success: boolean; user?: User }> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      if (!token) {
        return { success: false };
      }

      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return { success: true, user: data.user };
      }

      // Token is invalid, clear storage
      await this.logout();
      return { success: false };
    } catch (error) {
      console.error('Token verification error:', error);
      return { success: false };
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      if (token) {
        // Call logout endpoint
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    }
  }

  // Get stored token
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  // Get stored user
  async getUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // ============================================
  // RATINGS & REVIEWS
  // ============================================

  // Submit rating and review
  async submitRating(
    parkingSpotId: number,
    rating: number,
    review?: string,
    bookingId?: number
  ): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          parkingSpotId,
          bookingId,
          rating,
          review,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Submit rating error:', error);
      return { success: false, message: 'Failed to submit rating' };
    }
  }

  // Get ratings for parking spot
  async getRatings(parkingSpotId: number): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/ratings/parking/${parkingSpotId}`);
      return await response.json();
    } catch (error) {
      console.error('Get ratings error:', error);
      return { success: false, reviews: [] };
    }
  }

  // ============================================
  // PARKING SPOTS
  // ============================================

  // Get all parking spots
  async getParkingSpots(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/parking`);
      return await response.json();
    } catch (error) {
      console.error('Get parking spots error:', error);
      return { success: false, parkingSpots: [] };
    }
  }

  // Get single parking spot
  async getParkingSpot(id: number): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/parking/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Get parking spot error:', error);
      return { success: false };
    }
  }

  // ============================================
  // SAVED PARKING
  // ============================================

  // Save parking spot
  async saveParkingSpot(parkingSpotId: number): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/saved-parking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parkingSpotId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Save parking error:', error);
      return { success: false };
    }
  }

  // Unsave parking spot
  async unsaveParkingSpot(parkingSpotId: number): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/saved-parking/${parkingSpotId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Unsave parking error:', error);
      return { success: false };
    }
  }

  // Get saved parking spots
  async getSavedParkingSpots(): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/saved-parking`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get saved parking error:', error);
      return { success: false, savedParkingSpots: [] };
    }
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  // Get notifications
  async getNotifications(): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get notifications error:', error);
      return { success: false, notifications: [] };
    }
  }

  // Mark notification as read
  async markNotificationRead(notificationId: number): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Mark notification read error:', error);
      return { success: false };
    }
  }

  // Mark all notifications as read
  async markAllNotificationsRead(): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Mark all read error:', error);
      return { success: false };
    }
  }
}

export default new AuthService();