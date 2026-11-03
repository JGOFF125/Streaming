// Never put OAuth codes/state, arbitrary URLs or query parameters into navigation state.
export function orbitRouteForSystemPath(value: unknown): '/' | '/netflix' {
  if (typeof value !== 'string' || value.length > 16384 || /[\\\s]/.test(value)) return '/';
  try {
    const url = new URL(value, 'com.jgoff125.orbit:///');
    if (url.protocol !== 'com.jgoff125.orbit:' || url.username || url.password || url.port) return '/';
    if ((url.hostname === '' && url.pathname === '/netflix') ||
      (url.hostname === 'netflix' && (url.pathname === '' || url.pathname === '/'))) return '/netflix';
  } catch { /* Unknown/malformed native links return to Orbit's home safely. */ }
  return '/';
}
