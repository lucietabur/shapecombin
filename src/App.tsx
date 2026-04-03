import { useState, useEffect, useRef } from 'react';
import type { ShapeType } from './components/Shape';
import { ShapeSVG, MiniGrid } from './components/Shape';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

interface Toggles {
  empty: boolean;
  square: boolean;
  triangle: boolean;
  quarter: boolean;
}

const App = () => {
  const [gridSize, setGridSize] = useState<1 | 4 | 9>(4);
  const [toggles, setToggles] = useState<Toggles>({
    empty: true,
    square: true,
    triangle: true,
    quarter: true,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(50);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode from A
  const [pdfStartIndex, setPdfStartIndex] = useState(0);
  const [pdfCount, setPdfCount] = useState(256);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Get enabled shape types
  const getEnabledShapes = (): ShapeType[] => {
    const enabled: ShapeType[] = [];
    if (toggles.empty) enabled.push('empty');
    if (toggles.square) enabled.push('square');
    if (toggles.triangle) {
      enabled.push('tri-0', 'tri-90', 'tri-180', 'tri-270');
    }
    if (toggles.quarter) {
      enabled.push('qtr-0', 'qtr-90', 'qtr-180', 'qtr-270');
    }
    return enabled;
  };

  const enabledShapes = getEnabledShapes();
  const rawCombinations = Math.pow(enabledShapes.length, gridSize);
  const totalCombinations = Math.min(rawCombinations, 1000000);

  // Convert index to combination
  const indexToCombination = (index: number): ShapeType[] => {
    const result: ShapeType[] = [];
    let remaining = index;
    const base = enabledShapes.length;

    for (let i = 0; i < gridSize; i++) {
      const position = remaining % base;
      result.push(enabledShapes[position]);
      remaining = Math.floor(remaining / base);
    }

    return result;
  };

  // Animation loop
  useEffect(() => {
    if (!isAnimating) {
      if (animationRef.current) clearInterval(animationRef.current);
      return;
    }

    const speedMs = Math.max(10, 500 - animationSpeed * 4);
    animationRef.current = setInterval(() => {
      setCurrentIndex(_prev => Math.floor(Math.random() * totalCombinations));
    }, speedMs);

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isAnimating, animationSpeed, totalCombinations]);

  const handleToggle = (key: keyof Toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    setCurrentIndex(0);
  };

  // Download the current shape as SVG
  const downloadSVG = () => {
    const combination = indexToCombination(currentIndex);
    const side = Math.sqrt(gridSize);
    const cellSize = 100;
    const totalSize = side * cellSize;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">`;
    svgContent += `<rect width="${totalSize}" height="${totalSize}" fill="${darkMode ? '#000000' : '#ffffff'}" />`;

    combination.forEach((shape, index) => {
      const row = Math.floor(index / side);
      const col = index % side;
      const x = col * cellSize;
      const y = row * cellSize;

      svgContent += `<g transform="translate(${x}, ${y})">`;
      svgContent += `<rect width="${cellSize}" height="${cellSize}" fill="none" stroke="${darkMode ? '#ffffff' : '#000000'}" stroke-width="0.5" opacity="0.2" />`;

      const color = darkMode ? '#ffffff' : '#000000';

      if (shape === 'square') {
        svgContent += `<rect x="0" y="0" width="${cellSize}" height="${cellSize}" fill="${color}" />`;
      } else if (shape.startsWith('tri-')) {
        let pts = '';
        if (shape === 'tri-0') pts = `0,0 0,${cellSize} ${cellSize},${cellSize}`;
        if (shape === 'tri-90') pts = `${cellSize},0 0,${cellSize} ${cellSize},${cellSize}`;
        if (shape === 'tri-180') pts = `0,0 ${cellSize},0 ${cellSize},${cellSize}`;
        if (shape === 'tri-270') pts = `0,0 ${cellSize},0 0,${cellSize}`;
        svgContent += `<polygon points="${pts}" fill="${color}" />`;
      } else if (shape.startsWith('qtr-')) {
        let d = '';
        if (shape === 'qtr-0') d = `M 0,0 A ${cellSize},${cellSize} 0 0,1 ${cellSize},${cellSize} L 0,${cellSize} Z`;
        if (shape === 'qtr-90') d = `M ${cellSize},0 A ${cellSize},${cellSize} 0 0,1 0,${cellSize} L ${cellSize},${cellSize} Z`;
        if (shape === 'qtr-180') d = `M ${cellSize},${cellSize} A ${cellSize},${cellSize} 0 0,1 0,0 L ${cellSize},0 Z`;
        if (shape === 'qtr-270') d = `M 0,${cellSize} A ${cellSize},${cellSize} 0 0,1 ${cellSize},0 L 0,0 Z`;
        svgContent += `<path d="${d}" fill="${color}" />`;
      }

      svgContent += `</g>`;
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shape-combinator-${currentIndex}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download PDF with current shapes - WITH PERFECT SQUARES
  const generateCatalogPDF = (startItem: number, printCount: number) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const side = Math.sqrt(gridSize);

    const COLS = 8;
    const ROWS = 10;
    const CELL_SIZE = 14;
    const CELL_PADDING_X = 8;
    const CELL_PADDING_Y = 12;

    let printedCount = 0;
    let currentItem = startItem;

    while (printedCount < printCount) {
      if (printedCount > 0) {
        doc.addPage();
      }

      // White background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('SHAPE COMBINATOR - CATALOG', pageWidth / 2, 15, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Page ${Math.floor(currentItem / (COLS * ROWS)) + 1} • Grille ${side}x${side}`, pageWidth / 2, 20, { align: 'center' });

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (printedCount >= printCount) break;

          const startX = 25 + col * (CELL_SIZE + CELL_PADDING_X);
          const startY = 35 + row * (CELL_SIZE + CELL_PADDING_Y);

          // Draw index text
          doc.setFontSize(6);
          doc.setTextColor(150, 150, 150);
          doc.text(`N°${String(currentItem).padStart(4, '0')}`, startX, startY - 2);

          // Draw outer border for this combination
          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.1);
          doc.rect(startX, startY, CELL_SIZE, CELL_SIZE);

          const combination = indexToCombination(currentItem);

          combination.forEach((shape, subIdx) => {
            const subSide = side;
            const subRow = Math.floor(subIdx / subSide);
            const subCol = subIdx % subSide;
            const subCellSize = CELL_SIZE / subSide;
            const x = startX + subCol * subCellSize;
            const y = startY + subRow * subCellSize;

            doc.setFillColor(0, 0, 0);
            doc.setDrawColor(0, 0, 0);

            if (shape === 'square') {
              doc.rect(x, y, subCellSize, subCellSize, 'F');
            } else if (shape === 'tri-0') {
              doc.triangle(x, y, x, y + subCellSize, x + subCellSize, y + subCellSize, 'F');
            } else if (shape === 'tri-90') {
              doc.triangle(x + subCellSize, y, x, y + subCellSize, x + subCellSize, y + subCellSize, 'F');
            } else if (shape === 'tri-180') {
              doc.triangle(x, y, x + subCellSize, y, x + subCellSize, y + subCellSize, 'F');
            } else if (shape === 'tri-270') {
              doc.triangle(x, y, x + subCellSize, y, x, y + subCellSize, 'F');
            } else if (shape.startsWith('qtr-')) {
              if (shape === 'qtr-0') {
                doc.triangle(x, y, x, y + subCellSize, x + subCellSize, y, 'F');
              } else if (shape === 'qtr-90') {
                doc.triangle(x + subCellSize, y, x, y, x + subCellSize, y + subCellSize, 'F');
              } else if (shape === 'qtr-180') {
                doc.triangle(x, y + subCellSize, x + subCellSize, y + subCellSize, x + subCellSize, y, 'F');
              } else if (shape === 'qtr-270') {
                doc.triangle(x, y, x, y + subCellSize, x + subCellSize, y + subCellSize, 'F');
              }
            }
          });

          currentItem++;
          printedCount++;
        }
      }
    }

    return doc;
  };

  const downloadPDF = () => {
    try {
      const startItem = Math.max(0, Math.min(pdfStartIndex, totalCombinations - 1));
      const printCount = Math.min(pdfCount, 1000, totalCombinations - startItem);
      const doc = generateCatalogPDF(startItem, printCount);
      doc.save(`shape-combinator-catalog-${startItem}-${startItem + printCount - 1}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Error generating PDF catalog');
    }
  };

  const downloadAllPDFs = async () => {
    if (totalCombinations === 0) {
      alert('Aucune combinaison à exporter. Assurez-vous qu’au moins une forme est sélectionnée.');
      return;
    }

    const maxPerFile = 1000;
    const fileCount = Math.ceil(totalCombinations / maxPerFile);

    if (fileCount === 1) {
      const doc = generateCatalogPDF(0, totalCombinations);
      doc.save(`shape-combinator-all.pdf`);
      return;
    }

    try {
      const zip = new JSZip();
      for (let fileIdx = 0; fileIdx < fileCount; fileIdx++) {
        const startItem = fileIdx * maxPerFile;
        const chunkCount = Math.min(maxPerFile, totalCombinations - startItem);
        const doc = generateCatalogPDF(startItem, chunkCount);
        const arrayBuffer = doc.output('arraybuffer');
        zip.file(`shape-combinator-${startItem.toString().padStart(5, '0')}-${(startItem + chunkCount - 1).toString().padStart(5, '0')}.pdf`, arrayBuffer);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shape-combinator-all-${totalCombinations}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la création de l’archive ZIP.');
    }
  };
  


  const currentCombination = indexToCombination(currentIndex);
  const side = Math.sqrt(gridSize);

  const isTwoByTwo = gridSize === 4;

  const pageClasses = darkMode ? 'bg-black text-white' : 'bg-white text-black';
  const headerClasses = darkMode ? 'bg-black text-white border-neutral-800' : 'bg-white text-black border-neutral-300';
  const panelClasses = darkMode ? 'bg-black text-white' : 'bg-white text-black';
  const cardClasses = darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-300';
  const listBgClasses = darkMode ? 'bg-neutral-950' : 'bg-white';

  return (
    <div className={`min-h-screen flex flex-col font-mono selection:bg-neutral-800 selection:text-neutral-200 transition-colors duration-300 ${pageClasses}`}>
      {/* Header */}
      <header className={`border-b px-8 py-6 flex justify-between items-center ${headerClasses}`}>
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter leading-none">SHAPE COMBINATOR</h1>
          <p className="text-xs tracking-widest text-neutral-500 uppercase">EXPLORATION DES FORMES • {totalCombinations.toLocaleString()} COMBINAISONS</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-10 h-10 flex items-center justify-center border rounded-full transition-all text-sm ${darkMode ? 'border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800' : 'border-neutral-300 bg-white text-black hover:bg-neutral-100'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Control Panel */}
      <div className={`border-b p-8 grid grid-cols-1 md:grid-cols-4 gap-8 ${panelClasses}`}>
        {/* Grid Size */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block">Grille</span>
          <div className="grid grid-cols-3 gap-1">
            {[1, 4, 9].map(size => (
              <button
                key={size}
                onClick={() => {
                  setGridSize(size as 1 | 4 | 9);
                  setCurrentIndex(0);
                }}
                className={`py-2 text-xs border border-neutral-800 transition-all ${
                  gridSize === size 
                    ? 'bg-white text-black font-black' 
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                {size === 1 ? '1×1' : size === 4 ? '2×2' : '3×3'}
              </button>
            ))}
          </div>
        </div>

        {/* Shape Toggles */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block">Formes Actives</span>
          <div className="grid grid-cols-2 gap-1">
            {(['empty', 'square', 'triangle', 'quarter'] as const).map(key => (
              <button
                key={key}
                onClick={() => handleToggle(key)}
                className={`py-2 text-xs border border-neutral-800 transition-all uppercase ${
                  toggles[key] 
                    ? 'bg-white text-black font-black' 
                    : 'text-neutral-600 hover:bg-neutral-900 hover:text-neutral-400'
                }`}
              >
                {key === 'empty' ? 'Vide' : key === 'square' ? 'Carré' : key === 'triangle' ? 'Triangle' : 'Quart'}
              </button>
            ))}
          </div>
        </div>

        {/* Animation Speed */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Animation</span>
            <span className="text-xs text-neutral-400 font-bold">{animationSpeed}%</span>
          </div>
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className={`w-full py-2 text-xs border border-neutral-800 transition-all font-black ${
              isAnimating 
                ? 'bg-red-600 text-white border-red-600 animate-pulse' 
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            {isAnimating ? '⏹ ARRÊTER' : '▶ LANCER L\'ANIMATION'}
          </button>
          <input
            type="range"
            min="10"
            max="100"
            value={animationSpeed}
            onChange={e => setAnimationSpeed(Number(e.target.value))}
            className="w-full accent-white"
          />
        </div>

        {/* Downloads */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block">Téléchargements PDF (Range)</span>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">INDICE DÉBUT</label>
              <input
                type="number"
                min="0"
                max={totalCombinations - 1}
                value={pdfStartIndex}
                onChange={e => setPdfStartIndex(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-2 py-1 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">QUANTITÉ (MAX 1000)</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={pdfCount}
                onChange={e => setPdfCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-2 py-1 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={downloadSVG}
              className="py-3 text-xs border font-black transition-all bg-neutral-900 border-neutral-800 text-white hover:bg-white hover:text-black"
            >
              ↓ SVG ACTUEL
            </button>
          </div>
          <div className="mt-2">
            <button
              onClick={downloadAllPDFs}
                disabled={!isTwoByTwo}
                className={`w-full py-3 text-xs border font-black transition-all ${isTwoByTwo ? 'bg-green-600 border-green-600 text-white hover:bg-white hover:text-green-700 hover:text-black' : 'bg-neutral-200 border-neutral-300 text-neutral-500 cursor-not-allowed'}`}
            >
              ↓ PDF TOUTES FORMES (ZIP si plusieurs fichiers)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row border-b border-neutral-800">
        {/* BIG CENTRAL PREVIEW */}
        <div className={`flex-1 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r ${cardClasses} relative`}>
          <div className="absolute top-4 left-4 text-[10px] text-neutral-600 tracking-widest uppercase font-bold">
            Combinaison actuelle
          </div>
          
          <div className="absolute top-4 right-4 text-xs font-black px-2 py-1 bg-neutral-900 text-white border border-neutral-800 rounded">
            N° {currentIndex}
          </div>

          <div className={`p-12 border shadow-2xl ${darkMode ? 'border-neutral-800 bg-black' : 'border-neutral-300 bg-white'}`}>
            <svg 
              width={300} 
              height={300} 
              viewBox={`0 0 ${side * 100} ${side * 100}`} 
              className="block"
            >
              {(() => {
                // Reverse to display top-to-bottom like the UI
                const displayCombo = [...currentCombination].reverse();
                return displayCombo.map((shape, idx) => {
                  const r = Math.floor(idx / side);
                  const c = idx % side;
                  return (
                    <g key={idx} transform={`translate(${c * 100}, ${r * 100})`}>
                      <rect width="100" height="100" fill="none" stroke={darkMode ? '#1a1a1a' : '#1a1a1a'} strokeWidth="0.5" />
                      <ShapeSVG type={shape} size={100} color={darkMode ? '#fff' : '#000'} />
                    </g>
                  );
                });
              })()}
            </svg>
          </div>

          <div className="mt-8 flex gap-2 w-full max-w-xs">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              className="flex-1 py-3 border border-neutral-800 bg-black hover:bg-neutral-900 text-white text-xs transition-all"
            >
              ⬅ PRÉCÉDENT
            </button>
            <button
              onClick={() => setCurrentIndex(prev => Math.min(totalCombinations - 1, prev + 1))}
              className="flex-1 py-3 border border-neutral-800 bg-black hover:bg-neutral-900 text-white text-xs transition-all"
            >
              SUIVANT ➡
            </button>
          </div>
        </div>

        {/* ALL COMBINATIONS SIDE-BY-SIDE GRID */}
        <div className={`w-full md:w-1/3 flex flex-col ${listBgClasses}`}>
          <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-neutral-800 bg-neutral-900 text-white' : 'border-neutral-200 bg-white text-black'}`}>
            <span className="text-xs font-bold tracking-widest text-neutral-400">LES FORMES CÔTE À CÔTE</span>
            <span className={`text-xs px-2 py-1 rounded font-bold ${darkMode ? 'bg-black text-white' : 'bg-neutral-100 text-black'}`}>{totalCombinations} total</span>
          </div>

          <div 
            ref={gridContainerRef}
            className="flex-1 overflow-y-auto p-4 grid gap-1 scrollbar-none"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              maxHeight: 'calc(100vh - 350px)'
            }}
          >
            {Array.from({ length: Math.min(2000, totalCombinations) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`p-2 border transition-all origin-center hover:scale-110 transform flex flex-col items-center justify-center relative ${
                  i === currentIndex
                    ? `${darkMode ? 'border-white bg-white text-black z-10' : 'border-black bg-white text-black z-10'}`
                    : `${darkMode ? 'border-neutral-900 bg-black hover:border-neutral-700 text-neutral-600' : 'border-neutral-300 bg-white hover:border-neutral-200 text-neutral-800'}`
                }`}
              >
                <MiniGrid 
                  combo={indexToCombination(i)} 
                  gridSize={side} 
                  cellSize={12}
                  color={darkMode ? '#fff' : '#000'}
                  bg={darkMode ? '#000' : '#fff'}
                />
                <span className="text-[7px] mt-1 opacity-50 font-mono tracking-tighter">N°{i}</span>
              </button>
            ))}
          </div>
          
          <div className={`p-4 border-t text-center ${darkMode ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-white'}`}>
            <p className="text-[10px] text-neutral-500 font-mono tracking-widest">CLIQUEZ SUR UNE MINI-FORME POUR LA PRÉVISUALISER</p>
          </div>
        </div>
      </div>
      <footer className={`p-4 text-center border-t text-xs tracking-widest ${darkMode ? 'border-neutral-900 bg-black text-neutral-600' : 'border-neutral-200 bg-white text-neutral-600'}`}>
        NORM DESIGN STYLE • SHAPE GENERATOR PRO
      </footer>
    </div>
  );
};

export default App;