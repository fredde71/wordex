export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function isLetter(ch: string) {
  return /^[A-ZÅÄÖ]$/i.test(ch);
}

export function normalizeChar(ch: string) {
  const up = ch.toUpperCase();
  if (up === "Ö" || up === "Ä" || up === "Å") return up;
  return up.replace(/[^A-Z]/g, "").slice(0, 1);
}

export function safeMailtoEncode(s: string) {
  // encodeURIComponent är rätt, men vi håller den korta texten “mailto-säker”
  return encodeURIComponent(s).replace(/%20/g, "+");
}
