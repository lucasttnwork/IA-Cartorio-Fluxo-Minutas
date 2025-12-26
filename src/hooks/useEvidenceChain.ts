import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Evidence, Document, Extraction } from '../types'
import type { EvidenceChain, EvidenceChainNode, EvidenceChainLink } from '../types/evidence'

/**
 * Hook to fetch and construct the evidence chain for a specific entity field
 */
export function useEvidenceChain(
  entityType: 'person' | 'property',
  entityId: string,
  fieldName: string
) {
  const [chain, setChain] = useState<EvidenceChain | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!entityId || !fieldName) {
      setChain(null)
      return
    }

    async function fetchEvidenceChain() {
      setIsLoading(true)
      setError(null)

      try {
        // 1. Fetch evidence records for this field
        const { data: evidenceRecords, error: evidenceError } = await supabase
          .from('evidence')
          .select('*')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .eq('field_name', fieldName)
          .order('created_at', { ascending: true })

        if (evidenceError) throw evidenceError

        if (!evidenceRecords || evidenceRecords.length === 0) {
          setChain(null)
          setIsLoading(false)
          return
        }

        // 2. Get all unique document IDs
        const documentIds = [...new Set(evidenceRecords.map((e: Evidence) => e.document_id))]

        // 3. Fetch documents
        const { data: documents, error: docError } = await supabase
          .from('documents')
          .select('*')
          .in('id', documentIds)

        if (docError) throw docError

        // 4. Fetch extractions for these documents
        const { data: extractions, error: extractionError } = await supabase
          .from('extractions')
          .select('*')
          .in('document_id', documentIds)

        if (extractionError) throw extractionError

        // 5. Build the chain
        const nodes: EvidenceChainNode[] = []
        const links: EvidenceChainLink[] = []
        let hasConflicts = false
        let isPending = false

        // Create document map for quick lookup
        const docMap = new Map((documents as Document[])?.map(d => [d.id, d]) || [])
        const extractionMap = new Map((extractions as Extraction[])?.map(e => [e.document_id, e]) || [])

        evidenceRecords.forEach((evidence: Evidence, index: number) => {
          const doc = docMap.get(evidence.document_id)
          const extraction = extractionMap.get(evidence.document_id)

          // Document node
          const docNodeId = `doc-${evidence.document_id}`
          if (!nodes.find(n => n.id === docNodeId)) {
            nodes.push({
              id: docNodeId,
              type: 'document',
              label: doc?.original_name || 'Documento',
              value: null,
              confidence: 1,
              timestamp: doc?.created_at || evidence.created_at,
              documentId: evidence.document_id,
              pageNumber: evidence.page_number,
              metadata: {
                docType: doc?.doc_type,
                mimeType: doc?.mime_type,
              },
            })
          }

          // Extraction node (OCR or LLM based on source)
          if (extraction) {
            if (evidence.source === 'ocr' && extraction.ocr_result) {
              const ocrNodeId = `ocr-${evidence.document_id}`
              if (!nodes.find(n => n.id === ocrNodeId)) {
                nodes.push({
                  id: ocrNodeId,
                  type: 'ocr',
                  label: 'OCR Extraction',
                  value: evidence.extracted_text,
                  confidence: extraction.ocr_result.confidence || 0,
                  timestamp: extraction.created_at,
                  documentId: evidence.document_id,
                  pageNumber: evidence.page_number,
                  boundingBox: evidence.bounding_box || undefined,
                })

                // Link document to OCR
                links.push({
                  source: docNodeId,
                  target: ocrNodeId,
                  type: 'extraction',
                  label: 'OCR',
                })
              }
            }

            if (evidence.source === 'llm' && extraction.llm_result) {
              const llmNodeId = `llm-${evidence.document_id}`
              if (!nodes.find(n => n.id === llmNodeId)) {
                nodes.push({
                  id: llmNodeId,
                  type: 'llm',
                  label: 'LLM Extraction',
                  value: evidence.extracted_text,
                  confidence: extraction.llm_result.confidence || 0,
                  timestamp: extraction.created_at,
                  documentId: evidence.document_id,
                  pageNumber: evidence.page_number,
                })

                // Link document to LLM
                links.push({
                  source: docNodeId,
                  target: llmNodeId,
                  type: 'extraction',
                  label: 'LLM',
                })
              }
            }

            // Consensus node if available
            if (evidence.source === 'consensus' && extraction.consensus) {
              const consensusNodeId = `consensus-${evidence.document_id}-${index}`
              const consensusField = extraction.consensus.fields[fieldName]

              if (consensusField) {
                nodes.push({
                  id: consensusNodeId,
                  type: 'consensus',
                  label: 'Consensus',
                  value: String(consensusField.value || ''),
                  confidence: consensusField.confidence === 'high' ? 0.9 : consensusField.confidence === 'medium' ? 0.7 : 0.5,
                  timestamp: extraction.created_at,
                  metadata: {
                    isPending: consensusField.is_pending,
                    source: consensusField.source,
                  },
                })

                if (consensusField.is_pending) {
                  isPending = true
                }

                // Check for conflicts
                if (consensusField.ocr_value !== consensusField.llm_value) {
                  hasConflicts = true
                }

                // Link OCR/LLM to consensus
                const ocrNodeId = `ocr-${evidence.document_id}`
                const llmNodeId = `llm-${evidence.document_id}`

                if (nodes.find(n => n.id === ocrNodeId)) {
                  links.push({
                    source: ocrNodeId,
                    target: consensusNodeId,
                    type: 'consensus',
                  })
                }

                if (nodes.find(n => n.id === llmNodeId)) {
                  links.push({
                    source: llmNodeId,
                    target: consensusNodeId,
                    type: 'consensus',
                  })
                }
              }
            }
          }
        })

        // Entity node (final resolved value)
        const finalEvidence = evidenceRecords[evidenceRecords.length - 1] as Evidence
        const entityNodeId = `entity-${entityId}`
        nodes.push({
          id: entityNodeId,
          type: 'entity',
          label: `${entityType === 'person' ? 'Pessoa' : 'Propriedade'} - ${fieldName}`,
          value: finalEvidence.extracted_text,
          confidence: finalEvidence.confidence,
          timestamp: finalEvidence.created_at,
          metadata: {
            entityType,
            entityId,
            fieldName,
          },
        })

        // Link consensus/extraction nodes to entity
        const lastExtractionNodes = nodes.filter(n =>
          n.type === 'consensus' || n.type === 'ocr' || n.type === 'llm'
        )
        lastExtractionNodes.forEach(node => {
          if (!links.find(l => l.target === entityNodeId && l.source === node.id)) {
            links.push({
              source: node.id,
              target: entityNodeId,
              type: 'resolution',
            })
          }
        })

        const evidenceChain: EvidenceChain = {
          fieldName,
          entityType,
          entityId,
          currentValue: finalEvidence.extracted_text,
          confidence: finalEvidence.confidence,
          nodes,
          links,
          hasConflicts,
          isPending,
        }

        setChain(evidenceChain)
      } catch (err) {
        console.error('Erro ao buscar cadeia de evidências:', err)
        setError(err instanceof Error ? err.message : 'Falha ao buscar cadeia de evidências')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvidenceChain()
  }, [entityType, entityId, fieldName])

  return { chain, isLoading, error }
}
