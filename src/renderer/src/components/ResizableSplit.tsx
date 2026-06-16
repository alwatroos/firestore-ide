import {
  type MutableRefObject,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'

/** Props for {@link ResizableSplit}. */
interface Props {
  /** Content rendered in the left panel. */
  left: ReactNode
  /** Content rendered in the right panel. */
  right: ReactNode
  /** Initial pixel width of the left panel; defaults to 50% of the container. */
  initialLeftWidth?: number
  /** Minimum pixel width for either panel. @default 160 */
  minWidth?: number
}

/**
 * Register global mousemove/mouseup handlers that update the left-panel width.
 *
 * @param containerRef - Ref to the outermost container element.
 * @param dragging - Mutable ref tracking whether a drag is in progress.
 * @param minWidth - Minimum pixel width of either panel.
 * @param setWidth - State setter for the left-panel width.
 * @returns Cleanup function that removes the registered listeners.
 */
function registerDragListeners(
  containerRef: RefObject<HTMLDivElement | null>,
  dragging: MutableRefObject<boolean>,
  minWidth: number,
  setWidth: (w: number) => void
): () => void {
  const onMove = (e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return
    const { left, width } = containerRef.current.getBoundingClientRect()
    setWidth(Math.max(minWidth, Math.min(e.clientX - left, width - minWidth)))
  }
  const onUp = () => {
    dragging.current = false
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  return () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
}

/**
 * Track drag state and expose a `startDrag` callback for the divider element.
 *
 * @param containerRef - Ref to the outermost container element.
 * @param minWidth - Minimum pixel width of either panel.
 * @param setWidth - State setter for the left-panel width.
 * @returns Callback to attach to the divider's `onMouseDown`.
 */
function useDragResize(
  containerRef: RefObject<HTMLDivElement | null>,
  minWidth: number,
  setWidth: (w: number) => void
): () => void {
  const dragging = useRef(false)
  useEffect(
    () => registerDragListeners(containerRef, dragging, minWidth, setWidth),
    [containerRef, minWidth, setWidth]
  )
  return useCallback(() => {
    dragging.current = true
  }, [])
}

/**
 * Horizontal two-panel layout with a draggable resize divider.
 *
 * @param props - Left/right content and optional sizing constraints.
 * @returns The rendered split container.
 */
export function ResizableSplit({ left, right, initialLeftWidth, minWidth = 160 }: Props): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null)
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth ?? 0)
  const startDrag = useDragResize(containerRef, minWidth, setLeftWidth)

  useLayoutEffect(() => {
    if (!containerRef.current) return
    setLeftWidth(initialLeftWidth ?? containerRef.current.offsetWidth / 2)
  }, [initialLeftWidth])

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 min-w-0 select-none">
      <div style={{ width: leftWidth, minWidth: 0 }} className="overflow-hidden">
        {left}
      </div>
      <div
        className="w-1 shrink-0 cursor-col-resize bg-slate-200 dark:bg-slate-700 transition-colors hover:bg-blue-400 active:bg-blue-600"
        onMouseDown={startDrag}
      />
      <div className="min-w-0 flex-1 overflow-hidden">{right}</div>
    </div>
  )
}
