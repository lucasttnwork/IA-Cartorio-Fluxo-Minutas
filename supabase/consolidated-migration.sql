-- ============================================================================
-- Minuta Canvas - Consolidated Database Migrations
-- Generated: 2025-12-25T15:05:46.662Z
-- ============================================================================
--
-- This file contains all migrations consolidated into a single file.
-- Execute this in Supabase SQL Editor:
-- undefined/sql/new
--
-- ============================================================================


-- ============================================================================
-- Migration: 00001_initial_schema.sql
-- ============================================================================

-- ============================================================================
-- Minuta Canvas - Initial Database Schema
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Organizations
-- ============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Users
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('clerk', 'supervisor', 'admin')) DEFAULT 'clerk',
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Cases
-- ============================================================================
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    act_type TEXT NOT NULL CHECK (act_type IN ('purchase_sale', 'donation', 'exchange', 'lease')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'processing', 'review', 'approved', 'archived')) DEFAULT 'draft',
    title TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    canonical_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Documents
-- ============================================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    page_count INTEGER,
    status TEXT NOT NULL CHECK (status IN ('uploaded', 'processing', 'processed', 'needs_review', 'approved', 'failed')) DEFAULT 'uploaded',
    doc_type TEXT CHECK (doc_type IN ('cnh', 'rg', 'marriage_cert', 'deed', 'proxy', 'iptu', 'birth_cert', 'other')),
    doc_type_confidence FLOAT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Extractions
-- ============================================================================
CREATE TABLE extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    ocr_result JSONB,
    llm_result JSONB,
    consensus JSONB,
    pending_fields TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- People
-- ============================================================================
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    cpf TEXT,
    rg TEXT,
    rg_issuer TEXT,
    birth_date DATE,
    nationality TEXT,
    marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'separated', 'stable_union')),
    profession TEXT,
    address JSONB,
    email TEXT,
    phone TEXT,
    father_name TEXT,
    mother_name TEXT,
    confidence FLOAT DEFAULT 0,
    source_docs UUID[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Properties
-- ============================================================================
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    registry_number TEXT,
    registry_office TEXT,
    address JSONB,
    area_sqm NUMERIC,
    description TEXT,
    iptu_number TEXT,
    encumbrances JSONB,
    confidence FLOAT DEFAULT 0,
    source_docs UUID[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Evidence
-- ============================================================================
CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('person', 'property')),
    entity_id UUID NOT NULL,
    field_name TEXT NOT NULL,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL DEFAULT 1,
    bounding_box JSONB,
    extracted_text TEXT NOT NULL,
    confidence FLOAT DEFAULT 0,
    source TEXT NOT NULL CHECK (source IN ('ocr', 'llm', 'consensus')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Graph Edges (Relationships)
-- ============================================================================
CREATE TABLE graph_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('person', 'property')),
    source_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('person', 'property')),
    target_id UUID NOT NULL,
    relationship TEXT NOT NULL CHECK (relationship IN ('spouse_of', 'represents', 'owns', 'sells', 'buys', 'guarantor_of', 'witness_for')),
    confidence FLOAT DEFAULT 0,
    confirmed BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(case_id, source_type, source_id, target_type, target_id, relationship)
);

-- ============================================================================
-- Drafts
-- ============================================================================
CREATE TABLE drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    content JSONB NOT NULL,
    html_content TEXT,
    pending_items JSONB DEFAULT '[]',
    status TEXT NOT NULL CHECK (status IN ('generated', 'reviewing', 'approved')) DEFAULT 'generated',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(case_id, version)
);

