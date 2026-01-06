/**
 * MergePersonsPage
 *
 * Page for reviewing and merging duplicate person suggestions.
 * Fetches pending merge suggestions from the database and allows users to:
 * - Accept merges (combines data and removes duplicate)
 * - Reject suggestions (marks as rejected)
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MergeSuggestionCard } from '@/components/entities'
import { supabase } from '@/lib/supabase'
import type { MergeSuggestion, Person, Address } from '@/types'
import { cn } from '@/lib/utils'

interface MergeSuggestionWithPersons extends MergeSuggestion {
  personA: Person
  personB: Person
}

export default function MergePersonsPage() {
  const { caseId } = useParams()
  const [suggestions, setSuggestions] = useState<MergeSuggestionWithPersons[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load merge suggestions with person data
  const loadSuggestions = useCallback(async () => {
    if (!caseId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch pending merge suggestions for this case
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('merge_suggestions')
        .select('*')
        .eq('case_id', caseId)
        .eq('status', 'pending')
        .order('confidence', { ascending: false })

      if (suggestionsError) {
        throw new Error(`Failed to fetch suggestions: ${suggestionsError.message}`)
      }

      if (!suggestionsData || suggestionsData.length === 0) {
        setSuggestions([])
        return
      }

      // Collect all unique person IDs
      const personIds = new Set<string>()
      for (const suggestion of suggestionsData) {
        personIds.add(suggestion.person_a_id)
        personIds.add(suggestion.person_b_id)
      }

      // Fetch all person records
      const { data: personsData, error: personsError } = await supabase
        .from('people')
        .select('*')
        .in('id', Array.from(personIds))

      if (personsError) {
        throw new Error(`Failed to fetch persons: ${personsError.message}`)
      }

      // Build lookup map
      const personsMap = new Map<string, Person>()
      for (const person of personsData as Person[]) {
        personsMap.set(person.id, person)
      }

      // Combine suggestions with person data
      const enrichedSuggestions: MergeSuggestionWithPersons[] = []
      for (const suggestion of suggestionsData as MergeSuggestion[]) {
        const personA = personsMap.get(suggestion.person_a_id)
        const personB = personsMap.get(suggestion.person_b_id)

        if (personA && personB) {
          enrichedSuggestions.push({
            ...suggestion,
            personA,
            personB,
          })
        }
      }

      setSuggestions(enrichedSuggestions)
    } catch (err) {
      console.error('Error loading suggestions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load merge suggestions')
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions])

  // Accept merge: Combine person data and delete duplicate
  const handleAcceptMerge = async (suggestionId: string, personAId: string, personBId: string) => {
    setIsProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Find the suggestion
      const suggestion = suggestions.find(s => s.id === suggestionId)
      if (!suggestion) {
        throw new Error('Suggestion not found')
      }

      const { personA, personB } = suggestion

      // Merge logic: Prefer non-null values, prioritize personB (newer) when both exist
      const mergedData: Partial<Person> = {
        full_name: personB.full_name || personA.full_name,
        cpf: personB.cpf || personA.cpf,
        rg: personB.rg || personA.rg,
        rg_issuer: personB.rg_issuer || personA.rg_issuer,
        birth_date: personB.birth_date || personA.birth_date,
        nationality: personB.nationality || personA.nationality,
        marital_status: personB.marital_status || personA.marital_status,
        profession: personB.profession || personA.profession,
        email: personB.email || personA.email,
        phone: personB.phone || personA.phone,
        father_name: personB.father_name || personA.father_name,
        mother_name: personB.mother_name || personA.mother_name,
        address: personB.address || personA.address,
        // Combine source documents
        source_docs: Array.from(new Set([...personA.source_docs, ...personB.source_docs])),
        // Average confidence
        confidence: (personA.confidence + personB.confidence) / 2,
        // Merge metadata
        metadata: {
          ...personA.metadata,
          ...personB.metadata,
          merged_from: [personA.id, personB.id],
          merged_at: new Date().toISOString(),
        },
      }

      // Update personA with merged data
      const { error: updateError } = await supabase
        .from('people')
        .update(mergedData)
        .eq('id', personAId)

      if (updateError) {
        throw new Error(`Failed to update person: ${updateError.message}`)
      }

      // Update evidence records pointing to personB to point to personA instead
      const { error: evidenceError } = await supabase
        .from('evidence')
        .update({ entity_id: personAId })
        .eq('entity_id', personBId)
        .eq('entity_type', 'person')

      if (evidenceError) {
        console.warn('Failed to update evidence records:', evidenceError.message)
      }

      // Update graph edges
      // Update edges where personB is the source
      const { error: edgeSourceError } = await supabase
        .from('graph_edges')
        .update({ source_id: personAId })
        .eq('source_id', personBId)
        .eq('source_type', 'person')

      if (edgeSourceError) {
        console.warn('Failed to update graph edges (source):', edgeSourceError.message)
      }

      // Update edges where personB is the target
      const { error: edgeTargetError } = await supabase
        .from('graph_edges')
        .update({ target_id: personAId })
        .eq('target_id', personBId)
        .eq('target_type', 'person')

      if (edgeTargetError) {
        console.warn('Failed to update graph edges (target):', edgeTargetError.message)
      }

      // Delete personB (cascade deletes will handle remaining references)
      const { error: deleteError } = await supabase
        .from('people')
        .delete()
        .eq('id', personBId)

      if (deleteError) {
        throw new Error(`Failed to delete duplicate person: ${deleteError.message}`)
      }

      // Mark suggestion as accepted
      const { error: suggestionError } = await supabase
        .from('merge_suggestions')
        .update({
          status: 'accepted',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', suggestionId)

      if (suggestionError) {
        console.warn('Failed to update suggestion status:', suggestionError.message)
      }

      setSuccessMessage('Pessoas mescladas com sucesso!')

      // Reload suggestions
      await loadSuggestions()
    } catch (err) {
      console.error('Error accepting merge:', err)
      setError(err instanceof Error ? err.message : 'Failed to merge persons')
    } finally {
      setIsProcessing(false)
    }
  }

  // Reject merge suggestion
  const handleRejectMerge = async (suggestionId: string) => {
    setIsProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Mark suggestion as rejected
      const { error } = await supabase
        .from('merge_suggestions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', suggestionId)

      if (error) {
        throw new Error(`Failed to reject suggestion: ${error.message}`)
      }

      setSuccessMessage('Sugestão de mesclagem rejeitada.')

      // Reload suggestions
      await loadSuggestions()
    } catch (err) {
      console.error('Error rejecting merge:', err)
      setError(err instanceof Error ? err.message : 'Failed to reject suggestion')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <UserGroupIcon className="w-7 h-7 text-purple-500" />
            Mesclar Pessoas Duplicadas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Revise e mescle registros de pessoas que podem ser duplicatas.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => loadSuggestions()}
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
            <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando sugestões...</p>
          </div>
        </div>
      ) : suggestions.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Nenhuma Duplicata Encontrada
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Não há sugestões de mesclagem pendentes para este caso. Todas as pessoas foram processadas!
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
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {suggestions.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sugestões Pendentes
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
                    {suggestions.filter(s => s.confidence >= 0.8).length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Alta Confiança
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round((suggestions.reduce((sum, s) => sum + s.similarity_score, 0) / suggestions.length) * 100)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Similaridade Média
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Suggestions List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {suggestions.map((suggestion) => (
                <MergeSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  personA={suggestion.personA}
                  personB={suggestion.personB}
                  onAccept={handleAcceptMerge}
                  onReject={handleRejectMerge}
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
