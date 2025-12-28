export type Direction = "across" | "down";

export type Track = {
  id: string;
  title: string;
  artist: string;
  durationSec: number; // demo-lyssningstid
  hint: string;
};

export type Clue = {
  id: string;
  trackId: string;
  number: number;
  direction: Direction;
  row: number;
  col: number;
  length: number;
  clue: string;
};

export type Puzzle = {
  id: string;
  weekLabel: string;
  title: string;
  subtitle: string;
  size: { rows: number; cols: number };
  blocks: Array<[number, number]>;
  tracks: Track[];
  clues: Clue[];
};

export const puzzle: Puzzle = {
  id: "wordex-demo-001",
  weekLabel: "Vecka 52",
  title: "Musikkrysset – Demo",
  subtitle: "Fyll i krysset och skicka in dina svar till support@wordex.se.",
  size: { rows: 9, cols: 9 },
  blocks: [
    [0, 4],
    [1, 1],
    [1, 7],
    [2, 2],
    [2, 6],
    [3, 4],
    [4, 0],
    [4, 8],
    [5, 4],
    [6, 2],
    [6, 6],
    [7, 1],
    [7, 7],
    [8, 4]
  ],
  tracks: [
    { id: "t1", title: "Spår 1", artist: "Demo Artist", durationSec: 12, hint: "Klassisk svensk popkänsla." },
    { id: "t2", title: "Spår 2", artist: "Demo Artist", durationSec: 10, hint: "Tydlig refräng, lätt att nynna." },
    { id: "t3", title: "Spår 3", artist: "Demo Artist", durationSec: 14, hint: "Lite rockigare tempo." }
  ],
  clues: [
    { id: "c1", trackId: "t1", number: 1, direction: "across", row: 0, col: 0, length: 4, clue: "Artistens förnamn (demo)" },
    { id: "c2", trackId: "t1", number: 2, direction: "down", row: 0, col: 2, length: 5, clue: "Låtens tema (demo)" },
    { id: "c3", trackId: "t2", number: 3, direction: "across", row: 2, col: 0, length: 6, clue: "Refrängord (demo)" },
    { id: "c4", trackId: "t2", number: 4, direction: "down", row: 1, col: 8, length: 4, clue: "Plats (demo)" },
    { id: "c5", trackId: "t3", number: 5, direction: "across", row: 4, col: 1, length: 7, clue: "Bandnamn (demo)" },
    { id: "c6", trackId: "t3", number: 6, direction: "down", row: 3, col: 5, length: 5, clue: "Instrument (demo)" }
  ]
};
