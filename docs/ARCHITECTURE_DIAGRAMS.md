# Verolux Management System - Architecture Diagrams

Dokumentasi diagram arsitektur sistem menggunakan Mermaid diagrams.

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        A[Mobile Browser]
        B[Web Browser]
        C[Supervisor Dashboard]
    end
    
    subgraph "API Gateway"
        D[FastAPI Router]
    end
    
    subgraph "Division Routes"
        E[Security Routes]
        F[Cleaning Routes]
        G[Driver Routes]
        H[Parking Routes]
    end
    
    subgraph "Shared Services"
        I[Auth Service]
        J[Attendance Service]
        K[Checklist Service]
        L[Report Service]
    end
    
    subgraph "Database"
        M[(SQLite/PostgreSQL)]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    E --> I
    E --> J
    E --> K
    E --> L
    F --> I
    F --> J
    F --> K
    F --> L
    I --> M
    J --> M
    K --> M
    L --> M
```

---

## 2. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database
    
    U->>F: Enter credentials
    F->>B: POST /api/auth/login
    B->>D: Query user
    D-->>B: User data
    B->>B: Verify password
    B->>B: Generate JWT
    B-->>F: Token + User data
    F->>F: Store token
    F->>F: Store user
    F->>B: GET /api/auth/me
    B->>D: Get permissions
    D-->>B: Permissions
    B-->>F: User + Permissions
    F->>U: Redirect to dashboard
```

---

## 3. Attendance Check-In Flow

```mermaid
flowchart TD
    Start([User opens Attendance]) --> Scan[Scan QR Code]
    Scan --> ValidateQR{QR Valid?}
    ValidateQR -->|No| Error1[Show Error]
    ValidateQR -->|Yes| Capture[Capture Photo]
    Capture --> GetGPS[Get GPS Location]
    GetGPS --> ValidateGPS{Within Geofence?}
    ValidateGPS -->|No| Warning[Show Warning]
    ValidateGPS -->|Yes| Submit[POST /api/attendance/checkin]
    Warning --> Override{User Override?}
    Override -->|Yes| Submit
    Override -->|No| Error1
    Submit --> Save[Save to Database]
    Save --> Success{Success?}
    Success -->|No| Error2[Show Error]
    Success -->|Yes| ShowSuccess[Show Success Message]
    ShowSuccess --> End([End])
    Error1 --> End
    Error2 --> End
```

---

## 4. RBAC Permission Check Flow

```mermaid
flowchart LR
    A[User Request] --> B{Has JWT?}
    B -->|No| C[Return 401]
    B -->|Yes| D[Decode JWT]
    D --> E[Get User Role]
    E --> F{Is Admin?}
    F -->|Yes| G[Allow All]
    F -->|No| H{Is Supervisor?}
    H -->|Yes| I[Check Supervisor Perms]
    H -->|No| J[Get Role Permissions]
    J --> K{Has Permission?}
    I --> K
    K -->|Yes| L[Allow Access]
    K -->|No| M[Return 403]
    G --> L
```

---

## 5. Master Data Management Structure

```mermaid
graph TD
    A[Master Data Main Page] --> B[Roles]
    A --> C[Sites]
    A --> D[Zones]
    A --> E[Incident Types]
    A --> F[Status Types]
    A --> G[Visitor Categories]
    A --> H[Vehicle Types]
    A --> I[Other]
    
    B --> B1[CRUD Roles]
    B --> B2[Assign Permissions]
    B --> B3[View Users]
    
    C --> C1[CRUD Sites]
    C --> C2[Generate QR]
    C --> C3[Set Geofence]
    
    D --> D1[CRUD Zones]
    D --> D2[Filter by Division]
    
    E --> E1[CRUD Incident Types]
    F --> F1[CRUD Status Types]
    G --> G1[CRUD Visitor Categories]
    H --> H1[CRUD Vehicle Types]
    I --> I1[CRUD Other Categories]
```

---

