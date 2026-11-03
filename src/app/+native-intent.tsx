import { orbitRouteForSystemPath } from '../nativeRoutes';

// Router receives only fixed internal paths. The independent WebBrowser auth
// listener still receives the original callback and validates its PKCE/state.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return orbitRouteForSystemPath(path);
}
