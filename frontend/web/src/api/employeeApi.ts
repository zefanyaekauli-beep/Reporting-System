// frontend/web/src/api/employeeApi.ts

import api from "./client";

export interface Employee {
  id: number;
  company_id: number;
  user_id?: number;
  nik?: string;
  full_name: string;
  email?: string;
  phone?: string;
  position?: string;
  division?: string;
  site_id?: number;
  hire_date?: string;
  status: string;
  photo_path?: string;
  created_at: string;
}

export interface Contract {
  id: number;
  employee_id: number;
  contract_type: string;
  contract_number?: string;
  start_date: string;
  end_date?: string;
  base_salary?: number;
  status: string;
  created_at: string;
}

export interface EmployeeCreate {
  user_id?: number;
  nik?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  employee_number?: string;
  position?: string;
  division?: string;
  site_id?: number;
  department?: string;
  hire_date?: string;
  photo_path?: string;
  notes?: string;
}

export interface ContractCreate {
  employee_id: number;
  contract_type: string;
  contract_number?: string;
  start_date: string;
  end_date?: string;
  base_salary?: number;
  allowances?: number;
  benefits?: string;
  terms?: string;
  probation_period_days?: number;
  signed_date?: string;
  signed_by?: string;
  notes?: string;
}

export async function listEmployees(params?: {
  site_id?: number;
  division?: string;
  status?: string;
}): Promise<Employee[]> {
  const response = await api.get("/employees", { params });
  return response.data;
}

export async function getEmployee(id: number): Promise<Employee> {
  const response = await api.get(`/employees/${id}`);
  return response.data;
}

export async function createEmployee(payload: EmployeeCreate): Promise<Employee> {
  const response = await api.post("/employees", payload);
  return response.data;
}

export async function updateEmployee(id: number, payload: Partial<EmployeeCreate>): Promise<Employee> {
  const response = await api.put(`/employees/${id}`, payload);
  return response.data;
}

export async function deleteEmployee(id: number): Promise<void> {
  await api.delete(`/employees/${id}`);
}

export async function getEmployeeContracts(employeeId: number): Promise<Contract[]> {
  const response = await api.get(`/employees/${employeeId}/contracts`);
  return response.data;
}

export async function addContract(payload: ContractCreate): Promise<Contract> {
  const response = await api.post("/employees/contracts", payload);
  return response.data;
}

export async function getExpiringContracts(daysAhead: number = 30): Promise<Contract[]> {
  const response = await api.get("/employees/contracts/expiring", { params: { days_ahead: daysAhead } });
  return response.data;
}

export async function checkContractExpiry(): Promise<{ success: boolean; notifications_sent: number; message: string }> {
  const response = await api.post("/employees/contracts/check-expiry");
  return response.data;
}

