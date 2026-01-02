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
  photo?: File; // Make optional to match usage
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
  
  // CRITICAL: Append photo file with proper filename
  if (payload.photo) {
    // Ensure we have a proper File object
    let photoFile: File;
    
    if (payload.photo instanceof File) {
      // Already a File object - use it directly
      photoFile = payload.photo;
    } else if (payload.photo instanceof Blob) {
      // Convert Blob to File
      photoFile = new File([payload.photo], payload.photo.name || "photo.jpg", { 
        type: payload.photo.type || "image/jpeg",
        lastModified: Date.now()
      });
    } else {
      // Unknown type - try to create File from it
      console.warn("⚠️ Photo is not a File or Blob, attempting conversion...");
      photoFile = new File([payload.photo as any], "photo.jpg", { 
        type: "image/jpeg",
        lastModified: Date.now()
      });
    }
    
    // CRITICAL: Append with explicit filename to ensure backend receives it correctly
    formData.append("photo", photoFile, photoFile.name);
    
    console.log("📸 Photo appended to FormData:", {
      name: photoFile.name,
      size: photoFile.size,
      type: photoFile.type,
      lastModified: photoFile.lastModified,
      isFile: photoFile instanceof File,
      isBlob: photoFile instanceof Blob
    });
    
    // Verify the file is actually readable
    if (photoFile.size === 0) {
      console.error("❌ ERROR: Photo file has 0 bytes!");
    } else {
      console.log(`✅ Photo file is valid: ${photoFile.size} bytes`);
    }
  } else {
    console.warn("⚠️ No photo provided in payload");
  }

  console.log("FormData prepared:");
  console.log("qr_data:", payload.qr_data);
  console.log("role_type:", payload.role_type);
  console.log("lat:", payload.lat);
  console.log("lng:", payload.lng);
  console.log("accuracy:", payload.accuracy);
  console.log("photo file:", payload.photo?.name, payload.photo?.size, "bytes");
  
  // Verify FormData has photo
  if (formData.has("photo")) {
    const photoEntry = formData.get("photo");
    console.log("✅ FormData contains photo:", photoEntry instanceof File ? {
      name: photoEntry.name,
      size: photoEntry.size,
      type: photoEntry.type
    } : "Not a File object");
  } else {
    console.error("❌ FormData does NOT contain photo!");
  }

  try {
    console.log("📡 Sending POST /attendance/scan-qr ...");

    console.log("=".repeat(60));
    console.log("📡 [scanQRAttendance] === SENDING REQUEST ===");
    console.log("=".repeat(60));
    console.log("📡 Request URL: /attendance/scan-qr");
    console.log("📡 Request method: POST");
    console.log("📡 Content-Type: multipart/form-data");
    
    // Log FormData contents (as much as possible)
    console.log("📡 FormData contents:");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  - ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  - ${key}: ${value}`);
      }
    }
    
    const response = await api.post("/attendance/scan-qr", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("=".repeat(60));
    console.log("✅ [scanQRAttendance] === RESPONSE RECEIVED ===");
    console.log("=".repeat(60));
    console.log("✅ Response SUCCESS from /attendance/scan-qr");
    console.log("✅ Response status:", response.status);
    console.log("✅ Response data:", response.data);
    
    // Check if photo_path is in response
    if (response.data.photo_path) {
      console.log("");
      console.log("✅ PHOTO PROCESSING CONFIRMED:");
      console.log("  - Photo path:", response.data.photo_path);
      console.log("  - ✅ Backend has saved photo with watermark");
      console.log("  - 📁 File location:", response.data.photo_path);
    } else {
      console.log("");
      console.warn("⚠️ PHOTO PROCESSING STATUS:");
      console.warn("  - ⚠️ No photo_path in response");
      console.warn("  - ⚠️ Photo may not have been saved or watermark may have failed");
    }
    console.log("=".repeat(60));

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
  shift: string | null;
  is_overtime: boolean;
  is_backup: boolean;
}[]> {
  const params = role_type ? { role_type } : {};
  const response = await api.get("/attendance/my", { params });
  return response.data;
}

