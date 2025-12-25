# Organization Settings Feature - Setup Guide

## Overview
This feature adds organization settings management to the Minuta Canvas application, allowing administrators to view and update organization-level configurations.

## Files Created/Modified

### New Files
1. **src/pages/OrganizationSettingsPage.tsx** - Main settings page component
2. **src/hooks/useOrganization.ts** - React Query hook for organization data management
3. **src/pages/TestOrganizationSettingsPage.tsx** - Test page with mock data (for development/testing)
4. **setup-test-org.sql** - SQL script to setup test organization data

### Modified Files
1. **src/App.tsx** - Added routes for settings pages
2. **src/components/layout/DashboardLayout.tsx** - Added Settings link to navigation

## Database Setup

### Required Tables
The feature expects the following database schema (already defined in migrations):

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Setup Steps

1. **Apply Migrations**: Run all Supabase migrations to create the necessary tables:
   ```bash
   npx supabase db push
   ```

2. **Create Test Organization**: Run the setup SQL script in Supabase SQL Editor:
   ```bash
   # Copy contents of setup-test-org.sql and run in Supabase SQL Editor
   ```

   Or manually execute:
   ```sql
   -- Insert test organization
   INSERT INTO organizations (id, name, settings, created_at)
   VALUES (
     '550e8400-e29b-41d4-a716-446655440000',
     'Test Organization',
     '{"theme": "light", "notifications": true}'::jsonb,
     NOW()
   )
   ON CONFLICT (id) DO UPDATE
   SET name = EXCLUDED.name,
       settings = EXCLUDED.settings;

   -- Update user to belong to this organization
   UPDATE users
   SET organization_id = '550e8400-e29b-41d4-a716-446655440000',
       role = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'teste@minuta.com' LIMIT 1);
   ```

3. **Configure RLS Policies**: Ensure Row Level Security policies allow organization access:
   ```sql
   -- Allow users to read their organization
   CREATE POLICY "Users can read own organization"
   ON organizations FOR SELECT
   USING (id IN (
     SELECT organization_id FROM users WHERE id = auth.uid()
   ));

   -- Allow admins to update organization
   CREATE POLICY "Admins can update organization"
   ON organizations FOR UPDATE
   USING (
     id IN (
       SELECT organization_id FROM users
       WHERE id = auth.uid() AND role = 'admin'
     )
   );
   ```

## Features

### 1. Organization Information Management
- View organization name, ID, and creation date
- Edit organization name (admin only)
- Automatic change tracking and save/reset functionality

### 2. Role-Based Access Control
- **Admin users**: Can view and edit all settings
- **Non-admin users (clerk, supervisor)**: Can view but not edit (read-only mode with warning banner)

### 3. User Experience
- Loading states with skeleton cards
- Error states with retry functionality
- Success/error toast notifications
- Sticky save bar appears when changes are made
- Smooth animations using Framer Motion

### 4. System Settings Section
- Placeholder for future system-wide configurations
- Extensible design for adding new settings

## Usage

### For Production
Navigate to `/settings` in the application (link appears in the sidebar navigation).

### For Testing/Development
Use the test page at `/test-organization-settings` which uses mock data and doesn't require database setup.

## Access the Feature

1. **Login** to the application with a user account
2. **Click "Settings"** in the sidebar navigation
3. **View/Edit** organization information based on your role

## Screenshots

- **Initial State**: Clean settings page showing organization information
- **Editing**: Active input with unsaved changes indicator
- **Saving**: Toast notification confirming save
- **Read-Only**: Warning banner for non-admin users with disabled inputs

## Future Enhancements

1. **Additional Settings Sections**:
   - User management preferences
   - Document processing defaults
   - Notification settings
   - Integration configurations

2. **Advanced Features**:
   - Organization logo upload
   - Timezone and locale settings
   - Audit log for settings changes
   - Multi-organization support

## API Reference

### useOrganization Hook

```typescript
const {
  organization,      // Organization data
  isLoading,        // Loading state
  error,            // Error object
  updateOrganization, // Mutation function
  isUpdating        // Update in progress state
} = useOrganization()
```

### Update Organization
```typescript
updateOrganization(
  { name: 'New Organization Name' },
  {
    onSuccess: () => { /* handle success */ },
    onError: (error) => { /* handle error */ }
  }
)
```

## Troubleshooting

### Issue: "Failed to load organization settings"
- **Cause**: Database tables not created or user not linked to organization
- **Solution**: Run migrations and setup SQL script

### Issue: Settings not saving
- **Cause**: RLS policies not configured or user doesn't have admin role
- **Solution**: Check RLS policies and user role in database

### Issue: User not authenticated
- **Cause**: Auth session expired or invalid
- **Solution**: Log out and log back in

## Technical Details

- **State Management**: React Query for server state, local useState for form state
- **Validation**: Role-based UI disabling
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion for smooth transitions
- **Toast Notifications**: Sonner library
