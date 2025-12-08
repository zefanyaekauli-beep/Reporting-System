import api from "./client";

interface LoginRequest {
  username: string;
  password: string;
}

export interface UserInfo {
  id: number;
  username: string;
  division: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  division: string;
  role: string;
  user: UserInfo;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  try {
    console.log("API: Sending login request to /auth/login", payload);
    console.log("API: Base URL:", import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api");
    
    const response = await api.post<LoginResponse>("/auth/login", payload);
    
    console.log("API: Full response object:", response);
    console.log("API: Response status:", response.status);
    console.log("API: Response data:", response.data);
    console.log("API: Response headers:", response.headers);
    
    if (!response.data) {
      console.error("API: Response data is empty!");
      throw new Error("No data in response");
    }
    
    return response.data;
  } catch (error: any) {
    console.error("API: Login request failed", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      config: {
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
        method: error?.config?.method,
      },
      stack: error?.stack,
    });
    throw error;
  }
}
