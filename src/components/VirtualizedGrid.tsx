import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { ShapeType, MiniGrid } from './Shape';

interface VirtualizedGridProps {
  totalItems: number;
  gridSize: number;
  shapes: ShapeType[];
  darkMode: boolean;
  onSelectCombo: (combo: ShapeType[]) => void;
  animIndex: number | null;
}

const CELL_SIZE = 40;
const CELL_GAP = 4;
const CELLS_PER_ROW = 8;

// Generate combination at given index
function getCombinationAtIndex(index: number, numCells: number, shapes: ShapeType[]): ShapeType[] {
  const combo: ShapeType[] = [];
  let val = index;
  for (let j = 0; j < numCells; j++) {
    combo.push(shapes[val % shapes.length]);
    val = Math.floor(val / shapes.length);
  }
  return combo;
}

export default function VirtualizedGrid({
  totalItems,
  gridSize,
  shapes,
  darkMode,
  onSelectCombo,
  animIndex,
}: VirtualizedGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [itemsPerRow, setItemsPerRow] = useState(CELLS_PER_ROW);

  // Recalculate items per row based on container width
  useEffect(() => {
    if (!scrollRef.current) return;

    const updateItemsPerRow = () => {
      const width = scrollRef.current?.clientWidth || 1000;
      const itemWidth = CELL_SIZE * gridSize + (gridSize - 1) * CELL_GAP + 8;
      const newItemsPerRow = Math.max(1, Math.floor(width / itemWidth));
      setItemsPerRow(newItemsPerRow);
    };

    updateItemsPerRow();
    window.addEventListener('resize', updateItemsPerRow);
    return () => window.removeEventListener('resize', updateItemsPerRow);
  }, [gridSize]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const scrollTop = scrollRef.current.scrollTop;
    const viewportHeight = scrollRef.current.clientHeight;
    const itemHeight = CELL_SIZE * gridSize + (gridSize - 1) * CELL_GAP + 8;

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) * itemsPerRow);
    const end = Math.min(totalItems, Math.ceil((scrollTop + viewportHeight) / itemHeight) * itemsPerRow + itemsPerRow * 3);

    setVisibleRange({ start, end });
  }, [totalItems, gridSize, itemsPerRow]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Auto-scroll to animated item
  useEffect(() => {
    if (animIndex === null || !scrollRef.current) return;

    const itemHeight = CELL_SIZE * gridSize + (gridSize - 1) * CELL_GAP + 8;
    const row = Math.floor(animIndex / itemsPerRow);
    const scrollTop = row * itemHeight;

    scrollRef.current.scrollTop = scrollTop;
  }, [animIndex, itemsPerRow, gridSize]);

  // Generate visible items
  const visibleItems = useMemo(() => {
    const items: Array<{ index: number; combo: ShapeType[] }> = [];
    for (let i = visibleRange.start; i < Math.min(visibleRange.end, totalItems); i++) {
      items.push({
        index: i,
        combo: getCombinationAtIndex(i, gridSize * gridSize, shapes),
      });
    }
    return items;
  }, [visibleRange, totalItems, gridSize, shapes]);

  const itemHeight = CELL_SIZE * gridSize + (gridSize - 1) * CELL_GAP + 8;
  const totalHeight = Math.ceil(totalItems / itemsPerRow) * itemHeight;

  // Generate empty top space
  const topSpaceItems = visibleRange.start;
  const topSpaceHeight = Math.floor(topSpaceItems / itemsPerRow) * itemHeight;

  return (
    <div
      ref={scrollRef}
      className={`relative h-[calc(100vh-400px)] rounded-lg border overflow-y-auto ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      {/* Top spacer */}
      <div style={{ height: topSpaceHeight }} />

      {/* Grid container */}
      <div style={{ height: totalHeight - topSpaceHeight }}>
        <div className="flex flex-wrap gap-2 p-2">
          {visibleItems.map(({ index, combo }) => {
            const isAnimating = animIndex === index;
            return (
              <div
                key={index}
                onClick={() => onSelectCombo(combo)}
                className={`cursor-pointer rounded transition transform hover:scale-110 ${
                  isAnimating
                    ? darkMode
                      ? 'ring-2 ring-yellow-400 bg-yellow-900/30'
                      : 'ring-2 ring-yellow-500 bg-yellow-100'
                    : darkMode
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <MiniGrid
                  combo={combo}
                  gridSize={gridSize}
                  cellSize={CELL_SIZE}
                  color={darkMode ? '#fff' : '#000'}
                  bg={darkMode ? '#1f2937' : '#f9fafb'}
                  gap={CELL_GAP}
                  borderColor={darkMode ? '#374151' : '#e5e7eb'}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Info overlay */}
      <div className={`sticky bottom-0 left-0 right-0 px-4 py-2 text-xs border-t ${
        darkMode
          ? 'bg-gray-800 border-gray-700 text-gray-400'
          : 'bg-white border-gray-200 text-gray-600'
      }`}>
        Showing {visibleItems.length} of {totalItems.toLocaleString()} • Scroll: {Math.round((visibleRange.start / totalItems) * 100)}%
      </div>
    </div>
  );
}
