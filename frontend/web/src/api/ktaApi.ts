// frontend/web/src/api/ktaApi.ts

import api from "./client";

/**
 * Download KTA image for an employee
 */
export async function downloadKTAImage(employeeId: number, includeQr: boolean = true) {
  const response = await api.get(`/kta/${employeeId}/image`, {
    params: { include_qr: includeQr },
    responseType: "blob",
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `KTA_${employeeId}_${new Date().toISOString().split("T")[0]}.png`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Download KTA PDF for an employee
 */
export async function downloadKTAPDF(employeeId: number) {
  const response = await api.get(`/kta/${employeeId}/pdf`, {
    responseType: "blob",
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `KTA_${employeeId}_${new Date().toISOString().split("T")[0]}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Batch generate KTA for multiple employees
 */
export async function batchGenerateKTA(employeeIds: number[], format: "PNG" | "PDF" = "PNG") {
  const response = await api.post(
    `/kta/batch?${employeeIds.map(id => `employee_ids=${id}`).join("&")}&format=${format}`,
    {},
    {
      responseType: "blob",
    }
  );
  
  // Create download link for ZIP
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `KTA_Batch_${new Date().toISOString().split("T")[0]}.zip`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

