# Menu & Routes Audit Report
**Generated:** $(date)
**System:** Verolux Management System

## Executive Summary

Audit menyeluruh terhadap semua menu items, routes, dan navigate calls untuk mengidentifikasi:
- Menu items yang tidak punya route
- Routes yang tidak punya halaman
- Navigate calls yang menuju ke route yang tidak ada
- Form/Detail pages yang belum dibuat

## Audit Results

### 1. Menu Items Analysis
**Total Menu Items:** 56
**Status:** ✅ Semua menu items memiliki routes yang sesuai

### 2. Routes Analysis
**Total Routes:** 92
**Routes yang mungkin missing pages:** 83 (ini karena script tidak bisa memetakan dengan sempurna, perlu verifikasi manual)

### 3. Navigate Calls Analysis
**Total Unique Navigate Paths:** 35
**Navigate Calls to Missing Routes:** 21

### 4. Missing Pages Identified

#### A. Incident Forms & Detail Pages (HIGH PRIORITY)

**STPLK (Surat Tanda Laporan Kehilangan):**
- ❌ `/supervisor/incident/stplk/new` - STPLKFormPage.tsx MISSING
- ❌ `/supervisor/incident/stplk/:id` - STPLKDetailPage.tsx MISSING
- ❌ `/supervisor/incident/stplk/:id/edit` - Route exists but uses STPLKFormPage (need to verify)

**Findings Report:**
- ❌ `/supervisor/incident/findings/new` - FindingsFormPage.tsx MISSING
- ❌ `/supervisor/incident/findings/:id` - FindingsDetailPage.tsx MISSING
- ❌ `/supervisor/incident/findings/:id/edit` - Route exists but uses FindingsFormPage (need to verify)

**BAP:**
- ✅ `/supervisor/incident/bap/new` - BAPFormPage.tsx EXISTS
- ❌ `/supervisor/incident/bap/:id` - BAPDetailPage.tsx EXISTS but ROUTE MISSING
- ❌ `/supervisor/incident/bap/:id/edit` - Route MISSING

**LK/LP:**
- ✅ `/supervisor/incident/lk-lp/new` - LKLPFormPage.tsx EXISTS
- ✅ `/supervisor/incident/lk-lp/:id` - LKLPDetailPage.tsx EXISTS
- ✅ `/supervisor/incident/lk-lp/:id/edit` - Route exists, uses LKLPFormPage

#### B. Training Forms & Detail Pages (HIGH PRIORITY)

**Training Plan:**
- ❌ `/supervisor/training/plan/new` - TrainingPlanFormPage.tsx MISSING
- ❌ `/supervisor/training/plan/:id` - TrainingPlanDetailPage.tsx MISSING
- ❌ `/supervisor/training/plan/:id/edit` - Route MISSING

**Training Participant:**
- ❌ `/supervisor/training/participant/new` - ParticipantFormPage.tsx MISSING

#### C. Patrol Forms & Detail Pages (HIGH PRIORITY)

**Patrol Schedule:**
- ❌ `/supervisor/patrol/schedule/new` - ScheduleFormPage.tsx MISSING
- ❌ `/supervisor/patrol/schedule/:id/edit` - ScheduleEditPage.tsx MISSING
- ❌ `/supervisor/patrol/schedule/:id/assign` - ScheduleAssignPage.tsx MISSING

**Patrol Assignment:**
- ❌ `/supervisor/patrol/assignment/new` - AssignmentFormPage.tsx MISSING
- ❌ `/supervisor/patrol/assignment/:id` - AssignmentDetailPage.tsx MISSING

#### D. Navigate Calls dengan Template Literals (Need Route Verification)

Paths berikut menggunakan template literals (${id}, ${report.id}, dll) yang perlu diverifikasi:
- `/supervisor/incident/bap/${report.id}` → Should be `/supervisor/incident/bap/:id`
- `/supervisor/incident/stplk/${report.id}` → Should be `/supervisor/incident/stplk/:id`
- `/supervisor/incident/findings/${report.id}` → Should be `/supervisor/incident/findings/:id`
- `/supervisor/incident/lk-lp/${report.id}` → Should be `/supervisor/incident/lk-lp/:id` (EXISTS)
- `/supervisor/reporting/dar/${dar.id}` → Should be `/supervisor/reporting/dar/:id` (EXISTS)
- `/supervisor/reporting/visitors/${visitor.id}` → Should be `/supervisor/reporting/visitors/:id` (EXISTS)
- `/supervisor/training/plan/${plan.id}` → Should be `/supervisor/training/plan/:id`
- `/supervisor/patrol/assignment/${assignment.id}` → Should be `/supervisor/patrol/assignment/:id`
- `/supervisor/patrol/schedule/${schedule.id}/assign` → Should be `/supervisor/patrol/schedule/:id/assign`
- `/supervisor/patrol/schedule/${schedule.id}/edit` → Should be `/supervisor/patrol/schedule/:id/edit`
- `/supervisor/reporting/dar/${dar.id}/edit` → Should be `/supervisor/reporting/dar/:id/edit` (EXISTS)
- `/supervisor/reporting/visitors/${id}/edit` → Should be `/supervisor/reporting/visitors/:id/edit` (EXISTS)
- `/supervisor/incident/bap/${id}/edit` → Should be `/supervisor/incident/bap/:id/edit`
- `/supervisor/incident/lk-lp/${id}/edit` → Should be `/supervisor/incident/lk-lp/:id/edit` (EXISTS)

