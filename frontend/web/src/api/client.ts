import axios from "axios";
import { useAuthStore } from "../stores/authStore";

// Use environment variable or proxy through Vite
const getApiBaseURL = () => {
  // If explicitly set via env var AND it's a relative path, use it
  // Otherwise, always use relative path for proxy to work
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Only use env URL if it's a relative path (starts with /)
  // This ensures the Vite proxy works correctly
  if (envUrl && envUrl.startsWith("/")) {
    return envUrl;
  }
  
  // Always use relative path - Vite proxy will forward /api/* to backend
  // This avoids mixed content issues (HTTPS frontend -> HTTP backend)
  // The proxy in vite.config.ts handles forwarding to http://localhost:8000
  return "/api";
};

const API_BASE_URL = getApiBaseURL();

console.log("API Client initialized with baseURL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("API Request:", {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Log successful responses in development only
    if (import.meta.env.DEV) {
      console.log("API Response Success:", {
        status: response.status,
        url: response.config.url,
      });
    }
    return response;
  },
  (error) => {
    // Enhanced error handling with structured logging
    const errorInfo = {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      errorCode: error?.response?.data?.error_code,
      detail: error?.response?.data?.detail,
      url: error?.config?.url,
    };

    // Log error (always log errors, even in production)
    console.error("API Response Error:", errorInfo);

    // Handle specific error cases
    if (error?.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      const authStore = useAuthStore.getState();
      authStore.clear();
      localStorage.removeItem("auth_token");
      localStorage.removeItem("userRole");
      
      // Only redirect if we're not already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Reject with enhanced error info
    return Promise.reject({
      ...error,
      errorInfo, // Add structured error info
    });
  }
);

export default api;
