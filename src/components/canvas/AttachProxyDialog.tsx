import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import type { Document } from '@/types'
import { cn } from '@/lib/utils'
import { validateProxyDocument } from '@/utils/proxyValidation'

interface AttachProxyDialogProps {
  isOpen: boolean
  caseId: string
  onClose: () => void
  onAttach: (documentId: string) => void
}

export default function AttachProxyDialog({
  isOpen,
  caseId,
  onClose,
  onAttach,
}: AttachProxyDialogProps) {
  const [proxyDocuments, setProxyDocuments] = useState<Document[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch proxy documents for this case
  useEffect(() => {
    if (!isOpen) return

    const fetchProxyDocuments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('documents')
          .select('*')
          .eq('case_id', caseId)
          .eq('doc_type', 'proxy')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        setProxyDocuments(data || [])
      } catch (err) {
        console.error('Error fetching proxy documents:', err)
        setError('Erro ao carregar procuracoes')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProxyDocuments()
  }, [isOpen, caseId])

  const handleAttach = () => {
    if (selectedDocumentId) {
      onAttach(selectedDocumentId)
      setSelectedDocumentId(null)
    }
  }

  const handleSkip = () => {
    onAttach('')
    setSelectedDocumentId(null)
  }

  const getDocumentStatusBadge = (doc: Document) => {
    const statusMap = {
      uploaded: { label: 'Enviado', variant: 'secondary' },
      processing: { label: 'Processando', variant: 'default' },
      processed: { label: 'Processado', variant: 'default' },
      needs_review: { label: 'Requer Revisao', variant: 'default' },
      approved: { label: 'Aprovado', variant: 'default' },
      failed: { label: 'Falhou', variant: 'destructive' },
    } as const

    const status = statusMap[doc.status] || { label: doc.status, variant: 'secondary' }
    return (
      <Badge variant={status.variant as 'secondary' | 'default' | 'destructive'}>
        {status.label}
      </Badge>
    )
  }

  const getProxyValidityBadge = (doc: Document) => {
    const validation = validateProxyDocument(doc)

    if (!validation.isValid) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircleIcon className="w-3 h-3" />
          Invalida
        </Badge>
      )
    }

    if (validation.warnings.length > 0) {
      return (
        <Badge variant="default" className="gap-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
          <ExclamationTriangleIcon className="w-3 h-3" />
          {validation.warnings.length} Aviso(s)
        </Badge>
      )
    }

    return (
      <Badge variant="default" className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
        <CheckCircleIcon className="w-3 h-3" />
        Valida
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-dialog max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Anexar Procuracao</DialogTitle>
          <DialogDescription>
            Selecione a procuracao que autoriza esta representacao
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : proxyDocuments.length === 0 ? (
            <Alert>
              <ExclamationTriangleIcon className="w-4 h-4" />
              <AlertDescription>
                Nenhuma procuracao encontrada neste processo. Faca upload de uma procuracao primeiro.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {proxyDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocumentId(doc.id)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 transition-all text-left',
                    'hover:border-primary/50 hover:bg-primary/5',
                    selectedDocumentId === doc.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <DocumentTextIcon className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {doc.original_name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Enviado em {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {getDocumentStatusBadge(doc)}
                          {getProxyValidityBadge(doc)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {selectedDocumentId === doc.id && (
                        <CheckCircleIcon className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <Alert>
            <ExclamationTriangleIcon className="w-4 h-4" />
            <AlertDescription>
              Representacoes sem procuracao anexada receberao um aviso de validacao.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Pular (Anexar Depois)
          </Button>
          <Button
            onClick={handleAttach}
            disabled={!selectedDocumentId}
          >
            Anexar Procuracao
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