## 6. Database Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ ATTENDANCE : has
    USERS ||--o{ CHECKLISTS : creates
    USERS ||--o{ SECURITY_REPORTS : creates
    USERS ||--o{ SHIFT_HANDOVERS : creates
    USERS }o--|| ROLES : has
    
    ROLES ||--o{ ROLE_PERMISSIONS : has
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : belongs_to
    
    SITES ||--o{ ATTENDANCE : used_in
    SITES ||--o{ CHECKLISTS : used_in
    SITES ||--o{ SECURITY_REPORTS : used_in
    SITES ||--o{ CLEANING_ZONES : contains
    
    CHECKLIST_TEMPLATES ||--o{ CHECKLISTS : generates
    CHECKLISTS ||--o{ CHECKLIST_ITEMS : contains
    CHECKLIST_ITEMS ||--o{ EVIDENCE : has
    
    SHIFTS ||--o{ ATTENDANCE : related_to
    SHIFTS ||--o{ SHIFT_HANDOVERS : related_to
    
    MASTER_DATA ||--o{ SECURITY_REPORTS : categorizes
    MASTER_DATA ||--o{ CHECKLISTS : categorizes
```

---

## 7. Division-Based Data Flow

```mermaid
flowchart TD
    A[API Request] --> B[Extract User from JWT]
    B --> C{User Role?}
    C -->|Admin| D[No Filter]
    C -->|Supervisor| D
    C -->|Guard/Cleaner| E[Get User Division]
    E --> F[Filter Query by Division]
    F --> G[Join with User Table]
    G --> H[Match Division]
    H --> I[Return Filtered Data]
    D --> J[Return All Data]
    I --> K[Response]
    J --> K
```

---

## 8. Passdown Notes Division Filtering

```mermaid
sequenceDiagram
    participant U as User (Security)
    participant F as Frontend
    participant B as Backend
    participant D as Database
    
    U->>F: Open Passdown Page
    F->>B: GET /api/security/passdown/notes
    B->>B: Get user division (security)
    B->>B: Check role (guard)
    B->>D: Query ShiftHandover
    B->>D: JOIN User ON from_user_id
    B->>D: WHERE User.division = 'security'
    D-->>B: Filtered notes (security only)
    B-->>F: Return filtered notes
    F->>U: Display notes
    
    Note over B,D: Cleaning users only see cleaning notes
    Note over B,D: Supervisor/Admin see all notes
```

---

## 9. Master Data CRUD Flow

```mermaid
stateDiagram-v2
    [*] --> List: Load Page
    List --> Create: Click Create
    List --> Edit: Click Edit
    List --> Delete: Click Delete
    
    Create --> Form: Show Form
    Form --> Submit: Fill & Submit
    Submit --> API: POST /api/master-data
    API --> Success: Success
    API --> Error: Error
    Success --> List: Refresh
    Error --> Form: Show Error
    
    Edit --> Form: Show Form with Data
    Form --> Update: Submit Changes
    Update --> API: PUT /api/master-data/{id}
    API --> Success
    API --> Error
    
    Delete --> Confirm: Confirm Dialog
    Confirm --> API: DELETE /api/master-data/{id}
    API --> Success
    API --> Error
    
    List --> [*]: Close
```

---

## 10. Frontend Component Hierarchy

```mermaid
graph TD
    A[App.tsx] --> B[BrowserRouter]
    B --> C[Routes]
    C --> D[LoginPage]
    C --> E[ProtectedRoute]
    E --> F{User Division?}
    F -->|Security| G[SecurityLayout]
    F -->|Cleaning| H[CleaningLayout]
    F -->|Supervisor| I[SupervisorLayout]
    
    G --> J[MobileLayout]
    J --> K[Header]
    J --> L[Page Content]
    J --> M[BottomNav]
    
    I --> N[Sidebar]
    I --> O[Content Area]
    
    L --> P[PermissionGate]
    P --> Q[Actual Component]
```

---

## 11. API Request Flow with Error Handling

```mermaid
flowchart TD
    A[Frontend API Call] --> B[Axios Request]
    B --> C{Network Error?}
    C -->|Yes| D[Show Network Error]
    C -->|No| E[Backend Receives]
    E --> F[Validate Request]
    F --> G{Valid?}
    G -->|No| H[Return 422 Validation Error]
    G -->|Yes| I[Check Authentication]
    I --> J{Authenticated?}
    J -->|No| K[Return 401]
    J -->|Yes| L[Check Authorization]
    L --> M{Authorized?}
    M -->|No| N[Return 403]
    M -->|Yes| O[Process Request]
    O --> P{Success?}
    P -->|No| Q[Return 500]
    P -->|Yes| R[Return 200 + Data]
    
    H --> S[Frontend Error Handler]
    K --> S
    N --> S
    Q --> S
    R --> T[Frontend Success Handler]
    D --> S
```

---

## 12. Master Data Connection: Roles → Users

```mermaid
graph LR
    A[Master Data: Roles] --> B[Select Role]
    B --> C[View Role Permissions]
    C --> D[View Users with Role]
    D --> E[Select User]
    E --> F[Update User Role]
    F --> G[PATCH /api/admin/users/id]
    G --> H[Backend Updates]
    H --> I[user.role_id = new_role.id]
    I --> J[User inherits Role Permissions]
    J --> K[Updated User]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style E fill:#fff4e1
    style K fill:#e1ffe1
```

---

## 13. Complete Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Frontend
    participant A as API Gateway
    participant S as Service Layer
    participant D as Database
    
    C->>F: User Action
    F->>F: Prepare Request
    F->>A: HTTP Request + JWT
    A->>A: Validate JWT
    A->>A: Check Permissions
    A->>S: Call Service
    S->>D: Query/Update
    D-->>S: Data
    S->>S: Process Business Logic
    S-->>A: Response
    A-->>F: JSON Response
    F->>F: Update State
    F->>F: Update UI
    F-->>C: Display Result
```

---

## 14. Division Routing Logic

```mermaid
flowchart TD
    A[User Login] --> B[Get Division from User]
    B --> C{Division?}
    C -->|security| D[/security/*]
    C -->|cleaning| E[/cleaning/*]
    C -->|driver| F[/driver/*]
    C -->|parking| G[/parking/*]
    C -->|supervisor| H[/supervisor/*]
    C -->|admin| I[/supervisor/admin/*]
    
    D --> J[Security Dashboard]
    E --> K[Cleaning Dashboard]
    F --> L[Driver Dashboard]
    G --> M[Parking Dashboard]
    H --> N[Supervisor Dashboard]
    I --> O[Admin Panel]
```

---

## 15. Permission Gate Flow

```mermaid
flowchart TD
    A[Component with PermissionGate] --> B[Check User Permissions]
    B --> C{Has Permission?}
    C -->|Yes| D[Render Component]
    C -->|No| E{Show Fallback?}
    E -->|Yes| F[Render Fallback]
    E -->|No| G[Render Nothing]
    
    B --> H{Is Loading?}
    H -->|Yes| I{Show While Loading?}
    I -->|Yes| D
    I -->|No| J[Show Loading State]
```

---

## 16. Data Filtering Strategy

```mermaid
graph TD
    A[Query Request] --> B{User Role?}
    B -->|Admin| C[No Filter]
    B -->|Supervisor| C
    B -->|Guard/Cleaner| D[Apply Filters]
    
    D --> E[Company Filter]
    E --> F[Division Filter]
    F --> G[Site Filter]
    G --> H[Status Filter]
    
    C --> I[Return All Data]
    H --> J[Return Filtered Data]
    
    style C fill:#e1ffe1
    style D fill:#ffe1e1
```

---

## 17. Master Data Category Structure

```mermaid
mindmap
  root((Master Data))
    Roles
      CRUD Operations
      Permission Assignment
      User Management
    Sites
      CRUD Operations
      QR Code Generation
      Geofence Setup
    Zones
      CRUD Operations
      Division Filtering
      Zone Templates
    Incident Types
      CRUD Operations
      Division Specific
    Status Types
      CRUD Operations
      Used in Reports
    Visitor Categories
      CRUD Operations
      Visitor Management
    Vehicle Types
      CRUD Operations
      Driver Division
    Other
      Custom Categories
      Flexible Structure
```

---

## 18. System Module Dependencies

```mermaid
graph TD
    A[Core Models] --> B[User]
    A --> C[Site]
    A --> D[Master Data]
    
    E[Division Models] --> F[Security Models]
    E --> G[Cleaning Models]
    E --> H[Driver Models]
    
    F --> B
    F --> C
    G --> B
    G --> C
    H --> B
    H --> C
    
    I[Services] --> A
    I --> E
    
    J[API Routes] --> I
    J --> A
    J --> E
    
    K[Frontend] --> J
    K --> L[API Clients]
    L --> J
```

---

## 19. Passdown Notes Division Isolation

```mermaid
flowchart LR
    A[Security User] --> B[GET /api/security/passdown/notes]
    B --> C[Backend: Filter by division='security']
    C --> D[Return Security Notes Only]
    
    E[Cleaning User] --> F[GET /api/security/passdown/notes]
    F --> G[Backend: Filter by division='cleaning']
    G --> H[Return Cleaning Notes Only]
    
    I[Supervisor] --> J[GET /api/security/passdown/notes]
    J --> K[Backend: No Filter]
    K --> L[Return All Notes]
    
    style D fill:#e1f5ff
    style H fill:#ffe1f5
    style L fill:#e1ffe1
```

---

## 20. Complete Feature Implementation Flow

```mermaid
flowchart TD
    A[Feature Request] --> B[Design Phase]
    B --> C[Backend Implementation]
    C --> D[Create Model]
    D --> E[Create Routes]
    E --> F[Create Services]
    F --> G[Create Migration]
    G --> H[Test Backend]
    H --> I[Frontend Implementation]
    I --> J[Create Page]
    J --> K[Create API Functions]
    K --> L[Add Routes]
    L --> M[Add Menu Items]
    M --> N[Test Frontend]
    N --> O{All Tests Pass?}
    O -->|No| P[Fix Issues]
    P --> H
    O -->|Yes| Q[Deploy]
    Q --> R[Monitor]
    R --> S[Document]
```

---

## Diagram Usage

Semua diagram di atas menggunakan format **Mermaid** yang dapat dirender di:
- GitHub (otomatis)
- GitLab (otomatis)
- VS Code dengan extension Mermaid
- Online: https://mermaid.live
- Documentation tools (MkDocs, Docusaurus, dll)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15

