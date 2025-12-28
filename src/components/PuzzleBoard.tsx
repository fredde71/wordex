import React, { useEffect, useMemo, useRef } from "react";
import type { Clue, Direction, Puzzle } from "../data/puzzle";
import { cx, isLetter, normalizeChar } from "../lib/utils";

type Cell = {
  row: number;
  col: number;
  isBlock: boolean;
  number?: number;
};

function keyOf(r: number, c: number) {
  return `${r}:${c}`;
}

function inBounds(rows: number, cols: number, r: number, c: number) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

/**
 * Robust start: om clue.row/col inte är exakt start (demo-data),
 * gå bakåt tills kant eller block.
 */
function computeStartForClue(clue: Clue, rows: number, cols: number, blocks: Set<string>) {
  const dr = clue.direction === "down" ? 1 : 0;
  const dc = clue.direction === "across" ? 1 : 0;

  let r = clue.row;
  let c = clue.col;

  while (true) {
    const pr = r - dr;
    const pc = c - dc;
    if (!inBounds(rows, cols, pr, pc)) break;
    if (blocks.has(keyOf(pr, pc))) break;
    r = pr;
    c = pc;
  }

  return { row: r, col: c };
}

export default function PuzzleBoard(props: {
  puzzle: Puzzle;
  values: Record<string, string>;
  setValues: (next: Record<string, string>) => void;
  activeCell: { row: number; col: number };
  setActiveCell: (pos: { row: number; col: number }) => void;
  onPickClueByCell: (row: number, col: number) => void;
  clueById: Record<string, Clue>;
  activeDirection: Direction;
  setActiveDirection: (d: Direction) => void;
  onToggleDirection: () => void;

  activeClue: Clue | null;
  activeWordCells: Set<string>;
}) {
  const { rows, cols } = props.puzzle.size;

  const blocks = useMemo(
    () => new Set(props.puzzle.blocks.map(([r, c]) => keyOf(r, c))),
    [props.puzzle.blocks]
  );

  // ✅ NYTT: placera siffran på verkliga start-cellen (robust)
  const clueStartNumbers = useMemo(() => {
    const map = new Map<string, number>();

    // sortera så att om två clues startar i samma ruta (across+down) blir det samma nummer ändå
    const clues = [...props.puzzle.clues].sort((a, b) => a.number - b.number);

    for (const clue of clues) {
      const start = computeStartForClue(clue, rows, cols, blocks);
      const k = keyOf(start.row, start.col);

      // Om redan satt, behåll minsta numret (ofta samma ändå)
      const prev = map.get(k);
      if (prev == null || clue.number < prev) map.set(k, clue.number);
    }

    return map;
  }, [props.puzzle.clues, rows, cols, blocks]);

  const grid: Cell[] = useMemo(() => {
    const cells: Cell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = keyOf(r, c);
        const isBlock = blocks.has(k);
        const number = clueStartNumbers.get(k);
        cells.push({ row: r, col: c, isBlock, number });
      }
    }
    return cells;
  }, [rows, cols, blocks, clueStartNumbers]);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const focusCell = (r: number, c: number) => {
    props.setActiveCell({ row: r, col: c });
    const el = inputRefs.current[keyOf(r, c)];
    if (el) el.focus();
  };

  useEffect(() => {
    const startKey = keyOf(props.activeCell.row, props.activeCell.col);
    if (!blocks.has(startKey)) {
      focusCell(props.activeCell.row, props.activeCell.col);
      return;
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!blocks.has(keyOf(r, c))) {
          focusCell(r, c);
          return;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!props.activeClue) return;
    focusCell(props.activeCell.row, props.activeCell.col);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.activeClue?.id]);

  const stepForDirection = (dir: Direction) => (dir === "across" ? { dr: 0, dc: 1 } : { dr: 1, dc: 0 });

  const moveByArrow = (r: number, c: number, dr: number, dc: number) => {
    let rr = r + dr;
    let cc = c + dc;
    while (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
      if (!blocks.has(keyOf(rr, cc))) {
        focusCell(rr, cc);
        return;
      }
      rr += dr;
      cc += dc;
    }
  };

  const moveNext = (r: number, c: number, dir: Direction) => {
    const { dr, dc } = stepForDirection(dir);
    let rr = r + dr;
    let cc = c + dc;
    while (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
      if (!blocks.has(keyOf(rr, cc))) {
        focusCell(rr, cc);
        return;
      }
      rr += dr;
      cc += dc;
    }
  };

  const movePrev = (r: number, c: number, dir: Direction) => {
    const { dr, dc } = stepForDirection(dir);
    let rr = r - dr;
    let cc = c - dc;
    while (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
      if (!blocks.has(keyOf(rr, cc))) {
        focusCell(rr, cc);
        return;
      }
      rr -= dr;
      cc -= dc;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    const k = e.key;

    if (k === "ArrowUp") { e.preventDefault(); moveByArrow(r, c, -1, 0); return; }
    if (k === "ArrowDown") { e.preventDefault(); moveByArrow(r, c, 1, 0); return; }
    if (k === "ArrowLeft") { e.preventDefault(); moveByArrow(r, c, 0, -1); return; }
    if (k === "ArrowRight") { e.preventDefault(); moveByArrow(r, c, 0, 1); return; }

    if (k === "Tab" || k === " ") {
      e.preventDefault();
      props.onToggleDirection();
      return;
    }

    if (k === "Enter") {
      e.preventDefault();
      props.onPickClueByCell(r, c);
      return;
    }

    if (k === "Backspace") {
      e.preventDefault();
      const cellKey = keyOf(r, c);
      const next = { ...props.values };
      if (next[cellKey]) {
        next[cellKey] = "";
        props.setValues(next);
      } else {
        movePrev(r, c, props.activeDirection);
      }
      return;
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>, r: number, c: number) => {
    const raw = e.target.value;
    const ch = normalizeChar(raw);
    const cellKey = keyOf(r, c);

    const next = { ...props.values, [cellKey]: ch };
    props.setValues(next);

    if (ch && isLetter(ch)) {
      moveNext(r, c, props.activeDirection);
    }
  };

  return (
    <section className="rounded-2xl border border-wordex-line paper p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-wordex-muted">Kryss</div>
          <div className="text-sm text-wordex-ink">
            Klicka ledtråd → lyssna → fyll ordet • Tab/Mellanslag byter riktning
          </div>
        </div>

        <button
          onClick={props.onToggleDirection}
          className="rounded-xl bg-black/5 px-3 py-2 text-xs text-wordex-ink hover:bg-black/10"
        >
          Riktning: <b>{props.activeDirection === "across" ? "Vågrätt" : "Lodrätt"}</b>
        </button>
      </div>

      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {grid.map((cell) => {
          const k = keyOf(cell.row, cell.col);
          const isActiveCell = cell.row === props.activeCell.row && cell.col === props.activeCell.col;
          const inActiveWord = props.activeWordCells.has(k);

          if (cell.isBlock) {
            return <div key={k} className="aspect-square rounded-lg bg-[#1f2937]" />;
          }

          const val = props.values[k] ?? "";

          return (
            <div
              key={k}
              className={cx(
                "relative aspect-square rounded-lg border border-wordex-line",
                inActiveWord ? "bg-wordex-accent/10" : "bg-white/85",
                "hover:border-black/20"
              )}
              onClick={() => {
                focusCell(cell.row, cell.col);
                props.onPickClueByCell(cell.row, cell.col);
              }}
            >
              {cell.number != null && (
                <div className="absolute left-1 top-1 text-[10px] text-wordex-muted">
                  {cell.number}
                </div>
              )}

              <input
                ref={(el) => (inputRefs.current[k] = el)}
                value={val}
                onChange={(e) => onChange(e, cell.row, cell.col)}
                onKeyDown={(e) => onKeyDown(e, cell.row, cell.col)}
                onFocus={() => props.setActiveCell({ row: cell.row, col: cell.col })}
                inputMode="text"
                maxLength={1}
                className={cx(
                  "h-full w-full rounded-lg bg-transparent text-center text-lg font-semibold uppercase text-wordex-ink",
                  "focus:outline-none",
                  isActiveCell && "cell-focus"
                )}
                aria-label={`Ruta ${cell.row + 1},${cell.col + 1}`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
