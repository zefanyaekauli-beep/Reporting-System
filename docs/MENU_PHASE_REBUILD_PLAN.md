# Menu Phase Rebuild Plan

## 📋 Analisis Menu Items vs Routes

### ✅ Menu Items yang Sudah Ada Route & Halaman

1. **LIVE DASHBOARD**
   - ✅ Dashboard (`/supervisor`) - Ada

2. **REPORTING**
   - ✅ Daily Activity Report (DAR) (`/supervisor/reporting/dar`) - Ada
   - ✅ Daily Visitors Report (`/supervisor/reporting/visitors`) - Ada
   - ⚠️ Laporan Intelligent (`/supervisor/reporting/intelligent`) - Route: `/supervisor/intelligence-reports`
   - ✅ Compliance And Auditor (`/supervisor/reporting/compliance`) - Ada
   - ✅ All Reports (`/supervisor/reports`) - Ada

3. **PATROL**
   - ✅ Patrol Schedule (`/supervisor/patrol/schedule`) - Ada
   - ✅ Patrol Assignment (`/supervisor/patrol/assignment`) - Ada
   - ❌ Security Patrol (`/supervisor/patrol/security`) - **BELUM ADA**
   - ❌ Joint Patrol (`/supervisor/patrol/joint`) - **BELUM ADA**
   - ❌ Patrol Report (`/supervisor/patrol/report`) - **BELUM ADA**
   - ✅ Patrol & Activity (`/supervisor/patrol-activity`) - Ada
   - ✅ Inspect Points (`/supervisor/inspectpoints`) - Ada

4. **INCIDENT**
   - ✅ LK dan LP (`/supervisor/incident/lk-lp`) - Ada
   - ✅ BAP (`/supervisor/incident/bap`) - Ada
   - ✅ STPLK (`/supervisor/incident/stplk`) - Ada
   - ✅ Findings Report (`/supervisor/incident/findings`) - Ada
   - ✅ Incident Recap (`/supervisor/incident/recap`) - Ada
   - ✅ All Incidents (`/supervisor/reports?report_type=incident`) - Ada

5. **TRAINING**
   - ✅ Training Plan (`/supervisor/training/plan`) - Ada
   - ✅ Training Participant (`/supervisor/training/participant`) - Ada

6. **KPI**
   - ✅ KPI Patrol (`/supervisor/kpi/patrol`) - Ada
   - ✅ KPI Report (`/supervisor/kpi/report`) - Ada
   - ✅ KPI CCTV (`/supervisor/kpi/cctv`) - Ada
   - ✅ KPI Training (`/supervisor/kpi/training`) - Ada

7. **INFORMATION DATA**
   - ✅ Document Control (`/supervisor/information/document`) - Ada
   - ✅ CCTV Status (`/supervisor/information/cctv`) - Ada
   - ✅ Notification (`/supervisor/information/notification`) - Ada

8. **MASTER DATA**
   - ✅ Worker Data (`/supervisor/master/worker`) - Ada
   - ✅ Business Unit (`/supervisor/master/business-unit`) - Ada
   - ✅ Department (`/supervisor/master/department`) - Ada
   - ✅ Patrol and Guard Points (`/supervisor/master/patrol-points`) - Ada
   - ✅ Job Position (`/supervisor/master/job-position`) - Ada
   - ✅ Asset Management (`/supervisor/master/asset`) - Ada
   - ✅ Asset Category (`/supervisor/master/asset-category`) - Ada
   - ✅ CCTV Zone (`/supervisor/master/cctv-zone`) - Ada
   - ✅ Sites (`/supervisor/sites`) - Ada

9. **ADMINISTRATOR**
   - ❌ User Management (`/supervisor/admin/users`) - **BELUM ADA**
   - ✅ User Access (`/supervisor/admin/user-access`) - Ada
   - ✅ Incident User Access (`/supervisor/admin/incident-access`) - Ada
   - ✅ Translation (i18n) (`/supervisor/admin/translation`) - Ada
   - ✅ Roles & Permissions (`/supervisor/admin/roles`) - Ada
   - ✅ Audit Logs (`/supervisor/admin/audit-logs`) - Ada

