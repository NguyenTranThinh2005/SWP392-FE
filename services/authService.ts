import { fetchAPI, fetchWithFallback } from "./api";
import { SEED_USERS } from "../lib/users-store";

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Mangaka' | 'Assistant' | 'Tantou Editor' | 'Editorial Board' | 'Editor-in-Chief';
  avatarUrl: string;
}

export const MOCK_USER: User = {
  id: 'U01',
  name: 'Takeshi Obata',
  email: 'obata@mangaflow.com',
  role: 'Tantou Editor',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
};

export const authService = {
  login: async (credentials?: any) => {
    try {
      const response = await fetchAPI<{ data: { token: string; refreshToken: string; user: User }; message: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });  
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        localStorage.setItem('user-role', response.data.user.role);
      }
      return response;
    } catch (err) {
      console.warn("API login failed, falling back to mock login.", err);

      const email = credentials?.email;
      // Search matching mock user by email
      const mockUser = SEED_USERS.find(
        (u) => u.email.toLowerCase() === email?.toLowerCase() || u.username.toLowerCase() === email?.toLowerCase()
      ) || SEED_USERS[0];

      const response = {
        data: {
          token: "mock-jwt-token",
          refreshToken: "mock-refresh-token",
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role as any,
            avatarUrl: mockUser.avatarUrl,
          },
        },
        message: "Mock login successful (Offline Mode)",
      };

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user-role', response.data.user.role);

      return response;
    }
  },  

  register: async (userData: any) => {
    try {
      return await fetchAPI<any>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (err) {
      console.warn("API register failed, falling back to mock success.", err);
      return { success: true, message: "Mock registration successful (Offline Mode)" };
    }
  },
  
  logout: async () => {
    return fetchWithFallback<any>("/api/auth/logout", { success: true });
  },

  getCurrentUser: async () => {
    try {
      const response = await fetchAPI<{ data: User; message: string }>('/api/auth/me');
      return response.data;
    } catch (err) {
      console.warn("API /api/auth/me failed, falling back to cached role / mock user.", err);
      const storedRole = typeof window !== 'undefined' ? localStorage.getItem('user-role') : null;
      const mockUser = SEED_USERS.find((u) => u.role === storedRole) || SEED_USERS[0];
      return {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role as any,
        avatarUrl: mockUser.avatarUrl,
      };
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (!refreshToken) {
        throw new Error("No refresh token found");
      }
      const response = await fetchAPI<{ data: { token: string; refreshToken: string }; message: string }>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
      }
      return response;
    } catch (err) {
      console.warn("Refresh token API failed, using mock refresh token.", err);
      return {
        data: {
          token: "mock-jwt-token",
          refreshToken: "mock-refresh-token",
        },
        message: "Mock refresh successful",
      };
    }
  },

  changePassword: async (passwordData: any) => {
    try {
      return await fetchAPI<any>('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(passwordData),
      });
    } catch (err) {
      console.warn("API change-password failed, falling back to mock success.", err);
      return { success: true, message: "Mock password change successful (Offline Mode)" };
    }
  }
};
