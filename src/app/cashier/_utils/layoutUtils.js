
export function calculateDefaultLayout(tables) {
  if (!tables || tables.length === 0) return [];

  // Config for the grid
  const COLS = 5; // Number of tables per row
  const SPACING_X = 20; // Distance between columns (database units, not 3D units)
  const SPACING_Y = 20; // Distance between rows (database units)
  const START_X = 0;
  const START_Y = 0;

  return tables.map((table, index) => {
    // If table already has valid layout data (non-zero), keep it.
    // Assuming (0,0) is "unset" or default. 
    // If you want to force re-layout, you'd ignore this check.
    if (table.layout_data?.x !== undefined && table.layout_data?.x !== 0 && table.layout_data?.y !== 0) {
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
