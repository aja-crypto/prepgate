import { useState, useRef, useCallback, useEffect } from 'react';

const OVERSCAN = 3;

export function VirtualList({ items, itemHeight, renderItem, gap = 8, overscan = OVERSCAN }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    setScrollTop(containerRef.current?.scrollTop ?? 0);
  }, []);

  const totalHeight = items.length * (itemHeight + gap);
  const startIndex = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + overscan);
  const offsetY = startIndex * (itemHeight + gap);

  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div ref={containerRef} onScroll={handleScroll} className="overflow-y-auto will-change-scroll" style={{ height: '100%' }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => (
            <div key={item._id || item.id || i} style={{ height: itemHeight, marginBottom: gap }}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function useVirtualList({ items, itemHeight, overscan = OVERSCAN }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onScroll = useCallback(() => {
    setScrollTop(containerRef.current?.scrollTop ?? 0);
  }, []);

  const totalHeight = items.length * (itemHeight + 8);
  const startIndex = Math.max(0, Math.floor(scrollTop / (itemHeight + 8)) - overscan);
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / (itemHeight + 8)) + overscan);

  return {
    containerRef,
    totalHeight,
    offsetY: startIndex * (itemHeight + 8),
    visibleItems: items.slice(startIndex, endIndex),
    onScroll,
  };
}