-- ============================================================================
-- Chat Sessions
-- ============================================================================
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Chat Messages
-- ============================================================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    operation JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Operations Log (Audit Trail)
-- ============================================================================
CREATE TABLE operations_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operation_type TEXT NOT NULL,
    target_path TEXT,
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Processing Jobs
-- ============================================================================
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN ('ocr', 'extraction', 'consensus', 'entity_resolution', 'draft')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_people_case_id ON people(case_id);
CREATE INDEX idx_people_cpf ON people(cpf);
CREATE INDEX idx_properties_case_id ON properties(case_id);
CREATE INDEX idx_properties_registry ON properties(registry_number);
CREATE INDEX idx_graph_edges_case_id ON graph_edges(case_id);
CREATE INDEX idx_graph_edges_source ON graph_edges(source_type, source_id);
CREATE INDEX idx_graph_edges_target ON graph_edges(target_type, target_id);
CREATE INDEX idx_evidence_entity ON evidence(entity_type, entity_id);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_operations_log_case_id ON operations_log(case_id);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own organization's data
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view organization members" ON users
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- Cases policies
CREATE POLICY "Users can view org cases" ON cases
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can create org cases" ON cases
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update org cases" ON cases
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- Documents policies
CREATE POLICY "Users can view case documents" ON documents
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage case documents" ON documents
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- People policies
CREATE POLICY "Users can view case people" ON people
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage case people" ON people
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Properties policies
CREATE POLICY "Users can view case properties" ON properties
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage case properties" ON properties
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Graph edges policies
CREATE POLICY "Users can view case edges" ON graph_edges
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage case edges" ON graph_edges
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Drafts policies
CREATE POLICY "Users can view case drafts" ON drafts
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage case drafts" ON drafts
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Service role bypass for worker
-- Note: Service role automatically bypasses RLS

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_people_updated_at
    BEFORE UPDATE ON people
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Storage Buckets (run separately in Supabase dashboard or via API)
-- ============================================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documents', 'documents', false);



-- ============================================================================
-- Migration: 00002_add_entity_extraction_job_type.sql
-- ============================================================================

-- Add entity_extraction to the job_type check constraint
-- This migration adds support for the entity extraction job type

-- First, drop the existing constraint
ALTER TABLE processing_jobs DROP CONSTRAINT IF EXISTS processing_jobs_job_type_check;

-- Add the new constraint with entity_extraction included
ALTER TABLE processing_jobs ADD CONSTRAINT processing_jobs_job_type_check
  CHECK (job_type IN ('ocr', 'extraction', 'consensus', 'entity_resolution', 'entity_extraction', 'draft'));

-- Add index for entity extraction jobs for faster queries
CREATE INDEX IF NOT EXISTS idx_processing_jobs_entity_extraction
  ON processing_jobs(document_id, job_type)
  WHERE job_type = 'entity_extraction';



-- ============================================================================
-- Migration: 00003_add_merge_suggestions.sql
-- ============================================================================

-- ============================================================================
-- Migration: Add merge_suggestions table
-- Description: Stores suggestions for merging duplicate person records
--              during entity resolution. Allows users to review and approve
--              potential duplicates that couldn't be auto-merged.
-- ============================================================================

