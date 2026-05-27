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

// Domain types
export * from './user'
export * from './series'
export * from './chapter'
export * from './task'
export * from './manuscript'
export * from './review'
export * from './vote'
export * from './notification'
export * from './audit'
export * from './dashboard'
export * from './forms'
