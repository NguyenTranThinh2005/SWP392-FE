// Global types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
