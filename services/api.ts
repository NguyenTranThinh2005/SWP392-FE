// API service utilities
import { API_BASE_URL } from "@/lib/constants";

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (endpoint.includes("/api/auth/login")) {
        throw new Error("Tài khoản hoặc mật khẩu không chính xác.");
      } else {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
    }
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchWithFallback<T>(
  endpoint: string,
  mockData: T,
  options?: RequestInit
): Promise<T> {
  try {
    const data = await fetchAPI<T>(endpoint, options);
    return data;
  } catch (error) {
    console.warn(
      `[API Fallback Warning] Gọi API tới "${endpoint}" thất bại. Sử dụng Mock Data thay thế.`,
      error
    );
    return mockData;
  }
}