-- ============================================================================
-- Merge Suggestions Table
-- ============================================================================
CREATE TABLE merge_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,

    -- The two person records that might be duplicates
    person_a_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    person_b_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,

    -- Merge metadata
    reason TEXT NOT NULL CHECK (reason IN (
        'same_cpf',              -- CPF match (high confidence)
        'similar_name',          -- Name similarity above threshold
        'same_rg',               -- RG match
        'name_and_birth_date',   -- Name + birth date match
        'name_and_address'       -- Name + address match
    )),
    confidence FLOAT NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
    similarity_score FLOAT NOT NULL DEFAULT 0 CHECK (similarity_score >= 0 AND similarity_score <= 1),

    -- Status tracking
    status TEXT NOT NULL CHECK (status IN (
        'pending',      -- Awaiting user review
        'accepted',     -- User accepted the merge
        'rejected',     -- User rejected the merge
        'auto_merged'   -- System auto-merged (high confidence)
    )) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,

    -- Additional context (stored as JSONB arrays for flexibility)
    matching_fields JSONB DEFAULT '[]',      -- Which fields matched (e.g., ['full_name', 'birth_date'])
    conflicting_fields JSONB DEFAULT '[]',   -- Which fields have different values
    notes TEXT,                              -- Optional notes about the suggestion

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure we don't create duplicate suggestions for the same pair
    -- Order doesn't matter, so we need to handle both (A,B) and (B,A)
    CONSTRAINT unique_merge_pair UNIQUE (case_id, person_a_id, person_b_id),

    -- Ensure person_a_id < person_b_id to prevent duplicate pairs in different order
    CONSTRAINT ordered_person_ids CHECK (person_a_id < person_b_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Index for querying suggestions by case
CREATE INDEX idx_merge_suggestions_case_id ON merge_suggestions(case_id);

-- Index for querying pending suggestions (most common query)
CREATE INDEX idx_merge_suggestions_pending ON merge_suggestions(case_id, status)
    WHERE status = 'pending';

-- Index for querying by person (to find all suggestions involving a specific person)
CREATE INDEX idx_merge_suggestions_person_a ON merge_suggestions(person_a_id);
CREATE INDEX idx_merge_suggestions_person_b ON merge_suggestions(person_b_id);

-- Composite index for status filtering
CREATE INDEX idx_merge_suggestions_status ON merge_suggestions(status);

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Enable RLS on merge_suggestions table
ALTER TABLE merge_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view merge suggestions for cases in their organization
CREATE POLICY "Users can view case merge suggestions" ON merge_suggestions
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Users can manage (insert, update, delete) merge suggestions for cases in their organization
CREATE POLICY "Users can manage case merge suggestions" ON merge_suggestions
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- Triggers
-- ============================================================================

-- Trigger to update updated_at timestamp on modifications
CREATE TRIGGER update_merge_suggestions_updated_at
    BEFORE UPDATE ON merge_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE merge_suggestions IS 'Stores suggestions for merging duplicate person records during entity resolution';
COMMENT ON COLUMN merge_suggestions.person_a_id IS 'First person in the potential duplicate pair (always the smaller UUID)';
COMMENT ON COLUMN merge_suggestions.person_b_id IS 'Second person in the potential duplicate pair (always the larger UUID)';
COMMENT ON COLUMN merge_suggestions.reason IS 'The primary reason this merge was suggested';
COMMENT ON COLUMN merge_suggestions.confidence IS 'Overall confidence that these are the same person (0-1)';
COMMENT ON COLUMN merge_suggestions.similarity_score IS 'Name/data similarity score used in matching (0-1)';
COMMENT ON COLUMN merge_suggestions.matching_fields IS 'JSON array of field names that matched between the two persons';
COMMENT ON COLUMN merge_suggestions.conflicting_fields IS 'JSON array of field names with different values between the two persons';



-- ============================================================================
-- Migration: 00004_add_geocoding_fields.sql
-- ============================================================================

-- ============================================================================
-- Add Address Geocoding/Validation Fields
-- Migration: 00004_add_geocoding_fields
-- ============================================================================

-- Add geocoding fields to properties table
-- These fields will be stored in the address JSONB column
COMMENT ON COLUMN properties.address IS 'JSONB address object with fields: street, number, complement, neighborhood, city, state, zip, latitude, longitude, formatted_address, geocoded_at, geocode_confidence, geocode_status';

-- Add geocoding fields to people table
-- These fields will be stored in the address JSONB column
COMMENT ON COLUMN people.address IS 'JSONB address object with fields: street, number, complement, neighborhood, city, state, zip, latitude, longitude, formatted_address, geocoded_at, geocode_confidence, geocode_status';

-- Create index for geocoded properties for efficient querying
CREATE INDEX IF NOT EXISTS idx_properties_geocoded
ON properties ((address->>'latitude'), (address->>'longitude'))
WHERE address->>'latitude' IS NOT NULL AND address->>'longitude' IS NOT NULL;

-- Create index for geocoded people addresses for efficient querying
CREATE INDEX IF NOT EXISTS idx_people_geocoded
ON people ((address->>'latitude'), (address->>'longitude'))
WHERE address->>'latitude' IS NOT NULL AND address->>'longitude' IS NOT NULL;

-- Add validation status index for quick filtering
CREATE INDEX IF NOT EXISTS idx_properties_geocode_status
ON properties ((address->>'geocode_status'))
WHERE address->>'geocode_status' IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_people_geocode_status
ON people ((address->>'geocode_status'))
WHERE address->>'geocode_status' IS NOT NULL;



-- ============================================================================
-- Migration: 00005_add_retry_tracking.sql
-- ============================================================================

-- ============================================================================
-- Add retry tracking fields to processing_jobs table
-- ============================================================================

-- Add last_retry_at field to track when the last retry was scheduled
ALTER TABLE processing_jobs
ADD COLUMN last_retry_at TIMESTAMPTZ;

-- Add retry_delay_ms field to track the current retry delay (for exponential backoff)
ALTER TABLE processing_jobs
ADD COLUMN retry_delay_ms INTEGER DEFAULT 0;

-- Create index for efficient querying of jobs that need to be retried
CREATE INDEX idx_processing_jobs_status_retry ON processing_jobs(status, last_retry_at)
WHERE status = 'pending';

-- Add comment to document the retry mechanism
COMMENT ON COLUMN processing_jobs.last_retry_at IS 'Timestamp when the job was last scheduled for retry';
COMMENT ON COLUMN processing_jobs.retry_delay_ms IS 'Current retry delay in milliseconds for exponential backoff';



-- ============================================================================
-- Migration: 00006_production_security.sql
-- ============================================================================

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


