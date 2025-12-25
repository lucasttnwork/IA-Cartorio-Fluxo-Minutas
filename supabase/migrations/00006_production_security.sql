-- ============================================================================
-- Minuta Canvas - Production Security Enhancements
-- ============================================================================
-- This migration adds additional RLS policies and security configurations
-- for production deployment

-- ============================================================================
-- Additional RLS Policies for Remaining Tables
-- ============================================================================

-- Extractions policies (via document -> case relationship)
CREATE POLICY IF NOT EXISTS "Users can view extractions" ON extractions
    FOR SELECT USING (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN cases c ON d.case_id = c.id
            WHERE c.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY IF NOT EXISTS "Users can manage extractions" ON extractions
    FOR ALL USING (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN cases c ON d.case_id = c.id
            WHERE c.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Evidence policies
CREATE POLICY IF NOT EXISTS "Users can view evidence" ON evidence
    FOR SELECT USING (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN cases c ON d.case_id = c.id
            WHERE c.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY IF NOT EXISTS "Users can manage evidence" ON evidence
    FOR ALL USING (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN cases c ON d.case_id = c.id
            WHERE c.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Chat sessions policies
CREATE POLICY IF NOT EXISTS "Users can view chat sessions" ON chat_sessions
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY IF NOT EXISTS "Users can manage chat sessions" ON chat_sessions
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Chat messages policies (via session -> case)
CREATE POLICY IF NOT EXISTS "Users can view chat messages" ON chat_messages
    FOR SELECT USING (
        session_id IN (
            SELECT cs.id FROM chat_sessions cs
            JOIN cases c ON cs.case_id = c.id
            WHERE c.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY IF NOT EXISTS "Users can manage chat messages" ON chat_messages
    FOR ALL USING (
        session_id IN (
            SELECT cs.id FROM chat_sessions cs
            JOIN cases c ON cs.case_id = c.id
            WHERE c.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Operations log policies
CREATE POLICY IF NOT EXISTS "Users can view operations log" ON operations_log
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY IF NOT EXISTS "Users can create operations log" ON operations_log
    FOR INSERT WITH CHECK (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Processing jobs policies
CREATE POLICY IF NOT EXISTS "Users can view processing jobs" ON processing_jobs
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY IF NOT EXISTS "Users can create processing jobs" ON processing_jobs
    FOR INSERT WITH CHECK (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- Storage Bucket Configuration
-- ============================================================================

-- Create documents bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    52428800, -- 50MB
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/tiff',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- Storage RLS Policies
-- ============================================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;

-- Users can upload documents to their organization's cases
CREATE POLICY "Users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND
        -- Extract case_id from path (format: case_id/timestamp-filename)
        (string_to_array(name, '/'))[1]::uuid IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Users can view documents from their organization's cases
CREATE POLICY "Users can view documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND
        (string_to_array(name, '/'))[1]::uuid IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Users can update documents in their organization's cases
CREATE POLICY "Users can update documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' AND
        (string_to_array(name, '/'))[1]::uuid IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Users can delete documents from their organization's cases
CREATE POLICY "Users can delete documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND
        (string_to_array(name, '/'))[1]::uuid IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- Additional Indexes for Production Performance
-- ============================================================================

-- Index for faster user organization lookups
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Index for faster case organization lookups
CREATE INDEX IF NOT EXISTS idx_cases_organization_id ON cases(organization_id);

-- Index for faster document lookups by status
CREATE INDEX IF NOT EXISTS idx_documents_case_status ON documents(case_id, status);

-- Index for faster processing job lookups
CREATE INDEX IF NOT EXISTS idx_processing_jobs_case_status ON processing_jobs(case_id, status);

-- Index for faster extraction lookups
CREATE INDEX IF NOT EXISTS idx_extractions_document_id ON extractions(document_id);

-- ============================================================================
-- User Profile Update Function
-- ============================================================================

-- Allow users to update their own profile (except organization_id)
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        -- Prevent changing organization
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- ============================================================================
-- Admin Policies (for supervisor and admin roles)
-- ============================================================================

-- Admins can view all users in their organization
CREATE POLICY IF NOT EXISTS "Admins can manage org users" ON users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users
            WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    );

-- Admins can update organization settings
CREATE POLICY IF NOT EXISTS "Admins can update organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- Case Assignment Policies
-- ============================================================================

-- Only supervisors/admins can assign cases
CREATE POLICY IF NOT EXISTS "Supervisors can assign cases" ON cases
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM users
            WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users
            WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    );

-- ============================================================================
-- Audit Logging Function
-- ============================================================================

-- Function to log data changes
CREATE OR REPLACE FUNCTION log_data_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO operations_log (
            case_id,
            user_id,
            operation_type,
            target_path,
            old_value,
            new_value
        ) VALUES (
            COALESCE(NEW.case_id, OLD.case_id),
            auth.uid(),
            TG_OP || '_' || TG_TABLE_NAME,
            TG_TABLE_NAME || '/' || NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO operations_log (
            case_id,
            user_id,
            operation_type,
            target_path,
            old_value
        ) VALUES (
            OLD.case_id,
            auth.uid(),
            TG_OP || '_' || TG_TABLE_NAME,
            TG_TABLE_NAME || '/' || OLD.id,
            to_jsonb(OLD)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers for important tables
DROP TRIGGER IF EXISTS audit_people_changes ON people;
CREATE TRIGGER audit_people_changes
    AFTER UPDATE OR DELETE ON people
    FOR EACH ROW
    EXECUTE FUNCTION log_data_change();

DROP TRIGGER IF EXISTS audit_properties_changes ON properties;
CREATE TRIGGER audit_properties_changes
    AFTER UPDATE OR DELETE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION log_data_change();

DROP TRIGGER IF EXISTS audit_drafts_changes ON drafts;
CREATE TRIGGER audit_drafts_changes
    AFTER UPDATE OR DELETE ON drafts
    FOR EACH ROW
    EXECUTE FUNCTION log_data_change();

-- ============================================================================
-- Production-Ready Settings
-- ============================================================================

-- Ensure statement timeout for long-running queries
-- ALTER DATABASE postgres SET statement_timeout = '30s';

-- Add comment for documentation
COMMENT ON TABLE organizations IS 'Multi-tenant organization container for all data';
COMMENT ON TABLE users IS 'User profiles linked to Supabase Auth';
COMMENT ON TABLE cases IS 'Notary cases with documents and extracted data';
COMMENT ON TABLE documents IS 'Uploaded document files and metadata';
COMMENT ON TABLE extractions IS 'OCR and LLM extraction results';
COMMENT ON TABLE people IS 'Extracted person entities from documents';
COMMENT ON TABLE properties IS 'Extracted property entities from documents';
COMMENT ON TABLE evidence IS 'Links between entities and source documents';
COMMENT ON TABLE processing_jobs IS 'Background job queue for document processing';
