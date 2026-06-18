import {
  type MutableRefObject,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

/** Props for a horizontal (left/right) split. */
interface HorizontalProps {
  direction?: 'horizontal'
  /** Content rendered in the left panel. */
  left: ReactNode
  /** Content rendered in the right panel. */
  right: ReactNode
  /** Initial pixel width of the left panel; defaults to 50% of the container. */
  initialLeftWidth?: number
  /** Minimum pixel width for either panel. @default 160 */
  minWidth?: number
}

/** Props for a vertical (top/bottom) split. */
interface VerticalProps {
  direction: 'vertical'
  /** Content rendered in the top panel. */
  top: ReactNode
  /** Content rendered in the bottom panel. */
  bottom: ReactNode
  /** Initial pixel height of the top panel; defaults to 65% of the container. */
  initialTopHeight?: number
  /** Minimum pixel height for either panel. @default 80 */
  minHeight?: number
}

type Props = HorizontalProps | VerticalProps

/**
 * Register global mousemove/mouseup handlers for horizontal drag resize.
 *
 * @param containerRef - Ref to the container element.
 * @param dragging - Mutable ref tracking drag state.
 * @param minSize - Minimum pixel width of either panel.
 * @param setSize - State setter for the left-panel width.
 * @returns Cleanup function that removes the registered listeners.
 */
function registerHDrag(
  containerRef: RefObject<HTMLDivElement | null>,
  dragging: MutableRefObject<boolean>,
  minSize: number,
  setSize: (s: number) => void
): () => void {
  const onMove = (e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return
    const { left, width } = containerRef.current.getBoundingClientRect()
    setSize(Math.max(minSize, Math.min(e.clientX - left, width - minSize)))
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
 * Register global mousemove/mouseup handlers for vertical drag resize.
 *
 * @param containerRef - Ref to the container element.
 * @param dragging - Mutable ref tracking drag state.
 * @param minSize - Minimum pixel height of either panel.
 * @param setSize - State setter for the top-panel height.
 * @returns Cleanup function that removes the registered listeners.
 */
function registerVDrag(
  containerRef: RefObject<HTMLDivElement | null>,
  dragging: MutableRefObject<boolean>,
  minSize: number,
  setSize: (s: number) => void
): () => void {
  const onMove = (e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return
    const { top, height } = containerRef.current.getBoundingClientRect()
    setSize(Math.max(minSize, Math.min(e.clientY - top, height - minSize)))
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
 * @param containerRef - Ref to the container element.
 * @param direction - Split orientation.
 * @param minSize - Minimum pixel size for either panel.
 * @param setSize - State setter for the first-panel size.
 * @returns Callback to attach to the divider's `onMouseDown`.
 */
function useDragResize(
  containerRef: RefObject<HTMLDivElement | null>,
  direction: 'horizontal' | 'vertical',
  minSize: number,
  setSize: (s: number) => void
): () => void {
  const dragging = useRef(false)
  useEffect(
    () =>
      direction === 'horizontal'
        ? registerHDrag(containerRef, dragging, minSize, setSize)
        : registerVDrag(containerRef, dragging, minSize, setSize),
    [containerRef, direction, minSize, setSize]
  )
  return useCallback(() => {
    dragging.current = true
  }, [])
}

/**
 * Two-panel layout with a draggable resize divider.
 * Supports horizontal (`left`/`right`) and vertical (`top`/`bottom`) splits.
 *
 * @param props - Panel content and optional sizing constraints.
 * @returns The rendered split container.
 */
export function ResizableSplit(props: Props): ReactNode {
  const direction = props.direction ?? 'horizontal'
  const minSize =
    direction === 'vertical'
      ? ((props as VerticalProps).minHeight ?? 80)
      : ((props as HorizontalProps).minWidth ?? 160)
  const initialSize =
    direction === 'vertical'
      ? (props as VerticalProps).initialTopHeight
      : (props as HorizontalProps).initialLeftWidth

  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(0)
  const startDrag = useDragResize(containerRef, direction, minSize, setSize)

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const containerSize =
      direction === 'vertical'
        ? containerRef.current.offsetHeight
        : containerRef.current.offsetWidth
    setSize(initialSize ?? containerSize * (direction === 'vertical' ? 0.65 : 0.5))
  }, [direction, initialSize])

  if (direction === 'vertical') {
    const { top, bottom } = props as VerticalProps
    return (
      <div ref={containerRef} className="flex min-h-0 flex-1 min-w-0 flex-col select-none">
        <div style={{ height: size, minHeight: 0 }} className="flex flex-col overflow-hidden">
          {top}
        </div>
        <div
          className="h-1 shrink-0 cursor-row-resize bg-slate-200 dark:bg-slate-700 transition-colors hover:bg-blue-400 active:bg-blue-600"
          onMouseDown={startDrag}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{bottom}</div>
      </div>
    )
  }

  const { left, right } = props as HorizontalProps
  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 min-w-0 select-none">
      <div style={{ width: size, minWidth: 0 }} className="overflow-hidden">
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
