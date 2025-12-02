# Admin and Cost Tracking Features

This document describes the admin user functionality and cost tracking features added to the Suna frontend.

## Table of Contents

1. [Subscription Bypass](#subscription-bypass)
2. [Admin User Functionality](#admin-user-functionality)
3. [Cost Tracking](#cost-tracking)
4. [Database Setup](#database-setup)
5. [API Endpoints](#api-endpoints)

---

## Subscription Bypass

### Overview

The subscription bypass feature allows all platform features to be made available without requiring a paid subscription. This is useful for self-hosted deployments or development environments.

### Configuration

Set the following environment variable in your `.env.local` file:

```sh
NEXT_PUBLIC_BYPASS_SUBSCRIPTION=true
```

When this is set to `true`, all billing checks are bypassed and all features are available to users regardless of their subscription status.

### How It Works

The `isBillingDisabled()` function in `src/lib/config.ts` checks for:
1. Local development mode (`NEXT_PUBLIC_ENV_MODE=LOCAL`)
2. Explicit subscription bypass (`NEXT_PUBLIC_BYPASS_SUBSCRIPTION=true`)

When either condition is true, billing-related validations are skipped throughout the application.

---

## Admin User Functionality

### Overview

Admin users have elevated privileges and can access additional platform features such as cost tracking and user management.

### Components

#### AuthProvider Enhancement

The `AuthProvider` component has been enhanced to include admin role support:

```typescript
import { useAuth } from '@/components/AuthProvider';

function MyComponent() {
  const { isAdmin, userRole, refreshUserRole } = useAuth();
  
  if (isAdmin) {
    // Show admin-specific content
  }
}
```

#### AdminGuard Component

Use the `AdminGuard` component to protect admin-only content:

```tsx
import { AdminGuard } from '@/components/admin';

function AdminPage() {
  return (
    <AdminGuard 
      fallback={<div>Access denied</div>}
      redirectTo="/dashboard"
    >
      <div>Admin-only content</div>
    </AdminGuard>
  );
}
```

Props:
- `children`: Content to display for admin users
- `fallback`: Optional content to display for non-admin users
- `redirectTo`: Optional URL to redirect non-admin users

#### useIsAdmin Hook

```typescript
import { useIsAdmin } from '@/components/admin';

function MyComponent() {
  const isAdmin = useIsAdmin();
  // ...
}
```

### User Roles

User roles are stored in a `user_roles` table in the database with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Reference to auth.users |
| role | TEXT | 'user' or 'admin' |
| created_at | TIMESTAMP | When the role was assigned |
| updated_at | TIMESTAMP | When the role was last updated |

---

## Cost Tracking

### Overview

The cost tracking feature allows admin users to view and analyze platform usage costs across all users.

### Admin Dashboard

Admin users can access the cost tracking dashboard at `/settings/admin`. The dashboard shows:

1. **Summary Cards**
   - Total platform cost
   - Number of active users
   - Average cost per user

2. **User Cost Table**
   - Per-user breakdown of costs
   - Agent run counts
   - Input/output token counts
   - Click-through to detailed user view

3. **Date Filtering**
   - Last 7 days
   - Current month
   - All time

### API Integration

The cost tracking features rely on backend API endpoints for data. The following hooks are available:

```typescript
import { 
  useUserCosts, 
  useAllUsersCosts, 
  useUserCostsById 
} from '@/hooks/react-query/admin';

// Current user's costs
const { data: myCosts } = useUserCosts(startDate, endDate);

// All users' costs (admin only)
const { data: allCosts } = useAllUsersCosts(startDate, endDate);

// Specific user's costs (admin only)
const { data: userCosts } = useUserCostsById(userId, startDate, endDate);
```

---

## Database Setup

### Required Tables

#### user_roles Table

```sql
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can read all roles
CREATE POLICY "Admins can read all roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Only admins can update roles
CREATE POLICY "Admins can update roles" ON public.user_roles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
```

#### cost_records Table (Backend)

The cost tracking data should be populated by the backend. The expected structure:

```sql
CREATE TABLE IF NOT EXISTS public.cost_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    thread_id UUID,
    agent_run_id UUID,
    model_name TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cost_records_user_id ON public.cost_records(user_id);
CREATE INDEX idx_cost_records_created_at ON public.cost_records(created_at);
```

### Setting Up an Admin User

To designate a user as an admin, insert a record into the `user_roles` table:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();
```

---

## API Endpoints

The frontend expects the following backend API endpoints:

### GET /admin/costs/me
Returns the current user's cost data.

**Query Parameters:**
- `start_date` (optional): Start of date range (YYYY-MM-DD)
- `end_date` (optional): End of date range (YYYY-MM-DD)

**Response:**
```json
{
  "costs": [...],
  "summary": {
    "user_id": "...",
    "total_cost_usd": 0.0,
    "total_input_tokens": 0,
    "total_output_tokens": 0,
    "total_agent_runs": 0,
    "period_start": "...",
    "period_end": "..."
  }
}
```

### GET /admin/costs/all (Admin Only)
Returns all users' cost data.

**Response:**
```json
{
  "users": [...],
  "total_cost_usd": 0.0,
  "period_start": "...",
  "period_end": "..."
}
```

### GET /admin/costs/user/:userId (Admin Only)
Returns a specific user's cost data.

### GET /admin/role
Returns the current user's role.

**Response:**
```json
{
  "role": "admin"
}
```

### PUT /admin/role/:userId (Admin Only)
Updates a user's role.

**Request Body:**
```json
{
  "role": "admin"
}
```

---

## Security Considerations

1. **Admin Access Control**: The admin functionality relies on proper backend validation. Frontend checks are for UX only; all sensitive operations must be verified server-side.

2. **Subscription Bypass**: When `NEXT_PUBLIC_BYPASS_SUBSCRIPTION` is enabled, ensure this is intentional and appropriate for your deployment scenario.

3. **Cost Data Privacy**: Cost tracking data should only be accessible to admin users. Backend endpoints must enforce this access control.
