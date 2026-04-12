import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface DialogShellProps {
  title: string
  description: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function DialogShell({
  title,
  description,
  onClose,
  children,
  footer,
  className,
}: DialogShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div
        className={cn(
          'relative w-full max-w-md',
          'flex flex-col gap-4',
          'rounded-lg border border-border bg-background p-6',
          'shadow-lg',
          'mus-grow',
          className
        )}
        style={{ transformOrigin: 'center center' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-foreground/70 transition-opacity hover:opacity-100"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold leading-none text-foreground">
            {title}
          </h3>
          <p className="text-sm leading-normal text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Content */}
        {children}

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Shared form elements ─────────────────────────────────── */

export function DialogFormSection({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-card p-4">
      {children}
    </div>
  )
}

interface DialogInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}

export function DialogInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: DialogInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium leading-none text-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-10 w-full rounded-md border border-input bg-background px-3',
          'text-sm text-foreground shadow-xs',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring'
        )}
      />
    </div>
  )
}

interface DialogTextareaProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export function DialogTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: DialogTextareaProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium leading-none text-foreground">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          'min-h-[60px] w-full resize-none rounded-md border border-input bg-background px-3 py-2',
          'text-sm text-foreground shadow-xs',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring'
        )}
      />
    </div>
  )
}

export function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-9 rounded-md border border-input bg-background px-4',
        'text-sm font-medium text-foreground shadow-xs',
        'hover:bg-accent hover:text-accent-foreground',
        'transition-colors'
      )}
    >
      Cancel
    </button>
  )
}

export function SubmitButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-9 rounded-md bg-primary px-4',
        'text-sm font-medium text-primary-foreground shadow-xs',
        'hover:opacity-90 transition-opacity',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}
