export type Size = 4 | 6 | 9;
export type Cell = number | 0; // 0 means empty
export type Grid = Cell[][];

export function subgridDimensions(n: Size): [number, number] {
  if (n === 4) return [2,2];
  if (n === 6) return [2,3];
  return [3,3]; // 9
}

export function cloneGrid(g: Grid): Grid { return g.map(r => r.slice()); }

export function createEmpty(n: Size): Grid {
  return Array.from({length: n}, () => Array<Cell>(n).fill(0));
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isValidPlacement(g: Grid, r: number, c: number, val: number): boolean {
  const n = g.length;
  for (let i=0;i<n;i++){
    if (g[r][i] === val) return false;
    if (g[i][c] === val) return false;
  }
  const [sr, sc] = subgridDimensions(n as Size);
  const r0 = Math.floor(r/sr)*sr;
  const c0 = Math.floor(c/sc)*sc;
  for (let i=0;i<sr;i++) for (let j=0;j<sc;j++){
    if (g[r0+i][c0+j] === val) return false;
  }
  return true;
}

export function solve(g: Grid): Grid | null {
  const n = g.length;
  const grid = cloneGrid(g);

  function backtrack(pos=0): boolean {
    if (pos === n*n) return true;
    const r = Math.floor(pos / n);
    const c = pos % n;
    if (grid[r][c] !== 0) return backtrack(pos+1);
    for (const val of shuffle(Array.from({length:n}, (_,i)=>i+1))) {
      if (isValidPlacement(grid, r, c, val)) {
        grid[r][c] = val;
        if (backtrack(pos+1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  return backtrack() ? grid : null;
}

// Count solutions up to 2 for uniqueness check
export function countSolutions(g: Grid, limit=2): number {
  const n = g.length;
  const grid = cloneGrid(g);
  let count = 0;

  function backtrack(pos=0): boolean {
    if (pos === n*n) {
      count++;
      return count >= limit;
    }
    const r = Math.floor(pos / n);
    const c = pos % n;
    if (grid[r][c] !== 0) return backtrack(pos+1);
    for (let val=1; val<=n; val++) {
      if (isValidPlacement(grid, r, c, val)) {
        grid[r][c] = val;
        if (backtrack(pos+1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  backtrack();
  return count;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

function removalCounts(n: Size, d: Difficulty): number {
  // total cells - clues; tuned conservatively for playability
  const totals = {4:16, 6:36, 9:81} as const;
  const base = { easy: 0.45, medium: 0.6, hard: 0.7 }[d];
  // keep at least a minimum of clues
  const minClues = {4: 6, 6: 10, 9: 22}[n];
  const remove = Math.max(0, Math.floor(totals[n] * base));
  return Math.min(totals[n] - minClues, remove);
}

export function generate(n: Size, difficulty: Difficulty): { puzzle: Grid, solution: Grid } {
  // Create a full valid grid by solving an empty one with randomized order
  const solved = solve(createEmpty(n as Size));
  if (!solved) throw new Error('Failed to create a solved grid');

  const puzzle = cloneGrid(solved);
  // positions to try removing from
  const positions = shuffle(Array.from({length: n*n}, (_,i)=>i));
  let toRemove = removalCounts(n as Size, difficulty);

  for (const pos of positions) {
    if (toRemove <= 0) break;
    const r = Math.floor(pos / n);
    const c = pos % n;
    const backup = puzzle[r][c];
    if (backup === 0) continue;
    puzzle[r][c] = 0;
    const solutions = countSolutions(puzzle, 2);
    if (solutions !== 1) {
      // revert to keep uniqueness
      puzzle[r][c] = backup;
    } else {
      toRemove--;
    }
  }

  return { puzzle, solution: solved };
}

export function findFirstEmpty(g: Grid): [number, number] | null {
  for (let r=0;r<g.length;r++) for (let c=0;c<g.length;c++) {
    if (g[r][c] === 0) return [r,c];
  }
  return null;
}

export function checkGrid(current: Grid, solution: Grid): { ok: boolean, errors: [number, number][] } {
  const errors: [number, number][] = [];
  for (let r=0;r<current.length;r++) for (let c=0;c<current.length;c++) {
    const v = current[r][c];
    if (v !== 0 && v !== solution[r][c]) {
      errors.push([r,c]);
    }
  }
  return { ok: errors.length === 0 && current.flat().every(x => x !== 0), errors };
}