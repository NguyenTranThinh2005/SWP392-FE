// Application constants
export const APP_NAME = "My App";
export const APP_VERSION = "1.0.0";

// API endpoints
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
} as const;
