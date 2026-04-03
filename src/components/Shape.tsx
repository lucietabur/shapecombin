import React from 'react';

// All possible cell states including rotations
export type ShapeType =
  | 'empty'
  | 'square'
  | 'tri-0' | 'tri-90' | 'tri-180' | 'tri-270'
  | 'qtr-0' | 'qtr-90' | 'qtr-180' | 'qtr-270';

export interface ShapeFamily {
  id: string;
  label: string;
  variants: ShapeType[];
  description: string;
}

export const shapeFamilies: ShapeFamily[] = [
  { id: 'empty', label: 'Vide', description: 'Case vide', variants: ['empty'] },
  { id: 'square', label: 'Carré', description: 'Carré plein', variants: ['square'] },
  { id: 'triangle', label: 'Triangle', description: '4 rotations', variants: ['tri-0', 'tri-90', 'tri-180', 'tri-270'] },
  { id: 'quarter', label: 'Quart de rond', description: '4 rotations', variants: ['qtr-0', 'qtr-90', 'qtr-180', 'qtr-270'] },
];

export const allShapeTypes: ShapeType[] = shapeFamilies.flatMap(f => f.variants);

interface ShapeSVGProps {
  type: ShapeType;
  size: number;
  color?: string;
}

/*
  Shape drawing convention:
  Each shape fills a cell of `size` × `size`.
  
  Triangles fill exactly half the cell (diagonal):
    tri-0:   ◣  bottom-left  (vertices: bottom-left, bottom-right, top-left)
    tri-90:  ◢  bottom-right (vertices: bottom-left, bottom-right, top-right)
    tri-180: ◥  top-right    (vertices: top-left, top-right, bottom-right)
    tri-270: ◤  top-left     (vertices: top-left, top-right, bottom-left)
  
  Quarter circles fill a quarter-circle area from one corner:
    qtr-0:   arc from bottom-left corner
    qtr-90:  arc from bottom-right corner
    qtr-180: arc from top-right corner
    qtr-270: arc from top-left corner
*/
export const ShapeSVG: React.FC<ShapeSVGProps> = ({ type, size: s, color = '#000' }) => {
  switch (type) {
    case 'empty':
      return null;
    case 'square':
      return <rect x={0} y={0} width={s} height={s} fill={color} />;

    // Triangles
    case 'tri-0':
      return <polygon points={`0,0 0,${s} ${s},${s}`} fill={color} />;
    case 'tri-90':
      return <polygon points={`${s},0 0,${s} ${s},${s}`} fill={color} />;
    case 'tri-180':
      return <polygon points={`0,0 ${s},0 ${s},${s}`} fill={color} />;
    case 'tri-270':
      return <polygon points={`0,0 ${s},0 0,${s}`} fill={color} />;

    // Quarter circles — arc sweeps from corner
    // qtr-0: filled quarter from bottom-left corner
    // Start at top-left (0,0), arc to bottom-right (s,s), close through bottom-left (0,s)
    case 'qtr-0':
      return <path d={`M 0,0 A ${s},${s} 0 0,1 ${s},${s} L 0,${s} Z`} fill={color} />;
    // qtr-90: filled quarter from bottom-right corner
    case 'qtr-90':
      return <path d={`M ${s},0 A ${s},${s} 0 0,1 0,${s} L ${s},${s} Z`} fill={color} />;
    // qtr-180: filled quarter from top-right corner
    case 'qtr-180':
      return <path d={`M ${s},${s} A ${s},${s} 0 0,1 0,0 L ${s},0 Z`} fill={color} />;
    // qtr-270: filled quarter from top-left corner
    case 'qtr-270':
      return <path d={`M 0,${s} A ${s},${s} 0 0,1 ${s},0 L 0,0 Z`} fill={color} />;

    default:
      return null;
  }
};

// Renders a single cell
interface CellProps {
  type: ShapeType;
  size: number;
  color?: string;
  bg?: string;
}

export const Cell: React.FC<CellProps> = ({ type, size, color = '#000', bg = 'transparent' }) => (
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
    <rect x={0} y={0} width={size} height={size} fill={bg} />
    <ShapeSVG type={type} size={size} color={color} />
  </svg>
);

// Renders a mini grid (one combination)
interface MiniGridProps {
  combo: ShapeType[];
  gridSize: number;
  cellSize: number;
  color?: string;
  bg?: string;
  gap?: number;
  borderColor?: string;
}

export const MiniGrid: React.FC<MiniGridProps> = ({
  combo,
  gridSize,
  cellSize,
  color = '#000',
  bg = '#fff',
  gap = 0,
  borderColor,
}) => {
  const totalSize = gridSize * cellSize + (gridSize - 1) * gap;
  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      className="block"
    >
      <rect x={0} y={0} width={totalSize} height={totalSize} fill={bg} />
      {combo.map((type, i) => {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const x = col * (cellSize + gap);
        const y = row * (cellSize + gap);
        return (
          <g key={i} transform={`translate(${x},${y})`}>
            {borderColor && (
              <rect x={0} y={0} width={cellSize} height={cellSize} fill="none" stroke={borderColor} strokeWidth={0.5} />
            )}
            <ShapeSVG type={type} size={cellSize} color={color} />
          </g>
        );
      })}
    </svg>
  );
};
