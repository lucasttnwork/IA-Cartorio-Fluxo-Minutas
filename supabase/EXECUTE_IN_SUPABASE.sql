-- ============================================================================
-- MINUTA CANVAS - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Execute this ENTIRE file in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/sql/new
-- ============================================================================
-- This file contains ALL database structure for the Minuta Canvas project:
-- - 14 Tables (organizations, users, cases, documents, people, properties, etc.)
-- - All indexes for performance
-- - All RLS policies for security
-- - All triggers and functions
-- - Storage bucket configuration
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: Organizations
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE organizations IS 'Multi-tenant organization container for all data';

-- ============================================================================
-- TABLE: Users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('clerk', 'supervisor', 'admin')) DEFAULT 'clerk',
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User profiles linked to Supabase Auth';

-- ============================================================================
-- TABLE: Cases
-- ============================================================================
CREATE TABLE IF NOT EXISTS cases (
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

COMMENT ON TABLE cases IS 'Notary cases with documents and extracted data';

-- ============================================================================
-- TABLE: Documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS documents (
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

COMMENT ON TABLE documents IS 'Uploaded document files and metadata';

-- ============================================================================
-- TABLE: Extractions
-- ============================================================================
CREATE TABLE IF NOT EXISTS extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    ocr_result JSONB,
    llm_result JSONB,
    consensus JSONB,
    pending_fields TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE extractions IS 'OCR and LLM extraction results';

-- ============================================================================
-- TABLE: People
-- ============================================================================
CREATE TABLE IF NOT EXISTS people (
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

COMMENT ON TABLE people IS 'Extracted person entities from documents';
COMMENT ON COLUMN people.address IS 'JSONB address object with fields: street, number, complement, neighborhood, city, state, zip, latitude, longitude, formatted_address, geocoded_at, geocode_confidence, geocode_status';

-- ============================================================================
-- TABLE: Properties
-- ============================================================================
CREATE TABLE IF NOT EXISTS properties (
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

COMMENT ON TABLE properties IS 'Extracted property entities from documents';
COMMENT ON COLUMN properties.address IS 'JSONB address object with fields: street, number, complement, neighborhood, city, state, zip, latitude, longitude, formatted_address, geocoded_at, geocode_confidence, geocode_status';

-- ============================================================================
-- TABLE: Evidence
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence (
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

COMMENT ON TABLE evidence IS 'Links between entities and source documents';

-- ============================================================================
-- TABLE: Graph Edges (Relationships)
-- ============================================================================
CREATE TABLE IF NOT EXISTS graph_edges (
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
-- TABLE: Drafts
-- ============================================================================
CREATE TABLE IF NOT EXISTS drafts (
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
-- TABLE: Chat Sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: Chat Messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    operation JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: Operations Log (Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS operations_log (
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
-- TABLE: Processing Jobs
-- ============================================================================
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN ('ocr', 'extraction', 'consensus', 'entity_resolution', 'entity_extraction', 'draft')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_retry_at TIMESTAMPTZ,
    retry_delay_ms INTEGER DEFAULT 0
);

COMMENT ON TABLE processing_jobs IS 'Background job queue for document processing';
COMMENT ON COLUMN processing_jobs.last_retry_at IS 'Timestamp when the job was last scheduled for retry';
COMMENT ON COLUMN processing_jobs.retry_delay_ms IS 'Current retry delay in milliseconds for exponential backoff';

-- ============================================================================
-- TABLE: Merge Suggestions
-- ============================================================================
CREATE TABLE IF NOT EXISTS merge_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    person_a_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    person_b_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN (
        'same_cpf',
        'similar_name',
        'same_rg',
        'name_and_birth_date',
        'name_and_address'
    )),
    confidence FLOAT NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
    similarity_score FLOAT NOT NULL DEFAULT 0 CHECK (similarity_score >= 0 AND similarity_score <= 1),
    status TEXT NOT NULL CHECK (status IN (
        'pending',
        'accepted',
        'rejected',
        'auto_merged'
    )) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    matching_fields JSONB DEFAULT '[]',
    conflicting_fields JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_merge_pair UNIQUE (case_id, person_a_id, person_b_id),
    CONSTRAINT ordered_person_ids CHECK (person_a_id < person_b_id)
);

COMMENT ON TABLE merge_suggestions IS 'Stores suggestions for merging duplicate person records during entity resolution';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_case_status ON documents(case_id, status);

-- People indexes
CREATE INDEX IF NOT EXISTS idx_people_case_id ON people(case_id);
CREATE INDEX IF NOT EXISTS idx_people_cpf ON people(cpf);
CREATE INDEX IF NOT EXISTS idx_people_geocoded ON people ((address->>'latitude'), (address->>'longitude'))
    WHERE address->>'latitude' IS NOT NULL AND address->>'longitude' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_geocode_status ON people ((address->>'geocode_status'))
    WHERE address->>'geocode_status' IS NOT NULL;

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_case_id ON properties(case_id);
CREATE INDEX IF NOT EXISTS idx_properties_registry ON properties(registry_number);
CREATE INDEX IF NOT EXISTS idx_properties_geocoded ON properties ((address->>'latitude'), (address->>'longitude'))
    WHERE address->>'latitude' IS NOT NULL AND address->>'longitude' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_geocode_status ON properties ((address->>'geocode_status'))
    WHERE address->>'geocode_status' IS NOT NULL;

-- Graph edges indexes
CREATE INDEX IF NOT EXISTS idx_graph_edges_case_id ON graph_edges(case_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target_type, target_id);

-- Evidence indexes
CREATE INDEX IF NOT EXISTS idx_evidence_entity ON evidence(entity_type, entity_id);

-- Processing jobs indexes
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_case_status ON processing_jobs(case_id, status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_entity_extraction ON processing_jobs(document_id, job_type)
    WHERE job_type = 'entity_extraction';
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status_retry ON processing_jobs(status, last_retry_at)
    WHERE status = 'pending';

-- Operations log indexes
CREATE INDEX IF NOT EXISTS idx_operations_log_case_id ON operations_log(case_id);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Cases indexes
CREATE INDEX IF NOT EXISTS idx_cases_organization_id ON cases(organization_id);

-- Extractions indexes
CREATE INDEX IF NOT EXISTS idx_extractions_document_id ON extractions(document_id);

-- Merge suggestions indexes
CREATE INDEX IF NOT EXISTS idx_merge_suggestions_case_id ON merge_suggestions(case_id);
CREATE INDEX IF NOT EXISTS idx_merge_suggestions_pending ON merge_suggestions(case_id, status)
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_merge_suggestions_person_a ON merge_suggestions(person_a_id);
CREATE INDEX IF NOT EXISTS idx_merge_suggestions_person_b ON merge_suggestions(person_b_id);
CREATE INDEX IF NOT EXISTS idx_merge_suggestions_status ON merge_suggestions(status);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_people_updated_at ON people;
CREATE TRIGGER update_people_updated_at
    BEFORE UPDATE ON people
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_merge_suggestions_updated_at ON merge_suggestions;
CREATE TRIGGER update_merge_suggestions_updated_at
    BEFORE UPDATE ON merge_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Audit triggers
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
-- ROW LEVEL SECURITY - Enable on all tables
-- ============================================================================

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
ALTER TABLE merge_suggestions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Organizations
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can update organization" ON organizations;
CREATE POLICY "Admins can update organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES - Users
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can view organization members" ON users;
CREATE POLICY "Users can view organization members" ON users
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can manage org users" ON users;
CREATE POLICY "Admins can manage org users" ON users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users
            WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    );

DROP POLICY IF EXISTS "Users can insert their own record" ON users;
CREATE POLICY "Users can insert their own record" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================================
-- RLS POLICIES - Cases
-- ============================================================================

DROP POLICY IF EXISTS "Users can view org cases" ON cases;
CREATE POLICY "Users can view org cases" ON cases
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can create org cases" ON cases;
CREATE POLICY "Users can create org cases" ON cases
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update org cases" ON cases;
CREATE POLICY "Users can update org cases" ON cases
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Supervisors can assign cases" ON cases;
CREATE POLICY "Supervisors can assign cases" ON cases
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
-- RLS POLICIES - Documents
-- ============================================================================

DROP POLICY IF EXISTS "Users can view case documents" ON documents;
CREATE POLICY "Users can view case documents" ON documents
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage case documents" ON documents;
CREATE POLICY "Users can manage case documents" ON documents
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- RLS POLICIES - People
-- ============================================================================

DROP POLICY IF EXISTS "Users can view case people" ON people;
CREATE POLICY "Users can view case people" ON people
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage case people" ON people;
CREATE POLICY "Users can manage case people" ON people
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- RLS POLICIES - Properties
-- ============================================================================

DROP POLICY IF EXISTS "Users can view case properties" ON properties;
CREATE POLICY "Users can view case properties" ON properties
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage case properties" ON properties;
CREATE POLICY "Users can manage case properties" ON properties
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- RLS POLICIES - Graph Edges
-- ============================================================================

DROP POLICY IF EXISTS "Users can view case edges" ON graph_edges;
CREATE POLICY "Users can view case edges" ON graph_edges
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage case edges" ON graph_edges;
CREATE POLICY "Users can manage case edges" ON graph_edges
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- RLS POLICIES - Drafts
-- ============================================================================

DROP POLICY IF EXISTS "Users can view case drafts" ON drafts;
CREATE POLICY "Users can view case drafts" ON drafts
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage case drafts" ON drafts;
CREATE POLICY "Users can manage case drafts" ON drafts
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- RLS POLICIES - Extractions
-- ============================================================================

DROP POLICY IF EXISTS "Users can view extractions" ON extractions;
CREATE POLICY "Users can view extractions" ON extractions
    FOR SELECT USING (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN cases c ON d.case_id = c.id
            WHERE c.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage extractions" ON extractions;
CREATE POLICY "Users can manage extractions" ON extractions
    FOR ALL USING (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN cases c ON d.case_id = c.id
            WHERE c.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- RLS POLICIES - Evidence
-- ============================================================================

DROP POLICY IF EXISTS "Users can view evidence" ON evidence;
CREATE POLICY "Users can view evidence" ON evidence
    FOR SELECT USING (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN cases c ON d.case_id = c.id
            WHERE c.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage evidence" ON evidence;
CREATE POLICY "Users can manage evidence" ON evidence
    FOR ALL USING (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN cases c ON d.case_id = c.id
            WHERE c.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- RLS POLICIES - Chat Sessions
-- ============================================================================

DROP POLICY IF EXISTS "Users can view chat sessions" ON chat_sessions;
CREATE POLICY "Users can view chat sessions" ON chat_sessions
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage chat sessions" ON chat_sessions;
CREATE POLICY "Users can manage chat sessions" ON chat_sessions
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- RLS POLICIES - Chat Messages
-- ============================================================================

DROP POLICY IF EXISTS "Users can view chat messages" ON chat_messages;
CREATE POLICY "Users can view chat messages" ON chat_messages
    FOR SELECT USING (
        session_id IN (
            SELECT cs.id FROM chat_sessions cs
            JOIN cases c ON cs.case_id = c.id
            WHERE c.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage chat messages" ON chat_messages;
CREATE POLICY "Users can manage chat messages" ON chat_messages
    FOR ALL USING (
        session_id IN (
            SELECT cs.id FROM chat_sessions cs
            JOIN cases c ON cs.case_id = c.id
            WHERE c.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- RLS POLICIES - Operations Log
-- ============================================================================

DROP POLICY IF EXISTS "Users can view operations log" ON operations_log;
CREATE POLICY "Users can view operations log" ON operations_log
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can create operations log" ON operations_log;
CREATE POLICY "Users can create operations log" ON operations_log
    FOR INSERT WITH CHECK (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- RLS POLICIES - Processing Jobs
-- ============================================================================

DROP POLICY IF EXISTS "Users can view processing jobs" ON processing_jobs;
CREATE POLICY "Users can view processing jobs" ON processing_jobs
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can create processing jobs" ON processing_jobs;
CREATE POLICY "Users can create processing jobs" ON processing_jobs
    FOR INSERT WITH CHECK (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- RLS POLICIES - Merge Suggestions
-- ============================================================================

DROP POLICY IF EXISTS "Users can view case merge suggestions" ON merge_suggestions;
CREATE POLICY "Users can view case merge suggestions" ON merge_suggestions
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage case merge suggestions" ON merge_suggestions;
CREATE POLICY "Users can manage case merge suggestions" ON merge_suggestions
    FOR ALL USING (
        case_id IN (
            SELECT id FROM cases WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

-- Create documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    52428800,
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
-- STORAGE RLS POLICIES
-- ============================================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;

-- Users can upload documents to their organization's cases
CREATE POLICY "Users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND
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
-- GRANT PERMISSIONS FOR SERVICE ROLE
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

SELECT
    'Database setup completed!' as status,
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables;
