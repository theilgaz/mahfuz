/**
 * Pure 2048 game engine -- no UI, no side effects.
 * Tiles slide/merge in 4 directions on an NxN grid.
 */

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  mergedFrom?: boolean; // just merged this turn
  isNew?: boolean; // just spawned this turn
}

export interface GameState {
  size: number;
  tiles: Tile[];
  score: number;
  won: boolean;
  over: boolean;
  nextId: number;
}

export type Direction = "up" | "down" | "left" | "right";

/** Custom merge function: given current value, return merged value. Default: v * 2 */
export type MergeFn = (value: number) => number;

/** Create a fresh game with 2 random tiles. */
export function createGame(size: number, spawnValues: number[]): GameState {
  let state: GameState = { size, tiles: [], score: 0, won: false, over: false, nextId: 1 };
  state = spawnTile(state, spawnValues);
  state = spawnTile(state, spawnValues);
  return state;
}

/** Spawn a random tile in an empty cell. */
export function spawnTile(state: GameState, spawnValues: number[]): GameState {
  const occupied = new Set(state.tiles.map((t) => `${t.row},${t.col}`));
  const empty: [number, number][] = [];
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      if (!occupied.has(`${r},${c}`)) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return state;

  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  const value = spawnValues[Math.floor(Math.random() * spawnValues.length)];

  return {
    ...state,
    // Preserve mergedFrom on existing tiles; only clear isNew
    tiles: [
      ...state.tiles.map((t) => ({ ...t, isNew: false })),
      { id: state.nextId, value, row, col, isNew: true },
    ],
    nextId: state.nextId + 1,
  };
}

/** Move all tiles in a direction. Returns new state (or same if no move). */
export function move(
  state: GameState,
  dir: Direction,
  spawnValues: number[],
  winTarget: number,
  mergeFn?: MergeFn,
  scoreFn?: (merged: number) => number,
): GameState {
  const { size } = state;
  let newTiles: Tile[] = [];
  let score = state.score;
  let moved = false;
  let nextId = state.nextId;

  // Clear flags from previous turn before processing
  const cleanTiles = state.tiles.map((t) => ({ ...t, mergedFrom: false, isNew: false }));

  // Process each line (row or column) independently
  const lines = getLines(cleanTiles, size, dir);

  for (const line of lines) {
    // Remove gaps (compact toward start)
    const compacted = line.filter((t) => t !== null) as Tile[];
    const result: Tile[] = [];
    let i = 0;

    while (i < compacted.length) {
      if (i + 1 < compacted.length && compacted[i].value === compacted[i + 1].value) {
        // Merge: keep first tile's id so React reuses the DOM node (enables slide animation)
        const merged = mergeFn ? mergeFn(compacted[i].value) : compacted[i].value * 2;
        const points = scoreFn ? scoreFn(merged) : merged;
        result.push({ id: compacted[i].id, value: merged, row: 0, col: 0, mergedFrom: true });
        score += points;
        i += 2;
      } else {
        result.push({ ...compacted[i], mergedFrom: false });
        i++;
      }
    }

    // Assign positions
    const positions = getLinePositions(size, dir, line);
    for (let j = 0; j < result.length; j++) {
      result[j] = { ...result[j], row: positions[j][0], col: positions[j][1] };
    }

    // Check if anything moved
    if (result.length !== compacted.length) {
      moved = true;
    } else {
      for (let j = 0; j < result.length; j++) {
        if (result[j].row !== compacted[j].row || result[j].col !== compacted[j].col || result[j].mergedFrom) {
          moved = true;
          break;
        }
      }
    }

    newTiles.push(...result);
  }

  if (!moved) return state;

  let newState: GameState = { ...state, tiles: newTiles, score, nextId };
  newState = spawnTile(newState, spawnValues);

  // Check win
  if (!newState.won && newState.tiles.some((t) => t.value >= winTarget)) {
    newState.won = true;
  }

  // Check game over
  if (!canMove(newState)) {
    newState.over = true;
  }

  return newState;
}

/** Check if any move is possible. */
function canMove(state: GameState): boolean {
  const { size, tiles } = state;
  // Has empty cells?
  if (tiles.length < size * size) return true;

  // Any adjacent tiles with same value?
  const grid = buildGrid(tiles, size);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r][c];
      if (v === 0) return true;
      if (c + 1 < size && grid[r][c + 1] === v) return true;
      if (r + 1 < size && grid[r + 1][c] === v) return true;
    }
  }
  return false;
}

function buildGrid(tiles: Tile[], size: number): number[][] {
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));
  for (const t of tiles) {
    grid[t.row][t.col] = t.value;
  }
  return grid;
}

/** Extract lines (rows or columns) from tiles for the given direction. */
function getLines(tiles: Tile[], size: number, dir: Direction): (Tile | null)[][] {
  const grid = new Map<string, Tile>();
  for (const t of tiles) grid.set(`${t.row},${t.col}`, t);

  const lines: (Tile | null)[][] = [];

  for (let i = 0; i < size; i++) {
    const line: (Tile | null)[] = [];
    for (let j = 0; j < size; j++) {
      let r: number, c: number;
      switch (dir) {
        case "left":  r = i; c = j; break;
        case "right": r = i; c = size - 1 - j; break;
        case "up":    r = j; c = i; break;
        case "down":  r = size - 1 - j; c = i; break;
      }
      line.push(grid.get(`${r},${c}`) ?? null);
    }
    lines.push(line);
  }

  return lines;
}

/** Get target positions for a line after compaction. */
function getLinePositions(size: number, dir: Direction, line: (Tile | null)[]): [number, number][] {
  const lineIndex = (() => {
    const first = line.find((t) => t !== null);
    if (!first) return 0;
    switch (dir) {
      case "left": case "right": return first.row;
      case "up": case "down": return first.col;
    }
  })();

  const positions: [number, number][] = [];
  for (let j = 0; j < size; j++) {
    switch (dir) {
      case "left":  positions.push([lineIndex, j]); break;
      case "right": positions.push([lineIndex, size - 1 - j]); break;
      case "up":    positions.push([j, lineIndex]); break;
      case "down":  positions.push([size - 1 - j, lineIndex]); break;
    }
  }
  return positions;
}
