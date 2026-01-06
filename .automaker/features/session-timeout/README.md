# Session Timeout Feature

## Overview
Automatic session timeout handling that logs users out after a period of inactivity, with a warning modal before expiration.

## Implementation Details

### Files Created
1. **`src/config/sessionConfig.ts`** - Configuration for timeout durations and activity events
2. **`src/hooks/useSessionTimeout.ts`** - React hook for session timeout logic
3. **`src/components/common/SessionTimeoutWarning.tsx`** - Warning modal component
4. **`src/pages/TestSessionTimeoutPage.tsx`** - Test page for verification

### Files Modified
1. **`src/components/common/ProtectedRoute.tsx`** - Integrated session timeout monitoring
2. **`src/App.tsx`** - Added test route

## Configuration

Default settings in `src/config/sessionConfig.ts`:
- **Timeout Duration**: 15 minutes
- **Warning Duration**: 2 minutes (warning appears 2 minutes before timeout)
- **Check Interval**: 30 seconds (how often to check for timeout)
- **Activity Events**: mousedown, keydown, scroll, touchstart

## How It Works

1. **Activity Tracking**: The system monitors user activity events (mouse, keyboard, scroll, touch)
2. **Periodic Checks**: Every 30 seconds, the system checks if the user has been inactive
3. **Warning Modal**: After 13 minutes of inactivity, a warning modal appears with a countdown
4. **User Options**:
   - Click "Stay Logged In" to reset the timeout
   - Click "Log Out Now" to immediately log out
   - Do nothing and be automatically logged out when timer reaches zero
5. **Auto Reset**: Any user activity automatically resets the timeout timer

## Testing

Navigate to `/test-session-timeout` (development mode only) to:
- View current session status
- See configuration settings
- Monitor activity detection in real-time
- Test the timeout behavior

To test with shorter timeouts, temporarily modify `src/config/sessionConfig.ts`:
```typescript
export const SESSION_CONFIG = {
  TIMEOUT_DURATION: 30 * 1000, // 30 seconds
  WARNING_DURATION: 10 * 1000, // 10 seconds
  CHECK_INTERVAL: 1 * 1000,    // 1 second
  ACTIVITY_EVENTS: ['mousedown', 'keydown', 'scroll', 'touchstart'],
}
```

## User Experience

1. User logs in and uses the application normally
2. After 13 minutes of no activity, a warning modal appears
3. Modal shows countdown timer and two options
4. User can extend session or logout immediately
5. If no action taken, automatic logout occurs when timer reaches zero
6. User is redirected to login page with session expired message

## Security Benefits

- Prevents unauthorized access to unattended sessions
- Reduces risk of session hijacking
- Complies with security best practices for sensitive applications
- Configurable timeout duration for different security requirements

## Accessibility

- Warning modal is keyboard accessible
- Screen reader announcements for countdown
- Clear visual feedback with timer display
- Multiple ways to extend session (button or any activity)

## Performance

- Activity events are throttled to 1 second to prevent excessive re-renders
- Periodic checks run every 30 seconds (configurable)
- Minimal impact on application performance
- Event listeners cleaned up properly on unmount
