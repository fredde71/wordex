import { cx } from "../lib/utils";

export default function FooterBar(props: {
  filled: number;
  total: number;
  onSubmit: () => void;
  onReset: () => void;
  onHow: () => void;
}) {
  const pct = props.total === 0 ? 0 : Math.round((props.filled / props.total) * 100);

  return (
    <div className="sticky bottom-3 z-10">
      <div className="mx-auto flex w-[min(1100px,92vw)] items-center justify-between gap-3 rounded-2xl border border-wordex-line bg-white/75 p-3 shadow-soft backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-black/5 px-3 py-2 text-sm text-wordex-ink">
            <span className="font-semibold">{props.filled}</span>/{props.total} •{" "}
            <span className="text-wordex-muted">{pct}%</span>
          </div>
          <button
            onClick={props.onHow}
            className="rounded-xl bg-black/5 px-3 py-2 text-sm text-wordex-ink hover:bg-black/10"
          >
            Hjälp
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={props.onSubmit}
            className={cx(
              "rounded-xl px-3 py-2 text-sm font-medium",
              "bg-wordex-accent text-white shadow-soft hover:opacity-95"
            )}
          >
            Skicka in
          </button>

          <button
            onClick={props.onReset}
            className="rounded-xl bg-black/5 px-3 py-2 text-sm text-wordex-ink hover:bg-black/10"
          >
            Nollställ
          </button>
        </div>
      </div>
    </div>
  );
}
