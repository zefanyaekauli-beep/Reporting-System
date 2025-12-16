// frontend/web/src/api/client.ts
import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const getApiBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // ✅ Jika ada env URL, gunakan langsung (baik relatif maupun absolute)
  if (envUrl) {
    return envUrl;
  }
  
  // ✅ Fallback ke relative path jika tidak ada env var
  return "/api";
};

const API_BASE_URL = getApiBaseURL();

console.log("API Client initialized with baseURL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 detik untuk checklist yang kompleks
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
    if (import.meta.env.DEV) {
      console.log("API Response Success:", {
        status: response.status,
        url: response.config.url,
      });
    }
    return response;
  },
  (error) => {
    const errorInfo = {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      errorCode: error?.response?.data?.error_code,
      detail: error?.response?.data?.detail,
      url: error?.config?.url,
      baseURL: error?.config?.baseURL,
      fullURL: `${error?.config?.baseURL}${error?.config?.url}`,
      responseData: error?.response?.data,
    };

    // Don't log 404 errors for endpoints where 404 is expected behavior
    const expected404Endpoints = [
      '/security/me/checklist/today',
      '/cleaning/me/checklist/today',
      '/parking/me/checklist/today',
      '/driver/checklist/today',
      '/cleaning/checklist/today',
      '/parking/checklist/today',
    ];
    
    const isExpected404 = error?.response?.status === 404 && 
      expected404Endpoints.some(endpoint => error?.config?.url?.includes(endpoint));

    if (!isExpected404) {
      console.error("API Response Error:", errorInfo);
    }

    if (error?.response?.status === 401) {
      const authStore = useAuthStore.getState();
      authStore.clear();
      localStorage.removeItem("auth_token");
      localStorage.removeItem("userRole");
      
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject({
      ...error,
      errorInfo,
    });
  }
);

export default api;