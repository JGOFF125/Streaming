// One control operation across the diagnostic panel and room panel.
let owner: symbol | null = null;
export function acquireNetflixOperation(): (() => void) | null {
  if (owner) return null;
  const ticket = Symbol('netflix-operation'); owner = ticket;
  return () => { if (owner === ticket) owner = null; };
}
