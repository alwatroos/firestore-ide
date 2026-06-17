import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Visual variants for {@link Button}. */
type Variant = 'primary' | 'ghost' | 'danger'

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white',
  ghost: 'bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300',
  danger: 'bg-red-600 hover:bg-red-500 text-white'
}

/** Props for {@link Button}. */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. */
  variant?: Variant
}

/**
 * A styled button with a small set of variants.
 *
 * @param props - Standard button props plus an optional {@link Variant}.
 * @returns The rendered button.
 */
export function Button({ variant = 'primary', className = '', ...rest }: ButtonProps): ReactNode {
  const base = 'rounded px-3 py-1.5 text-sm font-medium disabled:opacity-40 transition'
  return <button className={`${base} ${VARIANT_CLASS[variant]} ${className}`} {...rest} />
}

/**
 * A dismissable error banner.
 *
 * @param props - The error message to display, or `null` to render nothing.
 * @returns The banner, or `null`.
 */
export function ErrorBanner({ message }: { message: string | null }): ReactNode {
  if (!message) return null
  return (
    <div className="rounded bg-red-100 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
      {message}
    </div>
  )
}

/**
 * A centred, muted placeholder message for empty states.
 *
 * @param props - The text to display.
 * @returns The rendered placeholder.
 */
export function Empty({ text }: { text: string }): ReactNode {
  return <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-500">{text}</div>
}

/** Props for {@link ConfirmDialog}. */
interface ConfirmDialogProps {
  /** Dialog heading. */
  title: string
  /** Optional rich body (e.g. a preview of what will change). */
  children?: ReactNode
  /** Confirm button label (defaults to `Confirm`). */
  confirmLabel?: string
  /** When true, the confirm button uses the destructive style. */
  danger?: boolean
  /** Disables the confirm button while an action is in flight. */
  busy?: boolean
  /** Invoked when the user confirms. */
  onConfirm: () => void
  /** Invoked when the user cancels or dismisses. */
  onCancel: () => void
}

/**
 * A modal confirmation dialog with an optional preview body. Used to guard
 * destructive operations (delete, bulk import/restore).
 *
 * @param props - See {@link ConfirmDialogProps}.
 * @returns The rendered modal.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps): ReactNode {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="w-[28rem] max-w-[90vw] space-y-3 rounded-lg bg-white dark:bg-slate-800 p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold dark:text-slate-200">{title}</h2>
        {children ? <div className="text-sm text-slate-600 dark:text-slate-300">{children}</div> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