## Missing Routes in AppRoutes.tsx

Routes yang perlu ditambahkan:

1. **BAP Routes:**
   - `/supervisor/incident/bap/:id` → BAPDetailPage
   - `/supervisor/incident/bap/:id/edit` → BAPFormPage

2. **STPLK Routes:**
   - `/supervisor/incident/stplk/new` → STPLKFormPage (need to create)
   - `/supervisor/incident/stplk/:id` → STPLKDetailPage (need to create)
   - `/supervisor/incident/stplk/:id/edit` → STPLKFormPage

3. **Findings Routes:**
   - `/supervisor/incident/findings/new` → FindingsFormPage (need to create)
   - `/supervisor/incident/findings/:id` → FindingsDetailPage (need to create)
   - `/supervisor/incident/findings/:id/edit` → FindingsFormPage

4. **Training Routes:**
   - `/supervisor/training/plan/new` → TrainingPlanFormPage (need to create)
   - `/supervisor/training/plan/:id` → TrainingPlanDetailPage (need to create)
   - `/supervisor/training/plan/:id/edit` → TrainingPlanFormPage
   - `/supervisor/training/participant/new` → ParticipantFormPage (need to create)

5. **Patrol Routes:**
   - `/supervisor/patrol/schedule/new` → ScheduleFormPage (need to create)
   - `/supervisor/patrol/schedule/:id/edit` → ScheduleEditPage (need to create)
   - `/supervisor/patrol/schedule/:id/assign` → ScheduleAssignPage (need to create)
   - `/supervisor/patrol/assignment/new` → AssignmentFormPage (need to create)
   - `/supervisor/patrol/assignment/:id` → AssignmentDetailPage (need to create)

## Files to Create

### Incident Pages
1. `frontend/web/src/modules/supervisor/pages/Incident/STPLK/STPLKFormPage.tsx`
2. `frontend/web/src/modules/supervisor/pages/Incident/STPLK/STPLKDetailPage.tsx`
3. `frontend/web/src/modules/supervisor/pages/Incident/Findings/FindingsFormPage.tsx`
4. `frontend/web/src/modules/supervisor/pages/Incident/Findings/FindingsDetailPage.tsx`

### Training Pages
5. `frontend/web/src/modules/supervisor/pages/Training/Plan/TrainingPlanFormPage.tsx`
6. `frontend/web/src/modules/supervisor/pages/Training/Plan/TrainingPlanDetailPage.tsx`
7. `frontend/web/src/modules/supervisor/pages/Training/Participant/ParticipantFormPage.tsx`

### Patrol Pages
8. `frontend/web/src/modules/supervisor/pages/Patrol/Schedule/ScheduleFormPage.tsx`
9. `frontend/web/src/modules/supervisor/pages/Patrol/Schedule/ScheduleEditPage.tsx`
10. `frontend/web/src/modules/supervisor/pages/Patrol/Schedule/ScheduleAssignPage.tsx`
11. `frontend/web/src/modules/supervisor/pages/Patrol/Assignment/AssignmentFormPage.tsx`
12. `frontend/web/src/modules/supervisor/pages/Patrol/Assignment/AssignmentDetailPage.tsx`

## Routes to Add to AppRoutes.tsx

```typescript
// BAP Routes
<Route path="incident/bap/:id" element={<BAPDetailPage />} />
<Route path="incident/bap/:id/edit" element={<BAPFormPage />} />

// STPLK Routes
<Route path="incident/stplk/new" element={<STPLKFormPage />} />
<Route path="incident/stplk/:id" element={<STPLKDetailPage />} />
<Route path="incident/stplk/:id/edit" element={<STPLKFormPage />} />

// Findings Routes
<Route path="incident/findings/new" element={<FindingsFormPage />} />
<Route path="incident/findings/:id" element={<FindingsDetailPage />} />
<Route path="incident/findings/:id/edit" element={<FindingsFormPage />} />

// Training Routes
<Route path="training/plan/new" element={<TrainingPlanFormPage />} />
<Route path="training/plan/:id" element={<TrainingPlanDetailPage />} />
<Route path="training/plan/:id/edit" element={<TrainingPlanFormPage />} />
<Route path="training/participant/new" element={<ParticipantFormPage />} />

// Patrol Routes
<Route path="patrol/schedule/new" element={<ScheduleFormPage />} />
<Route path="patrol/schedule/:id/edit" element={<ScheduleEditPage />} />
<Route path="patrol/schedule/:id/assign" element={<ScheduleAssignPage />} />
<Route path="patrol/assignment/new" element={<AssignmentFormPage />} />
<Route path="patrol/assignment/:id" element={<AssignmentDetailPage />} />
```

## Summary Statistics

- **Total Missing Form Pages:** 7
- **Total Missing Detail Pages:** 5
- **Total Missing Routes:** 12
- **Total Files to Create:** 12

## Priority Order

1. **CRITICAL:** Incident forms (STPLK, Findings) - users need to create reports
2. **HIGH:** BAP detail route - already has page, just needs route
3. **HIGH:** Training forms - users need to create training plans
4. **MEDIUM:** Patrol forms - scheduling functionality needed
5. **LOW:** Detail modals for Reports, Checklists, Attendance (can use existing pages)

## Notes

- Template literals in navigate calls (e.g., `${id}`) are valid in React Router - they're replaced at runtime
- Some routes may exist but script couldn't detect them due to dynamic path patterns
- Need to verify backend endpoints exist for all these forms before creating frontend pages

