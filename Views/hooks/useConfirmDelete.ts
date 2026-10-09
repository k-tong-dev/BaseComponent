'use client'

import { useState, useCallback, createElement } from 'react'
import { ConfirmationModal } from '@/components/Base/Actions'
import { showToast } from '@/lib/ui/toast'

interface UseConfirmDeleteOptions {
  apiEndpoint: string
  entityName: string
  refresh?: () => void
  useQueryParam?: boolean
}

export function useConfirmDelete({ apiEndpoint, entityName, refresh, useQueryParam }: UseConfirmDeleteOptions) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const confirmDelete = useCallback((id: string | number) => {
    setDeleteTarget(String(id))
  }, [])

  const handleClose = useCallback(() => {
    setDeleteTarget(null)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (deleteTarget === null) return
    try {
      const url = useQueryParam
        ? `${apiEndpoint}?id=${deleteTarget}`
        : `${apiEndpoint}/${deleteTarget}`
      const response = await fetch(url, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        refresh?.()
        showToast('success', `${entityName} deleted`, `The ${entityName} was removed successfully.`)
      } else {
        showToast('error', 'Delete failed', `Failed to delete ${entityName}.`)
      }
    } catch {
      showToast('error', 'Delete failed', `An error occurred while deleting the ${entityName}.`)
    }
  }, [deleteTarget, apiEndpoint, entityName, refresh, useQueryParam])

  const deleteModal = createElement(
    ConfirmationModal,
    {
      open: deleteTarget !== null,
      onClose: handleClose,
      config: {
        message: `Delete this ${entityName}?`,
        onConfirm: handleConfirm,
      },
    }
  )

  return { confirmDelete, deleteModal }
}
