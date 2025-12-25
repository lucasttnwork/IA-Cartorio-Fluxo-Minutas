# Supabase Production Integration Guide

This document provides comprehensive guidance for configuring and maintaining the Supabase production integration for Minuta Canvas.

## Table of Contents

1. [Overview](#overview)
2. [Environment Configuration](#environment-configuration)
3. [Database Schema](#database-schema)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [Authentication](#authentication)
6. [Storage Configuration](#storage-configuration)
7. [Real-time Subscriptions](#real-time-subscriptions)
8. [Connection Pooling](#connection-pooling)
9. [Backup & Recovery](#backup--recovery)
10. [Security Best Practices](#security-best-practices)
11. [Monitoring & Logging](#monitoring--logging)
12. [Troubleshooting](#troubleshooting)

---

## Overview

Minuta Canvas uses Supabase as its backend-as-a-service platform, providing:
- PostgreSQL database
- Authentication
- Real-time subscriptions
- File storage
- Edge functions (for document processing)

**Production Project URL:** `https://kllcbgoqtxedlfbkxpfo.supabase.co`

---

## Environment Configuration

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (public) key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) | Yes (for workers) |
| `VITE_APP_URL` | Application URL for redirects | Yes |

### Environment Setup

1. **Development**: Copy `.env.example` to `.env` and fill in values
2. **Production**: Set environment variables in your deployment platform (Vercel, Netlify, etc.)

### Security Notes

- **NEVER** commit `.env` files to version control
- **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Use `VITE_` prefix only for variables that should be exposed to the browser
- The anon key is safe to expose (RLS protects your data)

---

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `organizations` | Multi-tenant organization structure |
| `users` | User profiles linked to Supabase Auth |
| `cases` | Notary case records |
| `documents` | Uploaded documents metadata |
| `extractions` | OCR and LLM extraction results |
| `people` | Extracted person entities |
| `properties` | Extracted property entities |
| `evidence` | Evidence linking entities to documents |
| `graph_edges` | Relationships between entities |
| `drafts` | Generated draft documents |
| `processing_jobs` | Document processing queue |

### Running Migrations

```bash
# Using Supabase CLI
supabase db push

# Or run SQL files directly in Supabase dashboard
# supabase/migrations/00001_initial_schema.sql
# supabase/migrations/00002_add_entity_extraction_job_type.sql
# supabase/migrations/00003_add_merge_suggestions.sql
# supabase/migrations/00004_add_geocoding_fields.sql
# supabase/migrations/00005_add_retry_tracking.sql
```

---

## Row Level Security (RLS)

All tables have RLS enabled with organization-based access control:

### Policy Pattern

```sql
-- Users can only access data from their organization
CREATE POLICY "Users can view org data" ON table_name
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );
```

### Key Policies

1. **Organizations**: Users can only view their own organization
2. **Cases**: Users can CRUD cases within their organization
3. **Documents**: Access controlled through case ownership
4. **People/Properties**: Access controlled through case ownership

### Service Role Bypass

The service role key automatically bypasses RLS, used for:
- Background workers
- Edge functions
- Admin operations

---

## Authentication

### Configuration

```typescript
// src/lib/supabaseConfig.ts
export const AUTH_CONFIG = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  storageKey: 'minuta-canvas-auth',
  flowType: 'pkce',
}
```

### Supported Flows

- Email/Password authentication
- Magic link (email)
- PKCE flow for enhanced security

### Production Settings

In Supabase Dashboard > Authentication > Settings:

1. **Site URL**: Set to your production domain
2. **Redirect URLs**: Add all valid callback URLs
3. **Email Templates**: Customize for your brand
4. **Rate Limits**: Configure based on expected traffic

---

## Storage Configuration

### Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `documents` | Uploaded case documents | Private (RLS) |

### Storage Policies

```sql
-- Users can upload to their organization's cases
CREATE POLICY "Upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );
```

### File Size Limits

- Maximum file size: 50MB
- Allowed types: PDF, JPEG, PNG, WEBP, TIFF, DOC, DOCX

---

## Real-time Subscriptions

### Configuration

```typescript
// Production-optimized settings
export const REALTIME_CONFIG = {
  eventsPerSecond: 10,  // Throttle in production
  broadcastSelf: false,
  ack: false,
}
```

### Subscribed Tables

- `documents` - Document status changes
- `processing_jobs` - Job progress updates
- `extractions` - Consensus updates
- `people` / `properties` - Entity changes

### Best Practices

1. Unsubscribe when components unmount
2. Use filters to limit data transfer
3. Implement reconnection logic

---

## Connection Pooling

### Supabase Settings

In Supabase Dashboard > Settings > Database:

1. **Pool Mode**: Transaction (recommended)
2. **Pool Size**: Based on your plan tier
3. **Connection Timeout**: 30 seconds

### Client Configuration

```typescript
// Request timeout
export const CONNECTION_CONFIG = {
  requestTimeout: 30000,  // 30s for production
  realtimeHeartbeatMs: 30000,
  realtimeReconnectDelayMs: 1000,
  realtimeMaxReconnects: 10,
}
```

---

## Backup & Recovery

### Automatic Backups

Supabase provides:
- **Daily backups**: Retained for 7 days (Pro plan)
- **Point-in-time recovery**: Up to 7 days

### Manual Backup

```bash
# Export database
supabase db dump -f backup.sql

# Import database
psql -h db.project.supabase.co -U postgres -d postgres -f backup.sql
```

### Recommended Backup Strategy

1. Enable automatic daily backups
2. Export critical tables weekly
3. Test restore process monthly

---

## Security Best Practices

### 1. Environment Variables

```bash
# NEVER expose service role key to client
SUPABASE_SERVICE_ROLE_KEY=xxx  # Server-side only

# Safe to expose (protected by RLS)
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_ANON_KEY=xxx
```

### 2. RLS Enforcement

- Always enable RLS on new tables
- Test policies before deploying
- Use `auth.uid()` for user identification

### 3. API Security

- Enable CORS only for your domains
- Use rate limiting
- Monitor for unusual activity

### 4. Data Validation

- Validate on client AND server
- Use database constraints
- Sanitize user input

---

## Monitoring & Logging

### Supabase Dashboard

Monitor:
- Database connections
- API requests
- Authentication events
- Storage usage

### Application Logging

```typescript
// Production logging (no secrets)
export function logSupabaseConfig(): void {
  if (!isDevelopment) return
  console.log('Supabase Configuration:', {
    url: config.supabase.url,
    environment: config.app.environment,
  })
}
```

### Alerts

Set up alerts for:
- Database connection errors
- High error rates
- Storage limits
- Unusual authentication patterns

---

## Troubleshooting

### Common Issues

#### 1. "permission denied for table"

**Cause**: RLS policy not satisfied
**Solution**: Check user's organization membership

```sql
SELECT organization_id FROM users WHERE id = auth.uid();
```

#### 2. "JWT expired"

**Cause**: Token not refreshed
**Solution**: Ensure `autoRefreshToken: true` in config

#### 3. "Too many connections"

**Cause**: Connection pool exhausted
**Solution**:
- Enable connection pooling in Supabase
- Reduce concurrent connections
- Upgrade plan if needed

#### 4. Real-time not working

**Cause**: Multiple possible causes
**Solution**:
1. Check RLS policies allow SELECT
2. Verify table is in publication
3. Check WebSocket connection

### Debug Mode

Enable debug logging in development:

```typescript
if (isDevelopment) {
  logEnvironmentInfo()
  logSupabaseConfig()
}
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] RLS policies tested
- [ ] Backups configured
- [ ] CORS settings updated
- [ ] Rate limits configured
- [ ] Monitoring alerts set up
- [ ] SSL/TLS enforced
- [ ] Database indexes optimized
- [ ] Storage bucket policies configured
- [ ] Authentication providers configured
- [ ] Email templates customized
- [ ] Error handling tested
- [ ] Performance testing completed

---

## Support

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Status Page**: https://status.supabase.com
