# RBAC Implementation Guide - Frontend

## Overview

Sistem Role-Based Access Control (RBAC) telah diimplementasikan di seluruh frontend untuk mengontrol akses berdasarkan role, division, dan permission.

## Components

### 1. `usePermissions` Hook

Hook utama untuk permission checking:

```tsx
import { usePermissions } from "../hooks/usePermissions";

const {
  hasPermission,    // Check permission untuk resource & action
  canAccess,        // Check route access
  hasRole,          // Check role
  isDivision,       // Check division
  role,             // Current role
  division,         // Current division
  isAdmin,          // Boolean: is admin
  isSupervisor,     // Boolean: is supervisor or admin
  isField,          // Boolean: is field user
} = usePermissions();
```

**Usage:**
```tsx
const { hasPermission, hasRole } = usePermissions();

if (hasPermission("reports", "write")) {
  // User can write reports
}

if (hasRole(["admin", "supervisor"])) {
  // User is admin or supervisor
}
```

### 2. `RoleBasedRoute` Component

Route protection berdasarkan role, division, dan permission:

```tsx
<Route
  path="/admin/master-data"
  element={
    <RoleBasedRoute allowedRoles={["admin"]}>
      <MasterDataPage />
    </RoleBasedRoute>
  }
/>
```

**Props:**
- `allowedRoles?: string[]` - Roles yang diizinkan
- `allowedDivisions?: string[]` - Divisions yang diizinkan
- `requiredPermission?: { resource: string; action: string }` - Permission yang diperlukan
- `fallbackPath?: string` - Path untuk redirect jika tidak authorized

### 3. `PermissionGate` Component

Conditional rendering berdasarkan permission:

```tsx
<PermissionGate resource="reports" action="write">
  <button>Create Report</button>
</PermissionGate>
```

**Props:**
- `resource: string` - Resource name (e.g., "reports", "attendance")
- `action: string` - Action (e.g., "read", "write", "delete")
- `fallback?: ReactNode` - Component to show if no permission

### 4. `RoleBasedAccess` Component

Conditional rendering berdasarkan role dan division:

```tsx
<RoleBasedAccess allowedRoles={["admin"]}>
  <AdminPanel />
</RoleBasedAccess>

<RoleBasedAccess allowedDivisions={["security"]}>
  <SecurityFeatures />
</RoleBasedAccess>
```

**Props:**
- `allowedRoles?: string[]` - Roles yang diizinkan
- `allowedDivisions?: string[]` - Divisions yang diizinkan
- `requiredPermission?: { resource: string; action: string }` - Permission yang diperlukan
- `fallback?: ReactNode` - Component to show if not authorized

### 5. `ActionButton` Component

Button dengan permission checking built-in:

```tsx
<ActionButton
  to="/admin/master-data"
  variant="primary"
  size="md"
  requiredPermission={{ resource: "master_data", action: "write" }}
  allowedRoles={["admin"]}
>
  Manage Master Data
</ActionButton>
```

**Props:**
- `to?: string` - Route path (akan render sebagai Link)
- `onClick?: () => void` - Click handler (akan render sebagai button)
- `variant?: "primary" | "secondary" | "danger" | "success"`
- `size?: "sm" | "md" | "lg"`
- `requiredPermission?: { resource: string; action: string }`
- `allowedRoles?: string[]`
- `allowedDivisions?: string[]`
- `disabled?: boolean`

### 6. `UserRoleBadge` Component

Menampilkan role badge:

```tsx
<UserRoleBadge />
```

Menampilkan badge dengan warna berbeda:
- **Admin**: Red badge
- **Supervisor**: Blue badge
- **Field**: Green badge dengan division name

### 7. `RoleBasedMenu` Component

Dynamic menu berdasarkan role dan permission:

```tsx
<RoleBasedMenu />
```

Menu items akan otomatis difilter berdasarkan:
- Role user
- Division user
- Permissions user

## Permission Matrix

### Resources & Actions

