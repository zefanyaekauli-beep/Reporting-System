// frontend/web/src/routes/AppRoutes.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { SecurityDashboardPage } from "../modules/security/pages/SecurityDashboardPage";
import { CleaningDashboardPage } from "../modules/cleaning/pages/CleaningDashboardPage";
import { ParkingDashboardPage } from "../modules/parking/pages/ParkingDashboardPage";
import { LoginPage } from "../modules/shared/components/LoginPage";
import { QRAttendancePage } from "../modules/shared/pages/QRAttendancePage";
import { MobileCheckinPage } from "../modules/shared/pages/MobileCheckinPage";
import { ClockInPage } from "../modules/shared/pages/ClockInPage";
import { AttendanceListPage } from "../modules/shared/pages/AttendanceListPage";
import { ProfilePage } from "../modules/shared/pages/ProfilePage";
// Security pages
import { SecurityReportFormPage } from "../modules/security/pages/SecurityReportFormPage";
import { SecurityReportsListPage } from "../modules/security/pages/SecurityReportsListPage";
import { SecurityReportDetailPage } from "../modules/security/pages/SecurityReportDetailPage";
import { SecurityAttendancePage } from "../modules/security/pages/SecurityAttendancePage";
import { SecurityPatrolFormPage } from "../modules/security/pages/SecurityPatrolFormPage";
import { SecurityPatrolListPage } from "../modules/security/pages/SecurityPatrolListPage";
import { SecurityPatrolDetailPage } from "../modules/security/pages/SecurityPatrolDetailPage";
import { SecurityChecklistPage } from "../modules/security/pages/SecurityChecklistPage";
import { SecurityChecklistSupervisorPage } from "../modules/security/pages/SecurityChecklistSupervisorPage";
import { SecurityPanicButtonPage } from "../modules/security/pages/SecurityPanicButtonPage";
import { SecurityDispatchPage } from "../modules/security/pages/SecurityDispatchPage";
import { SecurityPassdownPage } from "../modules/security/pages/SecurityPassdownPage";
import { SecurityDARPage } from "../modules/security/pages/SecurityDARPage";
import { VisitorLogFormPage } from "../modules/security/pages/VisitorLogFormPage";
import { VisitorLogListPage } from "../modules/security/pages/VisitorLogListPage";
import { AssetInspectionFormPage } from "../modules/security/pages/AssetInspectionFormPage";
import { LeaveRequestFormPage } from "../modules/security/pages/LeaveRequestFormPage";
import { LeaveRequestListPage } from "../modules/security/pages/LeaveRequestListPage";
import { SecurityPatrolRoutesPage } from "../modules/security/pages/SecurityPatrolRoutesPage";
import { SecurityPostOrdersPage } from "../modules/security/pages/SecurityPostOrdersPage";
import { SecurityShiftsPage } from "../modules/security/pages/SecurityShiftsPage";
import { SecurityGPSTrackingPage } from "../modules/security/pages/SecurityGPSTrackingPage";
import { SecurityPayrollPage } from "../modules/security/pages/SecurityPayrollPage";
import { SecurityClientPortalPage } from "../modules/security/pages/SecurityClientPortalPage";
import { SecurityShiftExchangePage } from "../modules/security/pages/SecurityShiftExchangePage";
import { SecurityShiftCalendarPage } from "../modules/security/pages/SecurityShiftCalendarPage";
// Cleaning pages
import { CleaningChecklistFormPage } from "../modules/cleaning/pages/CleaningChecklistFormPage";
import { CleaningTasksPage } from "../modules/cleaning/pages/CleaningTasksPage";
import { CleaningQRScanPage } from "../modules/cleaning/pages/CleaningQRScanPage";
import { CleaningZoneChecklistPage } from "../modules/cleaning/pages/CleaningZoneChecklistPage";
import { CleaningDashboardSupervisorPage } from "../modules/cleaning/pages/CleaningDashboardSupervisorPage";
import { CleaningChecklistPage } from "../modules/cleaning/pages/CleaningChecklistPage";
import { CleaningShiftCalendarPage } from "../modules/cleaning/pages/CleaningShiftCalendarPage";
import { DriverChecklistPage } from "../modules/driver/pages/DriverChecklistPage";
import { DriverShiftCalendarPage } from "../modules/driver/pages/DriverShiftCalendarPage";
import { CleaningDashboardPage as SupervisorCleaningDashboardPage } from "../modules/supervisor/pages/CleaningDashboardPage";
import { CleaningAttendancePage } from "../modules/cleaning/pages/CleaningAttendancePage";
import { CleaningReportsListPage } from "../modules/cleaning/pages/CleaningReportsListPage";
import { CleaningReportFormPage } from "../modules/cleaning/pages/CleaningReportFormPage";
import { CleaningReportDetailPage } from "../modules/cleaning/pages/CleaningReportDetailPage";
// Driver pages
import { DriverTripsPage } from "../modules/driver/pages/DriverTripsPage";
import { DriverTripDetailPage } from "../modules/driver/pages/DriverTripDetailPage";
// Parking pages
import { ParkingEntryPage } from "../modules/parking/pages/ParkingEntryPage";
import { ParkingExitPage } from "../modules/parking/pages/ParkingExitPage";
import { ParkingChecklistPage } from "../modules/parking/pages/ParkingChecklistPage";
import { ParkingShiftCalendarPage } from "../modules/parking/pages/ParkingShiftCalendarPage";
import { ParkingAttendancePage } from "../modules/parking/pages/ParkingAttendancePage";
import { ParkingReportsListPage } from "../modules/parking/pages/ParkingReportsListPage";
import { ParkingReportFormPage } from "../modules/parking/pages/ParkingReportFormPage";
import { ParkingReportDetailPage } from "../modules/parking/pages/ParkingReportDetailPage";
// Supervisor pages
import SupervisorLayout from "../modules/supervisor/layout/SupervisorLayout";
import SupervisorDashboardPage from "../modules/supervisor/pages/SupervisorDashboardPage";
import { SupervisorAttendancePage } from "../modules/supervisor/pages/SupervisorAttendancePage";
import { SupervisorReportsPage } from "../modules/supervisor/pages/SupervisorReportsPage";
import { SupervisorSitesPage } from "../modules/supervisor/pages/SupervisorSitesPage";
import { SupervisorAnnouncementsPage } from "../modules/supervisor/pages/SupervisorAnnouncementsPage";
import { SupervisorChecklistPage } from "../modules/supervisor/pages/SupervisorChecklistPage";
import { SupervisorShiftCalendarPage } from "../modules/supervisor/pages/SupervisorShiftCalendarPage";
import OfficerListPage from "../modules/supervisor/pages/OfficerListPage";
import AttendanceCorrectionPage from "../modules/supervisor/pages/AttendanceCorrectionPage";
import InspectPointListPage from "../modules/supervisor/pages/InspectPointListPage";
import SimpleAttendancePage from "../modules/supervisor/pages/SimpleAttendancePage";
import OvertimeListPage from "../modules/supervisor/pages/OvertimeListPage";
import OutstationListPage from "../modules/supervisor/pages/OutstationListPage";
import LeaveListPage from "../modules/supervisor/pages/LeaveListPage";
import ApprovalListPage from "../modules/supervisor/pages/ApprovalListPage";
import PatrolActivityListPage from "../modules/supervisor/pages/PatrolActivityListPage";
import { ProtectedRoute } from "../modules/shared/components/ProtectedRoute";

