# Error Handling & Fixing Guardrails

## 10. Error Handling & System Repair Policy

### 10.1 Error Detection & Classification

When encountering errors in the system, classify them immediately:

**Critical Errors (Fix Immediately)**
- Runtime crashes (500 errors, unhandled exceptions)
- Data corruption risks (missing foreign keys, null violations)
- Authentication/authorization bypasses
- API contract mismatches (frontend expects X, backend returns Y)
- Database migration failures
- Build/compilation errors

**High Priority Errors (Fix in Current Session)**
- Type mismatches (TypeScript errors, Pydantic validation failures)
- Missing required fields in API responses
- Paginated response structure mismatches
- Missing error handling in critical flows
- N+1 query problems causing performance issues

**Medium Priority (Document & Plan)**
- Missing translations
- UI/UX inconsistencies
- Non-critical validation gaps
- Performance optimizations
- Code duplication

**Low Priority (Technical Debt)**
- Console.log statements
- Missing JSDoc comments
- Code style inconsistencies
- Unused imports

### 10.2 Error Handling Patterns

#### Backend Error Handling

**Always Use Structured Exception Handling:**

```python
# ✅ CORRECT: Use custom exceptions with proper logging
from app.core.exceptions import NotFoundError, ValidationError, DatabaseError
from app.core.logger import api_logger

@router.get("/items/{item_id}")
def get_item(item_id: int, db: Session = Depends(get_db)):
    try:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise NotFoundError(f"Item {item_id} not found")
        return item
    except NotFoundError:
        raise  # Re-raise custom exceptions
    except Exception as e:
        api_logger.error(f"Unexpected error fetching item {item_id}: {str(e)}", exc_info=True)
        raise DatabaseError("Failed to fetch item")
```

**Never Do This:**
```python
# ❌ WRONG: Silent failures, generic exceptions, no logging
@router.get("/items/{item_id}")
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    return item  # Returns None without error - breaks frontend
```

**Response Format Consistency:**
- All errors return JSON with `detail` field
- Use HTTP status codes correctly (400, 401, 403, 404, 422, 500)
- Include error context in logs, not in user-facing messages

#### Frontend Error Handling

**Always Handle API Errors Gracefully:**

```typescript
// ✅ CORRECT: Defensive checks, user feedback, fallback values
const loadData = async () => {
  setLoading(true);
  setErrorMsg("");
  try {
    const data = await apiCall();
    // Always ensure array/object structure
    setRecords(Array.isArray(data) ? data : (data?.items || []));
  } catch (err: any) {
    console.error("Failed to load data:", err);
    const message = err.response?.data?.detail || "Gagal memuat data";
    setErrorMsg(message);
    showToast(message, "error");
    setRecords([]); // Always set safe fallback
  } finally {
    setLoading(false);
  }
};
```

**Never Do This:**
```typescript
// ❌ WRONG: No error handling, assumes data structure
const loadData = async () => {
  const data = await apiCall();
  setRecords(data); // Crashes if data is not array
  data.map(...); // TypeError if data is undefined
};
```

**Defensive Array/Object Access:**
- Always check `Array.isArray()` before `.map()`, `.filter()`, `.forEach()`
- Use optional chaining: `data?.items?.map(...)`
- Provide fallback values: `data || []`, `data || {}`
- Validate API response structure before using

### 10.3 Paginated Response Handling

**Critical Pattern - Always Extract Items:**

Backend returns:
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

Frontend must handle:
```typescript
// ✅ CORRECT: Extract items from paginated response
export async function listItems(params?: any): Promise<Item[]> {
  const response = await api.get("/items", { params });
  // Handle both direct array and paginated response
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }
  if (response.data?.items && Array.isArray(response.data.items)) {
    return response.data.items;
  }
  return []; // Safe fallback
}
```

**Component Usage:**
```typescript
// ✅ CORRECT: Always ensure array before mapping
const data = await listItems();
setRecords(Array.isArray(data) ? data : []);

// In render:
{(Array.isArray(records) ? records : []).map(item => ...)}
```

### 10.4 Type Safety & Validation

**Backend - Pydantic Validation:**

```python
# ✅ CORRECT: Strict validation with clear error messages
from pydantic import BaseModel, Field, validator

class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    quantity: int = Field(..., ge=0, description="Quantity must be non-negative")
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty or whitespace')
        return v.strip()
```

**Frontend - TypeScript Types:**

```typescript
// ✅ CORRECT: Define types matching backend schemas
interface Item {
  id: number;
  name: string;
  quantity: number;
  created_at: string;
}

// Use type guards
function isItem(data: any): data is Item {
  return (
    typeof data === 'object' &&
    typeof data.id === 'number' &&
    typeof data.name === 'string' &&
    typeof data.quantity === 'number'
  );
}

const loadItem = async (id: number): Promise<Item | null> => {
  try {
    const data = await api.get(`/items/${id}`);
    return isItem(data.data) ? data.data : null;
  } catch {
    return null;
  }
};
```

