export function PlatformStats() {
  return null;
}

export function RealtimeEvent() {
  return null;
}

export function t(key: string) {
  return key;
}

export async function fetchJsonOrThrow(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export const $f = {
  formatNumber: (n: number) => n.toString(),
  formatCurrency: (n: number) => `$${n}`,
};