## 🎯 Menu Items yang Perlu Dibuat

### 1. Security Patrol (`/supervisor/patrol/security`)
**Status:** ❌ Belum Ada
**Prioritas:** HIGH
**Deskripsi:** Halaman untuk melihat dan mengelola patrol security yang sedang aktif

**Files to Create:**
- `frontend/web/src/modules/supervisor/pages/Patrol/Security/index.tsx`
- Backend: Endpoint sudah ada di `/api/security/patrol`

**Route to Add:**
```tsx
<Route path="patrol/security" element={<PatrolSecurityPage />} />
```

### 2. Joint Patrol (`/supervisor/patrol/joint`)
**Status:** ❌ Belum Ada
**Prioritas:** HIGH
**Deskripsi:** Halaman untuk mengelola joint patrol (patrol bersama)

**Files to Create:**
- `frontend/web/src/modules/supervisor/pages/Patrol/Joint/index.tsx`
- Backend: Perlu endpoint baru `/api/v1/patrol/joint`

**Route to Add:**
```tsx
<Route path="patrol/joint" element={<JointPatrolPage />} />
```

### 3. Patrol Report (`/supervisor/patrol/report`)
**Status:** ❌ Belum Ada
**Prioritas:** HIGH
**Deskripsi:** Halaman untuk melihat laporan patrol yang sudah selesai

**Files to Create:**
- `frontend/web/src/modules/supervisor/pages/Patrol/Report/index.tsx`
- Backend: Endpoint sudah ada di `/api/security/patrol`

**Route to Add:**
```tsx
<Route path="patrol/report" element={<PatrolReportPage />} />
```

### 4. User Management (`/supervisor/admin/users`)
**Status:** ❌ Belum Ada
**Prioritas:** MEDIUM
**Deskripsi:** Halaman untuk mengelola users (CRUD users)

**Files to Create:**
- `frontend/web/src/modules/supervisor/pages/Admin/Users/index.tsx`
- Backend: Endpoint sudah ada di `/api/admin/users` atau perlu dibuat

**Route to Add:**
```tsx
<Route path="admin/users" element={<AdminUsersPage />} />
```

### 5. Fix Laporan Intelligent Route
**Status:** ⚠️ Route Mismatch
**Prioritas:** LOW
**Deskripsi:** Menu item mengarah ke `/supervisor/reporting/intelligent` tapi route sebenarnya adalah `/supervisor/intelligence-reports`

**Fix Options:**
- Option 1: Update menu item to point to `/supervisor/intelligence-reports`
- Option 2: Add alias route `/supervisor/reporting/intelligent` → `/supervisor/intelligence-reports`

## 📝 Implementation Plan

### Phase 1: Fix Route Mismatch (Quick Fix)
1. Update menu item "Laporan Intelligent" route
2. Test navigation

### Phase 2: Create Missing Patrol Pages (HIGH Priority)
1. Create Security Patrol page
2. Create Joint Patrol page (with backend)
3. Create Patrol Report page
4. Add routes
5. Test navigation

### Phase 3: Create User Management Page (MEDIUM Priority)
1. Create Admin Users page
2. Add backend endpoint if needed
3. Add route
4. Test navigation

## 🔧 Quick Fixes Needed

1. **Fix Laporan Intelligent Route:**
   - Update `SupervisorLayout.tsx` line 46:
   ```tsx
   { label: "Laporan Intelligent", to: "/supervisor/intelligence-reports", icon: "reports" as IconKey },
   ```

2. **Add Missing Routes:**
   - Add routes for Security Patrol, Joint Patrol, Patrol Report, User Management

## ✅ Verification Checklist

- [ ] All menu items have corresponding routes
- [ ] All routes have corresponding pages
- [ ] All pages are accessible from menu
- [ ] Navigation works correctly
- [ ] No broken links
- [ ] Active state highlighting works

