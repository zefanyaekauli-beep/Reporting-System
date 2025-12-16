// frontend/web/src/modules/admin/pages/EmployeePage.tsx

import React, { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeContracts,
  addContract,
  getExpiringContracts,
  Employee,
  EmployeeCreate,
  Contract,
  ContractCreate,
} from "../../../api/employeeApi";
import { listSites, Site } from "../../../api/supervisorApi";

export function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [formData, setFormData] = useState<EmployeeCreate>({
    full_name: "",
    nik: "",
    email: "",
    phone: "",
    position: "",
    division: "",
    site_id: undefined,
    hire_date: "",
  });
  const [contractFormData, setContractFormData] = useState<ContractCreate>({
    employee_id: 0,
    contract_type: "PERMANENT",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    base_salary: 0,
  });

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {};
      if (selectedSiteId) params.site_id = selectedSiteId;
      if (selectedDivision) params.division = selectedDivision;

      const [employeesData, sitesData, expiringData] = await Promise.all([
        listEmployees(params),
        listSites(),
        getExpiringContracts(30),
      ]);

      setEmployees(employeesData);
      setSites(sitesData);
      setExpiringContracts(expiringData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteId, selectedDivision]);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadContracts(selectedEmployeeId);
    }
  }, [selectedEmployeeId]);

  const loadContracts = async (employeeId: number) => {
    try {
      const data = await getEmployeeContracts(employeeId);
      setContracts(data);
    } catch (err: any) {
      console.error("Failed to load contracts:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateEmployee(editingId, formData);
      } else {
        await createEmployee(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        full_name: "",
        nik: "",
        email: "",
        phone: "",
        position: "",
        division: "",
        site_id: undefined,
        hire_date: "",
      });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to save employee");
    }
  };

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addContract(contractFormData);
      setShowContractForm(false);
      setContractFormData({
        employee_id: 0,
        contract_type: "PERMANENT",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        base_salary: 0,
      });
      if (selectedEmployeeId) {
        loadContracts(selectedEmployeeId);
      }
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to create contract");
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setFormData({
      full_name: employee.full_name,
      nik: employee.nik || "",
      email: employee.email || "",
      phone: employee.phone || "",
      position: employee.position || "",
      division: employee.division || "",
      site_id: employee.site_id,
      hire_date: employee.hire_date || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await deleteEmployee(id);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to delete employee");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return theme.colors.success;
      case "INACTIVE":
        return theme.colors.danger;
      case "ON_LEAVE":
        return theme.colors.warning;
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
            Employee & Contract Management
          </h1>
          <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
            Manage employee database and contracts with expiry notifications
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 20px",
            borderRadius: theme.radius.button,
            backgroundColor: theme.colors.primary,
            color: "white",
            border: "none",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + New Employee
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: theme.colors.danger + "20",
            border: `1px solid ${theme.colors.danger}`,
            color: theme.colors.danger,
            fontSize: 12,
            borderRadius: theme.radius.card,
            padding: "10px 12px",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Expiring Contracts Alert */}
      {expiringContracts.length > 0 && (
        <div
          style={{
            backgroundColor: theme.colors.warning + "20",
            border: `1px solid ${theme.colors.warning}`,
            color: theme.colors.warning,
            fontSize: 12,
            borderRadius: theme.radius.card,
            padding: "10px 12px",
          }}
        >
          <strong>Warning:</strong> {expiringContracts.length} contract(s) expiring within 30 days
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          padding: 12,
          boxShadow: theme.shadowCard,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            Site
          </label>
          <select
            value={selectedSiteId || ""}
            onChange={(e) => setSelectedSiteId(e.target.value ? parseInt(e.target.value) : null)}
            style={{
              width: "100%",
              borderRadius: theme.radius.input,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 13,
              color: theme.colors.textMain,
            }}
          >
            <option value="">All Sites</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            Division
          </label>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            style={{
              width: "100%",
              borderRadius: theme.radius.input,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 13,
              color: theme.colors.textMain,
            }}
          >
            <option value="">All Divisions</option>
            <option value="SECURITY">Security</option>
            <option value="CLEANING">Cleaning</option>
            <option value="DRIVER">Driver</option>
            <option value="PARKING">Parking</option>
          </select>
        </div>
      </div>

      {/* Create/Edit Employee Form */}
      {showForm && (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 16,
            boxShadow: theme.shadowCard,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain, marginBottom: 8 }}>
              {editingId ? "Edit Employee" : "Create Employee"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  NIK
                </label>
                <input
                  type="text"
                  value={formData.nik || ""}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position || ""}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Division
                </label>
                <select
                  value={formData.division || ""}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                >
                  <option value="">Select Division</option>
                  <option value="SECURITY">Security</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="DRIVER">Driver</option>
                  <option value="PARKING">Parking</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Site
                </label>
                <select
                  value={formData.site_id || ""}
                  onChange={(e) => setFormData({ ...formData, site_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                >
                  <option value="">Select Site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Hire Date
                </label>
                <input
                  type="date"
                  value={formData.hire_date || ""}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    full_name: "",
                    nik: "",
                    email: "",
                    phone: "",
                    position: "",
                    division: "",
                    site_id: undefined,
                    hire_date: "",
                  });
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: theme.radius.button,
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textMain,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
                  borderRadius: theme.radius.button,
                  backgroundColor: theme.colors.primary,
                  color: "white",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Contract Form */}
      {showContractForm && (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 16,
            boxShadow: theme.shadowCard,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <form onSubmit={handleContractSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain, marginBottom: 8 }}>
              Add Contract
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Contract Type *
                </label>
                <select
                  required
                  value={contractFormData.contract_type}
                  onChange={(e) => setContractFormData({ ...contractFormData, contract_type: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                >
                  <option value="PERMANENT">Permanent</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="PROBATION">Probation</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={contractFormData.start_date}
                  onChange={(e) => setContractFormData({ ...contractFormData, start_date: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={contractFormData.end_date || ""}
                  onChange={(e) => setContractFormData({ ...contractFormData, end_date: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Base Salary
                </label>
                <input
                  type="number"
                  min="0"
                  value={contractFormData.base_salary || 0}
                  onChange={(e) => setContractFormData({ ...contractFormData, base_salary: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowContractForm(false);
                  setContractFormData({
                    employee_id: 0,
                    contract_type: "PERMANENT",
                    start_date: new Date().toISOString().split("T")[0],
                    end_date: "",
                    base_salary: 0,
                  });
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: theme.radius.button,
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textMain,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
                  borderRadius: theme.radius.button,
                  backgroundColor: theme.colors.primary,
                  color: "white",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Add Contract
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: theme.colors.textMuted }}>
          Loading...
        </div>
      ) : employees.length === 0 ? (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 40,
            textAlign: "center",
            color: theme.colors.textMuted,
            boxShadow: theme.shadowCard,
          }}
        >
          No employees found
        </div>
      ) : (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            overflow: "hidden",
            boxShadow: theme.shadowCard,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: theme.colors.background, borderBottom: `1px solid ${theme.colors.border}` }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Name
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  NIK
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Position
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Division
                </th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Status
                </th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, idx) => (
                <tr
                  key={employee.id}
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    backgroundColor: idx % 2 === 0 ? theme.colors.surface : theme.colors.background,
                  }}
                >
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMain, fontWeight: 500 }}>
                    {employee.full_name}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                    {employee.nik || "-"}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                    {employee.position || "-"}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                    {employee.division || "-"}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: theme.radius.badge,
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: getStatusColor(employee.status) + "20",
                        color: getStatusColor(employee.status),
                      }}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button
                        onClick={() => {
                          setSelectedEmployeeId(employee.id);
                          setContractFormData({ ...contractFormData, employee_id: employee.id });
                        }}
                        style={{
                          padding: "4px 8px",
                          borderRadius: theme.radius.button,
                          backgroundColor: theme.colors.info + "20",
                          color: theme.colors.info,
                          border: "none",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Contracts
                      </button>
                      <button
                        onClick={() => handleEdit(employee)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: theme.radius.button,
                          backgroundColor: theme.colors.primary + "20",
                          color: theme.colors.primary,
                          border: "none",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: theme.radius.button,
                          backgroundColor: theme.colors.danger + "20",
                          color: theme.colors.danger,
                          border: "none",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contracts Panel */}
      {selectedEmployeeId && (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 16,
            boxShadow: theme.shadowCard,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain }}>
              Contracts
            </div>
            <button
              onClick={() => {
                setShowContractForm(true);
                setContractFormData({ ...contractFormData, employee_id: selectedEmployeeId });
              }}
              style={{
                padding: "6px 12px",
                borderRadius: theme.radius.button,
                backgroundColor: theme.colors.primary,
                color: "white",
                border: "none",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              + Add Contract
            </button>
          </div>

          {contracts.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: theme.colors.textMuted }}>
              No contracts found
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  style={{
                    padding: 12,
                    backgroundColor: theme.colors.background,
                    borderRadius: theme.radius.input,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textMain, marginBottom: 4 }}>
                    {contract.contract_type} - {contract.contract_number || "No Number"}
                  </div>
                  <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                    {new Date(contract.start_date).toLocaleDateString()} -{" "}
                    {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : "Ongoing"}
                  </div>
                  {contract.base_salary && (
                    <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                      Salary: Rp {contract.base_salary.toLocaleString("id-ID")}
                    </div>
                  )}
                  <div style={{ marginTop: 4 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 6px",
                        borderRadius: theme.radius.badge,
                        fontSize: 10,
                        fontWeight: 500,
                        backgroundColor: contract.status === "ACTIVE" ? theme.colors.success + "20" : theme.colors.danger + "20",
                        color: contract.status === "ACTIVE" ? theme.colors.success : theme.colors.danger,
                      }}
                    >
                      {contract.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

