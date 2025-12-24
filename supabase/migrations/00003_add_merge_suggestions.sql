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
