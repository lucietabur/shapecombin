# Shape Combinator

A web application for exploring and generating combinations of geometric shapes in grid patterns. Create unique designs by combining squares, triangles, and quarter circles in 1×1, 2×2, and 3×3 grids.

## Features

- **Grid Sizes**: Choose from 1×1, 2×2, or 3×3 grids
- **Shape Types**: Toggle between empty spaces, squares, triangles (4 rotations), and quarter circles (4 rotations)
- **Animation**: Watch random combinations animate at adjustable speeds
- **Dark/Light Mode**: Switch between themes for optimal viewing
- **Downloads**:
  - SVG export of current combination
  - PDF catalog generation (limited to 2×2 grids for performance)
  - ZIP archive for large PDF collections
- **Interactive Preview**: Click on mini-grids to preview combinations

## Technologies

- **React 19** - Component-based UI framework
- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **jsPDF** - PDF generation library
- **JSZip** - ZIP archive creation

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lucietabur/shapecombin.git
   cd shapecombin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## Usage

1. **Select Grid Size**: Choose 1×1, 2×2, or 3×3 from the grid controls
2. **Toggle Shapes**: Enable/disable shape types (empty, square, triangle, quarter)
3. **Navigate Combinations**: Use previous/next buttons or click mini-grids
4. **Animation**: Start/stop animation with adjustable speed
5. **Download**: Export current combination as SVG or generate PDF catalogs

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
src/
├── App.tsx          # Main application component
├── main.tsx         # Application entry point
├── index.css        # Global styles
├── components/
│   ├── Shape.tsx    # Shape rendering components
│   └── VirtualizedGrid.tsx
└── utils/
    └── cn.ts        # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

---

**Designed by NORM DESIGN STYLE**