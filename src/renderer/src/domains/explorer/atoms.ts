import type { DocumentRecord } from '@shared/types/firestore';
import { atom } from 'jotai';
import { type CostTotals, ZERO_COST } from './cost';
import { createTab, type ExplorerTab, type QueryTab } from './tabs';

export type { ExplorerTab } from './tabs';

// ─── Tab management ───────────────────────────────────────────────────────────

const _initial = createTab();

/** All open query tabs. */
export const queryTabsAtom = atom<QueryTab[]>([_initial]);

/** Id of the currently active query tab. */
export const activeQueryTabIdAtom = atom<string>(_initial.id);

/** Derived: the active tab object, falling back to the first tab. */
const activeTabStateAtom = atom<QueryTab>((get) => {
  const tabs = get(queryTabsAtom);
  const id = get(activeQueryTabIdAtom);
  return tabs.find((t) => t.id === id) ?? tabs[0];
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SetStateAction<T> = T | ((prev: T) => T);

function resolve<T>(action: SetStateAction<T>, prev: T): T {
  return typeof action === 'function' ? (action as (p: T) => T)(prev) : action;
}

// ─── Per-tab derived atoms ────────────────────────────────────────────────────

/**
 * Currently selected collection path for the active tab.
 * Writing updates only the active tab's state.
 */
export const selectedCollectionAtom = atom(
  (get) => get(activeTabStateAtom).selectedCollection,
  (get, set, value: string | null) => {
    const id = get(activeQueryTabIdAtom);
    set(queryTabsAtom, (tabs) =>
      tabs.map((t) => (t.id === id ? { ...t, selectedCollection: value } : t))
    );
  }
);

/**
 * Active sub-tab (Browse / Query / History) for the active query tab.
 * Writing updates only the active tab's state.
 */
export const activeTabAtom = atom(
  (get) => get(activeTabStateAtom).activeSubTab,
  (get, set, value: ExplorerTab) => {
    const id = get(activeQueryTabIdAtom);
    set(queryTabsAtom, (tabs) =>
      tabs.map((t) => (t.id === id ? { ...t, activeSubTab: value } : t))
    );
  }
);

/**
 * Query editor mode (JSON spec / JS snippet) for the active tab.
 * Writing updates only the active tab's state.
 */
export const queryModeAtom = atom(
  (get) => get(activeTabStateAtom).queryMode,
  (get, set, value: 'json' | 'js') => {
    const id = get(activeQueryTabIdAtom);
    set(queryTabsAtom, (tabs) => tabs.map((t) => (t.id === id ? { ...t, queryMode: value } : t)));
  }
);

/**
 * Current query draft text for the active tab.
 * Accepts a direct value or an updater function (PrimitiveAtom-compatible).
 */
export const queryDraftAtom = atom(
  (get) => get(activeTabStateAtom).queryDraft,
  (get, set, action: SetStateAction<string>) => {
    const id = get(activeQueryTabIdAtom);
    set(queryTabsAtom, (tabs) =>
      tabs.map((t) => (t.id === id ? { ...t, queryDraft: resolve(action, t.queryDraft) } : t))
    );
  }
);

/**
 * Query results for the active tab.
 * Accepts a direct value or an updater function (PrimitiveAtom-compatible).
 */
export const queryResultsAtom = atom(
  (get) => get(activeTabStateAtom).queryResults,
  (get, set, action: SetStateAction<DocumentRecord[]>) => {
    const id = get(activeQueryTabIdAtom);
    set(queryTabsAtom, (tabs) =>
      tabs.map((t) => (t.id === id ? { ...t, queryResults: resolve(action, t.queryResults) } : t))
    );
  }
);

/**
 * AI instruction input for the active tab.
 * Accepts a direct value or an updater function (PrimitiveAtom-compatible).
 */
export const aiInstructionAtom = atom(
  (get) => get(activeTabStateAtom).aiInstruction,
  (get, set, action: SetStateAction<string>) => {
    const id = get(activeQueryTabIdAtom);
    set(queryTabsAtom, (tabs) =>
      tabs.map((t) => (t.id === id ? { ...t, aiInstruction: resolve(action, t.aiInstruction) } : t))
    );
  }
);

/**
 * AI streaming output for the active tab (read-only from the panel's perspective;
 * written directly via the store in {@link AiQueryPanel} to support concurrency).
 */
export const aiStreamTextAtom = atom((get) => get(activeTabStateAtom).aiStreamText);

/**
 * Generated query draft for the active tab awaiting review.
 * Accepts a direct value or an updater function (PrimitiveAtom-compatible).
 */
export const aiDraftAtom = atom(
  (get) => get(activeTabStateAtom).aiDraft,
  (get, set, action: SetStateAction<string>) => {
    const id = get(activeQueryTabIdAtom);
    set(queryTabsAtom, (tabs) =>
      tabs.map((t) => (t.id === id ? { ...t, aiDraft: resolve(action, t.aiDraft) } : t))
    );
  }
);

/** Whether AI generation is in progress for the active tab. */
export const aiBusyAtom = atom((get) => get(activeTabStateAtom).aiBusy);

/** Most recent AI generation error for the active tab, or `null`. */
export const aiErrorAtom = atom((get) => get(activeTabStateAtom).aiError);

// ─── Tab action atoms ─────────────────────────────────────────────────────────

/** Add a new query tab and make it active. */
export const addQueryTabAtom = atom(null, (_get, set) => {
  const tab = createTab();
  set(queryTabsAtom, (tabs) => [...tabs, tab]);
  set(activeQueryTabIdAtom, tab.id);
});

/**
 * Close the tab with the given id.
 * Activates the nearest remaining tab. Does nothing when only one tab is open.
 */
export const closeQueryTabAtom = atom(null, (get, set, tabId: string) => {
  const tabs = get(queryTabsAtom);
  if (tabs.length <= 1) return;
  const idx = tabs.findIndex((t) => t.id === tabId);
  const remaining = tabs.filter((t) => t.id !== tabId);
  if (get(activeQueryTabIdAtom) === tabId) {
    set(activeQueryTabIdAtom, remaining[Math.min(idx, remaining.length - 1)].id);
  }
  set(queryTabsAtom, remaining);
});

/**
 * Rename the tab with the given id.
 *
 * @param id - Tab id.
 * @param label - New label string.
 */
export const renameQueryTabAtom = atom(
  null,
  (_get, set, { id, label }: { id: string; label: string }) => {
    set(queryTabsAtom, (tabs) => tabs.map((t) => (t.id === id ? { ...t, label } : t)));
  }
);

// ─── Global (non-tab) atoms ───────────────────────────────────────────────────

/** Collection ids available for the active connection. */
export const collectionsAtom = atom<string[]>([]);

/** Documents loaded for the selected collection (browse cache). */
export const documentsAtom = atom<DocumentRecord[]>([]);

/** Monotonic counter bumped to force a document reload after mutations. */
export const documentsVersionAtom = atom(0);

/** Estimated Firestore operations accrued during this session. */
export const sessionCostAtom = atom<CostTotals>(ZERO_COST);
