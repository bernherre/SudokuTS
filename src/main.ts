import './style.css';
import { generate, solve, checkGrid, findFirstEmpty, type Grid, type Size, type Difficulty } from './sudoku';

type State = {
  size: Size;
  difficulty: Difficulty;
  puzzle: Grid;
  solution: Grid;
  current: Grid;
  fixed: boolean[][];
  selected: [number, number] | null;
  startTs: number;
  elapsedSec: number;
  running: boolean;
  dark: boolean;
};

const $ = (sel: string, ctx: Document | HTMLElement = document) => ctx.querySelector(sel)!;
const $$ = (sel: string, ctx: Document | HTMLElement = document) => Array.from(ctx.querySelectorAll(sel));

function gridTemplate(size: number, [sr, sc]: [number, number]) {
  const wrapper = document.createElement('div');
  wrapper.className = 'board';
  wrapper.style.gridTemplateColumns = `repeat(${size}, 42px)`;
  wrapper.style.gridTemplateRows = `repeat(${size}, 42px)`;
  // thick borders between subgrids
  wrapper.style.border = '2px solid var(--border)';
  return wrapper;
}

function formatTime(sec: number) {
  const h = Math.floor(sec/3600);
  const m = Math.floor((sec%3600)/60);
  const s = sec%60;
  return (h>0?`${h}:`:"") + `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function deepEqual(a: Grid, b: Grid) {
  return a.every((r,i)=>r.every((v,j)=>v===b[i][j]));
}

class App {
  state: State;
  interval: number | null = null;
  root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    const dark = true;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    this.state = this.newGame(9, 'easy', dark);
    this.render();
    this.selectFirstEditable();
    this.renderBoard();
    this.startTimer();
  }


selectFirstEditable() {
  for (let r=0;r<this.state.size;r++) for (let c=0;c<this.state.size;c++) {
    if (!this.state.fixed[r][c]) { this.state.selected=[r,c]; return; }
  }
  this.state.selected = [0,0];
}

moveSelection(dr: number, dc: number) {
  if (!this.state.selected) { this.selectFirstEditable(); return; }
  const [r0,c0] = this.state.selected;
  const n = this.state.size;
  let r=r0, c=c0;
  for (let k=0;k<n*n;k++) {
    r = (r + dr + n) % n;
    c = (c + dc + n) % n;
    if (!this.state.fixed[r][c]) { this.state.selected=[r,c]; break; }
  }
  this.renderBoard();
}

newGame(size: Size, difficulty: Difficulty, dark: boolean): State {
    const { puzzle, solution } = generate(size, difficulty);
    const fixed = puzzle.map(row => row.map(v => v !== 0));
    return {
      size,
      difficulty,
      puzzle,
      solution,
      current: puzzle.map(r=>r.slice()),
      fixed,
      selected: null,
      startTs: Date.now(),
      elapsedSec: 0,
      running: true,
      dark
    };
  }

  startTimer() {
    if (this.interval) window.clearInterval(this.interval);
    this.interval = window.setInterval(()=>{
      if (!this.state.running) return;
      this.state.elapsedSec = Math.floor((Date.now() - this.state.startTs)/1000);
      const t = $('.timer');
      if (t) t.textContent = `⏱️ ${formatTime(this.state.elapsedSec)}`;
    }, 1000);
  }

  toggleTheme() {
    this.state.dark = !this.state.dark;
    document.documentElement.setAttribute('data-theme', this.state.dark ? 'dark':'light');
  }

  handleNumberInput(n: number) {
    const sel = this.state.selected;
    if (!sel) return;
    const [r,c] = sel;
    if (this.state.fixed[r][c]) return;
    this.state.current[r][c] = n;
    this.renderBoard();
  }

  handleErase() {
    const sel = this.state.selected;
    if (!sel) return;
    const [r,c] = sel;
    if (this.state.fixed[r][c]) return;
    this.state.current[r][c] = 0;
    this.renderBoard();
  }

  giveHint() {
    // find any empty cell and fill with solution value
    const pos = findFirstEmpty(this.state.current);
    if (!pos) return;
    const [r,c] = pos;
    this.state.current[r][c] = this.state.solution[r][c];
    this.state.fixed[r][c] = false; // still editable if user wants
    this.renderBoard();
  }

  check() {
    const { errors, ok } = checkGrid(this.state.current, this.state.solution);
    $$('.cell').forEach(el=>el.classList.remove('error'));
    for (const [r,c] of errors) {
      const idx = r*this.state.size + c;
      $$('.cell')[idx].classList.add('error');
    }
    const status = $('.status');
    if (ok && deepEqual(this.state.current, this.state.solution)) {
      status.textContent = '✔️ ¡Completado!';
      this.state.running = false;
    } else if (errors.length === 0) {
      status.textContent = 'ℹ️ Sin errores (aún no completo).';
    } else {
      status.textContent = `❌ ${errors.length} error(es).`;
    }
  }

  solveNow() {
    const solved = solve(this.state.current);
    if (!solved) return;
    this.state.current = solved;
    this.renderBoard();
    $('.status').textContent = '🧠 Resuelto automáticamente.';
    this.state.running = false;
  }

  newPuzzle() {
    // re-create puzzle and auto-select first editable cell
    this.state = this.newGame(this.state.size, this.state.difficulty, this.state.dark);
    this.render();
    this.selectFirstEditable();
    this.renderBoard();
    this.startTimer();
  }

  renderControls() {
    const header = document.createElement('header');

    const left = document.createElement('div');
    left.className = 'controls';

    const sizeSel = document.createElement('select');
    sizeSel.innerHTML = `
      <option value="4">4x4</option>
      <option value="6">6x6</option>
      <option value="9">9x9</option>
    `;
    sizeSel.value = String(this.state.size);
    sizeSel.addEventListener('change', ()=>{
      this.state.size = Number(sizeSel.value) as Size;
      this.newPuzzle();
    });

    const diffSel = document.createElement('select');
    diffSel.innerHTML = `
      <option value="easy">Fácil</option>
      <option value="medium">Media</option>
      <option value="hard">Difícil</option>
    `;
    diffSel.value = this.state.difficulty;
    diffSel.addEventListener('change', ()=>{
      this.state.difficulty = diffSel.value as Difficulty;
      this.newPuzzle();
    });

    const newBtn = document.createElement('button');
    newBtn.textContent = '🆕 Nuevo';
    newBtn.addEventListener('click', ()=> this.newPuzzle());

    const hintBtn = document.createElement('button');
    hintBtn.textContent = '💡 Pista';
    hintBtn.addEventListener('click', ()=> this.giveHint());

    const checkBtn = document.createElement('button');
    checkBtn.textContent = '✔️ Check';
    checkBtn.addEventListener('click', ()=> this.check());

    const solveBtn = document.createElement('button');
    solveBtn.textContent = '🧩 Solución';
    solveBtn.addEventListener('click', ()=> this.solveNow());

    const themeBtn = document.createElement('button');
    themeBtn.textContent = this.state.dark ? '🌙 Oscuro' : '🌞 Claro';
    themeBtn.addEventListener('click', ()=> {
      this.toggleTheme();
      themeBtn.textContent = this.state.dark ? '🌙 Oscuro' : '🌞 Claro';
    });

    left.append(sizeSel, diffSel, newBtn, hintBtn, checkBtn, solveBtn, themeBtn);

    const right = document.createElement('div');
    right.className = 'controls';
    const timer = document.createElement('div');
    timer.className = 'timer';
    timer.textContent = '⏱️ 00:00';
    const status = document.createElement('div');
    status.className = 'status';
    status.textContent = 'Listo.';
    right.append(timer, status);

    header.append(left, right);
    return header;
  }

  renderBoard() {
    const host = $('.board-host');
    host.innerHTML = '';
    const n = this.state.size;
    const [sr, sc] = ((): [number, number] => {
      if (n === 4) return [2,2];
      if (n === 6) return [2,3];
      return [3,3];
    })();

    const board = gridTemplate(n, [sr, sc]);

    // draw cells
    for (let r=0;r<n;r++) for (let c=0;c<n;c++) {
      const val = this.state.current[r][c];
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (this.state.fixed[r][c] && this.state.puzzle[r][c] !== 0) cell.classList.add('fixed');
      cell.textContent = val ? String(val) : '';
      cell.tabIndex = 0;
      cell.addEventListener('click', ()=>{
        this.state.selected = [r,c];
        $$('.cell').forEach(el=>el.classList.remove('highlight'));
        cell.classList.add('highlight');
      });
      board.appendChild(cell);
    }

    host.append(board);
    if (this.state.selected) {
      const [rs,cs] = this.state.selected;
      const idx = rs*this.state.size + cs;
      const el = $$('.cell')[idx]; if (el) el.classList.add('highlight');
    }
  }


renderKeypad() {
  const host = document.createElement('div');
  host.className = 'controls';
  host.style.marginTop = '8px';
  const n = this.state.size;
  const btn = (label: string, on: ()=>void) => {
    const b = document.createElement('button'); b.textContent = label; b.onclick = on; return b;
  };
  for (let v=1; v<=n; v++) host.appendChild(btn(String(v), ()=>this.handleNumberInput(v)));
  host.appendChild(btn('⌫', ()=>this.handleErase()));
  return host;
}

attachKeyHandlers() {

document.addEventListener('keydown', (e)=>{
  if (e.key === 'ArrowUp') { e.preventDefault(); this.moveSelection(-1,0); return; }
  if (e.key === 'ArrowDown') { e.preventDefault(); this.moveSelection(1,0); return; }
  if (e.key === 'ArrowLeft') { e.preventDefault(); this.moveSelection(0,-1); return; }
  if (e.key === 'ArrowRight') { e.preventDefault(); this.moveSelection(0,1); return; }
  if (e.key === 'Enter') { e.preventDefault(); this.check(); return; }
  if (e.key === ' ') { e.preventDefault(); this.giveHint(); return; }
      if (!this.state.selected) return;
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        this.handleErase();
        return;
      }
      const n = parseInt(e.key, 10);
      if (!Number.isNaN(n) && n >= 0 && n <= this.state.size) {
        e.preventDefault();
        if (n === 0) this.handleErase();
        else this.handleNumberInput(n);
      }
    });
  }

  render() {
    this.root.innerHTML = '';
    this.root.appendChild(this.renderControls());

    const boardHost = document.createElement('div');
    boardHost.className = 'board-host';
    this.root.appendChild(boardHost);
    this.renderBoard();

    const footer = document.createElement('div');
    footer.className = 'footer-info';
    footer.innerHTML = `
      <span>Usa <kbd>1..${this.state.size}</kbd> y <kbd>Backspace</kbd>.</span>
      <span>Subcuadros: ${this.state.size===6?'2x3':'3x3 / 2x2'} según tamaño.</span>
      <span><a href="https://github.com/" target="_blank" rel="noreferrer">GitHub Pages</a> listo con CI.</span>
    `;
    this.root.appendChild(footer);
    this.root.appendChild(this.renderKeypad());

    this.attachKeyHandlers();
  }
}

new App(document.getElementById('app')!);