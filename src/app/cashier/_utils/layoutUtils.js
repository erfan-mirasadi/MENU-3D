
export function calculateDefaultLayout(tables) {
  if (!tables || tables.length === 0) return [];

  // Config for the grid
  const COLS = 5; // Number of tables per row
  const SPACING_X = 35; // Distance between columns (database units, not 3D units)
  const SPACING_Y = 35; // Distance between rows (database units)
  const START_X = 0;
  const START_Y = 0;

  return tables.map((table, index) => {
    // If table already has valid layout data (non-zero), keep it.
    // Assuming (0,0) is "unset" or default. 
    // If you want to force re-layout, you'd ignore this check.
    if (table.layout_data?.x != null && table.layout_data?.y != null) {
      return {
        ...table,
        x: table.layout_data.x,
        y: table.layout_data.y
      };
    }

    // Calculate grid position
    const col = index % COLS;
    const row = Math.floor(index / COLS);

    return {
      ...table,
      x: START_X + col * SPACING_X,
      y: START_Y + row * SPACING_Y,
      // Create a temporary layout_data object if it doesn't exist, for consistency
      layout_data: {
        ...table.layout_data,
        x: START_X + col * SPACING_X,
        y: START_Y + row * SPACING_Y
      }
    };
  });
}

// Forces a complete grid reset, centered on 0,0
export function calculateGridLayout(tables) {
    if (!tables || tables.length === 0) return [];
  
    // Sort tables by number (T-01, T-02...)
    const sorted = [...tables].sort((a, b) => {
        const numA = parseInt(a.table_number.replace(/\D/g, '') || '0');
        const numB = parseInt(b.table_number.replace(/\D/g, '') || '0');
        return numA - numB;
    });

    const COLS = 6; // User asked for 5x6 roughly (30 tables), 6 cols is a good balance
    const SPACING_X = 35;
    const SPACING_Y = 35;
    
    const totalCount = sorted.length;
    const numRows = Math.ceil(totalCount / COLS);
    const actualCols = Math.min(totalCount, COLS);

    // Calculate bounding box to center it
    const gridWidth = (actualCols - 1) * SPACING_X;
    const gridHeight = (numRows - 1) * SPACING_Y;
    
    const startX = -gridWidth / 2;
    const startY = -gridHeight / 2; // Center vertically too? Or start from top? User said "markaz". Let's center.

    return sorted.map((table, index) => {
      const col = index % COLS;
      const row = Math.floor(index / COLS);
  
      const x = startX + col * SPACING_X;
      const y = startY + row * SPACING_Y; // Builds upwards? Or downwards? 
      // 3D Z axis (Y in logic) usually increases "down" or "towards camera". 
      // Let's assume standard grid filling.
      
      return {
        ...table,
        x: x,
        y: y,
        layout_data: {
          ...table.layout_data,
          x: x,
          y: y
        }
      };
    });
}