function DivisionHomeRedirect() {
  const division = useAuthStore((s) => s.division);

  // Always redirect to login if not authenticated
  if (!division) {
    return <Navigate to="/login" replace />;
  }

  if (division === "security") {
    return <Navigate to="/security/dashboard" replace />;
  }

  if (division === "cleaning") {
    return <Navigate to="/cleaning/dashboard" replace />;
  }

  if (division === "driver") {
    return <Navigate to="/driver/trips" replace />;
  }

  if (division === "parking") {
    return <Navigate to="/parking/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DivisionHomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Supervisor Routes */}
        <Route
          path="/supervisor"
          element={
            <ProtectedRoute allowedRoles={["supervisor", "admin"]}>
              <SupervisorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SupervisorDashboardPage />} />
          <Route path="dashboard" element={<SupervisorDashboardPage />} />
          <Route path="officers" element={<OfficerListPage />} />
              <Route path="attendance" element={<SupervisorAttendancePage />} />
              <Route path="attendance/simple" element={<SimpleAttendancePage />} />
              <Route path="attendance/correction" element={<AttendanceCorrectionPage />} />
              <Route path="attendance/overtime" element={<OvertimeListPage />} />
              <Route path="attendance/outstation" element={<OutstationListPage />} />
              <Route path="attendance/leave" element={<LeaveListPage />} />
              <Route path="attendance/approval" element={<ApprovalListPage />} />
          <Route path="patrol-activity" element={<PatrolActivityListPage />} />
              <Route path="checklists" element={<SupervisorChecklistPage />} />
              <Route path="inspectpoints" element={<InspectPointListPage />} />
              <Route path="reports" element={<SupervisorReportsPage />} />
              <Route path="sites" element={<SupervisorSitesPage />} />
              <Route path="announcements" element={<SupervisorAnnouncementsPage />} />
              <Route path="shifts" element={<SupervisorShiftCalendarPage />} />
              <Route path="cleaning/dashboard" element={<SupervisorCleaningDashboardPage />} />
        </Route>

        {/* Security */}
        <Route path="/security/dashboard" element={<SecurityDashboardPage />} />
        <Route path="/security/attendance" element={<SecurityAttendancePage />} />
        <Route path="/security/attendance/qr" element={<QRAttendancePage roleType="SECURITY" />} />
                <Route path="/security/attendance/checkin" element={<MobileCheckinPage roleType="SECURITY" siteName="Entrance Gate" />} />
                <Route path="/security/attendance/clock-in" element={<ClockInPage roleType="SECURITY" siteName="Entrance Gate" />} />
        <Route path="/security/attendance/list" element={<AttendanceListPage roleType="SECURITY" />} />
        <Route path="/security/checklist" element={<SecurityChecklistPage />} />
        <Route path="/security/checklist/supervisor" element={<SecurityChecklistSupervisorPage />} />
        <Route path="/security/panic" element={<SecurityPanicButtonPage />} />
        <Route path="/security/dispatch" element={<SecurityDispatchPage />} />
        <Route path="/security/passdown" element={<SecurityPassdownPage />} />
        <Route path="/security/dar" element={<SecurityDARPage />} />
        <Route path="/security/reports" element={<SecurityReportsListPage />} />
        <Route path="/security/reports/:id" element={<SecurityReportDetailPage />} />
        <Route path="/security/reports/new" element={<SecurityReportFormPage />} />
        <Route path="/security/patrol" element={<SecurityPatrolListPage />} />
        <Route path="/security/patrol/:id" element={<SecurityPatrolDetailPage />} />
        <Route path="/security/patrol/new" element={<SecurityPatrolFormPage />} />
        <Route path="/security/visitors" element={<VisitorLogListPage />} />
        <Route path="/security/visitors/new" element={<VisitorLogFormPage />} />
        <Route path="/security/assets/inspect" element={<AssetInspectionFormPage />} />
        <Route path="/security/leave-requests" element={<LeaveRequestListPage />} />
        <Route path="/security/leave-requests/new" element={<LeaveRequestFormPage />} />
        <Route path="/security/patrol-routes" element={<SecurityPatrolRoutesPage />} />
        <Route path="/security/post-orders" element={<SecurityPostOrdersPage />} />
        <Route path="/security/shifts" element={<SecurityShiftCalendarPage />} />
        <Route path="/security/gps" element={<SecurityGPSTrackingPage />} />
        <Route path="/security/payroll" element={<SecurityPayrollPage />} />
        <Route path="/security/client-portal" element={<SecurityClientPortalPage />} />
        <Route path="/security/shifts/exchange" element={<SecurityShiftExchangePage />} />
        <Route path="/security/shifts/calendar" element={<SecurityShiftCalendarPage />} />
        {/* TODO: /security/report/:id */}

            {/* Cleaning */}
            <Route path="/cleaning/dashboard" element={<CleaningDashboardPage />} />
            <Route path="/cleaning/attendance" element={<CleaningAttendancePage />} />
            <Route path="/cleaning/attendance/qr" element={<QRAttendancePage roleType="CLEANING" />} />
                <Route path="/cleaning/attendance/checkin" element={<MobileCheckinPage roleType="CLEANING" siteName="Cleaning Area" />} />
                <Route path="/cleaning/attendance/clock-in" element={<ClockInPage roleType="CLEANING" siteName="Cleaning Area" />} />
            <Route path="/cleaning/attendance/list" element={<AttendanceListPage roleType="CLEANING" />} />
            <Route path="/cleaning/reports" element={<CleaningReportsListPage />} />
            <Route path="/cleaning/reports/new" element={<CleaningReportFormPage />} />
            <Route path="/cleaning/reports/:id" element={<CleaningReportDetailPage />} />
            <Route path="/cleaning/tasks" element={<CleaningTasksPage />} />
            <Route path="/cleaning/scan" element={<CleaningQRScanPage />} />
            <Route path="/cleaning/zones/:zoneId/checklist" element={<CleaningZoneChecklistPage />} />
            <Route path="/cleaning/dashboard/supervisor" element={<CleaningDashboardSupervisorPage />} />
            <Route path="/cleaning/checklist" element={<CleaningChecklistPage />} />
            <Route path="/cleaning/shifts" element={<CleaningShiftCalendarPage />} />
            <Route path="/cleaning/shifts/calendar" element={<CleaningShiftCalendarPage />} />
            <Route path="/cleaning/panic" element={<SecurityPanicButtonPage />} />
            <Route path="/cleaning/passdown" element={<SecurityPassdownPage />} />
            <Route
              path="/cleaning/checklists/new"
              element={<CleaningChecklistFormPage />}
            />
        
        {/* Driver */}
        <Route path="/driver/trips" element={<DriverTripsPage />} />
        <Route path="/driver/trips/:tripId" element={<DriverTripDetailPage />} />
        <Route path="/driver/checklist" element={<DriverChecklistPage />} />
        <Route path="/driver/shifts" element={<DriverShiftCalendarPage />} />
        <Route path="/driver/shifts/calendar" element={<DriverShiftCalendarPage />} />
        
        {/* Parking */}
        <Route path="/parking/dashboard" element={<ParkingDashboardPage />} />
        <Route path="/parking/attendance" element={<ParkingAttendancePage />} />
        <Route path="/parking/attendance/qr" element={<QRAttendancePage roleType="PARKING" />} />
                <Route path="/parking/attendance/checkin" element={<MobileCheckinPage roleType="PARKING" siteName="Parking Area" />} />
                <Route path="/parking/attendance/clock-in" element={<ClockInPage roleType="PARKING" siteName="Parking Area" />} />
        <Route path="/parking/attendance/list" element={<AttendanceListPage roleType="PARKING" />} />
        <Route path="/parking/reports" element={<ParkingReportsListPage />} />
        <Route path="/parking/reports/new" element={<ParkingReportFormPage />} />
        <Route path="/parking/reports/:id" element={<ParkingReportDetailPage />} />
        <Route path="/parking/entry" element={<ParkingEntryPage />} />
        <Route path="/parking/exit" element={<ParkingExitPage />} />
        <Route path="/parking/checklist" element={<ParkingChecklistPage />} />
        <Route path="/parking/shifts" element={<ParkingShiftCalendarPage />} />
        <Route path="/parking/shifts/calendar" element={<ParkingShiftCalendarPage />} />
        <Route path="/parking/panic" element={<SecurityPanicButtonPage />} />
        <Route path="/parking/passdown" element={<SecurityPassdownPage />} />
        {/* TODO: /parking/sessions, /parking/session/:id */}

        {/* Shared Routes */}
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
