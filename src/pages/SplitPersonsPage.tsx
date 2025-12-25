/**
 * SplitPersonsPage
 *
 * Page for reviewing and splitting merged person records.
 * Identifies persons that were previously merged and allows users to:
 * - Review the merged data and original data
 * - Split the merged person back into two separate records
 * - Restore evidence and relationship links
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SplitPersonCard from '@/components/entities/SplitPersonCard'
import { supabase } from '@/lib/supabase'
import type { Person, SplitCandidate, MergeMetadata } from '@/types'
import { cn } from '@/lib/utils'

export default function SplitPersonsPage() {
  const { caseId } = useParams()
  const [candidates, setCandidates] = useState<SplitCandidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load merged persons that can be split
  const loadCandidates = useCallback(async () => {
    if (!caseId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch all people for this case
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .eq('case_id', caseId)
        .order('updated_at', { ascending: false })

      if (peopleError) {
        throw new Error(`Failed to fetch persons: ${peopleError.message}`)
      }

      if (!peopleData || peopleData.length === 0) {
        setCandidates([])
        return
      }

      // Filter persons that have merge metadata
      const mergedPersons: SplitCandidate[] = []

      for (const person of peopleData as Person[]) {
        const metadata = person.metadata as MergeMetadata

        // Check if this person has merge history
        if (
          metadata?.merged_from &&
          Array.isArray(metadata.merged_from) &&
          metadata.merged_from.length >= 2
        ) {
          // Try to reconstruct original data
          const originalA = metadata.original_data_a as Partial<Person> | undefined
          const originalB = metadata.original_data_b as Partial<Person> | undefined

          // Determine if we have enough data to split
          const canSplit = !!(originalA && originalB)

          // Calculate split confidence based on data availability
          let splitConfidence = 0
          if (canSplit) {
            // Count how many fields we have for each original person
            const fieldsA = Object.keys(originalA || {}).filter(k => originalA?.[k as keyof Person] != null).length
            const fieldsB = Object.keys(originalB || {}).filter(k => originalB?.[k as keyof Person] != null).length
            const avgFields = (fieldsA + fieldsB) / 2
            // Confidence based on how much original data we retained (max ~12 fields)
            splitConfidence = Math.min(avgFields / 8, 1)
          }

          mergedPersons.push({
            id: person.id,
            merged_person: person,
            merge_metadata: metadata,
            original_person_a: originalA,
            original_person_b: originalB,
            merged_at: metadata.merged_at || person.updated_at,
            can_split: canSplit,
            split_confidence: splitConfidence,
          })
        }
      }

      setCandidates(mergedPersons)
    } catch (err) {
      console.error('Error loading split candidates:', err)
      setError(err instanceof Error ? err.message : 'Failed to load split candidates')
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  // Split a merged person back into two separate records
  const handleSplit = async (candidateId: string) => {
    setIsProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Find the candidate
      const candidate = candidates.find(c => c.id === candidateId)
      if (!candidate) {
        throw new Error('Split candidate not found')
      }

      if (!candidate.can_split || !candidate.original_person_a || !candidate.original_person_b) {
        throw new Error('Cannot split: original data not available')
      }

      const { merged_person, original_person_a, original_person_b, merge_metadata } = candidate

      // Create the two new person records
      const personAData = {
        case_id: merged_person.case_id,
        full_name: original_person_a.full_name || merged_person.full_name,
        cpf: original_person_a.cpf || null,
        rg: original_person_a.rg || null,
        rg_issuer: original_person_a.rg_issuer || null,
        birth_date: original_person_a.birth_date || null,
        nationality: original_person_a.nationality || null,
        marital_status: original_person_a.marital_status || null,
        profession: original_person_a.profession || null,
        email: original_person_a.email || null,
        phone: original_person_a.phone || null,
        father_name: original_person_a.father_name || null,
        mother_name: original_person_a.mother_name || null,
        address: original_person_a.address || null,
        source_docs: Array.isArray(original_person_a.source_docs)
          ? original_person_a.source_docs
          : merged_person.source_docs.slice(0, Math.ceil(merged_person.source_docs.length / 2)),
        confidence: original_person_a.confidence || merged_person.confidence * 0.8,
        metadata: {
          split_from: merged_person.id,
          split_at: new Date().toISOString(),
          was_person_a: true,
        },
      }

      const personBData = {
        case_id: merged_person.case_id,
        full_name: original_person_b.full_name || merged_person.full_name,
        cpf: original_person_b.cpf || null,
        rg: original_person_b.rg || null,
        rg_issuer: original_person_b.rg_issuer || null,
        birth_date: original_person_b.birth_date || null,
        nationality: original_person_b.nationality || null,
        marital_status: original_person_b.marital_status || null,
        profession: original_person_b.profession || null,
        email: original_person_b.email || null,
        phone: original_person_b.phone || null,
        father_name: original_person_b.father_name || null,
        mother_name: original_person_b.mother_name || null,
        address: original_person_b.address || null,
        source_docs: Array.isArray(original_person_b.source_docs)
          ? original_person_b.source_docs
          : merged_person.source_docs.slice(Math.ceil(merged_person.source_docs.length / 2)),
        confidence: original_person_b.confidence || merged_person.confidence * 0.8,
        metadata: {
          split_from: merged_person.id,
          split_at: new Date().toISOString(),
          was_person_b: true,
        },
      }

      // Insert new person A
      const { data: newPersonA, error: insertAError } = await supabase
        .from('people')
        .insert(personAData)
        .select()
        .single()

      if (insertAError || !newPersonA) {
        throw new Error(`Failed to create person A: ${insertAError?.message}`)
      }

      // Insert new person B
      const { data: newPersonB, error: insertBError } = await supabase
        .from('people')
        .insert(personBData)
        .select()
        .single()

      if (insertBError || !newPersonB) {
        throw new Error(`Failed to create person B: ${insertBError?.message}`)
      }

      // Get evidence records for the merged person
      const { data: evidenceData, error: evidenceQueryError } = await supabase
        .from('evidence')
        .select('*')
        .eq('entity_id', merged_person.id)
        .eq('entity_type', 'person')

      if (evidenceQueryError) {
        console.warn('Failed to fetch evidence records:', evidenceQueryError.message)
      }

      // Redistribute evidence between the two new persons
      // Simple heuristic: first half to A, second half to B
      if (evidenceData && evidenceData.length > 0) {
        const midpoint = Math.ceil(evidenceData.length / 2)
        const evidenceForA = evidenceData.slice(0, midpoint)
        const evidenceForB = evidenceData.slice(midpoint)

        // Update evidence for person A
        if (evidenceForA.length > 0) {
          const { error: updateEvidenceAError } = await supabase
            .from('evidence')
            .update({ entity_id: newPersonA.id })
            .in('id', evidenceForA.map(e => e.id))

          if (updateEvidenceAError) {
            console.warn('Failed to update evidence for person A:', updateEvidenceAError.message)
          }
        }

        // Update evidence for person B
        if (evidenceForB.length > 0) {
          const { error: updateEvidenceBError } = await supabase
            .from('evidence')
            .update({ entity_id: newPersonB.id })
            .in('id', evidenceForB.map(e => e.id))

          if (updateEvidenceBError) {
            console.warn('Failed to update evidence for person B:', updateEvidenceBError.message)
          }
        }
      }

      // Update graph edges
      // Get edges where merged person is source
      const { data: sourceEdges, error: sourceEdgesError } = await supabase
        .from('graph_edges')
        .select('*')
        .eq('source_id', merged_person.id)
        .eq('source_type', 'person')

      if (sourceEdgesError) {
        console.warn('Failed to fetch source edges:', sourceEdgesError.message)
      }

      // Get edges where merged person is target
      const { data: targetEdges, error: targetEdgesError } = await supabase
        .from('graph_edges')
        .select('*')
        .eq('target_id', merged_person.id)
        .eq('target_type', 'person')

      if (targetEdgesError) {
        console.warn('Failed to fetch target edges:', targetEdgesError.message)
      }

      // Redistribute edges (split evenly or by heuristic)
      if (sourceEdges && sourceEdges.length > 0) {
        const midpoint = Math.ceil(sourceEdges.length / 2)
        const edgesForA = sourceEdges.slice(0, midpoint)
        const edgesForB = sourceEdges.slice(midpoint)

        if (edgesForA.length > 0) {
          await supabase
            .from('graph_edges')
            .update({ source_id: newPersonA.id })
            .in('id', edgesForA.map(e => e.id))
        }

        if (edgesForB.length > 0) {
          await supabase
            .from('graph_edges')
            .update({ source_id: newPersonB.id })
            .in('id', edgesForB.map(e => e.id))
        }
      }

      if (targetEdges && targetEdges.length > 0) {
        const midpoint = Math.ceil(targetEdges.length / 2)
        const edgesForA = targetEdges.slice(0, midpoint)
        const edgesForB = targetEdges.slice(midpoint)

        if (edgesForA.length > 0) {
          await supabase
            .from('graph_edges')
            .update({ target_id: newPersonA.id })
            .in('id', edgesForA.map(e => e.id))
        }

        if (edgesForB.length > 0) {
          await supabase
            .from('graph_edges')
            .update({ target_id: newPersonB.id })
            .in('id', edgesForB.map(e => e.id))
        }
      }

      // Delete the merged person
      const { error: deleteError } = await supabase
        .from('people')
        .delete()
        .eq('id', merged_person.id)

      if (deleteError) {
        throw new Error(`Failed to delete merged person: ${deleteError.message}`)
      }

      setSuccessMessage('Pessoa separada com sucesso!')

      // Reload candidates
      await loadCandidates()
    } catch (err) {
      console.error('Error splitting person:', err)
      setError(err instanceof Error ? err.message : 'Failed to split person')
    } finally {
      setIsProcessing(false)
    }
  }

  // Cancel split (just remove from view)
  const handleCancel = (candidateId: string) => {
    setCandidates(prev => prev.filter(c => c.id !== candidateId))
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowsPointingOutIcon className="w-7 h-7 text-orange-500" />
            Separar Pessoas Mescladas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Revise e separe registros de pessoas que foram mesclados incorretamente.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => loadCandidates()}
          disabled={isLoading}
          className="gap-2"
        >
          <ArrowPathIcon className={cn("w-5 h-5", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between text-green-800 dark:text-green-200">
              {successMessage}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuccessMessage(null)}
                className="ml-2 h-6 px-2"
              >
                Fechar
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-2 h-6 px-2"
              >
                Fechar
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ArrowPathIcon className="w-10 h-10 text-gray-400 animate-spin mx-auto" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando registros mesclados...</p>
          </div>
        </div>
      ) : candidates.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Nenhuma Pessoa Mesclada Encontrada
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Não há registros de pessoas mescladas para este caso, ou não há dados suficientes para separação.
            </p>
            <Button asChild className="mt-4">
              <Link to={`/case/${caseId}/entities`}>
                Voltar para Entidades
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Statistics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <UserGroupIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {candidates.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Pessoas Mescladas
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {candidates.filter(c => c.can_split).length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Podem ser Separadas
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ArrowsPointingOutIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round((candidates.reduce((sum, c) => sum + c.split_confidence, 0) / candidates.length) * 100)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Confiança Média
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Candidates List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {candidates.map((candidate) => (
                <SplitPersonCard
                  key={candidate.id}
                  candidate={candidate}
                  onSplit={handleSplit}
                  onCancel={handleCancel}
                  isProcessing={isProcessing}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
