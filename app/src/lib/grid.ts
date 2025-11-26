import type { GridConfig } from '../types';

/**
 * Determines the grid configuration based on prediction count.
 *
 * Grid sizes:
 * - 3x3 = 9 cells, 8 predictions + free center (odd grid)
 * - 4x4 = 16 cells, 16 predictions, no free space (even grid)
 * - 5x5 = 25 cells, 24 predictions + free center (odd grid)
 * - 6x6 = 36 cells, 36 predictions, no free space (even grid)
 */
export function getGridConfig(predictionCount: number): GridConfig {
  let size: number;

  if (predictionCount <= 8) {
    size = 3;
  } else if (predictionCount <= 16) {
    size = 4;
  } else if (predictionCount <= 24) {
    size = 5;
  } else {
    size = 6;
  }

  const totalCells = size * size;
  const isOddGrid = size % 2 === 1;
  const hasFreeSpace = isOddGrid;
  const freeSpaceIndex = hasFreeSpace ? Math.floor(totalCells / 2) : null;
  const predictionSlots = hasFreeSpace ? totalCells - 1 : totalCells;

  return {
    size,
    totalCells,
    predictionSlots,
    hasFreeSpace,
    freeSpaceIndex,
  };
}

/**
 * Get minimum predictions needed for each grid size
 */
export function getMinPredictionsForGrid(size: number): number {
  if (size === 3) return 1;
  if (size === 4) return 9;
  if (size === 5) return 17;
  return 25;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Assign grid positions to predictions
 */
export function assignPositions(
  predictionCount: number
): number[] {
  const config = getGridConfig(predictionCount);

  // Create array of available positions (excluding free space if applicable)
  const positions: number[] = [];
  for (let i = 0; i < config.totalCells; i++) {
    if (i !== config.freeSpaceIndex) {
      positions.push(i);
    }
  }

  // Shuffle and return only the positions we need
  const shuffled = shuffleArray(positions);
  return shuffled.slice(0, predictionCount);
}
