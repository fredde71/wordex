import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import TrackPanel from "./components/TrackPanel";
import PuzzleBoard from "./components/PuzzleBoard";
import FooterBar from "./components/FooterBar";
import Modal from "./components/Modal";
import { puzzle } from "./data/puzzle";
import type { Clue, Direction } from "./data/puzzle";
import { clearKey, loadJson, saveJson } from "./lib/storage";
import { safeMailtoEncode } from "./lib/utils";

type Playing = { trackId: string; startedAt: number } | null;

function keyOf(r: number, c: number) {
  return `${r}:${c}`;
}

function buildBlocksSet() {
  return new Set(puzzle.blocks.map(([r, c]) => keyOf(r, c)));
}

function inBounds(r: number, c: number) {
  return r >= 0 && r < puzzle.size.rows && c >= 0 && c < puzzle.size.cols;
}

/**
 * ROBUST:
 * - Row/col i clue kan vara "inne i ordet" i demo-data.
 * - Vi hittar riktiga start-cellen genom att gå bakåt tills block/kant.
 * - Sen samlar vi celler framåt tills block/kant.
 */
function normalizeClueWord(clue: Clue, blocks: Set<string>) {
  const dr = clue.direction === "down" ? 1 : 0;
  const dc = clue.direction === "across" ? 1 : 0;

  // 1) gå bakåt till riktig start
  let sr = clue.row;
  let sc = clue.col;

  while (true) {
    const pr = sr - dr;
    const pc = sc - dc;
    if (!inBounds(pr, pc)) break;
    if (blocks.has(keyOf(pr, pc))) break;
    sr = pr;
    sc = pc;
  }

  // 2) samla framåt
  const cells: string[] = [];
  let r = sr;
  let c = sc;

  while (inBounds(r, c)) {
    const k = keyOf(r, c);
    if (blocks.has(k)) break;
    cells.push(k);
    r += dr;
    c += dc;
  }

  return {
    start: { row: sr, col: sc },
    cellsSet: new Set(cells),
    cellsList: cells,
    length: cells.length
  };
}

function buildTotalFillableCells() {
  const blocks = buildBlocksSet();
  let count = 0;
  for (let r = 0; r < puzzle.size.rows; r++) {
    for (let c = 0; c < puzzle.size.cols; c++) {
      if (!blocks.has(keyOf(r, c))) count++;
    }
  }
  return count;
}

