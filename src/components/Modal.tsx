import React from "react";
import { cx } from "../lib/utils";

export default function Modal(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Stäng"
        className="absolute inset-0 bg-black/40"
        onClick={props.onClose}
      />
      <div className="relative mx-auto mt-16 w-[min(820px,92vw)] rounded-2xl border border-wordex-line bg-white/80 shadow-lift backdrop-blur">
        <div className="flex items-start justify-between gap-3 border-b border-wordex-line px-5 py-4">
          <div>
            <div className="text-lg font-semibold text-wordex-ink">{props.title}</div>
            <div className="text-xs text-wordex-muted">Wordex – Musikkryss</div>
          </div>
          <button
            onClick={props.onClose}
            className={cx(
              "rounded-xl px-3 py-2 text-sm",
              "bg-black/5 hover:bg-black/10 active:bg-black/15"
            )}
          >
            Stäng
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-wordex-ink">{props.children}</div>
      </div>
    </div>
  );
}
