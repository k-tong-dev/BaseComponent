'use client'

import { type ReactNode } from 'react'
import { Modal, Button } from 'rsuite'
import { cn } from '@/lib/utils'
import { showDevToast } from '@/components/ui/notification'

// ─── Types ──────────────────────────────────────────────────────────

export interface WizardButton {
  label: string
  onClick: () => void | Promise<void>
  appearance?: 'primary' | 'default' | 'subtle' | 'ghost' | 'link'
  color?: 'red' | 'green' | 'blue' | 'violet' | 'orange' | 'yellow'
  loading?: boolean
  disabled?: boolean
}

export type WizardVariant = 'default' | 'info' | 'warning' | 'error'

// ─── Main Wizard Modal ──────────────────────────────────────────────

interface WizardProps {
  open: boolean
  onClose: () => void
  title?: string
  variant?: WizardVariant
  size?: 'xs' | 'sm' | 'md' | 'lg'
  children?: ReactNode
  buttons?: WizardButton[]
  backdrop?: boolean | 'static'
  className?: string
}

export function Wizard({
  open,
  onClose,
  title,
  variant = 'default',
  size = 'sm',
  children,
  buttons,
  backdrop = true,
  className,
}: WizardProps) {
  const iconMap: Record<string, string> = {
    info: '💡',
    warning: '⚠️',
    error: '❌',
  }

  return (
    <Modal open={open} onClose={onClose} size={size} backdrop={backdrop} className={cn(className)} draggable>
      {title && (
        <Modal.Header>
          <Modal.Title className="text-base">
            {variant !== 'default' && (
              <span className="mr-2">{iconMap[variant]}</span>
            )}
            {title}
          </Modal.Title>
        </Modal.Header>
      )}
      <Modal.Body>{children}</Modal.Body>
      {buttons && buttons.length > 0 && (
        <Modal.Footer>
          {buttons.map((btn, i) => (
            <Button
              key={i}
              appearance={btn.appearance || 'default'}
              color={btn.color}
              onClick={btn.onClick}
              loading={btn.loading}
              disabled={btn.disabled}
            >
              {btn.label}
            </Button>
          ))}
        </Modal.Footer>
      )}
    </Modal>
  )
}

// ─── Imperative developer message helpers ───────────────────────────
// These replace console.error/warn with persistent UI toasts.
// They do NOT auto-dismiss and have no close button — the bug must be fixed first.

/**
 * Show a developer-facing message as a persistent toast notification.
 * Backward-compatible: (type, title, description) signature.
 */
export function showWizardMessage(type: WizardVariant, title: string, description?: string) {
  const toastType = type === 'default' ? 'info' : type as 'info' | 'warning' | 'error'
  showDevToast(toastType, title, description)
}

export const showWizardWarning = (title: string, description?: string) =>
  showDevToast('warning', title, description)

export const showWizardError = (title: string, description?: string) =>
  showDevToast('error', title, description)

export const showWizardInfo = (title: string, description?: string) =>
  showDevToast('info', title, description)
