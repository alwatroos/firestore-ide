import type { ConnectionMeta } from '@shared/types/connection'
import { atom } from 'jotai'

/** All known connections (secret-free metadata). */
export const connectionsAtom = atom<ConnectionMeta[]>([])

/** Id of the currently selected connection, or `null`. */
export const activeConnectionIdAtom = atom<string | null>(null)

/** Derived: the currently selected connection object, or `null`. */
export const activeConnectionAtom = atom((get) => {
  const id = get(activeConnectionIdAtom)
  return get(connectionsAtom).find((connection) => connection.id === id) ?? null
})
