import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Clue, Track } from "../data/puzzle";
import { cx, clamp } from "../lib/utils";

type Playing = { trackId: string; startedAt: number } | null;

export default function TrackPanel(props: {
  tracks: Track[];
  clues: Clue[];
  activeTrackId: string;
  onSelectTrack: (id: string) => void;
  playing: Playing;
  setPlaying: (p: Playing) => void;

  activeClueId: string | null;
  onSelectClue: (clueId: string) => void;
  onPrevClue: () => void;
  onNextClue: () => void;

  clueLenById: Record<string, number>;
}) {
  const activeTrack = useMemo(
    () => props.tracks.find((t) => t.id === props.activeTrackId) ?? props.tracks[0],
    [props.activeTrackId, props.tracks]
  );

  const [now, setNow] = useState(Date.now());
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      raf.current = window.requestAnimationFrame(tick);
    };
    raf.current = window.requestAnimationFrame(tick);
    return () => {
      if (raf.current) window.cancelAnimationFrame(raf.current);
    };
  }, []);

  const isPlaying = props.playing?.trackId === activeTrack.id;

  const elapsed = useMemo(() => {
    if (!isPlaying || !props.playing) return 0;
    const sec = (now - props.playing.startedAt) / 1000;
    return clamp(sec, 0, activeTrack.durationSec);
  }, [activeTrack.durationSec, isPlaying, now, props.playing]);

  useEffect(() => {
    if (!isPlaying || !props.playing) return;
    if (elapsed >= activeTrack.durationSec) props.setPlaying(null);
  }, [elapsed, activeTrack.durationSec, isPlaying, props.playing, props.setPlaying]);

  const activeClues = useMemo(
    () => props.clues.filter((c) => c.trackId === activeTrack.id).sort((a, b) => a.number - b.number),
    [props.clues, activeTrack.id]
  );

  return (
    <aside className="flex flex-col gap-3 rounded-2xl border border-wordex-line paper p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-wordex-muted">Spår</div>
          <div className="text-base font-semibold text-wordex-ink">{activeTrack.title}</div>
          <div className="text-xs text-wordex-muted">{activeTrack.artist}</div>
        </div>

        <button
          onClick={() => {
            if (isPlaying) props.setPlaying(null);
            else props.setPlaying({ trackId: activeTrack.id, startedAt: Date.now() });
          }}
          className={cx(
            "rounded-xl px-3 py-2 text-sm font-medium shadow-soft",
            isPlaying ? "bg-wordex-accent text-white hover:opacity-95" : "bg-black/5 text-wordex-ink hover:bg-black/10"
          )}
        >
          {isPlaying ? "Stoppa" : "Lyssna"}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
          <div className="h-full bg-wordex-accent/70" style={{ width: `${(elapsed / activeTrack.durationSec) * 100}%` }} />
        </div>
        <div className="text-xs tabular-nums text-wordex-muted">
          {Math.floor(elapsed)}/{activeTrack.durationSec}s
        </div>
      </div>

      <div className="rounded-xl border border-wordex-line bg-white/70 p-3 text-sm">
        <div className="text-xs uppercase tracking-wide text-wordex-muted">Hint</div>
        <div className="mt-1 text-wordex-ink">{activeTrack.hint}</div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-wide text-wordex-muted">Ledtrådar</div>

        <select
          value={props.activeTrackId}
          onChange={(e) => props.onSelectTrack(e.target.value)}
          className="rounded-lg border border-wordex-line bg-white/80 px-2 py-1 text-xs text-wordex-ink"
        >
          {props.tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button onClick={props.onPrevClue} className="flex-1 rounded-xl bg-black/5 px-3 py-2 text-sm text-wordex-ink hover:bg-black/10">
          ← Föregående
        </button>
        <button onClick={props.onNextClue} className="flex-1 rounded-xl bg-black/5 px-3 py-2 text-sm text-wordex-ink hover:bg-black/10">
          Nästa →
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {activeClues.map((c) => {
          const isActive = props.activeClueId === c.id;
          const len = props.clueLenById[c.id] ?? c.length;

          return (
            <button
              key={c.id}
              onClick={() => props.onSelectClue(c.id)}
              className={cx(
                "rounded-xl border border-wordex-line px-3 py-2 text-left transition",
                isActive ? "bg-wordex-accent/10" : "bg-white/70 hover:bg-white/90"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-wordex-ink">
                  {c.number}. {c.direction === "across" ? "Vågrätt" : "Lodrätt"}
                </div>
                <div className="text-xs text-wordex-muted">{len} bokstäver</div>
              </div>
              <div className="mt-1 text-sm text-wordex-muted">{c.clue}</div>
              {isActive && <div className="mt-2 text-xs font-medium text-wordex-ink">Aktiv • klick = spela om</div>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
