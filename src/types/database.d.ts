import type { Organization, User, Case, Document, Extraction, Person, Property, Evidence, GraphEdge, Draft, ChatSession, ChatMessage, OperationsLog, ProcessingJob, MergeSuggestion, DocumentStatus, DocumentType, JobType, JobStatus } from './index';
export interface DocumentInsert {
    id?: string;
    case_id: string;
    storage_path: string;
    original_name: string;
    mime_type: string;
    file_size: number;
    page_count?: number | null;
    status: DocumentStatus;
    doc_type?: DocumentType | null;
    doc_type_confidence?: number | null;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
}
export interface ProcessingJobInsert {
    id?: string;
    case_id: string;
    document_id: string | null;
    job_type: JobType;
    status: JobStatus;
    attempts: number;
    max_attempts: number;
    error_message?: string | null;
    result?: Record<string, unknown> | null;
    created_at?: string;
    started_at?: string | null;
    completed_at?: string | null;
    last_retry_at?: string | null;
    retry_delay_ms?: number;
}
export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: Organization;
                Insert: Omit<Organization, 'id' | 'created_at'> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Omit<Organization, 'id' | 'created_at'>>;
                Relationships: [];
            };
            users: {
                Row: User;
                Insert: Omit<User, 'id' | 'created_at'> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Omit<User, 'id' | 'created_at'>>;
                Relationships: [];
            };
            cases: {
                Row: Case;
                Insert: Omit<Case, 'id' | 'created_at' | 'updated_at'> & {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Omit<Case, 'id' | 'created_at'>>;
                Relationships: [];
            };
            documents: {
                Row: Document;
                Insert: DocumentInsert;
                Update: Partial<DocumentInsert>;
                Relationships: [];
            };
            extractions: {
                Row: Extraction;
                Insert: Omit<Extraction, 'id' | 'created_at'> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Omit<Extraction, 'id' | 'created_at'>>;
                Relationships: [];
            };
            people: {
                Row: Person;
                Insert: Omit<Person, 'id' | 'created_at' | 'updated_at'> & {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Omit<Person, 'id' | 'created_at'>>;
                Relationships: [];
            };
            properties: {
                Row: Property;
                Insert: Omit<Property, 'id' | 'created_at' | 'updated_at'> & {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Omit<Property, 'id' | 'created_at'>>;
                Relationships: [];
            };
            evidence: {
                Row: Evidence;
                Insert: Omit<Evidence, 'id' | 'created_at'> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Omit<Evidence, 'id' | 'created_at'>>;
                Relationships: [];
            };
            graph_edges: {
                Row: GraphEdge;
                Insert: Omit<GraphEdge, 'id' | 'created_at'> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Omit<GraphEdge, 'id' | 'created_at'>>;
                Relationships: [];
            };
            drafts: {
                Row: Draft;
                Insert: Omit<Draft, 'id' | 'created_at'> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Omit<Draft, 'id' | 'created_at'>>;
                Relationships: [];
            };
            chat_sessions: {
                Row: ChatSession;
                Insert: Omit<ChatSession, 'id' | 'created_at'> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Omit<ChatSession, 'id' | 'created_at'>>;
                Relationships: [];
            };
            chat_messages: {
                Row: ChatMessage;
                Insert: Omit<ChatMessage, 'id' | 'created_at'> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>;
                Relationships: [];
            };
            operations_log: {
                Row: OperationsLog;
                Insert: Omit<OperationsLog, 'id' | 'created_at'> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Omit<OperationsLog, 'id' | 'created_at'>>;
                Relationships: [];
            };
            processing_jobs: {
                Row: ProcessingJob;
                Insert: ProcessingJobInsert;
                Update: Partial<ProcessingJobInsert>;
                Relationships: [];
            };
            merge_suggestions: {
                Row: MergeSuggestion;
                Insert: Omit<MergeSuggestion, 'id' | 'created_at' | 'updated_at'> & {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Omit<MergeSuggestion, 'id' | 'created_at'>>;
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
//# sourceMappingURL=database.d.ts.map