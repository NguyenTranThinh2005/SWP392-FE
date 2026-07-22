// API service utilities
import { API_BASE_URL } from "@/lib/constants";
import { tokenService } from "./tokenService";

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = tokenService.getToken();

  const isFormData = typeof window !== 'undefined' && options?.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options?.headers,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (endpoint.includes("/api/auth/login") || endpoint.includes("/api/auth/refresh")) {
        if (endpoint.includes("/api/auth/login")) {
          throw new Error("Incorrect email or password.");
        }
        tokenService.clearAll();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error("Session expired. Please log in again.");
      }

      // Try to refresh token and retry the request
      try {
        const newToken = await tokenService.getOrTriggerRefresh();

        const retryHeaders: HeadersInit = {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...options?.headers,
          "Authorization": `Bearer ${newToken}`,
        };

        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });

        if (!retryResponse.ok) {
          throw new Error(`Request failed after retry (${retryResponse.statusText || retryResponse.status})`);
        }

        return retryResponse.json();
      } catch (refreshError) {
        throw new Error("Session expired. Please log in again.");
      }
    }

    let errorMessage = response.statusText || `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      if (typeof errorData === 'string' && errorData.trim()) {
        errorMessage = errorData;
      } else if (errorData && typeof errorData === 'object') {
        if (errorData.message && typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        } else if (errorData.detail && typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (errorData.title && typeof errorData.title === 'string' && !errorData.errors) {
          errorMessage = errorData.title;
        } else if (errorData.errors && typeof errorData.errors === 'object') {
          const firstKey = Object.keys(errorData.errors)[0];
          if (firstKey && Array.isArray(errorData.errors[firstKey]) && errorData.errors[firstKey].length > 0) {
            errorMessage = errorData.errors[firstKey][0];
          } else if (firstKey && typeof errorData.errors[firstKey] === 'string') {
            errorMessage = errorData.errors[firstKey];
          }
        }
      }
    } catch { }
    throw new Error(errorMessage);
  }

  return response.json();
}