### 10.5 Database Error Handling

**Always Handle Database Errors Explicitly:**

```python
# ✅ CORRECT: Specific error handling
from sqlalchemy.exc import IntegrityError, OperationalError
from app.core.logger import api_logger

@router.post("/items")
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    try:
        db_item = Item(**item.dict())
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except IntegrityError as e:
        db.rollback()
        api_logger.error(f"Integrity error creating item: {str(e)}")
        if "unique constraint" in str(e).lower():
            raise ValidationError("Item with this name already exists")
        raise DatabaseError("Failed to create item due to data conflict")
    except OperationalError as e:
        db.rollback()
        api_logger.error(f"Database operational error: {str(e)}")
        raise DatabaseError("Database connection issue")
    except Exception as e:
        db.rollback()
        api_logger.error(f"Unexpected error creating item: {str(e)}", exc_info=True)
        raise DatabaseError("Failed to create item")
```

### 10.6 API Contract Validation

**When Fixing API Mismatches:**

1. **Identify the Contract:**
   - Check backend schema/model
   - Check frontend TypeScript interface
   - Check actual API response

2. **Fix at the Source:**
   - If backend schema is wrong → fix backend, regenerate types
   - If frontend expects wrong structure → fix frontend types
   - Never hack one side to match the other

3. **Update All Layers:**
   - Backend: Model → Schema → Route
   - Frontend: API client → Type → Component
   - Tests: Update test data to match

**Example Fix Process:**

```python
# Backend: Fix model first
class Attendance(Base):
    # Add missing field
    shift: Optional[str] = Column(String(50), nullable=True)

# Update schema
class AttendanceOut(BaseModel):
    # Add missing field
    shift: Optional[str] = None
    class Config:
        from_attributes = True

# Update route to include field
def get_attendance(...):
    return AttendanceOut(
        ...
        shift=att.shift,  # Now included
    )
```

```typescript
// Frontend: Update type
interface AttendanceRecord {
  // Add missing field
  shift?: string | null;
}

// Update component to handle field
{record.shift || "-"}
```

### 10.7 Error Logging & Monitoring

**Structured Logging:**

```python
# ✅ CORRECT: Structured logging with context
from app.core.logger import api_logger

api_logger.info(
    "Attendance check-in",
    extra={
        "user_id": current_user["id"],
        "site_id": site_id,
        "qr_code": qr_code,
        "distance_m": distance,
    }
)

api_logger.error(
    "Failed to process check-in",
    extra={
        "user_id": current_user["id"],
        "error_type": type(e).__name__,
        "error_message": str(e),
    },
    exc_info=True  # Include stack trace
)
```

**Never Log Sensitive Data:**
```python
# ❌ WRONG: Logging passwords, tokens, full GPS
api_logger.info(f"Login attempt: {username}, password: {password}")
api_logger.info(f"Token: {token}")
api_logger.info(f"GPS: {lat}, {lng}")  # OK if not with PII

# ✅ CORRECT: Log metadata only
api_logger.info(f"Login attempt for user: {username}")
api_logger.info(f"Token generated, length: {len(token)}")
api_logger.info(f"Location update for user {user_id}, distance: {distance}m")
```

### 10.8 Error Recovery & User Experience

**Always Provide User Feedback:**

```typescript
// ✅ CORRECT: Clear error messages, loading states, retry options
const [errorMsg, setErrorMsg] = useState("");
const [loading, setLoading] = useState(false);
const [retryCount, setRetryCount] = useState(0);

const loadData = async () => {
  setLoading(true);
  setErrorMsg("");
  try {
    const data = await apiCall();
    setRecords(data);
    setRetryCount(0); // Reset on success
  } catch (err: any) {
    const message = err.response?.data?.detail || "Gagal memuat data";
    setErrorMsg(message);
    showToast(message, "error");
    
    // Offer retry for transient errors
    if (retryCount < 3 && isRetryableError(err)) {
      setTimeout(() => {
        setRetryCount(retryCount + 1);
        loadData();
      }, 1000 * (retryCount + 1)); // Exponential backoff
    }
  } finally {
    setLoading(false);
  }
};
```

**Error UI Patterns:**
- Show error message clearly (not just console)
- Provide actionable feedback ("Please check your connection and try again")
- Allow retry for transient errors
- Show loading states during operations
- Disable buttons during submission to prevent double-submit

### 10.9 Fixing Broken Features - Systematic Approach

**When Asked to Fix a Feature:**

1. **Reproduce the Error:**
   - Check browser console for frontend errors
   - Check backend logs for server errors
   - Identify the exact error message and stack trace

2. **Trace the Flow:**
   - Frontend: Component → API call → Route
   - Backend: Route → Service → Model → Database
   - Identify where the flow breaks

3. **Identify Root Cause:**
   - Type mismatch? → Fix types at source
   - Missing field? → Add to model/schema/type
   - API contract mismatch? → Align backend and frontend
   - Logic error? → Fix business logic
   - Missing error handling? → Add proper try-catch