| Resource | Actions | Admin | Supervisor | Field (Security) | Field (Other) |
|----------|---------|-------|------------|------------------|---------------|
| dashboard | read | ✅ | ✅ | ✅ | ✅ |
| attendance | read, write | ✅ | ✅ | ✅ | ✅ |
| reports | read, write | ✅ | ✅ | ✅ | ✅ |
| checklists | read, write | ✅ | ✅ | ✅ | ✅ |
| patrols | read, write | ✅ | ✅ | ✅ | ❌ |
| incidents | read, write | ✅ | ✅ | ✅ | ❌ |
| visitors | read, write | ✅ | ✅ | ✅ | ❌ |
| panic | read, write | ✅ | ❌ | ✅ | ❌ |
| dispatch | read, write | ✅ | ❌ | ✅ | ❌ |
| dar | read, write | ✅ | ❌ | ✅ | ❌ |
| passdown | read, write | ✅ | ❌ | ✅ | ❌ |
| training | read, write | ✅ | ✅ | ❌ | ❌ |
| manpower | read | ✅ | ✅ | ❌ | ❌ |
| patrol_targets | read, write | ✅ | ✅ | ❌ | ❌ |
| patrol_teams | read, write | ✅ | ✅ | ❌ | ❌ |
| master_data | read, write | ✅ | ❌ | ❌ | ❌ |
| employees | read, write | ✅ | ❌ | ❌ | ❌ |
| kta | read, write | ✅ | ✅ | ❌ | ❌ |
| control_center | read | ✅ | ✅ | ❌ | ❌ |
| calendar | read | ✅ | ✅ | ❌ | ❌ |

## Implementation Examples

### Example 1: Protected Route

```tsx
<Route
  path="/security/patrol/map"
  element={
    <RoleBasedRoute 
      allowedDivisions={["security"]} 
      allowedRoles={["supervisor", "admin"]}
    >
      <SecurityPatrolMapPage />
    </RoleBasedRoute>
  }
/>
```

### Example 2: Conditional Button

```tsx
<PermissionGate resource="reports" action="write">
  <button onClick={() => navigate("/security/reports/new")}>
    Create Report
  </button>
</PermissionGate>
```

### Example 3: Role-based Menu Item

```tsx
<RoleBasedAccess allowedRoles={["admin"]}>
  <MenuItem to="/admin/master-data">Master Data</MenuItem>
</RoleBasedAccess>
```

### Example 4: Division-specific Feature

```tsx
<RoleBasedAccess allowedDivisions={["security"]}>
  <IconActionButton
    label="Panic"
    onClick={() => navigate("/security/panic")}
    icon={AppIcons.panic()}
    variant="danger"
  />
</RoleBasedAccess>
```

### Example 5: Action Button dengan Permission

```tsx
<ActionButton
  to="/supervisor/control-center"
  variant="primary"
  requiredPermission={{ resource: "control_center", action: "read" }}
>
  🎛️ Control Center
</ActionButton>
```

## Menu Integration

### SupervisorLayout

Menu di SupervisorLayout sudah terintegrasi dengan:
- Role-based menu items
- Permission-based filtering
- Division-specific items
- Dynamic menu generation

Menu items akan otomatis muncul/hilang berdasarkan:
- Role user (admin, supervisor, field)
- Division user (security, cleaning, driver, parking)
- Permissions user

### BottomNav

BottomNav untuk field users sudah terintegrasi dengan:
- Division-specific items
- Role-based filtering
- Permission checking

## Best Practices

1. **Always use RoleBasedRoute for protected routes**
   ```tsx
   <RoleBasedRoute allowedRoles={["admin"]}>
     <AdminPage />
   </RoleBasedRoute>
   ```

2. **Use PermissionGate for conditional UI elements**
   ```tsx
   <PermissionGate resource="reports" action="write">
     <CreateButton />
   </PermissionGate>
   ```

3. **Use RoleBasedAccess for role/division-specific features**
   ```tsx
   <RoleBasedAccess allowedDivisions={["security"]}>
     <SecurityOnlyFeature />
   </RoleBasedAccess>
   ```

4. **Display role badge in headers**
   ```tsx
   <div className="flex items-center gap-2">
     <h1>Dashboard</h1>
     <UserRoleBadge />
   </div>
   ```

5. **Use ActionButton for permission-aware buttons**
   ```tsx
   <ActionButton
     to="/path"
     requiredPermission={{ resource: "resource", action: "action" }}
   >
     Button Text
   </ActionButton>
   ```

## Testing

Untuk test RBAC:

1. Login dengan role berbeda (admin, supervisor, field)
2. Verify menu items muncul sesuai role
3. Verify routes terproteksi dengan benar
4. Verify buttons/actions muncul sesuai permission
5. Verify redirect ke halaman yang sesuai jika tidak authorized

## Troubleshooting

### Menu items tidak muncul
- Check role user di authStore
- Check permission di usePermissions hook
- Verify menu item configuration di RoleBasedMenuItems

### Route redirect loop
- Check RoleBasedRoute configuration
- Verify fallbackPath
- Check role di authStore

### Permission tidak bekerja
- Verify permission matrix
- Check resource dan action name
- Verify user role di backend

