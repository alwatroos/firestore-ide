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
