import { describe, it, expect } from 'vitest';
import { createEmpty, solve, generate, isValidPlacement, checkGrid } from '../src/sudoku';

describe('Sudoku engine', () => {
  it('creates empty grid', () => {
    const g = createEmpty(4);
    expect(g.length).toBe(4);
    expect(g[0].length).toBe(4);
    expect(g.flat().every(x=>x===0)).toBe(true);
  });

  it('solves a generated puzzle (4x4)', () => {
    const { puzzle, solution } = generate(4, 'easy');
    const solved = solve(puzzle);
    expect(solved).not.toBeNull();
    expect(solved!.flat().every(x=>x>0)).toBe(true);
    const check = checkGrid(solved!, solution);
    expect(check.ok).toBe(true);
  });

  it('solves a generated puzzle (6x6)', () => {
    const { puzzle, solution } = generate(6, 'medium');
    const solved = solve(puzzle);
    expect(solved).not.toBeNull();
    const check = checkGrid(solved!, solution);
    expect(check.ok).toBe(true);
  });

  it('solves a generated puzzle (9x9)', () => {
    const { puzzle, solution } = generate(9, 'hard');
    const solved = solve(puzzle);
    expect(solved).not.toBeNull();
    const check = checkGrid(solved!, solution);
    expect(check.ok).toBe(true);
  });

  it('valid placement check works', () => {
    const { puzzle } = generate(4, 'easy');
    const g = puzzle.map(r=>r.slice());
    // place a number, ensure row conflict is detected
    g[0][0] = 1;
    expect(isValidPlacement(g, 0, 1, 1)).toBe(false);
  });
});