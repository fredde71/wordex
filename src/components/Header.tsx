export default function Header(props: {
  weekLabel: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-wordex-line bg-white/70 px-3 py-1 text-xs text-wordex-ink shadow-soft">
          <span className="h-2 w-2 rounded-full bg-wordex-accent" />
          <span className="font-medium">{props.weekLabel}</span>
          <span className="text-wordex-muted">•</span>
          <span className="text-wordex-muted">Demo</span>
        </div>

        <div className="text-xs text-wordex-muted">
          Autospar är på • inskick via e-post
        </div>
      </div>

      <div className="rounded-2xl border border-wordex-line bg-white/70 p-5 shadow-soft">
        <h1 className="text-2xl font-semibold tracking-tight text-wordex-ink">
          {props.title}
        </h1>
        <p className="mt-2 text-sm text-wordex-muted">
          {props.subtitle}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="rounded-full bg-wordex-accent/10 px-3 py-1 text-xs font-medium text-wordex-ink">
            Veckans kryss
          </div>
          <div className="rounded-full bg-wordex-accent2/10 px-3 py-1 text-xs font-medium text-wordex-ink">
            Musik + korsord
          </div>
          <div className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-wordex-ink">
            Mobilvänligt
          </div>
        </div>
      </div>
    </header>
  );
}
