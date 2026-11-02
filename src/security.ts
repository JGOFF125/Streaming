export const privacyRules = [
  'Orbit code never reads or extracts streaming passwords, provider cookies, access tokens, or login-page screenshots. The official provider website may keep sign-in data in its browser storage; use Clear Netflix browser sign-in to remove it.',
  'Netflix sign-in uses its official website or app, never a custom Orbit credential form. The in-app website experiment is not verified movie playback or synchronization.',
  'Private rooms require an authorized Orbit account and a server-validated invitation. Share codes only with trusted people.',
  'Android Netflix controls are optional. Notification access is used only for Netflix media controls; notification text is not processed.',
  'Voice is not connected. Verify room access rules on the configured backend before inviting another person.',
  'Do not use DRM bypasses, screen capture of protected media, or accessibility automation to control Netflix.',
] as const;