4. **Fix Systematically:**
   - Fix backend first (source of truth)
   - Update migrations if schema changed
   - Update frontend types to match
   - Update all components using the API
   - Add defensive checks in components

5. **Verify the Fix:**
   - Test the happy path
   - Test error cases
   - Check for similar issues elsewhere
   - Ensure no regressions

**Example Fix Workflow:**

```
Error: "records.map is not a function"

1. Identify: SupervisorAttendancePage.tsx line 285
2. Trace: listAttendance() → API response → setRecords()
3. Root Cause: Backend returns PaginatedResponse, frontend expects array
4. Fix:
   - Update listAttendance() to extract items
   - Add defensive check: Array.isArray(data) ? data : []
   - Update all similar API calls
5. Verify: Check all pages using listAttendance, listReports, etc.
```

### 10.10 Prevention - Code Review Checklist

**Before Committing Any Change, Verify:**

- [ ] All API responses handled defensively (check for array/object)
- [ ] Error states handled (try-catch, fallback values)
- [ ] Loading states implemented
- [ ] Type safety maintained (no `any` unless necessary)
- [ ] Backend and frontend types aligned
- [ ] Sensitive data not logged
- [ ] User-friendly error messages
- [ ] No console.log in production code
- [ ] Database errors handled with rollback
- [ ] Paginated responses extracted correctly

### 10.11 Common Error Patterns & Solutions

**Pattern 1: Paginated Response Mismatch**
```typescript
// Problem: Backend returns {items: [], total: 0}, frontend expects []
// Solution: Extract items in API client
const data = response.data?.items || response.data || [];
```

**Pattern 2: Missing Null Checks**
```typescript
// Problem: r.checkout_time.toLocaleString() crashes if null
// Solution: Optional chaining and fallback
{r.checkout_time ? new Date(r.checkout_time).toLocaleString() : "OPEN"}
```

**Pattern 3: Type Mismatch**
```typescript
// Problem: division is string, but type expects "security" | "cleaning" | "parking"
// Solution: Type guard or mapping
const divisionMap: Record<string, Division> = {
  security: "security",
  cleaning: "cleaning",
  parking: "parking",
};
const division = divisionMap[rawDivision?.toLowerCase()] || "security";
```

**Pattern 4: Missing Array Check**
```typescript
// Problem: data.map() when data is undefined
// Solution: Always check before mapping
{(Array.isArray(data) ? data : []).map(item => ...)}
```

**Pattern 5: Database Field Missing**
```python
# Problem: Model has field, but migration not run
# Solution: Check migration status, run if needed
# alembic upgrade head
# Or add field check in code:
shift_val = getattr(att, 'shift', None)  # Safe access
```

### 10.12 Error Handling in Critical Flows

**Attendance Check-in/out:**
- Validate QR code exists
- Validate GPS within threshold
- Validate photo uploaded
- Handle network errors gracefully
- Store event even if sync fails (offline mode)

**Patrol Checkpoint:**
- Validate checkpoint exists in route
- Validate order (not skipping required checkpoints)
- Handle GPS errors (use last known location)
- Store partial progress if app crashes

**Report Submission:**
- Validate required fields
- Handle large file uploads (progress, timeout)
- Retry on network failure
- Show confirmation before submission

**Shift Exchange:**
- Validate shift exists and is exchangeable
- Check approval workflow
- Handle concurrent updates (optimistic locking)
- Notify all parties on status change

### 10.13 Testing Error Scenarios

**For Each Critical Feature, Test:**

1. **Happy Path:** Normal operation works
2. **Validation Errors:** Invalid input rejected properly
3. **Network Errors:** Offline/timeout handled
4. **Server Errors:** 500 errors don't crash frontend
5. **Missing Data:** Empty/null responses handled
6. **Concurrent Updates:** Race conditions handled
7. **Permission Errors:** 403/401 handled gracefully

**Example Test Cases:**

```python
# Backend test
def test_attendance_checkin_missing_qr():
    response = client.post("/attendance/checkin", json={...})
    assert response.status_code == 400
    assert "QR code" in response.json()["detail"]

def test_attendance_checkin_invalid_location():
    response = client.post("/attendance/checkin", json={
        "qr_code": "valid_qr",
        "lat": 999.0,  # Invalid
        "lng": 999.0,
    })
    assert response.status_code == 400
    assert "location" in response.json()["detail"].lower()
```

```typescript
// Frontend test
it('handles API error gracefully', async () => {
  mockApi.get.mockRejectedValue(new Error('Network error'));
  render(<AttendancePage />);
  await waitFor(() => {
    expect(screen.getByText(/gagal memuat/i)).toBeInTheDocument();
  });
  expect(mockShowToast).toHaveBeenCalledWith(
    expect.stringContaining('error'),
    'error'
  );
});
```

---

**Remember:** Error handling is not optional. Every API call, every user interaction, every data transformation must have proper error handling. A system that crashes on errors is not production-ready.

