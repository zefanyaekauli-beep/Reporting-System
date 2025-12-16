// frontend/web/src/api/attendanceApi.ts

import api from "./client";

export interface CheckInRequest {
  site_id: number;
  role_type: "SECURITY" | "CLEANING" | "DRIVER";
  lat: number;
  lng: number;
  accuracy?: number;
  photo: File;
}

export interface CheckOutRequest {
  attendance_id: number;
  lat: number;
  lng: number;
  accuracy?: number;
  photo: File;
}

export interface AttendanceResponse {
  attendance_id: number;
  is_valid_location: boolean;
  message: string;
  checkin_time?: string;
  checkout_time?: string;
}

export interface CurrentAttendance {
  attendance: {
    id: number;
    site_id: number;
    role_type: string;
    checkin_time: string;
    checkin_lat: number;
    checkin_lng: number;
    is_valid_location: boolean;
  } | null;
}

/**
 * Check-in dengan GPS dan foto dari kamera
 */
export async function checkIn(payload: CheckInRequest): Promise<AttendanceResponse> {
  const formData = new FormData();
  formData.append("site_id", String(payload.site_id));
  formData.append("role_type", payload.role_type);
  formData.append("lat", String(payload.lat));
  formData.append("lng", String(payload.lng));
  if (payload.accuracy !== undefined) {
    formData.append("accuracy", String(payload.accuracy));
  }
  formData.append("photo", payload.photo);

  const response = await api.post("/attendance/checkin", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/**
 * Check-out dengan GPS dan foto dari kamera
 */
export async function checkOut(payload: CheckOutRequest): Promise<AttendanceResponse> {
  const formData = new FormData();
  formData.append("attendance_id", String(payload.attendance_id));
  formData.append("lat", String(payload.lat));
  formData.append("lng", String(payload.lng));
  if (payload.accuracy !== undefined) {
    formData.append("accuracy", String(payload.accuracy));
  }
  formData.append("photo", payload.photo);

  const response = await api.post("/attendance/checkout", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/**
 * Get current active attendance
 */
export async function getCurrentAttendance(): Promise<CurrentAttendance> {
  const response = await api.get("/attendance/current");
  return response.data;
}

/**
 * Scan QR code untuk attendance (auto clock-in/clock-out)
 */
export async function scanQRAttendance(payload: {
  qr_data: string;
  role_type: "SECURITY" | "CLEANING" | "DRIVER" | "PARKING";
  lat?: number;
  lng?: number;
  accuracy?: number;
  photo: File;
}): Promise<{
  action: "clock_in" | "clock_out";
  attendance_id: number;
  site_name: string;
  checkin_time?: string;
  checkout_time?: string;
  is_valid_location: boolean;
  message: string;
}> {

  console.log("=== scanQRAttendance() CALLED ===");
  console.log("Payload received:", payload);
  console.log("Payload fields:", {
    qr_data: payload.qr_data,
    role_type: payload.role_type,
    lat: payload.lat,
    lng: payload.lng,
    accuracy: payload.accuracy,
    hasPhoto: !!payload.photo,
    photoName: payload.photo?.name,
  });

  const formData = new FormData();
  formData.append("qr_data", payload.qr_data);
  formData.append("role_type", payload.role_type);
  if (payload.lat !== undefined) formData.append("lat", String(payload.lat));
  if (payload.lng !== undefined) formData.append("lng", String(payload.lng));
  if (payload.accuracy !== undefined) formData.append("accuracy", String(payload.accuracy));
  formData.append("photo", payload.photo);

  console.log("FormData prepared:");
  console.log("qr_data:", payload.qr_data);
  console.log("role_type:", payload.role_type);
  console.log("lat:", payload.lat);
  console.log("lng:", payload.lng);
  console.log("accuracy:", payload.accuracy);
  console.log("photo file:", payload.photo?.name, payload.photo?.size, "bytes");

  try {
    console.log("📡 Sending POST /attendance/scan-qr ...");

    const response = await api.post("/attendance/scan-qr", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("✅ Response SUCCESS from /attendance/scan-qr:", response);
    console.log("Response data:", response.data);

    return response.data;

  } catch (error: any) {
    console.error("❌ Error calling /attendance/scan-qr");
    console.error("Error message:", error?.message);
    console.error("Response error:", error?.response?.data);
    console.error("Status:", error?.response?.status);
    console.error("Config:", error?.config);

    throw error; // lempar lagi supaya FE tetap tahu errornya
  }
}


/**
 * Get attendance status (on_shift or not_clocked_in)
 */
export async function getAttendanceStatus(role_type?: string): Promise<{
  status: "on_shift" | "not_clocked_in";
  current_attendance: {
    id: number;
    site_id: number;
    site_name: string;
    role_type: string;
    checkin_time: string;
    checkin_lat: number;
    checkin_lng: number;
  } | null;
}> {
  const params = role_type ? { role_type } : {};
  const response = await api.get("/attendance/status", { params });
  return response.data;
}

/**
 * List my attendance history
 */
export async function listMyAttendance(role_type?: string): Promise<{
  id: number;
  site_id: number;
  site_name: string;
  role_type: string;
  checkin_time: string | null;
  checkout_time: string | null;
  checkin_lat: number | null;
  checkin_lng: number | null;
  checkout_lat: number | null;
  checkout_lng: number | null;
  status: string;
  is_valid_location: boolean;
}[]> {
  const params = role_type ? { role_type } : {};
  const response = await api.get("/attendance/my", { params });
  return response.data;
}

