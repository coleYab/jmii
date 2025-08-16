interface CellDimensions {
  width: number;
  height: number;
}



export function calculateCellDimensions(
  containerWidth: number,
  columns: number,
  gap = 8
): CellDimensions {
  const totalGapWidth = gap * (columns - 1);
  const cellWidth = (containerWidth - totalGapWidth) / columns;
  return {
    width: cellWidth,
    height: cellWidth // maintaining square aspect ratio
  };
}