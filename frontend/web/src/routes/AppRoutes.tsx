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
import { SecurityIntelligenceReportFormPage } from "../modules/security/pages/SecurityIntelligenceReportFormPage";
import { SecurityIntelligenceReportListPage } from "../modules/security/pages/SecurityIntelligenceReportListPage";
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
// New feature pages
import KTAManagementPage from "../modules/supervisor/pages/KTAManagementPage";
import AdminRolesPage from "../modules/supervisor/pages/AdminRolesPage";
import RolesAndPermissionsPage from "../modules/admin/pages/RolesAndPermissionsPage";
import MasterDataMainPage from "../modules/admin/pages/MasterDataMainPage";
import MasterDataRolesPage from "../modules/admin/pages/MasterDataRolesPage";
import MasterDataSitesPage from "../modules/admin/pages/MasterDataSitesPage";
import MasterDataZonesPage from "../modules/admin/pages/MasterDataZonesPage";
import MasterDataIncidentTypesPage from "../modules/admin/pages/MasterDataIncidentTypesPage";
import MasterDataStatusTypesPage from "../modules/admin/pages/MasterDataStatusTypesPage";
import MasterDataVisitorCategoriesPage from "../modules/admin/pages/MasterDataVisitorCategoriesPage";
import MasterDataVehicleTypesPage from "../modules/admin/pages/MasterDataVehicleTypesPage";
import MasterDataOtherPage from "../modules/admin/pages/MasterDataOtherPage";
import AdminAuditLogsPage from "../modules/supervisor/pages/AdminAuditLogsPage";
import PatrolTargetsPage from "../modules/supervisor/pages/PatrolTargetsPage";
import PatrolTeamsPage from "../modules/supervisor/pages/PatrolTeamsPage";
import CalendarPage from "../modules/supervisor/pages/CalendarPage";
import HeatmapPage from "../modules/supervisor/pages/HeatmapPage";
import ControlCenterPage from "../modules/supervisor/pages/ControlCenterPage";
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
import { CleaningTaskDetailPage } from "../modules/cleaning/pages/CleaningTaskDetailPage";
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
import { SupervisorChecklistTemplatePage } from "../modules/supervisor/pages/SupervisorChecklistTemplatePage";
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
import { RoleBasedRoute } from "../components/RoleBasedRoute";
// Phase 1-10 pages
import { SecurityPatrolMapPage } from "../modules/security/pages/SecurityPatrolMapPage";
import { MasterDataPage } from "../modules/admin/pages/MasterDataPage";
import { EmployeePage } from "../modules/admin/pages/EmployeePage";
// Phase 11-15 pages
import { ManpowerPage } from "../modules/supervisor/pages/ManpowerPage";
import { IncidentPerpetratorPage } from "../modules/supervisor/pages/IncidentPerpetratorPage";
import { PatrolTargetManagementPage } from "../modules/supervisor/pages/PatrolTargetManagementPage";
import { PatrolTeamManagementPage } from "../modules/supervisor/pages/PatrolTeamManagementPage";
import { TrainingPage } from "../modules/supervisor/pages/TrainingPage";
import { VisitorManagementPage } from "../modules/security/pages/VisitorManagementPage";
// DAR pages
import { DARListPage } from "../modules/supervisor/pages/Reporting/DAR";
import { DARFormPage } from "../modules/supervisor/pages/Reporting/DAR/DARFormPage";
import { DARDetailPage } from "../modules/supervisor/pages/Reporting/DAR/DARDetailPage";
// Visitors pages
import { VisitorsReportPage } from "../modules/supervisor/pages/Reporting/Visitors";
import { VisitorFormPage } from "../modules/supervisor/pages/Reporting/Visitors/VisitorFormPage";
import { VisitorDetailPage } from "../modules/supervisor/pages/Reporting/Visitors/VisitorDetailPage";
// Patrol pages
import { PatrolSchedulePage } from "../modules/supervisor/pages/Patrol/Schedule";
import { ScheduleFormPage } from "../modules/supervisor/pages/Patrol/Schedule/ScheduleFormPage";
import { ScheduleEditPage } from "../modules/supervisor/pages/Patrol/Schedule/ScheduleEditPage";
import { ScheduleAssignPage } from "../modules/supervisor/pages/Patrol/Schedule/ScheduleAssignPage";
import { PatrolAssignmentPage } from "../modules/supervisor/pages/Patrol/Assignment";
import { AssignmentFormPage } from "../modules/supervisor/pages/Patrol/Assignment/AssignmentFormPage";
import { AssignmentDetailPage } from "../modules/supervisor/pages/Patrol/Assignment/AssignmentDetailPage";
import { PatrolSecurityPage } from "../modules/supervisor/pages/Patrol/Security";
import { PatrolReportPage } from "../modules/supervisor/pages/Patrol/Report";
import { ReportDetailPage } from "../modules/supervisor/pages/Patrol/Report/ReportDetailPage";
import { ReportFormPage } from "../modules/supervisor/pages/Patrol/Report/ReportFormPage";
import { PatrolJointPage } from "../modules/supervisor/pages/Patrol/Joint";
import { JointFormPage } from "../modules/supervisor/pages/Patrol/Joint/JointFormPage";
import { JointDetailPage } from "../modules/supervisor/pages/Patrol/Joint/JointDetailPage";
// Incident pages
import { LKLPListPage } from "../modules/supervisor/pages/Incident/LKLP";
import { LKLPFormPage } from "../modules/supervisor/pages/Incident/LKLP/LKLPFormPage";
import { LKLPDetailPage } from "../modules/supervisor/pages/Incident/LKLP/LKLPDetailPage";
import { BAPListPage } from "../modules/supervisor/pages/Incident/BAP";
import { BAPFormPage } from "../modules/supervisor/pages/Incident/BAP/BAPFormPage";
import { BAPDetailPage } from "../modules/supervisor/pages/Incident/BAP/BAPDetailPage";
import { STPLKListPage } from "../modules/supervisor/pages/Incident/STPLK";
import { STPLKFormPage } from "../modules/supervisor/pages/Incident/STPLK/STPLKFormPage";
import { STPLKDetailPage } from "../modules/supervisor/pages/Incident/STPLK/STPLKDetailPage";
import { FindingsListPage } from "../modules/supervisor/pages/Incident/Findings";
import { FindingsFormPage } from "../modules/supervisor/pages/Incident/Findings/FindingsFormPage";
import { FindingsDetailPage } from "../modules/supervisor/pages/Incident/Findings/FindingsDetailPage";
import { IncidentRecapPage } from "../modules/supervisor/pages/Incident/Recap";
// Compliance pages
import { CompliancePage } from "../modules/supervisor/pages/Reporting/Compliance";
// Training pages
import { TrainingPlanPage } from "../modules/supervisor/pages/Training/Plan";
import { TrainingPlanFormPage } from "../modules/supervisor/pages/Training/Plan/TrainingPlanFormPage";
import { TrainingPlanDetailPage } from "../modules/supervisor/pages/Training/Plan/TrainingPlanDetailPage";
import { TrainingParticipantPage } from "../modules/supervisor/pages/Training/Participant";
import { ParticipantFormPage } from "../modules/supervisor/pages/Training/Participant/ParticipantFormPage";
// KPI pages
import { KPIPatrolPage } from "../modules/supervisor/pages/KPI/Patrol";
import { KPIReportPage } from "../modules/supervisor/pages/KPI/Report";
import { KPICCTVPage } from "../modules/supervisor/pages/KPI/CCTV";
import { KPITrainingPage } from "../modules/supervisor/pages/KPI/Training";
// Master Data pages
import { MasterWorkerPage } from "../modules/supervisor/pages/Master/Worker";
import { WorkerFormPage } from "../modules/supervisor/pages/Master/Worker/WorkerFormPage";
import { MasterBusinessUnitPage } from "../modules/supervisor/pages/Master/BusinessUnit";
import { BusinessUnitFormPage } from "../modules/supervisor/pages/Master/BusinessUnit/BusinessUnitFormPage";
import { MasterDepartmentPage } from "../modules/supervisor/pages/Master/Department";
import { DepartmentFormPage } from "../modules/supervisor/pages/Master/Department/DepartmentFormPage";
import { MasterPatrolPointsPage } from "../modules/supervisor/pages/Master/PatrolPoints";
import { PatrolPointFormPage } from "../modules/supervisor/pages/Master/PatrolPoints/PatrolPointFormPage";
import { MasterJobPositionPage } from "../modules/supervisor/pages/Master/JobPosition";
import { JobPositionFormPage } from "../modules/supervisor/pages/Master/JobPosition/JobPositionFormPage";
import { MasterAssetPage } from "../modules/supervisor/pages/Master/Asset";
import { AssetFormPage } from "../modules/supervisor/pages/Assets/AssetFormPage";
import { MasterAssetCategoryPage } from "../modules/supervisor/pages/Master/AssetCategory";
import { AssetCategoryFormPage } from "../modules/supervisor/pages/Master/AssetCategory/AssetCategoryFormPage";
import { MasterCCTVZonePage } from "../modules/supervisor/pages/Master/CCTVZone";
import { CCTVZoneFormPage } from "../modules/supervisor/pages/Master/CCTVZone/CCTVZoneFormPage";
// Admin pages
import { AdminUserAccessPage } from "../modules/supervisor/pages/Admin/UserAccess";
import { AdminUsersPage } from "../modules/supervisor/pages/Admin/Users";
import { AdminIncidentAccessPage } from "../modules/supervisor/pages/Admin/IncidentAccess";
import { AdminTranslationPage } from "../modules/supervisor/pages/Admin/Translation";
// Information pages
import { InformationDocumentPage } from "../modules/supervisor/pages/Information/Document";
import { InformationCCTVPage } from "../modules/supervisor/pages/Information/CCTV";
import { InformationNotificationPage } from "../modules/supervisor/pages/Information/Notification";

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
              <Route path="checklist-templates" element={<SupervisorChecklistTemplatePage />} />
              <Route path="inspectpoints" element={<InspectPointListPage />} />
              <Route path="reports" element={<SupervisorReportsPage />} />
              <Route path="reports/:id" element={<SecurityReportDetailPage />} />
              <Route path="reporting/dar" element={<DARListPage />} />
              <Route path="reporting/dar/new" element={<DARFormPage />} />
              <Route path="reporting/dar/:id" element={<DARDetailPage />} />
              <Route path="reporting/dar/:id/edit" element={<DARFormPage />} />
              <Route path="reporting/visitors" element={<VisitorsReportPage />} />
              <Route path="reporting/visitors/new" element={<VisitorFormPage />} />
              <Route path="reporting/visitors/:id" element={<VisitorDetailPage />} />
              <Route path="reporting/visitors/:id/edit" element={<VisitorFormPage />} />
              <Route path="patrol/schedule" element={<PatrolSchedulePage />} />
              <Route path="patrol/schedule/new" element={<ScheduleFormPage />} />
              <Route path="patrol/schedule/:id/edit" element={<ScheduleEditPage />} />
              <Route path="patrol/schedule/:id/assign" element={<ScheduleAssignPage />} />
              <Route path="patrol/assignment" element={<PatrolAssignmentPage />} />
              <Route path="patrol/assignment/new" element={<AssignmentFormPage />} />
              <Route path="patrol/assignment/:id" element={<AssignmentDetailPage />} />
              <Route path="patrol/security" element={<PatrolSecurityPage />} />
              <Route path="patrol/joint" element={<PatrolJointPage />} />
              <Route path="patrol/joint/new" element={<JointFormPage />} />
              <Route path="patrol/joint/:id" element={<JointDetailPage />} />
              <Route path="patrol/joint/:id/edit" element={<JointFormPage />} />
              <Route path="patrol/report" element={<PatrolReportPage />} />
              <Route path="patrol/report/new" element={<ReportFormPage />} />
              <Route path="patrol/report/:id" element={<ReportDetailPage />} />
              <Route path="patrol/report/:id/edit" element={<ReportFormPage />} />
              <Route path="incident/lk-lp" element={<LKLPListPage />} />
              <Route path="incident/lk-lp/new" element={<LKLPFormPage />} />
              <Route path="incident/lk-lp/:id" element={<LKLPDetailPage />} />
              <Route path="incident/lk-lp/:id/edit" element={<LKLPFormPage />} />
              <Route path="incident/bap" element={<BAPListPage />} />
              <Route path="incident/bap/new" element={<BAPFormPage />} />
              <Route path="incident/bap/:id" element={<BAPDetailPage />} />
              <Route path="incident/bap/:id/edit" element={<BAPFormPage />} />
              <Route path="incident/stplk" element={<STPLKListPage />} />
              <Route path="incident/stplk/new" element={<STPLKFormPage />} />
              <Route path="incident/stplk/:id" element={<STPLKDetailPage />} />
              <Route path="incident/stplk/:id/edit" element={<STPLKFormPage />} />
              <Route path="incident/findings" element={<FindingsListPage />} />
              <Route path="incident/findings/new" element={<FindingsFormPage />} />
              <Route path="incident/findings/:id" element={<FindingsDetailPage />} />
              <Route path="incident/findings/:id/edit" element={<FindingsFormPage />} />
              <Route path="incident/recap" element={<IncidentRecapPage />} />
              <Route path="reporting/compliance" element={<CompliancePage />} />
              <Route path="training/plan" element={<TrainingPlanPage />} />
              <Route path="training/plan/new" element={<TrainingPlanFormPage />} />
              <Route path="training/plan/:id" element={<TrainingPlanDetailPage />} />
              <Route path="training/plan/:id/edit" element={<TrainingPlanFormPage />} />
              <Route path="training/participant" element={<TrainingParticipantPage />} />
              <Route path="training/participant/new" element={<ParticipantFormPage />} />
              <Route path="kpi/patrol" element={<KPIPatrolPage />} />
              <Route path="kpi/report" element={<KPIReportPage />} />
              <Route path="kpi/cctv" element={<KPICCTVPage />} />
              <Route path="kpi/training" element={<KPITrainingPage />} />
              <Route path="master/worker" element={<MasterWorkerPage />} />
              <Route path="master/worker/new" element={<WorkerFormPage />} />
              <Route path="master/worker/:id/edit" element={<WorkerFormPage />} />
              <Route path="master/business-unit" element={<MasterBusinessUnitPage />} />
              <Route path="master/business-unit/new" element={<BusinessUnitFormPage />} />
              <Route path="master/business-unit/:id/edit" element={<BusinessUnitFormPage />} />
              <Route path="master/department" element={<MasterDepartmentPage />} />
              <Route path="master/department/new" element={<DepartmentFormPage />} />
              <Route path="master/department/:id/edit" element={<DepartmentFormPage />} />
              <Route path="master/patrol-points" element={<MasterPatrolPointsPage />} />
              <Route path="master/patrol-points/new" element={<PatrolPointFormPage />} />
              <Route path="master/patrol-points/:id/edit" element={<PatrolPointFormPage />} />
              <Route path="master/job-position" element={<MasterJobPositionPage />} />
              <Route path="master/job-position/new" element={<JobPositionFormPage />} />
              <Route path="master/job-position/:id/edit" element={<JobPositionFormPage />} />
              <Route path="master/asset" element={<MasterAssetPage />} />
              <Route path="master/asset/new" element={<AssetFormPage />} />
              <Route path="master/asset/:id/edit" element={<AssetFormPage />} />
              <Route path="master/asset-category" element={<MasterAssetCategoryPage />} />
              <Route path="master/asset-category/new" element={<AssetCategoryFormPage />} />
              <Route path="master/asset-category/:id/edit" element={<AssetCategoryFormPage />} />
              <Route path="master/cctv-zone" element={<MasterCCTVZonePage />} />
              <Route path="master/cctv-zone/new" element={<CCTVZoneFormPage />} />
              <Route path="master/cctv-zone/:id/edit" element={<CCTVZoneFormPage />} />
              <Route path="admin/user-access" element={<AdminUserAccessPage />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/incident-access" element={<AdminIncidentAccessPage />} />
              <Route path="admin/translation" element={<AdminTranslationPage />} />
              <Route path="information/document" element={<InformationDocumentPage />} />
              <Route path="information/cctv" element={<InformationCCTVPage />} />
              <Route path="information/notification" element={<InformationNotificationPage />} />
              <Route path="intelligence-reports" element={<SecurityIntelligenceReportListPage />} />
              <Route path="intelligence-reports/new" element={<SecurityIntelligenceReportFormPage />} />
              {/* Alias for menu compatibility */}
              <Route path="reporting/intelligent" element={<SecurityIntelligenceReportListPage />} />
              <Route path="reporting/intelligent/new" element={<SecurityIntelligenceReportFormPage />} />
              <Route path="sites" element={<SupervisorSitesPage />} />
              <Route path="announcements" element={<SupervisorAnnouncementsPage />} />
              <Route path="shifts" element={<SupervisorShiftCalendarPage />} />
              <Route path="cleaning/dashboard" element={<SupervisorCleaningDashboardPage />} />
              <Route path="kta" element={<KTAManagementPage />} />
              <Route path="admin/roles" element={<AdminRolesPage />} />
              <Route path="admin/audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="patrol/targets" element={<PatrolTargetsPage />} />
              <Route path="patrol/teams" element={<PatrolTeamsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route
                path="heatmap"
                element={
                  <RoleBasedRoute allowedRoles={["supervisor", "admin"]}>
                    <HeatmapPage />
                  </RoleBasedRoute>
                }
              />
              <Route path="control-center" element={<ControlCenterPage />} />
              <Route path="manpower" element={<ManpowerPage />} />
              <Route path="incidents/perpetrators" element={<IncidentPerpetratorPage />} />
              <Route path="patrol/targets/manage" element={<PatrolTargetManagementPage />} />
              <Route path="patrol/teams/manage" element={<PatrolTeamManagementPage />} />
              <Route path="training" element={<TrainingPage />} />
              <Route
                path="admin/master-data"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <MasterDataPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/employees"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <EmployeePage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/roles"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <RolesAndPermissionsPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/roles-old"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <AdminRolesPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/audit-logs"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <AdminAuditLogsPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/master-data"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <MasterDataMainPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/master-data/roles"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <MasterDataRolesPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/master-data/sites"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <MasterDataSitesPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/master-data/zones"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <MasterDataZonesPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/master-data/incident-types"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <MasterDataIncidentTypesPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/master-data/status-types"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <MasterDataStatusTypesPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/master-data/visitor-categories"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <MasterDataVisitorCategoriesPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/master-data/vehicle-types"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <MasterDataVehicleTypesPage />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="admin/master-data/other"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <MasterDataOtherPage />
                  </RoleBasedRoute>
                }
              />
        </Route>

        {/* Security */}
        <Route
          path="/security/dashboard"
          element={
            <RoleBasedRoute allowedDivisions={["security"]}>
              <SecurityDashboardPage />
            </RoleBasedRoute>
          }
        />
        <Route path="/security/attendance" element={<SecurityAttendancePage />} />
        <Route path="/security/attendance/qr" element={<QRAttendancePage roleType="SECURITY" />} />
        <Route path="/security/attendance/checkin" element={<MobileCheckinPage roleType="SECURITY" siteName="Entrance Gate" />} />
        <Route path="/security/attendance/clock-in" element={<ClockInPage roleType="SECURITY" siteName="Entrance Gate" />} />
        <Route path="/security/attendance/list" element={<AttendanceListPage roleType="SECURITY" />} />
        <Route path="/security/checklist" element={<SecurityChecklistPage />} />
        <Route path="/security/checklist/supervisor" element={<SecurityChecklistSupervisorPage />} />
        <Route
          path="/security/panic"
          element={
            <RoleBasedRoute allowedDivisions={["security"]}>
              <SecurityPanicButtonPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/security/dispatch"
          element={
            <RoleBasedRoute allowedDivisions={["security"]}>
              <SecurityDispatchPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/security/passdown"
          element={
            <RoleBasedRoute allowedDivisions={["security"]}>
              <SecurityPassdownPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/security/dar"
          element={
            <RoleBasedRoute allowedDivisions={["security"]}>
              <SecurityDARPage />
            </RoleBasedRoute>
          }
        />
        <Route path="/security/reports" element={<SecurityReportsListPage />} />
        <Route path="/security/reports/:id" element={<SecurityReportDetailPage />} />
        <Route path="/security/reports/new" element={<SecurityReportFormPage />} />
        <Route path="/security/intelligence-reports" element={<SecurityIntelligenceReportListPage />} />
        <Route path="/security/intelligence-reports/new" element={<SecurityIntelligenceReportFormPage />} />
        <Route path="/security/patrol" element={<SecurityPatrolListPage />} />
        <Route path="/security/patrol/:id" element={<SecurityPatrolDetailPage />} />
        <Route path="/security/patrol/new" element={<SecurityPatrolFormPage />} />
        <Route
          path="/security/patrol/map"
          element={
            <RoleBasedRoute allowedDivisions={["security"]} allowedRoles={["supervisor", "admin"]}>
              <SecurityPatrolMapPage />
            </RoleBasedRoute>
          }
        />
        <Route path="/security/visitors" element={<VisitorLogListPage />} />
        <Route path="/security/visitors/new" element={<VisitorLogFormPage />} />
        <Route
          path="/security/visitors/manage"
          element={
            <RoleBasedRoute allowedDivisions={["security"]} allowedRoles={["supervisor", "admin"]}>
              <VisitorManagementPage />
            </RoleBasedRoute>
          }
        />
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
            <Route
              path="/cleaning/dashboard"
              element={
                <RoleBasedRoute allowedDivisions={["cleaning"]}>
                  <CleaningDashboardPage />
                </RoleBasedRoute>
              }
            />
            <Route path="/cleaning/attendance" element={<CleaningAttendancePage />} />
            <Route path="/cleaning/attendance/qr" element={<QRAttendancePage roleType="CLEANING" />} />
                <Route path="/cleaning/attendance/checkin" element={<MobileCheckinPage roleType="CLEANING" siteName="Cleaning Area" />} />
                <Route path="/cleaning/attendance/clock-in" element={<ClockInPage roleType="CLEANING" siteName="Cleaning Area" />} />
            <Route path="/cleaning/attendance/list" element={<AttendanceListPage roleType="CLEANING" />} />
            <Route path="/cleaning/reports" element={<CleaningReportsListPage />} />
            <Route path="/cleaning/reports/new" element={<CleaningReportFormPage />} />
            <Route path="/cleaning/reports/:id" element={<CleaningReportDetailPage />} />
            <Route path="/cleaning/tasks" element={<CleaningTasksPage />} />
            <Route path="/cleaning/tasks/:id" element={<CleaningTaskDetailPage />} />
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
        <Route
          path="/driver/trips"
          element={
            <RoleBasedRoute allowedDivisions={["driver"]} allowedRoles={["supervisor", "admin"]}>
              <DriverTripsPage />
            </RoleBasedRoute>
          }
        />
        <Route path="/driver/trips/:tripId" element={<DriverTripDetailPage />} />
        <Route path="/driver/checklist" element={<DriverChecklistPage />} />
        <Route path="/driver/shifts" element={<DriverShiftCalendarPage />} />
        <Route path="/driver/shifts/calendar" element={<DriverShiftCalendarPage />} />
        
        {/* Parking */}
        <Route
          path="/parking/dashboard"
          element={
            <RoleBasedRoute allowedDivisions={["parking"]} allowedRoles={["supervisor", "admin"]}>
              <ParkingDashboardPage />
            </RoleBasedRoute>
          }
        />
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
