// API service utilities
import { API_BASE_URL } from "@/lib/constants";

// Global callbacks for UI loading and error display
let showLoadingCallback: (() => void) | null = null;
let hideLoadingCallback: (() => void) | null = null;
let showErrorCallback: ((title: string, message: string, code?: number) => void) | null = null;

/**
 * Register global UI handlers to connect pure JS API calls with React Context state.
 */
export function registerGlobalUIHandlers(
  show: () => void,
  hide: () => void,
  error: (title: string, message: string, code?: number) => void
) {
  showLoadingCallback = show;
  hideLoadingCallback = hide;
  showErrorCallback = error;
}

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit & { suppressGlobalError?: boolean }
): Promise<T> {
  const { suppressGlobalError = false, ...fetchOptions } = options || {};
  
  // Show global loading indicator
  showLoadingCallback?.();

  const url = `${API_BASE_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const isFormData = typeof window !== 'undefined' && fetchOptions.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...fetchOptions.headers,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.statusText || response.status}`;
      try {
        const errorData = await response.json();
        if (errorData) {
          if (errorData.errors && typeof errorData.errors === 'object') {
            const detailMessages = Object.entries(errorData.errors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('; ');
            errorMessage = `${errorData.title || 'One or more validation errors occurred.'} Details: ${detailMessages}`;
          } else {
            errorMessage = errorData.detail || errorData.message || errorData.title || errorMessage;
          }
        }
      } catch {}

      // Handle specific HTTP Status Codes
      if (response.status === 401) {
        if (endpoint.includes("/api/auth/login")) {
          errorMessage = "Tài khoản hoặc mật khẩu không chính xác.";
        } else {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user-role');
            localStorage.removeItem('user-info');
            window.location.href = '/login';
          }
        }
      }

      // Display global error popup if not suppressed
      if (!suppressGlobalError) {
        showErrorCallback?.(
          response.status === 401 ? "Lỗi Xác Thực" : "Lỗi Kết Nối Hệ Thống",
          errorMessage,
          response.status
        );
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    // Catch network failures (e.g. Server is offline)
    const isNetworkError = error.message && (
      error.message.includes("Failed to fetch") || 
      error.message.includes("NetworkError") || 
      error.message.includes("API Error")
    );

    if (isNetworkError && !suppressGlobalError) {
      showErrorCallback?.(
        "Lỗi Kết Nối Server",
        "Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại đường truyền hoặc khởi chạy Backend C# API.",
        500
      );
    }

    throw error;
  } finally {
    // Hide global loading indicator
    hideLoadingCallback?.();
  }
}

export async function fetchWithFallback<T>(
  endpoint: string,
  mockData: T,
  options?: RequestInit
): Promise<T> {
  try {
    // Suppress global error popup inside fallback call to avoid scaring users
    const data = await fetchAPI<T>(endpoint, {
      ...options,
      suppressGlobalError: true
    } as any);
    return data;
  } catch (error) {
    console.warn(
      `[API Fallback Warning] Gọi API tới "${endpoint}" thất bại. Sử dụng Mock Data thay thế.`,
      error
    );
    return mockData;
  }
}