function buildSubmissionText(values: Record<string, string>) {
  const lines: string[] = [];
  lines.push("WORDEX – MUSIKKRYSS INSKICK");
  lines.push(`PuzzleId: ${puzzle.id}`);
  lines.push(`Vecka: ${puzzle.weekLabel}`);
  lines.push(`Tid: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("Svar per ledtråd (tomt = ej ifyllt):");

  const blocks = buildBlocksSet();

  for (const clue of [...puzzle.clues].sort((a, b) => a.number - b.number)) {
    const meta = normalizeClueWord(clue, blocks);
    const ans = meta.cellsList.map((k) => values[k] || "_").join("");

    lines.push(`${clue.number}. ${clue.direction === "across" ? "Vågrätt" : "Lodrätt"} (${meta.length}) – ${clue.clue}`);
    lines.push(`Svar: ${ans}`);
    lines.push("");
  }

  lines.push("Rutor (rådata):");
  const entries = Object.entries(values)
    .filter(([, v]) => v && v.trim())
    .sort(([a], [b]) => a.localeCompare(b));
  lines.push(JSON.stringify(Object.fromEntries(entries), null, 2));

  return lines.join("\n");
}

export default function App() {
  const storageKey = `puzzle:${puzzle.id}`;
  const blocks = useMemo(() => buildBlocksSet(), []);

  const clueById = useMemo(() => {
    const out: Record<string, Clue> = {};
    for (const c of puzzle.clues) out[c.id] = c;
    return out;
  }, []);

  const orderedClues = useMemo(() => [...puzzle.clues].sort((a, b) => a.number - b.number), []);
  const totalFillable = useMemo(() => buildTotalFillableCells(), []);

  // Precompute robust meta for every clue (length + highlight cells + real start)
  const clueMetaById = useMemo(() => {
    const m: Record<string, ReturnType<typeof normalizeClueWord>> = {};
    for (const c of puzzle.clues) m[c.id] = normalizeClueWord(c, blocks);
    return m;
  }, [blocks]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    return loadJson<Record<string, string>>(`${storageKey}:values`) ?? {};
  });

  const [activeCell, setActiveCell] = useState<{ row: number; col: number }>(() => {
    return loadJson<{ row: number; col: number }>(`${storageKey}:activeCell`) ?? { row: 0, col: 0 };
  });

  const [activeClueId, setActiveClueId] = useState<string | null>(() => {
    return loadJson<string | null>(`${storageKey}:activeClueId`) ?? null;
  });

  const [activeTrackId, setActiveTrackId] = useState<string>(() => {
    return loadJson<string>(`${storageKey}:activeTrackId`) ?? puzzle.tracks[0].id;
  });

  const [activeDirection, setActiveDirection] = useState<Direction>(() => {
    return loadJson<Direction>(`${storageKey}:activeDirection`) ?? "across";
  });

  const [playing, setPlaying] = useState<Playing>(null);

  const [helpOpen, setHelpOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => saveJson(`${storageKey}:values`, values), [values, storageKey]);
  useEffect(() => saveJson(`${storageKey}:activeCell`, activeCell), [activeCell, storageKey]);
  useEffect(() => saveJson(`${storageKey}:activeClueId`, activeClueId), [activeClueId, storageKey]);
  useEffect(() => saveJson(`${storageKey}:activeTrackId`, activeTrackId), [activeTrackId, storageKey]);
  useEffect(() => saveJson(`${storageKey}:activeDirection`, activeDirection), [activeDirection, storageKey]);

  const filled = useMemo(() => {
    let n = 0;
    for (const k of Object.keys(values)) if (values[k]?.trim()) n++;
    return n;
  }, [values]);

  const activeClue = useMemo(() => (activeClueId ? clueById[activeClueId] : null), [activeClueId, clueById]);

  const activeWordCells = useMemo(() => {
    if (!activeClueId) return new Set<string>();
    return clueMetaById[activeClueId]?.cellsSet ?? new Set<string>();
  }, [activeClueId, clueMetaById]);

  const toggleDirection = () => setActiveDirection((d) => (d === "across" ? "down" : "across"));

  const startPlayingTrack = (trackId: string) => setPlaying({ trackId, startedAt: Date.now() });

  const onSelectClue = (clueId: string) => {
    const clue = clueById[clueId];
    if (!clue) return;

    const meta = clueMetaById[clueId];

    setActiveClueId(clueId);
    setActiveTrackId(clue.trackId);
    setActiveDirection(clue.direction);

    // fokusera riktiga startcellen (inte row/col om den råkar vara fel)
    if (meta?.start) setActiveCell(meta.start);
    else setActiveCell({ row: clue.row, col: clue.col });

    startPlayingTrack(clue.trackId);
  };

  const onPrevClue = () => {
    const idx = activeClueId ? orderedClues.findIndex((c) => c.id === activeClueId) : -1;
    const nextIdx = idx <= 0 ? 0 : idx - 1;
    onSelectClue(orderedClues[nextIdx].id);
  };

  const onNextClue = () => {
    const idx = activeClueId ? orderedClues.findIndex((c) => c.id === activeClueId) : -1;
    const nextIdx = idx < 0 ? 0 : Math.min(orderedClues.length - 1, idx + 1);
    onSelectClue(orderedClues[nextIdx].id);
  };

  const onPickClueByCell = (row: number, col: number) => {
    const k = keyOf(row, col);

    // 1) om man klickar i en markerad aktiv ord-cell: behåll
    // 2) annars: hitta den clue vars robusta cellsSet innehåller cellen
    const containing = puzzle.clues.find((c) => {
      const meta = clueMetaById[c.id];
      return meta?.cellsSet.has(k);
    });

    if (containing) onSelectClue(containing.id);
  };

  const resetAll = () => {
    setValues({});
    setActiveClueId(null);
    setActiveTrackId(puzzle.tracks[0].id);
    setActiveDirection("across");
    setPlaying(null);

    clearKey(`${storageKey}:values`);
    clearKey(`${storageKey}:activeCell`);
    clearKey(`${storageKey}:activeClueId`);
    clearKey(`${storageKey}:activeTrackId`);
    clearKey(`${storageKey}:activeDirection`);
  };

  const submissionText = useMemo(() => buildSubmissionText(values), [values]);

  const openEmailClient = () => {
    const to = "support@wordex.se";
    const subject = `Musikkryss – ${puzzle.weekLabel} – ${puzzle.id}`;
    const body = submissionText;
    const mailto = `mailto:${to}?subject=${safeMailtoEncode(subject)}&body=${safeMailtoEncode(body)}`;
    window.location.href = mailto;
  };

  const copySubmission = async () => {
    try {
      await navigator.clipboard.writeText(submissionText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-[min(1100px,92vw)] py-8">
        <Header weekLabel={puzzle.weekLabel} title={puzzle.title} subtitle={puzzle.subtitle} />

        <div className="mt-5 rounded-2xl border border-wordex-line paper p-4 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-wordex-muted">Så gör du</div>
              <ol className="mt-2 list-decimal pl-5 text-sm text-wordex-ink">
                <li>Klicka en ledtråd → spåret spelas upp (demo).</li>
                <li>Skriv svaret i krysset. Tab/Mellanslag växlar vågrätt/lodrätt.</li>
                <li>Byt ledtråd när som helst – allt autosparas.</li>
                <li>När du är klar: Skicka in (öppnar mail med svaret ifyllt).</li>
              </ol>
            </div>

            <button onClick={() => setHelpOpen(true)} className="rounded-xl bg-black/5 px-3 py-2 text-sm text-wordex-ink hover:bg-black/10">
              Visa tips
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <PuzzleBoard
            puzzle={puzzle}
            values={values}
            setValues={setValues}
            activeCell={activeCell}
            setActiveCell={setActiveCell}
            onPickClueByCell={onPickClueByCell}
            clueById={clueById}
            activeDirection={activeDirection}
            setActiveDirection={setActiveDirection}
            onToggleDirection={toggleDirection}
            activeClue={activeClue}
            activeWordCells={activeWordCells}
          />

          <TrackPanel
            tracks={puzzle.tracks}
            clues={puzzle.clues}
            activeTrackId={activeTrackId}
            onSelectTrack={setActiveTrackId}
            playing={playing}
            setPlaying={setPlaying}
            activeClueId={activeClueId}
            onSelectClue={onSelectClue}
            onPrevClue={onPrevClue}
            onNextClue={onNextClue}
            clueLenById={Object.fromEntries(Object.entries(clueMetaById).map(([id, m]) => [id, m.length])) as Record<string, number>}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-wordex-line paper p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-wordex-muted">Aktiv</div>
              <div className="mt-1 font-semibold text-wordex-ink">
                {activeClue
                  ? `${activeClue.number}. ${activeClue.direction === "across" ? "Vågrätt" : "Lodrätt"} — ${activeClue.clue}`
                  : "Ingen ledtråd vald (klicka en ledtråd för att börja)"}
              </div>
              <div className="mt-1 text-sm text-wordex-muted">
                Riktning: {activeDirection === "across" ? "Vågrätt" : "Lodrätt"} • Fyllt: {filled}/{totalFillable}
              </div>
            </div>

            <button
              onClick={() => setSubmitOpen(true)}
              className="rounded-xl bg-wordex-accent px-3 py-2 text-sm font-medium text-white shadow-soft hover:opacity-95"
            >
              Skicka in svar
            </button>
          </div>
        </div>
      </div>

      <FooterBar filled={filled} total={totalFillable} onSubmit={() => setSubmitOpen(true)} onReset={resetAll} onHow={() => setHelpOpen(true)} />

      <Modal open={helpOpen} title="Tips & navigation" onClose={() => setHelpOpen(false)}>
        <div className="space-y-3">
          <div className="rounded-xl border border-wordex-line bg-white/70 p-3">
            <div className="text-xs uppercase tracking-wide text-wordex-muted">Snabbguide</div>
            <div className="mt-2 text-sm">
              Klicka en ledtråd → spåret spelas upp → fyll i ordet → gå vidare till nästa ledtråd → skicka in via mail.
            </div>
          </div>

          <ul className="list-disc pl-5 leading-relaxed">
            <li><b>Tab</b> eller <b>mellanslag</b> växlar vågrätt/lodrätt.</li>
            <li>Piltangenter flyttar i krysset.</li>
            <li><b>Enter</b> i en ruta väljer relevant ledtråd.</li>
            <li>Allt autosparas – du kan stänga fliken och fortsätta senare.</li>
          </ul>
        </div>
      </Modal>

      <Modal open={submitOpen} title="Skicka in ditt musikkryss" onClose={() => setSubmitOpen(false)}>
        <div className="space-y-3">
          <div className="rounded-xl border border-wordex-line bg-white/70 p-3 text-sm">
            <div className="text-xs uppercase tracking-wide text-wordex-muted">Mottagare</div>
            <div className="mt-1 font-semibold text-wordex-ink">support@wordex.se</div>
            <div className="mt-2 text-wordex-muted">
              “Öppna e-post” öppnar ditt mailprogram med svaret ifyllt. Annars: “Kopiera svar”.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={openEmailClient}
              className="rounded-xl bg-wordex-accent px-3 py-2 text-sm font-medium text-white shadow-soft hover:opacity-95"
            >
              Öppna e-post
            </button>

            <button
              onClick={copySubmission}
              className="rounded-xl bg-black/5 px-3 py-2 text-sm text-wordex-ink hover:bg-black/10"
            >
              {copied ? "Kopierat!" : "Kopiera svar"}
            </button>
          </div>

          <div className="rounded-xl border border-wordex-line bg-white/70 p-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-wordex-muted">
              Förhandsvisning (detta hamnar i mailet)
            </div>
            <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap text-xs text-wordex-ink">
{submissionText}
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
}
