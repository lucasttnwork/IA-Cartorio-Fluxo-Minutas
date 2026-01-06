# Secrets Management Guide

This document outlines best practices for managing secrets and credentials in the Minuta Canvas application.

## Overview

Proper secrets management is critical for production security. This guide covers:
- What secrets exist in the application
- How to securely store them
- How to rotate credentials
- Platform-specific configuration

## Secrets Inventory

### Critical Secrets (Server-Side Only)

| Secret | Purpose | Exposure Risk |
|--------|---------|---------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS, full DB access | CRITICAL - Full data breach |
| `SUPABASE_PASSWORD` | Direct database access | CRITICAL - Full data breach |
| `GEMINI_API_KEY` | LLM API access | HIGH - API abuse, costs |
| `GOOGLE_APPLICATION_CREDENTIALS` | Document AI access | HIGH - API abuse, costs |

### Public Secrets (Safe for Browser)

| Secret | Purpose | Why Safe |
|--------|---------|----------|
| `VITE_SUPABASE_URL` | API endpoint | Public endpoint, no security risk |
| `VITE_SUPABASE_ANON_KEY` | Client authentication | RLS protects data |

## Security Rules

### Rule 1: Never Commit Secrets

```bash
# .gitignore - ensure these are included
.env
.env.local
.env.production
*.pem
*.key
credentials/
```

### Rule 2: Prefix Convention

```bash
# Client-safe (VITE_ prefix - exposed to browser)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Server-only (NO VITE_ prefix - never in browser)
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```

### Rule 3: Environment Isolation

| Environment | Credentials |
|-------------|-------------|
| Development | Development Supabase project |
| Staging | Staging Supabase project |
| Production | Production Supabase project |

**Never** share credentials between environments.

## Platform-Specific Configuration

### Vercel

1. Go to Project Settings > Environment Variables
2. Add each variable:
   - For client variables (`VITE_*`): Select "Production", "Preview", "Development"
   - For server variables: Select only the environments where backend runs
3. Mark sensitive variables as "Sensitive" (hidden in logs)

```bash
# Vercel CLI
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

### Netlify

1. Go to Site Settings > Environment Variables
2. Add variables with appropriate scopes
3. Use "Sensitive variable" toggle for secrets

### Railway

1. Go to Project > Variables
2. Add variables (automatically hidden in logs)
3. Use "Shared Variables" for multi-service projects

### Docker

```dockerfile
# Never hardcode secrets in Dockerfile!
# Use build arguments or runtime injection

# BAD:
ENV SUPABASE_KEY=secret123

# GOOD - runtime injection:
docker run -e SUPABASE_KEY=$SUPABASE_KEY myapp
```

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: npm run build
```

Add secrets in: Repository Settings > Secrets > Actions

## Credential Rotation

### When to Rotate

- Suspected compromise
- Employee departure
- Regular rotation (every 90 days recommended)
- After any security incident

### Rotation Process

#### Supabase Anon Key

1. Generate new key in Supabase Dashboard > Settings > API
2. Update in all deployment platforms
3. Deploy application
4. Monitor for errors
5. Delete old key after confirmation

#### Supabase Service Role Key

1. Generate new key in Supabase Dashboard
2. Update in Edge Functions and Workers
3. Redeploy backend services
4. Verify worker functionality
5. Delete old key

#### Gemini API Key

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create new API key
3. Update in backend services
4. Test LLM functionality
5. Delete old key

## Access Control

### Who Has Access

| Role | Credentials Access |
|------|-------------------|
| Lead Developer | All credentials |
| Backend Developer | Server-side only |
| Frontend Developer | VITE_* only |
| DevOps | All for deployment |

### Access Audit

Regularly review:
- Who has access to deployment platforms
- Who has access to Supabase dashboard
- Who has access to Google Cloud console

## Local Development

### Setting Up

```bash
# 1. Copy example file
cp .env.example .env

# 2. Get credentials from team lead or password manager

# 3. Verify .env is in .gitignore
cat .gitignore | grep .env
```

### Using Different Environments

```bash
# Development (default)
npm run dev

# Use staging
cp .env.staging .env
npm run dev

# Use production (be careful!)
cp .env.production .env
npm run dev
```

## Password Manager Integration

### Recommended Tools

1. **1Password** - Team password sharing
2. **HashiCorp Vault** - Enterprise secrets management
3. **AWS Secrets Manager** - If using AWS
4. **Google Secret Manager** - If using GCP

### 1Password Integration

```bash
# Install 1Password CLI
brew install 1password-cli

# Load secrets from 1Password
eval $(op signin)
export SUPABASE_KEY=$(op read "op://Development/Supabase/key")
npm run dev
```

## Incident Response

### If Secrets Are Compromised

1. **Immediately rotate** the compromised credential
2. **Review audit logs** for unauthorized access
3. **Notify** security team and stakeholders
4. **Assess damage** - what data was accessed?
5. **Document** the incident
6. **Improve** - update procedures to prevent recurrence

### Checking for Leaks

```bash
# Scan git history for secrets
git secrets --scan-history

# Use truffleHog for deep scanning
trufflehog git file://. --since-commit HEAD~100

# Check if secrets are in GitHub
# Go to: github.com/your-org/your-repo/security/secret-scanning
```

## Compliance

### SOC 2 Requirements

- [ ] Secrets stored in approved vaults
- [ ] Access logged and auditable
- [ ] Regular rotation schedule
- [ ] Encryption at rest and in transit

### LGPD Requirements (Brazil)

- [ ] Data encryption for personal data
- [ ] Access controls documented
- [ ] Audit trail maintained
- [ ] Incident response plan

## Checklist for New Deployments

- [ ] All secrets set in deployment platform
- [ ] No secrets hardcoded in code
- [ ] .env files in .gitignore
- [ ] Server-side secrets not exposed to browser
- [ ] Access controls reviewed
- [ ] Rotation schedule established
- [ ] Incident response plan documented

## Quick Reference

```bash
# Check if .env is tracked by git
git ls-files --error-unmatch .env 2>/dev/null && echo "WARNING: .env is tracked!" || echo ".env is safe"

# Verify no secrets in code
grep -r "sk_live_\|SUPABASE_SERVICE_ROLE" src/ --include="*.ts" --include="*.tsx"

# List environment variables (sanitized)
env | grep -E "SUPABASE|GEMINI" | sed 's/=.*/=***/'
```

## Contact

For credential access or security concerns:
- Security Team: security@your-company.com
- DevOps Team: devops@your-company.com
- Emergency: [On-call contact]
